# Real-Time Polling Backend 🗳️

A complete Node.js backend service for a real-time polling application with WebSockets support, built with Express, PostgreSQL, Prisma, and Socket.io.

## 🚀 Features

### Core Functionality
- **User Management**: Create users and manage user profiles
- **Poll System**: Create polls with multiple options, publish/unpublish polls
- **Voting System**: Submit votes with validation and duplicate prevention
- **Real-time Updates**: Live poll results via WebSocket connections
- **Data Relationships**: Complete many-to-many and one-to-many relationships

### Technical Features
- **REST API**: Complete CRUD operations for users, polls, and votes
- **WebSocket Integration**: Socket.io for real-time communication
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Request validation with express-validator
- **Error Handling**: Comprehensive error handling with custom middleware
- **Pagination**: Pagination support for all list endpoints
- **Database Seeding**: Sample data for testing and development

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v16.0.0 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12.0 or higher) or **Docker** (recommended)
- **Git**

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd real-time-polling-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database Configuration (Docker)
DATABASE_URL="postgresql://polling_user:password123@localhost:5432/realtime_polling_db"

# Database Configuration (Local PostgreSQL)
# DATABASE_URL="postgresql://username:password@localhost:5432/realtime_polling_db"

# Server Configuration
PORT=5000
NODE_ENV=development

# Client Configuration (for CORS)
CLIENT_URL=http://localhost:3000
```

### 4. Database Setup


```

#### Option A: Using Docker Run

```bash
# Start PostgreSQL with Docker
docker run --name polling-postgres \
  -e POSTGRES_DB=realtime_polling_db \
  -e POSTGRES_USER=polling_user \
  -e POSTGRES_PASSWORD=password123 \
  -p 5432:5432 \
  -d postgres:15

# Verify container is running
docker ps
```

#### Option B: Local PostgreSQL Installation

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE realtime_polling_db;

# Create user (optional)
CREATE USER polling_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE realtime_polling_db TO polling_user;
```

#### Generate Prisma Client

```bash
npm run db:generate
```

#### Run Database Migrations

```bash
npm run db:migrate
```

#### Seed Database (Optional)

```bash
npm run db:seed
```

This will create sample users, polls, and votes for testing.

### 5. Start the Server

#### Development Mode (with auto-reload)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Currently, this API doesn't include authentication. User ID is passed in request bodies for operations requiring user context.

### Users Endpoints

#### Create User
```http
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Get All Users
```http
GET /api/users?page=1&limit=10&search=john
```

#### Get User by ID
```http
GET /api/users/{userId}
```

### Polls Endpoints

#### Create Poll
```http
POST /api/polls
Content-Type: application/json

{
  "question": "What is your favorite programming language?",
  "options": ["JavaScript", "Python", "Java", "Go"],
  "creatorId": "user-uuid-here",
  "isPublished": true
}
```

#### Get All Polls
```http
GET /api/polls?page=1&limit=10&isPublished=true&search=programming
```

#### Get Poll by ID
```http
GET /api/polls/{pollId}?includeVotes=true
```

#### Update Poll
```http
PUT /api/polls/{pollId}
Content-Type: application/json

{
  "question": "Updated question",
  "isPublished": true
}
```

#### Delete Poll
```http
DELETE /api/polls/{pollId}
```

### Votes Endpoints

#### Submit Vote
```http
POST /api/votes
Content-Type: application/json

{
  "userId": "user-uuid-here",
  "pollOptionId": "option-uuid-here"
}
```

#### Get Poll Votes
```http
GET /api/votes/poll/{pollId}?page=1&limit=10
```

#### Get Poll Results
```http
GET /api/votes/poll/{pollId}/results
```

#### Remove Vote
```http
DELETE /api/votes/{voteId}
```

## 🔌 WebSocket Events

### Client to Server Events

#### Join Poll Room
```javascript
socket.emit('joinPoll', {
  pollId: 'poll-uuid-here',
  userId: 'user-uuid-here' // optional
});
```

#### Leave Poll Room
```javascript
socket.emit('leavePoll', {
  pollId: 'poll-uuid-here'
});
```

#### Get Poll Results
```javascript
socket.emit('getPollResults', {
  pollId: 'poll-uuid-here'
});
```

#### Ping
```javascript
socket.emit('ping');
```

