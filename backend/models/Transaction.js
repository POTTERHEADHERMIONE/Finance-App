/**
 * Transaction Model
 * Handles income and expense transactions with categorization
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Basic transaction information
  title: {
    type: String,
    required: [true, 'Transaction title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Financial details
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR']
  },
  
  // Transaction type and category
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Transaction type must be either income or expense'
    }
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  
  // Date information
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Transaction date cannot be in the future'
    }
  },
  
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'digital_wallet', 'other'],
    default: 'cash'
  },
  
  // Location information
  location: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Location name cannot exceed 100 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  
  // Receipt/attachment information
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // OCR extracted data
  ocrData: {
    extractedText: String,
    extractedAmount: Number,
    extractedDate: Date,
    extractedMerchant: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    processedAt: Date
  },
  
  // Transaction tags for better organization
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Recurring transaction information
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      required: function() {
        return this.recurring.isRecurring;
      }
    },
    nextDate: {
      type: Date,
      required: function() {
        return this.recurring.isRecurring;
      }
    },
    endDate: Date
  },
  
  // Status and metadata
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'confirmed'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ amount: -1 });
transactionSchema.index({ 'recurring.isRecurring': 1, 'recurring.nextDate': 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Virtual for days since transaction
transactionSchema.virtual('daysSince').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.date);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to validate category type
transactionSchema.pre('save', async function(next) {
  if (this.isModified('category') || this.isModified('type')) {
    try {
      const Category = mongoose.model('Category');
      const category = await Category.findById(this.category);
      
      if (!category) {
        throw new Error('Category does not exist');
      }
      
      if (category.type !== 'both' && category.type !== this.type) {
        throw new Error(`Category "${category.name}" cannot be used for ${this.type} transactions`);
      }
      
      // Increment category usage
      await category.incrementUsage();
      
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Static method to get user transactions with filters and pagination
transactionSchema.statics.getUserTransactions = function(userId, options = {}) {
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
  } = options;

  // Build query
  const query = { userId };

  if (type) query.type = type;
  if (category) query.category = category;
  if (paymentMethod) query.paymentMethod = paymentMethod;
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  if (minAmount || maxAmount) {
    query.amount = {};
    if (minAmount) query.amount.$gte = minAmount;
    if (maxAmount) query.amount.$lte = maxAmount;
  }
  
  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'location.name': { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('category', 'name color icon type')
    .populate('userId', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get transaction statistics
transactionSchema.statics.getTransactionStats = async function(userId, options = {}) {
  const { startDate, endDate } = options;
  
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $group: {
        _id: null,
        stats: {
          $push: {
            type: '$_id',
            totalAmount: '$totalAmount',
            count: '$count',
            avgAmount: '$avgAmount'
          }
        },
        totalTransactions: { $sum: '$count' }
      }
    }
  ]);
};

// Static method to get spending by category
transactionSchema.statics.getSpendingByCategory = async function(userId, options = {}) {
  const { startDate, endDate, type = 'expense' } = options;
  
  const matchStage = { 
    userId: new mongoose.Types.ObjectId(userId),
    type: type
  };
  
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  return await this.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    { $unwind: '$categoryInfo' },
    {
      $group: {
        _id: '$category',
        categoryName: { $first: '$categoryInfo.name' },
        categoryColor: { $first: '$categoryInfo.color' },
        categoryIcon: { $first: '$categoryInfo.icon' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);