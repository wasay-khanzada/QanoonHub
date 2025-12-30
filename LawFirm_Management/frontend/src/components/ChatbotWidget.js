// src/components/ChatbotWidget.js
import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import ChatbotPanel from './ChatbotPanel';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Chatbot Panel */}
            <ChatbotPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />

            {/* Floating Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        relative flex items-center justify-center w-12 h-12 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95
                        ${isOpen
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-[#d4a857] hover:bg-yellow-600 hover:shadow-yellow-500/50'
                        }
                    `}
                    aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
                >
                    {isOpen ? (
                        <X size={20} className="text-white" />
                    ) : (
                        <>
                            <MessageCircle size={22} className="text-white" />
                            {/* Status Indicator */}
                            <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-white animate-pulse"></span>
                        </>
                    )}
                </button>
            </div>
        </>
    );
};

export default ChatbotWidget;
