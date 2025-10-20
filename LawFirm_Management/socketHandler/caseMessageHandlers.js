let collectedUserInfo = {};
let messageBatch = {};

const User = require('../models/user')
const mongoose = require('mongoose');
const Message = require('../models/message')


const caseMessageHandlers = (io, socket) => {
    console.log(`🟢 [Socket Connected] ${socket.id} (User ID: ${socket.decoded?.userId || 'unknown'})`);
     socket.on('test', (data) => {
        console.log('🧪 TEST EVENT RECEIVED:', data);
    });

    socket.onAny((eventName, ...args) => {
        console.log(`📨 RECEIVED EVENT: ${eventName}`, args);
    });

    

    const joinRoom = async (caseId) => {
        console.log(`➡️  [joinRoom] User ${socket.decoded.userId} trying to join case ${caseId}`);
        try {
            const currentUserId = socket.decoded.userId;
            const Case = require('../models/case');
            const caseData = await Case.findById(caseId)
                .populate('client_id', 'username email')
                .populate('assigned_lawyer_id', 'username email');

            if (!caseData) {
                console.warn(`⚠️  [joinRoom] Case ${caseId} not found`);
                socket.emit('error', { message: 'Case not found' });
                return;
            }

            // Check access
            const isClient = caseData.client_id && caseData.client_id._id.toString() === currentUserId;
            const isAssignedLawyer = caseData.assigned_lawyer_id && caseData.assigned_lawyer_id._id.toString() === currentUserId;
            const isAdmin = socket.decoded.type === 'admin';

            if (!isClient && !isAssignedLawyer && !isAdmin) {
                console.warn(`🚫 [joinRoom] Unauthorized access attempt by ${currentUserId} for case ${caseId}`);
                socket.emit('error', { message: 'You do not have access to this case chat' });
                return;
            }

            socket.join(caseId);
            console.log(`✅ [joinRoom] User ${currentUserId} joined room for case ${caseId}`);

            socket.emit('roomJoined', { caseId, caseTitle: caseData.case_title });
        } catch (error) {
            console.error('❌ [joinRoom Error]:', error);
            socket.emit('error', { message: 'Failed to join chat room' });
        }
    };

    const chatMessage = async (data) => {
        console.log(`💬 [chatMessage] From ${socket.decoded.userId} → Case ${data.caseId}: ${data.message}`);
        try {
            const currentUserId = socket.decoded.userId;
            const Case = require('../models/case');
            const caseData = await Case.findById(data.caseId)
                .populate('client_id', 'username email')
                .populate('assigned_lawyer_id', 'username email');

            if (!caseData) {
                console.warn(`⚠️  [chatMessage] Case ${data.caseId} not found`);
                socket.emit('error', { message: 'Case not found' });
                return;
            }

            // Check access again
            const isClient = caseData.client_id && caseData.client_id._id.toString() === currentUserId;
            const isAssignedLawyer = caseData.assigned_lawyer_id && caseData.assigned_lawyer_id._id.toString() === currentUserId;
            const isAdmin = socket.decoded.type === 'admin';

            if (!isClient && !isAssignedLawyer && !isAdmin) {
                console.warn(`🚫 [chatMessage] Unauthorized message attempt by ${currentUserId}`);
                socket.emit('error', { message: 'You do not have permission to send messages' });
                return;
            }

            // Cache user info
            if (!collectedUserInfo[currentUserId]) {
                console.log(`ℹ️  [chatMessage] Fetching user info for ${currentUserId}`);
                collectedUserInfo[currentUserId] = await User.findById(new mongoose.Types.ObjectId(currentUserId));
            }


            // Build enriched message object
            const messagebody = {
                message_sender_id: currentUserId,
                message_sender_name: collectedUserInfo[currentUserId].username,
                message_sender_avatar: collectedUserInfo[currentUserId].avatar_url,
                message_type: data.type,
                message: data.message,
                message_sent_date: Date.now(),
            };

            // Broadcast enriched message to the room
            io.to(data.caseId).emit('message', messagebody);
            console.log(`📤 [chatMessage] Broadcasted enriched message to room ${data.caseId}`);

            // Add to batch for database storage
            if (!messageBatch[data.caseId]) {
                messageBatch[data.caseId] = [messagebody];
            } else {
                messageBatch[data.caseId].push(messagebody);
            }

            console.log(`🗂️  [chatMessage] Added message to batch for case ${data.caseId}`);

        }catch (error) {
            console.error('❌ [chatMessage Error]:', error);
            socket.emit('error', { message: 'failed to send message'});
        }
    };  // ← Only ONE brace here to close chatMessage

    // Register event listeners HERE
    socket.on('joinRoom', joinRoom);
    socket.on('chatMessage', chatMessage);

    socket.on('disconnect', (reason) => {
        console.log(`🔴 [Socket Disconnected] ${socket.id} - Reason: ${reason}`);
    });
};     

// Write the message batch to MongoDB
const writeMessageBatchToDB = () => {
    if (Object.keys(messageBatch).length > 0) {
   
      for (const cid of Object.keys(messageBatch)) {
        const messageEachCase = messageBatch[cid]
        const filter = {
          "message_case_id": cid,
        }
        const newMessages = Message.findOneAndUpdate(filter, {
          "$push":
          {
            "message_list": [...messageEachCase]
          }
        }, { new: true, upsert: true }).then(() => {
          console.log('Batch written to MongoDB');
          // Clear the batch after writing
          messageBatch = {};
        })
          .catch((err) => {
            console.error('Error writing batch to MongoDB:', err);
          });
      }
  
    };
}
module.exports =
    {caseMessageHandlers, writeMessageBatchToDB}

