// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
dotenv.config();
const getUserInfo = require('./helpers/getUserInfo');
const jwt = require('jsonwebtoken');
const { caseMessageHandlers, writeMessageBatchToDB } = require('./socketHandler/caseMessageHandlers')
const appointment = require('./routes/appointment');
const caseRoute = require('./routes/case');
const document = require('./routes/document');
const auth = require('./routes/auth');
const task = require('./routes/task');
const statistic = require('./routes/statistic');
const crm = require('./routes/crm');
const billing = require('./routes/billing');
const chat = require('./routes/chat');

const mongoose = require('mongoose');
const Message = require('./models/message')
const User = require('./models/user')

mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DBNAME,
})
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));


const PORT = process.env.SERVER_PORT || 9000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
// All routes
app.use('/api/appointments', appointment);
app.use('/api/documents', document);
app.use('/api/cases', caseRoute);
app.use('/api/statistics', statistic);
app.use('/auth', auth);
app.use('/api/crm', crm);
app.use('/api/tasks', task);
app.use('/api/billing', billing);
app.use('/api/chat', chat);

const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

const onConnection = (socket) => {
  caseMessageHandlers(io, socket);
}

io.use(function (socket, next) {
  if (socket.handshake.query && socket.handshake.query.token) {
    jwt.verify(socket.handshake.query.token, process.env.JWT_SECRET, function (err, decoded) {
      if (err) return next(new Error('Authentication error'));
      socket.decoded = decoded;
      next();
    });
  }
  else {
    next(new Error('Authentication error'));
  }
}).on('connection', onConnection);

// Set up periodic batch write (adjust the interval as needed)
setInterval(writeMessageBatchToDB, 5000); // 5000 milliseconds (5 seconds) as an example interval
