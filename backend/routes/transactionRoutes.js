/**
 * Transaction Routes
 * Handles transaction CRUD operations and related functionality
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  exportTransactionsPDF,
  bulkDeleteTransactions
} = require('../controllers/transactionController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');
const {
  validateTransaction,
  validateObjectId,
  validateQueryFilters
} = require('../middleware/validation');

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions with filtering and pagination
 * @access  Private
 */
router.get('/', authenticateToken, validateQueryFilters, getTransactions);

/**
 * @route   GET /api/transactions/stats
 * @desc    Get transaction statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, getTransactionStats);

/**
 * @route   GET /api/transactions/export
 * @desc    Export transactions to PDF
 * @access  Private
 */
router.get('/export', authenticateToken, exportTransactionsPDF);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get a single transaction by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, validateObjectId, getTransaction);

/**
 * @route   POST /api/newTransactions
 * @desc    Create a new transaction
 * @access  Private
 */
router.post('/', authenticateToken, validateTransaction, createTransaction);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update a transaction
 * @access  Private
 */
router.put('/:id', authenticateToken, validateObjectId, validateTransaction, updateTransaction);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete a transaction
 * @access  Private
 */
router.delete('/:id', authenticateToken, validateObjectId, deleteTransaction);

/**
 * @route   DELETE /api/transactions/bulk
 * @desc    Bulk delete transactions
 * @access  Private
 */
router.delete('/bulk', authenticateToken, bulkDeleteTransactions);

module.exports = () => router;