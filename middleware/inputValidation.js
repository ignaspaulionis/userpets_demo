// Input Validation Middleware
const { body, validationResult } = require('express-validator');

exports.validateUserRegistration = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('fullname').isString().withMessage('Fullname must be a string')));