import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftIcon,
  UserIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { getSocketServerUrl } from '../config/socket';

const CaseChat = ({ caseId, isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch existing messages
  const { data: existingMessages = [], isLoading } = useQuery(
    ['caseMessages', caseId],
    async () => {
      const response = await axios.get(`/api/chat/cases/${caseId}/messages`);
      return response.data;
    },
    {
      enabled: !!caseId && isOpen,
      onSuccess: (data) => {
        setMessages(data);
      }
    }
  );

  // Initialize socket connection
  useEffect(() => {
    if (!isOpen || !caseId || !user) {
      console.log('Chat conditions not met:', { isOpen, caseId, user });
      return;
    }

    // Prefer fresh token from localStorage (set by /auth/me), fallback to cookie
    const token = localStorage.getItem('authToken') || getCookie('token');
    if (!token) {
      console.log('No token found');
      toast.error('Authentication token not found');
      return;
    }

    console.log('Attempting to connect to socket server...');
    const serverUrl = getSocketServerUrl();
    console.log('Server URL:', serverUrl);
    
    const newSocket = io(serverUrl, {
      query: { token },
      transports: ['websocket', 'polling'] // Add polling as fallback
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      // Join the case room
      newSocket.emit('joinRoom', caseId);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    newSocket.on('roomJoined', (data) => {
      console.log('Successfully joined room:', data);
    });

    newSocket.on('message', (data) => {
      console.log('New message received:', data);
      setMessages(prev => [...prev, data]);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Chat error occurred');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
      });
      toast.error(`Failed to connect to chat server: ${error.message}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isOpen, caseId, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !isConnected) return;

    const messageData = {
      caseId,
      message: message.trim(),
      type: 'text'
    };

    // Emit message to socket
    socket.emit('chatMessage', messageData);
    console.log('📤 Emitted chatMessage:', messageData);
    setMessage('');
  };

  const handleDeleteMessages = async () => {
    if (!window.confirm('Are you sure you want to delete all messages in this chat? This action cannot be undone.')) {
      return;
    }

    try {
      const deleteUrl = `/api/chat/cases/${caseId}/messages`;
      console.log('🗑️ [Frontend] Attempting to delete messages at:', deleteUrl);
      await axios.delete(deleteUrl);
      setMessages([]);
      toast.success('All messages deleted successfully');
    } catch (error) {
      console.error('Error deleting messages:', error);
      console.error('Full error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url
      });
      toast.error('Failed to delete messages');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (messageSenderId) => {
    if (!user || !messageSenderId) return false;
    const isOwn = messageSenderId === user.userId || messageSenderId === user.id;
    console.log('🔍 isOwnMessage check:', {
      messageSenderId,
      userUserId: user.userId,
      userId: user.id,
      isOwn
    });
    return isOwn;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Case Chat</h3>
              <p className="text-sm text-gray-500">Case ID: {caseId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {messages.length > 0 && (
              <button
                onClick={handleDeleteMessages}
                className="text-red-500 hover:text-red-700 p-1"
                title="Delete all messages"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
              <p className="mt-1 text-sm text-gray-500">Start the conversation!</p>
            </div>
          ) : (messages.map((msg, index) => (
            
                <div
                key={index}
                className={`flex ${isOwnMessage(msg.message_sender_id) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage(msg.message_sender_id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {!isOwnMessage(msg.message_sender_id) && (
                    <div className="flex items-center space-x-2 mb-1">
                      <UserIcon className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {msg.message_sender_name || 'Unknown User'}
                      </span>
                    </div>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <ClockIcon className="h-3 w-3" />
                    <span className="text-xs opacity-75">
                      {formatTime(msg.message_sent_date)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!message.trim() || !isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default CaseChat;
