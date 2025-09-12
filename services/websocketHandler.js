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

        // Notify other users in the room that someone joined (optional)
        socket.to(roomName).emit('userJoined', {
          message: 'A user joined the poll',
          pollId,
          timestamp: new Date()
        });

        // Store poll association with socket for cleanup
        socket.pollId = pollId;
        socket.userId = userId;

      } catch (error) {
        console.error('Error handling joinPoll:', error);
        socket.emit('error', { message: 'Failed to join poll' });
      }
    });

    // Handle client leaving a poll room
    socket.on('leavePoll', (data) => {
      try {
        const { pollId } = data;

        if (!pollId) {
          socket.emit('error', { message: 'Poll ID is required' });
          return;
        }

        const roomName = `poll-${pollId}`;
        socket.leave(roomName);

        console.log(`Client ${socket.id} left poll room: ${roomName}`);

        // Notify other users in the room that someone left (optional)
        socket.to(roomName).emit('userLeft', {
          message: 'A user left the poll',
          pollId,
          timestamp: new Date()
        });

        // Clear poll association
        delete socket.pollId;
        delete socket.userId;

      } catch (error) {
        console.error('Error handling leavePoll:', error);
      }
    });

    // Handle requests for current poll results
    socket.on('getPollResults', async (data) => {
      try {
        const { pollId } = data;

        if (!pollId) {
          socket.emit('error', { message: 'Poll ID is required' });
          return;
        }

        const pollResults = await getPollResults(pollId);
        
        if (!pollResults) {
          socket.emit('error', { message: 'Poll not found' });
          return;
        }

        socket.emit('pollResults', pollResults);

      } catch (error) {
        console.error('Error handling getPollResults:', error);
        socket.emit('error', { message: 'Failed to get poll results' });
      }
    });

    // Handle ping/pong for connection health check
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);

      // If the client was in a poll room, notify other users
      if (socket.pollId) {
        const roomName = `poll-${socket.pollId}`;
        socket.to(roomName).emit('userLeft', {
          message: 'A user disconnected',
          pollId: socket.pollId,
          timestamp: new Date()
        });
      }
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

  // Periodically clean up empty rooms (optional)
  setInterval(() => {
    const rooms = io.sockets.adapter.rooms;
    rooms.forEach((sockets, roomName) => {
      if (roomName.startsWith('poll-') && sockets.size === 0) {
        console.log(`Cleaning up empty room: ${roomName}`);
        delete rooms[roomName];
      }
    });
  }, 300000); // Every 5 minutes
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