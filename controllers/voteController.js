const { validationResult } = require('express-validator');
const prisma = require('../config/database');

const voteController = {
  // Submit a vote for a poll option
  submitVote: async (req, res, next) => {
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

      const { userId, pollOptionId } = req.body;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if poll option exists and get poll information
      const pollOption = await prisma.pollOption.findUnique({
        where: { id: pollOptionId },
        include: {
          poll: {
            select: {
              id: true,
              question: true,
              isPublished: true
            }
          }
        }
      });

      if (!pollOption) {
        return res.status(404).json({
          success: false,
          error: 'Poll option not found'
        });
      }

      // Check if poll is published
      if (!pollOption.poll.isPublished) {
        return res.status(400).json({
          success: false,
          error: 'Cannot vote on unpublished poll'
        });
      }

      // Check if user has already voted for any option in this poll
      const existingVoteInPoll = await prisma.vote.findFirst({
        where: {
          userId,
          pollOption: {
            pollId: pollOption.poll.id
          }
        },
        include: {
          pollOption: {
            select: {
              id: true,
              text: true
            }
          }
        }
      });

      if (existingVoteInPoll) {
        return res.status(409).json({
          success: false,
          error: 'User has already voted in this poll',
          details: {
            existingVote: {
              optionId: existingVoteInPoll.pollOption.id,
              optionText: existingVoteInPoll.pollOption.text
            }
          }
        });
      }

      // Create the vote
      const vote = await prisma.vote.create({
        data: {
          userId,
          pollOptionId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          },
          pollOption: {
            select: {
              id: true,
              text: true,
              poll: {
                select: {
                  id: true,
                  question: true
                }
              }
            }
          }
        }
      });

      // Get updated poll results for real-time broadcast
      const updatedPollResults = await getPollResults(pollOption.poll.id);

      // Emit real-time update via WebSocket
      const io = req.app.get('io');
      if (io) {
        io.to(`poll-${pollOption.poll.id}`).emit('pollUpdate', {
          pollId: pollOption.poll.id,
          results: updatedPollResults,
          newVote: {
            optionId: pollOptionId,
            optionText: pollOption.text,
            voterName: user.name,
            timestamp: vote.createdAt
          }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Vote submitted successfully',
        data: { 
          vote,
          pollResults: updatedPollResults
        }
      });
    } catch (error) {
      // Handle unique constraint violation (user trying to vote twice)
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: 'User has already voted for this option'
        });
      }
      next(error);
    }
  },

  // Get votes for a specific poll
  getPollVotes: async (req, res, next) => {
    try {
      const { pollId } = req.params;

      // Check if poll exists
      const poll = await prisma.poll.findUnique({
        where: { id: pollId }
      });

      if (!poll) {
        return res.status(404).json({
          success: false,
          error: 'Poll not found'
        });
      }

      // Get votes (simplified - no pagination as not required in prompt)
      const votes = await prisma.vote.findMany({
        where: {
          pollOption: {
            pollId
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          },
          pollOption: {
            select: {
              id: true,
              text: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        data: {
          votes,
          poll: {
            id: poll.id,
            question: poll.question
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get poll results (vote counts and percentages)
  getPollResults: async (req, res, next) => {
    try {
      const { pollId } = req.params;

      const results = await getPollResults(pollId);

      if (!results) {
        return res.status(404).json({
          success: false,
          error: 'Poll not found'
        });
      }

      res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  },

 
};

// Helper function to get poll results
async function getPollResults(pollId) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        include: {
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
    return null;
  }

  const totalVotes = poll.options.reduce((sum, option) => sum + option._count.votes, 0);

  const results = {
    pollId: poll.id,
    question: poll.question,
    totalVotes,
    options: poll.options.map(option => ({
      id: option.id,
      text: option.text,
      votes: option._count.votes,
      percentage: totalVotes > 0 ? Math.round((option._count.votes / totalVotes) * 100) : 0
    })),
    updatedAt: new Date()
  };

  return results;
}

module.exports = voteController;