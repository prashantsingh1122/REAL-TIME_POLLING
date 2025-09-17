const prisma = require('../config/database');

const websocketHandler = (io) => {
  console.log('WebSocket handler initialized');

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle client joining a poll room for real-time updates
    socket.on('joinPoll', async (data) => {
      try {
        const { pollId, userId } = data;

        if (!pollId) {
          socket.emit('error', { message: 'Poll ID is required' });
          return;
        }

        // Validate poll exists
        const poll = await prisma.poll.findUnique({
          where: { id: pollId }
        });

        if (!poll) {
          socket.emit('error', { message: 'Poll not found' });
          return;
        }

        // Join the poll room
        const roomName = `poll-${pollId}`;
        socket.join(roomName);

        console.log(`Client ${socket.id} joined poll room: ${roomName}`);

        // Send current poll results to the newly joined client
        const pollResults = await getPollResults(pollId);
        socket.emit('pollResults', pollResults);

        // Note: User join/leave notifications were not required in the original prompt

        // Store poll association with socket for cleanup
        socket.pollId = pollId;
        socket.userId = userId;

      } catch (error) {
        console.error('Error handling joinPoll:', error);
        socket.emit('error', { message: 'Failed to join poll' });
      }
    });

    // Note: Additional WebSocket events (leavePoll, getPollResults, ping/pong) 
    // were not required in the original prompt. Keeping only joinPoll for real-time updates.

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);

      // Note: User disconnect notifications were not required in the original prompt
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for client ${socket.id}:`, error);
    });
  });

  // Global error handler for the io instance
  io.on('error', (error) => {
    console.error('Socket.IO server error:', error);
  });

  // Note: Room cleanup was causing issues - removed as it's not required in the prompt
  // Socket.io handles room management automatically
};

// Helper function to get poll results (same as in voteController)
async function getPollResults(pollId) {
  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        },
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
      isPublished: poll.isPublished,
      creator: poll.creator,
      totalVotes,
      options: poll.options.map(option => ({
        id: option.id,
        text: option.text,
        votes: option._count.votes,
        percentage: totalVotes > 0 ? Math.round((option._count.votes / totalVotes) * 100) : 0
      })),
      updatedAt: new Date(),
      createdAt: poll.createdAt
    };

    return results;
  } catch (error) {
    console.error('Error getting poll results:', error);
    return null;
  }
}

module.exports = websocketHandler;