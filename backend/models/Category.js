/**
 * Category Model
 * Handles transaction categories for better organization
 */

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // Basic category information
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  
  // Visual representation
  color: {
    type: String,
    default: '#1976d2',
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color code']
  },
  icon: {
    type: String,
    default: 'category',
    trim: true
  },
  
  // Category type
  type: {
    type: String,
    required: [true, 'Category type is required'],
    enum: {
      values: ['income', 'expense', 'both'],
      message: 'Category type must be either income, expense, or both'
    }
  },
  
  // User reference (null for system default categories)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null indicates system-wide category
  },
  
  // Category status
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false // true for system default categories
  },
  
  // Usage statistics
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative']
  },
  lastUsed: {
    type: Date,
    default: null
  },
  
  // Parent category for subcategories
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  
  // Budget allocation for expense categories
  budgetLimit: {
    type: Number,
    min: [0, 'Budget limit cannot be negative'],
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
categorySchema.index({ userId: 1, type: 1 });
categorySchema.index({ name: 1, userId: 1 }, { unique: true });
categorySchema.index({ isActive: 1 });
categorySchema.index({ usageCount: -1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Pre-save middleware to validate parent category
categorySchema.pre('save', async function(next) {
  if (this.parentCategory) {
    try {
      const parentCategory = await this.constructor.findById(this.parentCategory);
      if (!parentCategory) {
        throw new Error('Parent category does not exist');
      }
      if (parentCategory.parentCategory) {
        throw new Error('Cannot create subcategory of a subcategory');
      }
      if (parentCategory.userId && this.userId && !parentCategory.userId.equals(this.userId)) {
        throw new Error('Parent category must belong to the same user');
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Instance method to increment usage count
categorySchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Static method to get default categories
categorySchema.statics.getDefaultCategories = function() {
  return this.find({ isDefault: true, isActive: true });
};

// Static method to get user categories
categorySchema.statics.getUserCategories = function(userId, type = null) {
  const query = {
    $or: [
      { userId: userId },
      { isDefault: true }
    ],
    isActive: true
  };
  
  if (type && type !== 'both') {
    query.type = { $in: [type, 'both'] };
  }
  
  return this.find(query).populate('parentCategory').sort({ usageCount: -1, name: 1 });
};

// Static method to create default categories
categorySchema.statics.createDefaultCategories = async function() {
  const defaultCategories = [
    // Income categories
    { name: 'Salary', type: 'income', color: '#4caf50', icon: 'work', isDefault: true },
    { name: 'Freelance', type: 'income', color: '#2196f3', icon: 'business', isDefault: true },
    { name: 'Investment', type: 'income', color: '#ff9800', icon: 'trending_up', isDefault: true },
    { name: 'Other Income', type: 'income', color: '#9c27b0', icon: 'add_circle', isDefault: true },
    
    // Expense categories
    { name: 'Food & Dining', type: 'expense', color: '#f44336', icon: 'restaurant', isDefault: true },
    { name: 'Transportation', type: 'expense', color: '#3f51b5', icon: 'directions_car', isDefault: true },
    { name: 'Shopping', type: 'expense', color: '#e91e63', icon: 'shopping_cart', isDefault: true },
    { name: 'Entertainment', type: 'expense', color: '#009688', icon: 'movie', isDefault: true },
    { name: 'Bills & Utilities', type: 'expense', color: '#795548', icon: 'receipt', isDefault: true },
    { name: 'Healthcare', type: 'expense', color: '#607d8b', icon: 'local_hospital', isDefault: true },
    { name: 'Education', type: 'expense', color: '#ff5722', icon: 'school', isDefault: true },
    { name: 'Travel', type: 'expense', color: '#cddc39', icon: 'flight', isDefault: true },
    { name: 'Insurance', type: 'expense', color: '#8bc34a', icon: 'security', isDefault: true },
    { name: 'Other Expense', type: 'expense', color: '#ffc107', icon: 'remove_circle', isDefault: true }
  ];

  try {
    // Only create if no default categories exist
    const existingCount = await this.countDocuments({ isDefault: true });
    if (existingCount === 0) {
      await this.insertMany(defaultCategories);
      console.log('✅ Default categories created successfully');
    }
  } catch (error) {
    console.error('❌ Error creating default categories:', error);
  }
};

module.exports = mongoose.model('Category', categorySchema);