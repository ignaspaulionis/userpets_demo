const { body } = require('express-validator');

module.exports = {
  registerValidator: [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('fullname').notEmpty().withMessage('Full name is required')
  ],
  updateValidator: [
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('fullname').optional().notEmpty().withMessage('Full name is required')
  ],
  petValidator: [
    body('name').notEmpty().withMessage('Pet name is required'),
    body('type').notEmpty().withMessage('Pet type is required'),
    body('age').isInt({ min: 0 }).withMessage('Age must be a non-negative integer')
  ]
};