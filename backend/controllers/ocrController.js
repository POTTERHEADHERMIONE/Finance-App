/**
 * OCR Controller
 * Handles receipt processing and OCR functionality
 */

const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/receipts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, and PDF files are allowed', 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Single file upload
  }
});

/**
 * Upload and process receipt
 * @route POST /api/ocr/process
 * @access Private
 */
const processReceipt = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Handle file upload
  upload.single('receipt')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          throw new AppError('File size too large. Maximum size is 10MB', 400);
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          throw new AppError('Too many files. Only one file allowed', 400);
        }
      }
      throw new AppError(err.message, 400);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    try {
      // Send file to Flask OCR service
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(req.file.path);
      const blob = new Blob([fileBuffer], { type: req.file.mimetype });
      formData.append('file', blob, req.file.originalname);

      const ocrResponse = await axios.post(
        `${process.env.FLASK_OCR_URL}/process-receipt`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      if (!ocrResponse.data.success) {
        throw new AppError('Failed to process receipt', 500);
      }

      const ocrData = ocrResponse.data.data;

      // Try to match extracted merchant with existing categories
      let suggestedCategory = null;
      if (ocrData.extractedMerchant) {
        suggestedCategory = await suggestCategoryFromMerchant(userId, ocrData.extractedMerchant);
      }

      // Prepare response data
      const result = {
        ocrData: {
          extractedText: ocrData.extractedText,
          extractedAmount: ocrData.extractedAmount,
          extractedDate: ocrData.extractedDate,
          extractedMerchant: ocrData.extractedMerchant,
          confidence: ocrData.confidence,
          processedAt: new Date()
        },
        suggestedTransaction: {
          title: ocrData.extractedMerchant || 'Receipt Transaction',
          amount: ocrData.extractedAmount || 0,
          date: ocrData.extractedDate || new Date().toISOString().split('T')[0],
          type: 'expense', // Default to expense for receipts
          category: suggestedCategory?._id,
          location: {
            name: ocrData.extractedMerchant
          }
        },
        suggestedCategory,
        attachment: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path
        }
      };

      res.json({
        success: true,
        message: 'Receipt processed successfully',
        data: result
      });

    } catch (error) {
      // Clean up uploaded file if processing fails
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      if (error.code === 'ECONNREFUSED') {
        throw new AppError('OCR service is unavailable. Please try again later', 503);
      }

      throw new AppError(error.message || 'Failed to process receipt', 500);
    }
  });
});

/**
 * Create transaction from OCR data
 * @route POST /api/ocr/create-transaction
 * @access Private
 */
const createTransactionFromOCR = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { transactionData, ocrData, attachmentPath } = req.body;

  // Validate required fields
  if (!transactionData || !transactionData.title || !transactionData.amount) {
    throw new AppError('Transaction title and amount are required', 400);
  }

  // Prepare transaction data
  const newTransactionData = {
    ...transactionData,
    userId,
    ocrData: ocrData ? {
      ...ocrData,
      processedAt: new Date()
    } : undefined
  };

  // Add attachment if provided
  if (attachmentPath && fs.existsSync(attachmentPath)) {
    const fileStats = fs.statSync(attachmentPath);
    newTransactionData.attachments = [{
      filename: path.basename(attachmentPath),
      originalName: req.body.originalFilename || path.basename(attachmentPath),
      mimetype: req.body.fileMimetype || 'application/octet-stream',
      size: fileStats.size,
      path: attachmentPath,
      uploadDate: new Date()
    }];
  }

  // Create transaction
  const transaction = await Transaction.create(newTransactionData);
  await transaction.populate('category', 'name color icon type');

  res.status(201).json({
    success: true,
    message: 'Transaction created from receipt successfully',
    data: {
      transaction
    }
  });
});

/**
 * Get OCR processing history
 * @route GET /api/ocr/history
 * @access Private
 */
const getOCRHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  // Get transactions with OCR data
  const transactions = await Transaction.find({
    userId,
    'ocrData.processedAt': { $exists: true }
  })
    .populate('category', 'name color icon type')
    .sort({ 'ocrData.processedAt': -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalTransactions = await Transaction.countDocuments({
    userId,
    'ocrData.processedAt': { $exists: true }
  });

  const totalPages = Math.ceil(totalTransactions / limit);

  res.json({
    success: true,
    message: 'OCR history retrieved successfully',
    data: {
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTransactions,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
});

/**
 * Re-process a receipt with different settings
 * @route POST /api/ocr/reprocess/:transactionId
 * @access Private
 */
const reprocessReceipt = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const userId = req.user._id;

  // Find transaction with attachment
  const transaction = await Transaction.findOne({ _id: transactionId, userId });
  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  if (!transaction.attachments || transaction.attachments.length === 0) {
    throw new AppError('No receipt attachment found for this transaction', 400);
  }

  const attachment = transaction.attachments[0];
  if (!fs.existsSync(attachment.path)) {
    throw new AppError('Receipt file not found', 404);
  }

  try {
    // Send file to Flask OCR service for reprocessing
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(attachment.path);
    const blob = new Blob([fileBuffer], { type: attachment.mimetype });
    formData.append('file', blob, attachment.originalName);

    const ocrResponse = await axios.post(
      `${process.env.FLASK_OCR_URL}/process-receipt`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000
      }
    );

    if (!ocrResponse.data.success) {
      throw new AppError('Failed to reprocess receipt', 500);
    }

    const ocrData = ocrResponse.data.data;

    // Update transaction with new OCR data
    transaction.ocrData = {
      extractedText: ocrData.extractedText,
      extractedAmount: ocrData.extractedAmount,
      extractedDate: ocrData.extractedDate,
      extractedMerchant: ocrData.extractedMerchant,
      confidence: ocrData.confidence,
      processedAt: new Date()
    };

    await transaction.save();
    await transaction.populate('category', 'name color icon type');

    res.json({
      success: true,
      message: 'Receipt reprocessed successfully',
      data: {
        transaction,
        ocrData: transaction.ocrData
      }
    });

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new AppError('OCR service is unavailable. Please try again later', 503);
    }
    throw new AppError(error.message || 'Failed to reprocess receipt', 500);
  }
});

/**
 * Helper function to suggest category based on merchant name
 */
const suggestCategoryFromMerchant = async (userId, merchantName) => {
  if (!merchantName) return null;

  const merchant = merchantName.toLowerCase();

  // Define merchant patterns and their likely categories
  const categoryPatterns = {
    'Food & Dining': ['restaurant', 'cafe', 'pizza', 'burger', 'food', 'kitchen', 'diner', 'grill', 'bar', 'pub', 'starbucks', 'mcdonald', 'subway', 'domino'],
    'Transportation': ['gas', 'fuel', 'station', 'shell', 'exxon', 'chevron', 'bp', 'uber', 'lyft', 'taxi', 'metro', 'bus'],
    'Shopping': ['store', 'shop', 'mall', 'walmart', 'target', 'amazon', 'ebay', 'retail', 'boutique'],
    'Healthcare': ['pharmacy', 'hospital', 'clinic', 'medical', 'health', 'doctor', 'cvs', 'walgreens'],
    'Bills & Utilities': ['electric', 'water', 'phone', 'internet', 'cable', 'utility', 'bill', 'payment'],
    'Entertainment': ['movie', 'theater', 'cinema', 'game', 'entertainment', 'netflix', 'spotify']
  };

  // Try to match merchant with patterns
  for (const [categoryName, patterns] of Object.entries(categoryPatterns)) {
    for (const pattern of patterns) {
      if (merchant.includes(pattern)) {
        // Find the category in database
        const category = await Category.findOne({
          name: categoryName,
          $or: [
            { userId: userId },
            { isDefault: true }
          ],
          isActive: true
        });
        
        if (category) {
          return category;
        }
      }
    }
  }

  // Default to "Other Expense" if no match found
  return await Category.findOne({
    name: 'Other Expense',
    isDefault: true,
    isActive: true
  });
};

/**
 * Get supported file types and limits
 * @route GET /api/ocr/info
 * @access Private
 */
const getOCRInfo = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'OCR service information',
    data: {
      supportedFormats: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      maxFileSize: '10MB',
      maxFiles: 1,
      features: [
        'Text extraction from receipts',
        'Amount detection',
        'Date extraction',
        'Merchant name identification',
        'Automatic category suggestion'
      ]
    }
  });
});

module.exports = {
  processReceipt,
  createTransactionFromOCR,
  getOCRHistory,
  reprocessReceipt,
  getOCRInfo
};