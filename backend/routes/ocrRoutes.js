/**
 * OCR Routes
 * Handles receipt processing and OCR functionality routes
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  processReceipt,
  createTransactionFromOCR,
  getOCRHistory,
  reprocessReceipt,
  getOCRInfo
} = require('../controllers/ocrController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

/**
 * @route   GET /api/ocr/info
 * @desc    Get OCR service information
 * @access  Private
 */
router.get('/info', authenticateToken, getOCRInfo);

/**
 * @route   GET /api/ocr/history
 * @desc    Get OCR processing history
 * @access  Private
 */
router.get('/history', authenticateToken, getOCRHistory);

/**
 * @route   POST /api/ocr/process
 * @desc    Upload and process receipt
 * @access  Private
 */
router.post('/process', authenticateToken, processReceipt);

/**
 * @route   POST /api/ocr/create-transaction
 * @desc    Create transaction from OCR data
 * @access  Private
 */
router.post('/create-transaction', authenticateToken, createTransactionFromOCR);

/**
 * @route   POST /api/ocr/reprocess/:transactionId
 * @desc    Re-process a receipt
 * @access  Private
 */
router.post('/reprocess/:transactionId', authenticateToken, validateObjectId, reprocessReceipt);

module.exports = () => router;