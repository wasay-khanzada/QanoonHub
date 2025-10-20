# Real-time Chat Setup Guide

## Overview
The law firm management system now includes real-time chat functionality that allows lawyers and clients to communicate directly within ongoing cases.

## Features
- **Real-time messaging** using Socket.io
- **Case-specific chat rooms** - each case has its own chat room
- **Restricted access** - only the client, assigned lawyer, and admins can access each case chat
- **Message persistence** - all messages are stored in the database
- **User authentication** - JWT-based authentication for all chat access
- **Responsive UI** - works on desktop and mobile devices

## How to Use

### For Clients:
1. Navigate to your dashboard or the Cases page
2. Find a case that has an assigned lawyer
3. Click the "Chat" button next to the case
4. Start typing your message and press Enter or click Send

### For Lawyers:
1. Navigate to your dashboard or the Cases page
2. Find a case you're assigned to
3. Click the "Chat" button next to the case
4. Start typing your message and press Enter or click Send

### For Admins:
1. Navigate to the Cases page
2. Click the chat icon on any case
3. You can view and participate in any case chat

## Technical Implementation

### Backend Components:
- **Socket Handler**: `socketHandler/caseMessageHandlers.js` - Handles real-time communication
- **Message Model**: `models/message.js` - Database schema for messages
- **Chat Controller**: `controllers/chatController.js` - API endpoints for message management
- **Chat Routes**: `routes/chat.js` - HTTP routes for chat functionality

### Frontend Components:
- **CaseChat Component**: `components/CaseChat.js` - Main chat interface
- **Socket.io Client**: Integrated into React components
- **Message Display**: Real-time message rendering with user identification

### API Endpoints:
- `GET /api/chat/cases/:caseId/messages` - Fetch messages for a specific case
- `GET /api/chat/cases/messages` - Get all cases with message counts

### Socket Events:
- `joinRoom` - Join a case chat room
- `chatMessage` - Send a message to a case room
- `message` - Receive new messages
- `disconnect` - Handle user disconnection

## Security Features:
- **JWT Authentication**: All socket connections require valid JWT tokens
- **Restricted Chat Access**: Only the client, assigned lawyer, and admins can access each case chat
- **Case Access Control**: Users can only access chats for cases they're directly involved in
- **Message Validation**: Server-side validation for all messages
- **Real-time Authorization**: Every message and room join is validated against case assignments

## Database Schema:
```javascript
{
  message_case_id: String, // Case ID
  message_list: [{
    message_sender_id: String,
    message_sender_name: String,
    message_sender_avatar: String,
    message_type: String,
    message: String,
    message_sent_date: String
  }]
}
```

## Environment Configuration:
Make sure your frontend has the correct server URL configured:
```javascript
// In your React app, the socket connection uses:
const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:9000', {
  query: { token },
  transports: ['websocket']
});
```

## Troubleshooting:
1. **Connection Issues**: Check that the backend server is running on the correct port
2. **Authentication Errors**: Ensure JWT tokens are properly configured
3. **Message Not Sending**: Check browser console for socket connection errors
4. **Messages Not Loading**: Verify the API endpoints are accessible

## Future Enhancements:
- File sharing in chat
- Message reactions
- Typing indicators
- Message search functionality
- Chat notifications
- Message encryption
