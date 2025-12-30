// src/utils/chatbotApi.js
import axios from 'axios';

const API_BASE_URL = '/api/chatbot';

/**
 * Send a message to the chatbot
 * @param {string} message - The user's message
 * @param {string|null} sessionId - The current session ID (optional)
 * @returns {Promise} Response from the chatbot
 */
export const sendMessage = async (message, sessionId = null) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/message`, {
            message,
            sessionId
        });
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

/**
 * Get conversation history for a session
 * @param {string} sessionId - The session ID
 * @returns {Promise} Conversation history
 */
export const getConversationHistory = async (sessionId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/history/${sessionId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting conversation history:', error);
        throw error;
    }
};

/**
 * Clear conversation history for a session
 * @param {string} sessionId - The session ID
 * @returns {Promise} Success response
 */
export const clearConversation = async (sessionId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/history/${sessionId}`);
        return response.data;
    } catch (error) {
        console.error('Error clearing conversation:', error);
        throw error;
    }
};
