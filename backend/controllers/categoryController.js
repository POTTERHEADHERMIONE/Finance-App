/**
 * Category Controller
 * Handles CRUD operations for transaction categories
 */

const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * Get all categories for a user (including default categories)
 * @route GET /api/categories
 * @access Private
 */
const getCategories = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type } = req.query;

  const categories = await Category.getUserCategories(userId, type);

  res.json({
    success: true,
    message: 'Categories retrieved successfully',
    data: {
      categories
    }
  });
});

/**
 * Get a single category by ID
 * @route GET /api/categories/:id
 * @access Private
 */
const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const category = await Category.findById(id).populate('parentCategory');

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Check if user can access this category
  if (category.userId && !category.userId.equals(userId) && !category.isDefault) {
    throw new AppError('You can only access your own categories or default categories', 403);
  }

  res.json({
    success: true,
    message: 'Category retrieved successfully',
    data: {
      category
    }
  });
});

/**
 * Create a new category
 * @route POST /api/categories
 * @access Private
 */
const createCategory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const categoryData = {
    ...req.body,
    userId
  };

  // Validate parent category if provided
  if (req.body.parentCategory) {
    const parentCategory = await Category.findById(req.body.parentCategory);
    if (!parentCategory) {
      throw new AppError('Parent category not found', 404);
    }

    // Check if user can use this parent category
    if (parentCategory.userId && !parentCategory.userId.equals(userId) && !parentCategory.isDefault) {
      throw new AppError('You can only use your own categories or default categories as parent', 403);
    }
  }

  // Check if category name already exists for this user
  const existingCategory = await Category.findOne({
    name: req.body.name,
    $or: [
      { userId: userId },
      { isDefault: true }
    ]
  });

  if (existingCategory) {
    throw new AppError('A category with this name already exists', 400);
  }

  const category = await Category.create(categoryData);
  await category.populate('parentCategory');

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: {
      category
    }
  });
});

/**
 * Update a category
 * @route PUT /api/categories/:id
 * @access Private
 */
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Find category and check ownership
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Only allow users to update their own categories (not default ones)
  if (!category.userId || !category.userId.equals(userId)) {
    throw new AppError('You can only update your own categories', 403);
  }

  // Validate parent category if being updated
  if (req.body.parentCategory) {
    const parentCategory = await Category.findById(req.body.parentCategory);
    if (!parentCategory) {
      throw new AppError('Parent category not found', 404);
    }

    // Check if user can use this parent category
    if (parentCategory.userId && !parentCategory.userId.equals(userId) && !parentCategory.isDefault) {
      throw new AppError('You can only use your own categories or default categories as parent', 403);
    }

    // Prevent circular references
    if (parentCategory._id.equals(id)) {
      throw new AppError('A category cannot be its own parent', 400);
    }
  }

  // Check for name conflicts if name is being updated
  if (req.body.name && req.body.name !== category.name) {
    const existingCategory = await Category.findOne({
      name: req.body.name,
      _id: { $ne: id },
      $or: [
        { userId: userId },
        { isDefault: true }
      ]
    });

    if (existingCategory) {
      throw new AppError('A category with this name already exists', 400);
    }
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('parentCategory');

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: {
      category: updatedCategory
    }
  });
});

/**
 * Delete a category
 * @route DELETE /api/categories/:id
 * @access Private
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Find category and check ownership
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Only allow users to delete their own categories (not default ones)
  if (!category.userId || !category.userId.equals(userId) || category.isDefault) {
    throw new AppError('You can only delete your own custom categories', 403);
  }

  // Check if category is being used in any transactions
  const transactionCount = await Transaction.countDocuments({ category: id });
  if (transactionCount > 0) {
    throw new AppError(`Cannot delete category. It is being used in ${transactionCount} transaction(s)`, 400);
  }

  // Check if category has subcategories
  const subcategoryCount = await Category.countDocuments({ parentCategory: id });
  if (subcategoryCount > 0) {
    throw new AppError(`Cannot delete category. It has ${subcategoryCount} subcategory(ies)`, 400);
  }

  await Category.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

/**
 * Get category statistics
 * @route GET /api/categories/stats
 * @access Private
 */
const getCategoryStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate } = req.query;

  const options = {};
  if (startDate) options.startDate = startDate;
  if (endDate) options.endDate = endDate;

  // Get spending by category
  const [expenseStats, incomeStats] = await Promise.all([
    Transaction.getSpendingByCategory(userId, { ...options, type: 'expense' }),
    Transaction.getSpendingByCategory(userId, { ...options, type: 'income' })
  ]);

  // Get most used categories
  const mostUsedCategories = await Category.find({
    $or: [
      { userId: userId },
      { isDefault: true }
    ],
    isActive: true
  }).sort({ usageCount: -1 }).limit(10);

  res.json({
    success: true,
    message: 'Category statistics retrieved successfully',
    data: {
      expenseBreakdown: expenseStats,
      incomeBreakdown: incomeStats,
      mostUsedCategories
    }
  });
});

/**
 * Get default categories
 * @route GET /api/categories/defaults
 * @access Public
 */
const getDefaultCategories = asyncHandler(async (req, res) => {
  const categories = await Category.getDefaultCategories();

  res.json({
    success: true,
    message: 'Default categories retrieved successfully',
    data: {
      categories
    }
  });
});

/**
 * Initialize default categories (admin only)
 * @route POST /api/categories/init-defaults
 * @access Private
 */
const initializeDefaultCategories = asyncHandler(async (req, res) => {
  await Category.createDefaultCategories();

  res.json({
    success: true,
    message: 'Default categories initialized successfully'
  });
});

/**
 * Archive/Deactivate a category
 * @route PUT /api/categories/:id/archive
 * @access Private
 */
const archiveCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Find category and check ownership
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Only allow users to archive their own categories (not default ones)
  if (!category.userId || !category.userId.equals(userId)) {
    throw new AppError('You can only archive your own categories', 403);
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Category archived successfully',
    data: {
      category: updatedCategory
    }
  });
});

/**
 * Restore an archived category
 * @route PUT /api/categories/:id/restore
 * @access Private
 */
const restoreCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Find category and check ownership
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Only allow users to restore their own categories
  if (!category.userId || !category.userId.equals(userId)) {
    throw new AppError('You can only restore your own categories', 403);
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Category restored successfully',
    data: {
      category: updatedCategory
    }
  });
});

/**
 * Bulk delete categories
 * @route DELETE /api/categories/bulk
 * @access Private
 */
const bulkDeleteCategories = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { categoryIds } = req.body;

  if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
    throw new AppError('Category IDs are required', 400);
  }

  // Verify all categories belong to the user
  const categories = await Category.find({
    _id: { $in: categoryIds },
    userId: userId,
    isDefault: false
  });

  if (categories.length !== categoryIds.length) {
    throw new AppError('Some categories not found or cannot be deleted', 400);
  }

  // Check if any categories are being used in transactions
  const transactionCount = await Transaction.countDocuments({
    category: { $in: categoryIds }
  });

  if (transactionCount > 0) {
    throw new AppError('Cannot delete categories that are being used in transactions', 400);
  }

  // Delete categories
  const result = await Category.deleteMany({
    _id: { $in: categoryIds },
    userId: userId,
    isDefault: false
  });

  res.json({
    success: true,
    message: `${result.deletedCount} categories deleted successfully`,
    data: {
      deletedCount: result.deletedCount
    }
  });
});

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
  getDefaultCategories,
  initializeDefaultCategories,
  archiveCategory,
  restoreCategory,
  bulkDeleteCategories
};