### Server to Client Events

#### Poll Results
```javascript
socket.on('pollResults', (data) => {
  console.log(data);
  // {
  //   pollId: 'uuid',
  //   question: 'Poll question',
  //   totalVotes: 42,
  //   options: [
  //     { id: 'uuid', text: 'Option 1', votes: 20, percentage: 48 }
  //   ]
  // }
});
```

#### Poll Update (Real-time)
```javascript
socket.on('pollUpdate', (data) => {
  console.log(data);
  // {
  //   pollId: 'uuid',
  //   results: { /* poll results */ },
  //   newVote: {
  //     optionId: 'uuid',
  //     optionText: 'Selected option',
  //     voterName: 'John Doe',
  //     timestamp: '2023-01-01T00:00:00.000Z'
  //   }
  // }
});
```

#### User Events
```javascript
socket.on('userJoined', (data) => {
  console.log('User joined the poll');
});

socket.on('userLeft', (data) => {
  console.log('User left the poll');
});
```

#### Error Handling
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});
```

#### Pong Response
```javascript
socket.on('pong', () => {
  console.log('Connection is alive');
});
```

## 📁 Project Structure

```
real-time-polling-backend/
├── config/
│   └── database.js          # Prisma client configuration
├── controllers/
│   ├── userController.js    # User-related operations
│   ├── pollController.js    # Poll-related operations
│   └── voteController.js    # Vote-related operations
├── middleware/
│   └── errorHandler.js      # Global error handling
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.js             # Database seeding
├── routes/
│   ├── userRoutes.js       # User API routes
│   ├── pollRoutes.js       # Poll API routes
│   └── voteRoutes.js       # Vote API routes
├── services/
│   └── websocketHandler.js # WebSocket event handling
├── .env.example            # Environment variables template
├── package.json            # Dependencies and scripts
├── server.js              # Main application entry point
└── README.md              # This file
```

## 🔧 Database Schema

### User Model
- `id` (UUID, Primary Key)
- `name` (String)
- `email` (String, Unique)
- `passwordHash` (String)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Poll Model
- `id` (UUID, Primary Key)
- `question` (String)
- `isPublished` (Boolean)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `creatorId` (UUID, Foreign Key to User)

### PollOption Model
- `id` (UUID, Primary Key)
- `text` (String)
- `pollId` (UUID, Foreign Key to Poll)

### Vote Model
- `id` (UUID, Primary Key)
- `createdAt` (DateTime)
- `userId` (UUID, Foreign Key to User)
- `pollOptionId` (UUID, Foreign Key to PollOption)
- Unique constraint on `(userId, pollOptionId)`

## 🔄 Relationships

- **User → Polls**: One-to-Many (A user can create many polls)
- **Poll → PollOptions**: One-to-Many (A poll has many options)
- **User ↔ PollOption**: Many-to-Many through Vote table (Users can vote on multiple options across different polls)

## 📊 Sample Data

After running `npm run db:seed`, you'll have:

- **3 sample users** with email/password combinations:
  - `alice@example.com` / `password123`
  - `bob@example.com` / `password123`  
  - `carol@example.com` / `password123`

- **3 sample polls**:
  - Programming language preferences (published)
  - Frontend framework preferences (published)
  - Meeting time preferences (draft)

- **4 sample votes** across the published polls

## 🚀 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with sample data

## 🔍 Health Check

Check if the server is running:

```http
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "uptime": 42.123
}
```

## 🐛 Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Verify database credentials in `.env`
3. Check if database exists
4. Run migrations: `npm run db:migrate`

### Port Already in Use
- Change `PORT` in `.env` file
- Kill process using the port: `lsof -ti:5000 | xargs kill -9` (macOS/Linux)

### WebSocket Connection Issues
- Ensure `CLIENT_URL` in `.env` matches your frontend URL
- Check firewall settings
- Verify CORS configuration

### Migration Errors
- Reset database: `npx prisma migrate reset`
- Generate client: `npm run db:generate`
- Run migrations: `npm run db:migrate`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Web framework
- [Prisma](https://prisma.io/) - Database ORM
- [Socket.io](https://socket.io/) - WebSocket implementation
- [PostgreSQL](https://postgresql.org/) - Database system

---

**Happy Polling! 🗳️✨**