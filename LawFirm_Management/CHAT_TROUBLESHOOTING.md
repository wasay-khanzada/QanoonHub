# Chat Troubleshooting Guide

## Issue: Chat Shows "Disconnected" Status

### Step 1: Check Backend Server
1. Make sure the backend server is running on port 9000
2. Check the terminal for any error messages
3. Verify MongoDB connection is working

### Step 2: Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for these messages:
   - "Attempting to connect to socket server..."
   - "Server URL: http://localhost:9000"
   - "Connected to chat server" (success)
   - "Socket connection error:" (failure)

### Step 3: Check Network Tab
1. In Developer Tools, go to Network tab
2. Look for WebSocket connections to localhost:9000
3. Check if the connection is successful (Status 101) or failed

### Step 4: Verify Authentication
1. Check if you're logged in properly
2. Verify the JWT token exists in cookies
3. Check if the token is valid

### Step 5: Check Case Access
1. Make sure you have access to the case you're trying to chat in
2. Verify you're either:
   - The client who created the case
   - The assigned lawyer for the case
   - An admin

## Common Solutions:

### Solution 1: Restart Backend Server
```bash
cd LawFirm_Management
npm start
```

### Solution 2: Check Environment Variables
Make sure these are set in your backend:
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`

### Solution 3: Check Frontend Environment
Create a `.env` file in the frontend directory:
```
REACT_APP_SERVER_URL=http://localhost:9000
```

### Solution 4: Clear Browser Cache
1. Clear browser cache and cookies
2. Refresh the page
3. Try logging in again

### Solution 5: Check Firewall/Port Issues
1. Make sure port 9000 is not blocked
2. Check if another service is using port 9000
3. Try changing the port in app.js

## Debug Steps:

1. **Open Browser Console** and look for error messages
2. **Check Network Tab** for failed WebSocket connections
3. **Verify Backend Logs** for authentication errors
4. **Test API Endpoints** manually using browser or Postman

## Expected Console Output (Success):
```
Attempting to connect to socket server...
Server URL: http://localhost:9000
Connected to chat server
Successfully joined room: {caseId: "...", caseTitle: "..."}
```

## Expected Console Output (Failure):
```
Socket connection error: [error details]
Failed to connect to chat server: [error message]
```

## Quick Test:
1. Open browser console
2. Try to open a case chat
3. Look for the debug messages above
4. Share the console output for further debugging
