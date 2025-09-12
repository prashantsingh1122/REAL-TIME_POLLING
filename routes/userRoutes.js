const express = require('express');
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');

const router = express.Router();

// Validation middleware for creating a user
const createUserValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// Validation middleware for user ID parameter
const userIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format')
];

// Routes
router.post('/', createUserValidation, userController.createUser);
router.get('/', userController.getUsers);
router.get('/:id', userIdValidation, userController.getUserById);

module.exports = router;