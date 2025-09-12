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
      const { 
        page = 1, 
        limit = 10, 
        search, 
        isPublished,
        creatorId,
        includeVotes = true 
      } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const where = {};
      
      if (search) {
        where.question = { contains: search, mode: 'insensitive' };
      }
      
      if (isPublished !== undefined) {
        where.isPublished = isPublished === 'true';
      }
      
      if (creatorId) {
        where.creatorId = creatorId;
      }

      // Get polls with pagination
      const [polls, total] = await Promise.all([
        prisma.poll.findMany({
          where,
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
                ...(includeVotes === 'true' && {
                  _count: {
                    select: {
                      votes: true
                    }
                  }
                })
              }
            },
            _count: {
              select: {
                options: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.poll.count({ where })
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      res.status(200).json({
        success: true,
        data: {
          polls,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get poll by ID with detailed information
  getPollById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { includeVotes = true } = req.query;

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
              ...(includeVotes === 'true' && {
                votes: {
                  select: {
                    id: true,
                    createdAt: true,
                    user: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                },
                _count: {
                  select: {
                    votes: true
                  }
                }
              })
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

      // Calculate total votes for percentage calculation
      if (includeVotes === 'true') {
        const totalVotes = poll.options.reduce((sum, option) => sum + option._count.votes, 0);
        
        // Add percentage to each option
        poll.options = poll.options.map(option => ({
          ...option,
          percentage: totalVotes > 0 ? Math.round((option._count.votes / totalVotes) * 100) : 0
        }));

        poll.totalVotes = totalVotes;
      }

      res.status(200).json({
        success: true,
        data: { poll }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update poll (publish/unpublish)
  updatePoll: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { question, isPublished } = req.body;

      // Check if poll exists
      const existingPoll = await prisma.poll.findUnique({
        where: { id }
      });

      if (!existingPoll) {
        return res.status(404).json({
          success: false,
          error: 'Poll not found'
        });
      }

      // Update poll
      const poll = await prisma.poll.update({
        where: { id },
        data: {
          ...(question && { question }),
          ...(isPublished !== undefined && { isPublished })
        },
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

      res.status(200).json({
        success: true,
        message: 'Poll updated successfully',
        data: { poll }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete poll
  deletePoll: async (req, res, next) => {
    try {
      const { id } = req.params;

      // Check if poll exists
      const existingPoll = await prisma.poll.findUnique({
        where: { id }
      });

      if (!existingPoll) {
        return res.status(404).json({
          success: false,
          error: 'Poll not found'
        });
      }

      // Delete poll (cascade will handle options and votes)
      await prisma.poll.delete({
        where: { id }
      });

      res.status(200).json({
        success: true,
        message: 'Poll deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = pollController;