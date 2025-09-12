const express = require('express');
const { body, param } = require('express-validator');
const voteController = require('../controllers/voteController');

const router = express.Router();

// Validation middleware for submitting a vote
const submitVoteValidation = [
  body('userId')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  body('pollOptionId')
    .isUUID()
    .withMessage('Poll option ID must be a valid UUID')
];

// Validation middleware for poll ID parameter
const pollIdValidation = [
  param('pollId')
    .isUUID()
    .withMessage('Invalid poll ID format')
];

// Validation middleware for vote ID parameter
const voteIdValidation = [
  param('voteId')
    .isUUID()
    .withMessage('Invalid vote ID format')
];

// Routes

// POST /api/votes - Submit a vote
router.post('/', submitVoteValidation, voteController.submitVote);

// GET /api/votes/poll/:pollId - Get all votes for a specific poll
router.get('/poll/:pollId', pollIdValidation, voteController.getPollVotes);

// GET /api/votes/poll/:pollId/results - Get poll results (vote counts and percentages)
router.get('/poll/:pollId/results', pollIdValidation, voteController.getPollResults);

// DELETE /api/votes/:voteId - Remove a vote
router.delete('/:voteId', voteIdValidation, voteController.removeVote);

module.exports = router;