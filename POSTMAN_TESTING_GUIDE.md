# Postman Testing Guide for Real-Time Polling Backend

This guide will help you test all the API endpoints and WebSocket functionality using Postman.

## Prerequisites

1. **Start the server:**
   ```bash
   npm run dev
   ```
   Server should run on `http://localhost:5000`

2. **Seed the database:**
   ```bash
   npm run db:seed
   ```

## 1. REST API Testing

### Base URL
```
http://localhost:5000/api
```

### 1.1 User Management

#### Create User
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/users`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Get All Users
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/users`

#### Get User by ID
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/users/{userId}`
- **Note:** Replace `{userId}` with actual user ID from previous responses

### 1.2 Poll Management

#### Create Poll
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/polls`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "question": "What is your favorite programming language?",
  "options": ["JavaScript", "Python", "Java", "Go", "Rust"],
  "creatorId": "USER_ID_FROM_PREVIOUS_RESPONSE",
  "isPublished": true
}
```

#### Get All Polls
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/polls`

#### Get Poll by ID
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/polls/{pollId}`
- **Note:** Replace `{pollId}` with actual poll ID from previous responses

### 1.3 Vote Management

#### Submit Vote
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/votes`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "userId": "USER_ID_FROM_PREVIOUS_RESPONSE",
  "pollOptionId": "POLL_OPTION_ID_FROM_POLL_RESPONSE"
}
```

#### Get Poll Votes
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/votes/poll/{pollId}`

#### Get Poll Results
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/votes/poll/{pollId}/results`

### 1.4 Health Check
- **Method:** `GET`
- **URL:** `http://localhost:5000/health`

## 2. WebSocket Testing

### 2.1 Using Postman WebSocket

1. **Open Postman**
2. **Create New Request**
3. **Change method to WebSocket**
4. **Enter URL:** `ws://localhost:5000/socket.io/?EIO=4&transport=websocket`

### 2.2 WebSocket Events to Test

#### Join Poll Room
```json
{
  "type": "joinPoll",
  "data": {
    "pollId": "POLL_ID_FROM_API_RESPONSE",
    "userId": "USER_ID_FROM_API_RESPONSE"
  }
}
```

#### Listen for Events
After joining, you should receive:
- `pollResults` - Current poll results
- `pollUpdate` - Real-time updates when votes are cast

## 3. Complete Testing Workflow

### Step 1: Create Test Data
1. **Create 2-3 users** using the User API
2. **Create 1-2 polls** using the Poll API (with different users as creators)
3. **Note down the IDs** from responses

### Step 2: Test Voting
1. **Submit votes** using the Vote API
2. **Check poll results** after each vote
3. **Verify vote counts** are updating correctly

### Step 3: Test Real-time Updates
1. **Open WebSocket connection** in Postman
2. **Join a poll room** using `joinPoll` event
3. **Submit votes** via REST API in another tab
4. **Watch for real-time updates** in WebSocket connection

## 4. Sample Test Data

### Users to Create
```json
// User 1
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "SecurePass123"
}

// User 2
{
  "name": "Bob Smith", 
  "email": "bob@example.com",
  "password": "SecurePass123"
}
```

### Polls to Create
```json
// Poll 1
{
  "question": "What is your favorite programming language?",
  "options": ["JavaScript", "Python", "Java", "Go", "Rust"],
  "creatorId": "ALICE_USER_ID",
  "isPublished": true
}

// Poll 2
{
  "question": "Which frontend framework do you prefer?",
  "options": ["React", "Vue.js", "Angular", "Svelte"],
  "creatorId": "BOB_USER_ID", 
  "isPublished": true
}
```

## 5. Expected Responses

### Successful User Creation
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Successful Poll Creation
```json
{
  "success": true,
  "message": "Poll created successfully",
  "data": {
    "poll": {
      "id": "uuid-here",
      "question": "What is your favorite programming language?",
      "isPublished": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "creatorId": "user-uuid-here",
      "options": [
        {
          "id": "option-uuid-1",
          "text": "JavaScript",
          "pollId": "poll-uuid-here"
        },
        {
          "id": "option-uuid-2", 
          "text": "Python",
          "pollId": "poll-uuid-here"
        }
      ]
    }
  }
}
```

### Successful Vote Submission
```json
{
  "success": true,
  "message": "Vote submitted successfully",
  "data": {
    "vote": {
      "id": "vote-uuid-here",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "userId": "user-uuid-here",
      "pollOptionId": "option-uuid-here"
    },
    "pollResults": {
      "pollId": "poll-uuid-here",
      "question": "What is your favorite programming language?",
      "totalVotes": 1,
      "options": [
        {
          "id": "option-uuid-1",
          "text": "JavaScript",
          "votes": 1,
          "percentage": 100
        },
        {
          "id": "option-uuid-2",
          "text": "Python", 
          "votes": 0,
          "percentage": 0
        }
      ],
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### WebSocket Poll Update Event
```json
{
  "pollId": "poll-uuid-here",
  "results": {
    "pollId": "poll-uuid-here",
    "question": "What is your favorite programming language?",
    "totalVotes": 2,
    "options": [
      {
        "id": "option-uuid-1",
        "text": "JavaScript",
        "votes": 1,
        "percentage": 50
      },
      {
        "id": "option-uuid-2",
        "text": "Python",
        "votes": 1, 
        "percentage": 50
      }
    ],
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "newVote": {
    "optionId": "option-uuid-2",
    "optionText": "Python",
    "voterName": "Bob Smith",
    "timestamp": "2023-01-01T00:00:00.000Z"
  }
}
```

## 6. Error Testing

### Test Validation Errors
- Try creating user with invalid email
- Try creating poll with less than 2 options
- Try voting with invalid user/poll option IDs

### Test Business Logic Errors
- Try voting on unpublished poll
- Try voting twice in same poll
- Try voting with non-existent user/poll option

## 7. Tips for Testing

1. **Use Postman Collections** - Save all requests in a collection for easy reuse
2. **Use Variables** - Store user IDs, poll IDs, etc. in Postman variables
3. **Test Error Cases** - Don't just test happy path, test validation and error scenarios
4. **WebSocket Testing** - Keep WebSocket connection open while testing REST API
5. **Real-time Verification** - Submit votes via REST API and watch WebSocket for updates

## 8. Troubleshooting

### Common Issues
- **Connection refused** - Make sure server is running on port 5000
- **Database errors** - Ensure PostgreSQL is running and migrations are applied
- **WebSocket connection failed** - Check if Socket.io is properly configured
- **Validation errors** - Check request body format and required fields

### Debug Steps
1. Check server logs for errors
2. Verify database connection
3. Test with simple requests first
4. Check Postman request format
5. Verify all required fields are present

---

**Happy Testing! 🧪✨**
