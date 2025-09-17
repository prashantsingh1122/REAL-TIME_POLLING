const { validationResult } = require('express-validator');
const prisma = require('../config/database');

const pollController = {
  // Create a new poll with options
  createPoll: async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { question, options, isPublished = false, creatorId } = req.body;

      // Validate that we have at least 2 options
      if (!options || options.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'A poll must have at least 2 options'
        });
      }

      // Validate that options are not empty
      const validOptions = options.filter(option => option && option.trim().length > 0);
      if (validOptions.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'All poll options must be non-empty'
        });
      }

      // Check if creator exists
      const creator = await prisma.user.findUnique({
        where: { id: creatorId }
      });

      if (!creator) {
        return res.status(404).json({
          success: false,
          error: 'Creator user not found'
        });
      }

      // Create poll with options in a transaction
      const poll = await prisma.$transaction(async (prisma) => {
        // Create the poll
        const newPoll = await prisma.poll.create({
          data: {
            question,
            isPublished,
            creatorId
          }
        });

        // Create the poll options
        const pollOptions = await Promise.all(
          validOptions.map(optionText => 
            prisma.pollOption.create({
              data: {
                text: optionText.trim(),
                pollId: newPoll.id
              }
            })
          )
        );

        // Return the poll with its options
        return {
          ...newPoll,
          options: pollOptions
        };
      });

      res.status(201).json({
        success: true,
        message: 'Poll created successfully',
        data: { poll }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all polls with their options and vote counts
  getPolls: async (req, res, next) => {
    try {
      // Simplified to match original prompt requirements - no pagination, search, or filtering
      const polls = await prisma.poll.findMany({
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          options: {
            select: {
              id: true,
              text: true,
              _count: {
                select: {
                  votes: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        data: { polls }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get poll by ID with detailed information
  getPollById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const poll = await prisma.poll.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          options: {
            select: {
              id: true,
              text: true,
              _count: {
                select: {
                  votes: true
                }
              }
            }
          }
        }
      });

      if (!poll) {
        return res.status(404).json({
          success: false,
          error: 'Poll not found'
        });
      }

      // Calculate total votes and percentages
      const totalVotes = poll.options.reduce((sum, option) => sum + option._count.votes, 0);
      
      // Add percentage to each option
      poll.options = poll.options.map(option => ({
        ...option,
        percentage: totalVotes > 0 ? Math.round((option._count.votes / totalVotes) * 100) : 0
      }));

      poll.totalVotes = totalVotes;

      res.status(200).json({
        success: true,
        data: { poll }
      });
    } catch (error) {
      next(error);
    }
  },

  // Note: Poll update and delete were not required in the original prompt
  // Keeping only the core functionality: create and retrieve polls
};

module.exports = pollController;