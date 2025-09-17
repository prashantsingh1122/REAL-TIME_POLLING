const express = require('express');
const { body, param } = require('express-validator');
const pollController = require('../controllers/pollController');

const router = express.Router();

// Validation middleware for creating a poll
const createPollValidation = [
  body('question')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Question must be between 5 and 500 characters'),
  body('options')
    .isArray({ min: 2, max: 10 })
    .withMessage('A poll must have between 2 and 10 options'),
  body('options.*')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each option must be between 1 and 200 characters'),
  body('creatorId')
    .isUUID()
    .withMessage('Creator ID must be a valid UUID'),
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean value')
];

// Validation middleware for poll ID parameter
const pollIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid poll ID format')
];

// Routes

// POST /api/polls - Create a new poll
router.post('/', createPollValidation, pollController.createPoll);

// GET /api/polls - Get all polls
router.get('/', pollController.getPolls);

// GET /api/polls/:id - Get a specific poll by ID
router.get('/:id', pollIdValidation, pollController.getPollById);

// Note: Poll update and delete endpoints removed as they were not in the original prompt

module.exports = router;