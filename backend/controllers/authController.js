/**
 * Authentication Controller
 * Handles user registration, login, and profile management
 */

const User = require('../models/User');
const Category = require('../models/Category');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phoneNumber, dateOfBirth, currency } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists with this email', 400);
  }

  // Create new user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
    dateOfBirth,
    currency: currency || 'USD'
  });

  // Initialize default categories for the user
  await Category.createDefaultCategories();

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  console.log('JWT_SECRET is:', process.env.JWT_SECRET);


  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: userResponse,
      token,
      refreshToken
    }
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated. Please contact support', 401);
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last login
  await user.updateLastLogin();

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      token,
      refreshToken
    }
  });
});

/**
 * Get current user profile
 * @route GET /api/auth/profile
 * @access Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user
    }
  });
});

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    firstName,
    lastName,
    phoneNumber,
    dateOfBirth,
    currency,
    monthlyBudget,
    notifications
  } = req.body;

  // Build update object with only provided fields
  const updateFields = {};
  if (firstName) updateFields.firstName = firstName;
  if (lastName) updateFields.lastName = lastName;
  if (phoneNumber) updateFields.phoneNumber = phoneNumber;
  if (dateOfBirth) updateFields.dateOfBirth = dateOfBirth;
  if (currency) updateFields.currency = currency;
  if (monthlyBudget !== undefined) updateFields.monthlyBudget = monthlyBudget;
  if (notifications) updateFields.notifications = { ...req.user.notifications, ...notifications };

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateFields,
    {
      new: true,
      runValidators: true
    }
  );

  if (!updatedUser) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: updatedUser
    }
  });
});

/**
 * Change user password
 * @route PUT /api/auth/change-password
 * @access Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  // Get user with password
  const user = await User.findById(userId).select('+password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Upload profile picture
 * @route POST /api/auth/profile-picture
 * @access Private
 */
const uploadProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  if (!req.file) {
    throw new AppError('No image file provided', 400);
  }

  // Update user profile picture path
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { profilePicture: req.file.path },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Profile picture uploaded successfully',
    data: {
      user: updatedUser
    }
  });
});

/**
 * Delete user account
 * @route DELETE /api/auth/account
 * @access Private
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { password } = req.body;

  // Get user with password
  const user = await User.findById(userId).select('+password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify password before deletion
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Password is incorrect', 400);
  }

  // Soft delete: deactivate account instead of hard delete
  await User.findByIdAndUpdate(userId, { 
    isActive: false,
    email: `deleted_${Date.now()}_${user.email}` // Prevent email conflicts
  });

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 * @access Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Refresh token is required', 400);
  }

  try {
    // Verify refresh token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid refresh token', 401);
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Generate new access token
    const newAccessToken = generateToken(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newAccessToken
      }
    });

  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
});

/**
 * Get user statistics
 * @route GET /api/auth/stats
 * @access Private
 */
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get user's transaction statistics
  const Transaction = require('../models/Transaction');
  
  const [transactionStats, categoryStats] = await Promise.all([
    Transaction.getTransactionStats(userId),
    Transaction.getSpendingByCategory(userId)
  ]);

  const stats = {
    totalTransactions: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    topCategories: categoryStats.slice(0, 5)
  };

  if (transactionStats && transactionStats.length > 0) {
    const statData = transactionStats[0];
    stats.totalTransactions = statData.totalTransactions || 0;
    
    statData.stats?.forEach(stat => {
      if (stat.type === 'income') {
        stats.totalIncome = stat.totalAmount || 0;
      } else if (stat.type === 'expense') {
        stats.totalExpenses = stat.totalAmount || 0;
      }
    });
    
    stats.netIncome = stats.totalIncome - stats.totalExpenses;
  }

  res.json({
    success: true,
    message: 'User statistics retrieved successfully',
    data: {
      stats
    }
  });
});

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  uploadProfilePicture,
  deleteAccount,
  refreshToken,
  getUserStats
};