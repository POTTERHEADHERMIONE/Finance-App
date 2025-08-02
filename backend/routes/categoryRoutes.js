/**
 * Category Routes
 * Handles category CRUD operations and related functionality
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
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
} = require('../controllers/categoryController');

// Import middleware
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const {
  validateCategory,
  validateObjectId
} = require('../middleware/validation');

/**
 * @route   GET /api/categories/defaults
 * @desc    Get default categories
 * @access  Public
 */
router.get('/defaults', getDefaultCategories);

/**
 * @route   POST /api/categories/init-defaults
 * @desc    Initialize default categories
 * @access  Private
 */
router.post('/init-defaults', authenticateToken, initializeDefaultCategories);

/**
 * @route   GET /api/categories/stats
 * @desc    Get category statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, getCategoryStats);

/**
 * @route   GET /api/categories
 * @desc    Get all categories for a user
 * @access  Private
 */
router.get('/', authenticateToken, getCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get a single category by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, validateObjectId, getCategory);

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private
 */
router.post('/', authenticateToken, validateCategory, createCategory);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category
 * @access  Private
 */
router.put('/:id', authenticateToken, validateObjectId, validateCategory, updateCategory);

/**
 * @route   PUT /api/categories/:id/archive
 * @desc    Archive a category
 * @access  Private
 */
router.put('/:id/archive', authenticateToken, validateObjectId, archiveCategory);

/**
 * @route   PUT /api/categories/:id/restore
 * @desc    Restore an archived category
 * @access  Private
 */
router.put('/:id/restore', authenticateToken, validateObjectId, restoreCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category
 * @access  Private
 */
router.delete('/:id', authenticateToken, validateObjectId, deleteCategory);

/**
 * @route   DELETE /api/categories/bulk
 * @desc    Bulk delete categories
 * @access  Private
 */
router.delete('/bulk', authenticateToken, bulkDeleteCategories);

module.exports = () => router;