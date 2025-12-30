// src/components/ChatbotPanel.js
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Trash2, Bot, Sparkles } from 'lucide-react';
import { sendMessage, clearConversation } from '../utils/chatbotApi';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const ChatbotPanel = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! I\'m QanoonHub AI. How can I assist you with your legal cases today?'
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await sendMessage(userMessage, sessionId);
            if (!sessionId) setSessionId(response.sessionId);

            setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again.');
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an issue. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearConversation = async () => {
        if (sessionId) {
            try {
                await clearConversation(sessionId);
                setSessionId(null);
                toast.success('Chat cleared');
            } catch (e) { console.error(e); }
        }
        setMessages([{ role: 'assistant', content: 'Chat cleared. How can I help?' }]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-20 right-4 w-96 h-[550px] bg-[#2d2d5f] rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-700/50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 font-sans">

            {/* Header */}
            <div className="bg-secondary-800 p-4 flex items-center justify-between border-b border-gray-700/30">
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-500/20 p-2 rounded-lg border border-yellow-500/30">
                        <Bot size={20} className="text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-white">QanoonHub Assistant</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <p className="text-xs text-gray-400">Online</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={handleClearConversation} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Clear">
                        <Trash2 size={16} />
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Close">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary-700">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                        {msg.role === 'assistant' && (
                            <div className="w-7 h-7 rounded-lg bg-yellow-700/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 text-xs font-bold mr-2 mt-auto shrink-0">
                                AI
                            </div>
                        )}

                        <div className={`max-w-[75%] p-3 shadow-sm text-sm leading-relaxed
                            ${msg.role === 'user'
                                ? 'bg-[#d4a857] text-white rounded-2xl rounded-tr-md'
                                : 'bg-secondary-800 text-gray-100 border border-gray-700/50 rounded-2xl rounded-tl-md'
                            }`}
                        >
                            <div className="markdown-content">
                                <ReactMarkdown
                                    components={{
                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                                        em: ({ node, ...props }) => <em className="italic" {...props} />,
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold">AI</div>
                        <div className="bg-[#3d3d6f] px-4 py-3 rounded-2xl rounded-tl-md border border-gray-700/50">
                            <div className="flex gap-1.5">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-secondary-800 border-t border-gray-700/30">
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your question..."
                        className="w-full bg-secondary-800 border border-gray-700/50 text-white text-sm rounded-xl px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all placeholder:text-gray-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputMessage.trim()}
                        className="absolute right-2 p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send size={14} className={isLoading ? 'opacity-0' : 'opacity-100'} />
                        {isLoading && <span className="absolute inset-0 m-auto w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                    </button>
                </form>
                <div className="flex justify-center mt-2 items-center gap-1.5">
                    <Sparkles size={9} className="text-yellow-400" />
                    <p className="text-[9px] text-gray-500 font-medium">Powered by Gemini AI</p>
                </div>
            </div>
        </div>
    );
};

export default ChatbotPanel;
