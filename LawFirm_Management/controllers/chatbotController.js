// controllers/chatbotController.js
import { GoogleGenAI } from "@google/genai";

// In-memory session store (use Redis in prod)
const conversationSessions = new Map();

// System prompt
const SYSTEM_PROMPT = `You are a helpful legal assistant for CaseAce, a law firm management system.
You help users with general legal questions, case management guidance, and navigating the application.
Provide professional, accurate, and helpful responses. If a question is beyond your knowledge or requires
specific legal advice, recommend consulting with a qualified attorney.`;

// Initialize Gemini (API key is read automatically from env)
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Send message to chatbot
 */
export const sendMessage = async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required",
            });
        }

        // Create session ID if missing
        const currentSessionId =
            sessionId ||
            `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

        // Load conversation history
        let conversationHistory =
            conversationSessions.get(currentSessionId) || [];

        // Limit history
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }

        /**
         * Build contents in the official format
         * contents: [{ role, parts: [{ text }] }]
         */
        const contents = [
            {
                role: "user",
                parts: [{ text: SYSTEM_PROMPT }],
            },
            ...conversationHistory.map((msg) => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }],
            })),
            {
                role: "user",
                parts: [{ text: message }],
            },
        ];

        // Generate response (OFFICIAL METHOD)
        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
            },
        });

        const aiResponse =
            response.text || "Sorry, I couldn’t generate a response.";

        // Update history
        conversationHistory.push({ role: "user", content: message });
        conversationHistory.push({ role: "assistant", content: aiResponse });

        // Re-limit after push
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }

        conversationSessions.set(currentSessionId, conversationHistory);
        cleanupOldSessions();

        res.json({
            success: true,
            sessionId: currentSessionId,
            message: aiResponse,
            conversationHistory,
        });
    } catch (error) {
        console.error("Gemini chatbot error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get response from chatbot",
            error: error.message,
        });
    }
};

/**
 * Get conversation history
 */
export const getHistory = async (req, res) => {
    const { sessionId } = req.params;

    res.json({
        success: true,
        sessionId,
        conversationHistory: conversationSessions.get(sessionId) || [],
    });
};

/**
 * Clear conversation history
 */
export const clearHistory = async (req, res) => {
    const { sessionId } = req.params;

    conversationSessions.delete(sessionId);

    res.json({
        success: true,
        message: "Conversation history cleared",
    });
};

/**
 * Cleanup sessions older than 1 hour
 */
function cleanupOldSessions() {
    const ONE_HOUR = 60 * 60 * 1000;
    const now = Date.now();

    for (const [sessionId] of conversationSessions.entries()) {
        const match = sessionId.match(/session_(\d+)_/);
        if (!match) continue;

        const createdAt = parseInt(match[1], 10);
        if (now - createdAt > ONE_HOUR) {
            conversationSessions.delete(sessionId);
        }
    }
}
