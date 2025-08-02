/**
 * Transaction Controller
 * Handles CRUD operations for income and expense transactions
 */

const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Get all transactions for a user with filtering and pagination
 * @route GET /api/transactions
 * @access Private
 */
const getTransactions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    page = 1,
    limit = 10,
    type,
    category,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    paymentMethod,
    tags,
    search,
    sortBy = 'date',
    sortOrder = 'desc'
  } = req.query;

  // Build filter options
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    type,
    category,
    startDate,
    endDate,
    minAmount: minAmount ? parseFloat(minAmount) : undefined,
    maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
    paymentMethod,
    tags: tags ? tags.split(',') : undefined,
    search,
    sortBy,
    sortOrder
  };

  // Get transactions with filters
  const transactions = await Transaction.getUserTransactions(userId, options);
  
  // Get total count for pagination
  const query = { userId };
  if (type) query.type = type;
  if (category) query.category = category;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  if (minAmount || maxAmount) {
    query.amount = {};
    if (minAmount) query.amount.$gte = parseFloat(minAmount);
    if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
  }
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (tags) query.tags = { $in: tags.split(',') };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'location.name': { $regex: search, $options: 'i' } }
    ];
  }

  const totalTransactions = await Transaction.countDocuments(query);
  const totalPages = Math.ceil(totalTransactions / options.limit);

  res.json({
    success: true,
    message: 'Transactions retrieved successfully',
    data: {
      transactions,
      pagination: {
        currentPage: options.page,
        totalPages,
        totalTransactions,
        hasNext: options.page < totalPages,
        hasPrev: options.page > 1
      }
    }
  });
});

/**
 * Get a single transaction by ID
 * @route GET /api/transactions/:id
 * @access Private
 */
const getTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const transaction = await Transaction.findOne({ _id: id, userId })
    .populate('category', 'name color icon type')
    .populate('userId', 'firstName lastName email');

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  res.json({
    success: true,
    message: 'Transaction retrieved successfully',
    data: {
      transaction
    }
  });
});

/**
 * Create a new transaction
 * @route POST /api/transactions
 * @access Private
 */
const createTransaction = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const transactionData = {
    ...req.body,
    userId
  };

  // Validate category belongs to user or is a default category
  const category = await Category.findById(req.body.category);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (category.userId && !category.userId.equals(userId) && !category.isDefault) {
    throw new AppError('You can only use your own categories or default categories', 403);
  }

  // Create transaction
  const transaction = await Transaction.create(transactionData);
  
  // Populate category info
  await transaction.populate('category', 'name color icon type');

  res.status(201).json({
    success: true,
    message: 'Transaction created successfully',
    data: {
      transaction
    }
  });
});

/**
 * Update a transaction
 * @route PUT /api/transactions/:id
 * @access Private
 */
const updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Check if transaction exists and belongs to user
  const existingTransaction = await Transaction.findOne({ _id: id, userId });
  if (!existingTransaction) {
    throw new AppError('Transaction not found', 404);
  }

  // If category is being updated, validate it
  if (req.body.category) {
    const category = await Category.findById(req.body.category);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    if (category.userId && !category.userId.equals(userId) && !category.isDefault) {
      throw new AppError('You can only use your own categories or default categories', 403);
    }
  }

  // Update transaction
  const transaction = await Transaction.findByIdAndUpdate(
    id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('category', 'name color icon type');

  res.json({
    success: true,
    message: 'Transaction updated successfully',
    data: {
      transaction
    }
  });
});

/**
 * Delete a transaction
 * @route DELETE /api/transactions/:id
 * @access Private
 */
const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const transaction = await Transaction.findOneAndDelete({ _id: id, userId });
  
  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  res.json({
    success: true,
    message: 'Transaction deleted successfully'
  });
});

/**
 * Get transaction statistics
 * @route GET /api/transactions/stats
 * @access Private
 */
const getTransactionStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate, period = 'month' } = req.query;

  const options = {};
  if (startDate) options.startDate = startDate;
  if (endDate) options.endDate = endDate;

  // Get overall statistics
  const [overallStats, categoryStats, monthlyStats] = await Promise.all([
    Transaction.getTransactionStats(userId, options),
    Transaction.getSpendingByCategory(userId, options),
    getMonthlyTransactionStats(userId, options)
  ]);

  const stats = {
    totalTransactions: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    avgTransactionAmount: 0,
    categoryBreakdown: categoryStats,
    monthlyTrends: monthlyStats
  };

  if (overallStats && overallStats.length > 0) {
    const statData = overallStats[0];
    stats.totalTransactions = statData.totalTransactions || 0;
    
    statData.stats?.forEach(stat => {
      if (stat.type === 'income') {
        stats.totalIncome = stat.totalAmount || 0;
      } else if (stat.type === 'expense') {
        stats.totalExpenses = stat.totalAmount || 0;
      }
    });
    
    stats.netIncome = stats.totalIncome - stats.totalExpenses;
    stats.avgTransactionAmount = stats.totalTransactions > 0 
      ? (stats.totalIncome + stats.totalExpenses) / stats.totalTransactions 
      : 0;
  }

  res.json({
    success: true,
    message: 'Transaction statistics retrieved successfully',
    data: {
      stats
    }
  });
});

