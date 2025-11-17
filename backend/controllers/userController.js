const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const { body, validationResult } = require('express-validator');

// Security fix: Input validation middleware
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8, max: 12 })
    .withMessage('Password must be between 8 and 12 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  body('isAdmin')
    .optional()
    .isBoolean()
    .withMessage('isAdmin must be a boolean value')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      errors: errors.array(),
      ip: req.ip,
      endpoint: req.originalUrl
    });
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
   console.log('Register endpoint hit');
   const { name, email, password, isAdmin = false } = req.body;
   console.log('Register request body:', { name, email, password: password ? '***' : undefined, isAdmin });

  try {
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      isAdmin: Boolean(isAdmin),
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
   console.log('Login endpoint hit');
   const { email, password } = req.body;
   console.log('Login request body:', { email, password: password ? '***' : undefined });
   const clientIP = req.ip || req.connection.remoteAddress;

   logger.info('Login attempt', { email, ip: clientIP });

   try {
     // Temporarily use raw SQL to bypass Sequelize model caching issues
     const [users] = await global.sequelize.query(
       'SELECT id, name, email, password, isAdmin FROM Users WHERE email = ?',
       {
         replacements: [email],
         type: global.sequelize.QueryTypes.SELECT
       }
     );
     const user = users ? users : null;

     if (user) {
       // Temporarily disabled account lockout due to database schema mismatch
       // TODO: Re-enable when database is properly migrated
       /*
       // Security fix: Check if account is locked
       if (user.isLocked && user.lockUntil && user.lockUntil > new Date()) {
         logger.warn('Login failed - account locked', {
           email,
           ip: clientIP,
           lockUntil: user.lockUntil
         });
         return res.status(423).json({
           message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
         });
       }
       */

       // Security fix: Removed password logging to prevent sensitive data exposure
       const bcrypt = require('bcryptjs');
       const isMatch = await bcrypt.compare(password, user.password);

       if (isMatch) {
         // Temporarily disabled failed attempts reset due to database schema mismatch
         // TODO: Re-enable when database is properly migrated
         /*
         // Security fix: Reset failed attempts on successful login
         await user.update({
           failedAttempts: 0,
           isLocked: false,
           lockUntil: null
         });
         */

         logger.info('Login successful', {
           email,
           userId: user.id,
           isAdmin: user.isAdmin,
           ip: clientIP
         });

         res.json({
           _id: user.id,
           name: user.name,
           email: user.email,
           isAdmin: user.isAdmin,
           token: generateToken(user.id),
         });
       } else {
         // Temporarily disabled failed attempts tracking due to database schema mismatch
         // TODO: Re-enable when database is properly migrated
         /*
         // Security fix: Increment failed attempts and lock account if necessary
         const newFailedAttempts = user.failedAttempts + 1;
         const maxAttempts = 5;
         const lockTime = 15 * 60 * 1000; // 15 minutes

         if (newFailedAttempts >= maxAttempts) {
           await user.update({
             failedAttempts: newFailedAttempts,
             isLocked: true,
             lockUntil: new Date(Date.now() + lockTime)
           });
           logger.warn('Account locked due to failed attempts', {
             email,
             userId: user.id,
             attempts: newFailedAttempts,
             ip: clientIP
           });
           return res.status(423).json({
             message: 'Account locked due to too many failed login attempts. Please try again in 15 minutes.'
           });
         } else {
           await user.update({
             failedAttempts: newFailedAttempts,
             isLocked: false,
             lockUntil: null
           });
           logger.warn('Login failed - invalid password', {
             email,
             userId: user.id,
             attempts: newFailedAttempts,
             ip: clientIP
           });
           return res.status(401).json({ message: 'Invalid email or password' });
         }
         */
         logger.warn('Login failed - invalid password', {
           email,
           userId: user.id,
           ip: clientIP
         });
         return res.status(401).json({ message: 'Invalid email or password' });
       }
     } else {
       logger.warn('Login failed - user not found', { email, ip: clientIP });
       res.status(401).json({ message: 'Invalid email or password' });
     }
   } catch (error) {
     logger.error('Login error', { error: error.message, email, ip: clientIP });
     res.status(500).json({ message: 'Server Error' });
   }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        console.log('Users found:', users.length);
        console.log('Users:', users.map(u => ({ id: u.id, name: u.name, email: u.email, isAdmin: u.isAdmin })));
        res.json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  validateRegistration,
  handleValidationErrors
};