/**
 * Export transactions to PDF
 * @route GET /api/transactions/export
 * @access Private
 */
const exportTransactionsPDF = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = req.user;
  const {
    startDate,
    endDate,
    type,
    category
  } = req.query;

  // Build filter options
  const options = {
    page: 1,
    limit: 1000, // Export up to 1000 transactions
    type,
    category,
    startDate,
    endDate,
    sortBy: 'date',
    sortOrder: 'desc'
  };

  // Get transactions
  const transactions = await Transaction.getUserTransactions(userId, options);

  if (transactions.length === 0) {
    throw new AppError('No transactions found for the specified criteria', 404);
  }

  // Create PDF
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="transactions-${Date.now()}.pdf"`);
  
  // Pipe PDF to response
  doc.pipe(res);

  // Add title
  doc.fontSize(20).text('Transaction History Report', 50, 50);
  doc.fontSize(12).text(`Generated for: ${user.fullName}`, 50, 80);
  doc.text(`Email: ${user.email}`, 50, 95);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 110);
  
  if (startDate || endDate) {
    const dateRange = `Date Range: ${startDate ? new Date(startDate).toLocaleDateString() : 'Beginning'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`;
    doc.text(dateRange, 50, 125);
  }

  // Add summary
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  doc.moveDown(2);
  doc.fontSize(14).text('Summary:', 50);
  doc.fontSize(12);
  doc.text(`Total Transactions: ${transactions.length}`, 70);
  doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 70);
  doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 70);
  doc.text(`Net Income: $${(totalIncome - totalExpenses).toFixed(2)}`, 70);

  // Add table headers
  doc.moveDown(2);
  const tableTop = doc.y;
  const col1X = 50;
  const col2X = 150;
  const col3X = 250;
  const col4X = 350;
  const col5X = 450;

  doc.fontSize(10).text('Date', col1X, tableTop);
  doc.text('Title', col2X, tableTop);
  doc.text('Category', col3X, tableTop);
  doc.text('Type', col4X, tableTop);
  doc.text('Amount', col5X, tableTop);

  // Add line under headers
  doc.moveTo(col1X, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  // Add transaction rows
  let yPosition = tableTop + 25;
  transactions.forEach((transaction, index) => {
    // Check if we need a new page
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
      
      // Re-add headers on new page
      doc.fontSize(10).text('Date', col1X, yPosition);
      doc.text('Title', col2X, yPosition);
      doc.text('Category', col3X, yPosition);
      doc.text('Type', col4X, yPosition);
      doc.text('Amount', col5X, yPosition);
      doc.moveTo(col1X, yPosition + 15).lineTo(550, yPosition + 15).stroke();
      yPosition += 25;
    }

    doc.fontSize(9);
    doc.text(new Date(transaction.date).toLocaleDateString(), col1X, yPosition);
    doc.text(transaction.title.substring(0, 15), col2X, yPosition);
    doc.text(transaction.category.name.substring(0, 15), col3X, yPosition);
    doc.text(transaction.type, col4X, yPosition);
    doc.text(`$${transaction.amount.toFixed(2)}`, col5X, yPosition);
    
    yPosition += 20;

    // Add alternating row colors
    if (index % 2 === 0) {
      doc.rect(col1X - 5, yPosition - 18, 520, 18).fill('#f5f5f5');
    }
  });

  // Finalize PDF
  doc.end();
});

/**
 * Helper function to get monthly transaction statistics
 */
const getMonthlyTransactionStats = async (userId, options = {}) => {
  const { startDate, endDate } = options;
  
  const matchStage = { userId: userId };
  
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  return await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type'
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: {
          year: '$_id.year',
          month: '$_id.month'
        },
        income: {
          $sum: {
            $cond: [{ $eq: ['$_id.type', 'income'] }, '$totalAmount', 0]
          }
        },
        expenses: {
          $sum: {
            $cond: [{ $eq: ['$_id.type', 'expense'] }, '$totalAmount', 0]
          }
        },
        totalTransactions: { $sum: '$count' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

/**
 * Bulk delete transactions
 * @route DELETE /api/transactions/bulk
 * @access Private
 */
const bulkDeleteTransactions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { transactionIds } = req.body;

  if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
    throw new AppError('Transaction IDs are required', 400);
  }

  // Delete transactions belonging to the user
  const result = await Transaction.deleteMany({
    _id: { $in: transactionIds },
    userId
  });

  res.json({
    success: true,
    message: `${result.deletedCount} transactions deleted successfully`,
    data: {
      deletedCount: result.deletedCount
    }
  });
});

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  exportTransactionsPDF,
  bulkDeleteTransactions
};