import React, { useState, useRef, useEffect } from 'react';
import { CivicBotMessage } from '../types';
import { MessageSquare, Send, Sparkles, X, ChevronUp, Bot, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CivicBotChatProps {
  onClose?: () => void;
  isOpen: boolean;
}

export default function CivicBotChat({ onClose, isOpen }: CivicBotChatProps) {
  const [messages, setMessages] = useState<CivicBotMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I'm **CivicBot**, your ResQLink Civic AI companion. Ask me anything about active issues, your neighborhood's Community Health Score, or how you can earn Civic Points to rank up!",
      createdAt: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: CivicBotMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: textToSend,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });

      if (!response.ok) throw new Error("Failed to contact chat server");
      const data = await response.json();

      const assistantMsg: CivicBotMessage = {
        id: `ast_${Date.now()}`,
        sender: "assistant",
        text: data.text || "I was unable to retrieve a response. Please check back shortly.",
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        sender: "assistant",
        text: "I encountered a minor network error. Make sure your local Express server is active and try again!",
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    "What is our Community Health Score?",
    "Show me critical active issues.",
    "How can I earn Civic Points?"
  ];

  const formatText = (text: string) => {
    // Support basic bolding and bullet list styling
    return text.split('\n').map((line, idx) => {
      let formatted = line;
      // Bold **text**
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Highlight inline code / IDs
      formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-100 text-rose-600 rounded text-xs font-mono">$1</code>');
      
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return <li key={idx} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-*]\s*/, '') }} />;
      }
      return <p key={idx} className="mb-1.5" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="fixed bottom-6 right-6 w-96 h-[540px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-50"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight flex items-center gap-1.5">
                  Civic AI Concierge
                  <Sparkles className="h-3.5 w-3.5 text-yellow-200 fill-yellow-200 animate-pulse" />
                </h3>
                <span className="text-xs text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Grounded in Live Database
                </span>
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs shrink-0 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl text-xs shadow-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}
                >
                  {formatText(msg.text)}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-3 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm text-xs flex items-center gap-2">
                  <span className="text-gray-400 animate-pulse">Civic AI is compiling...</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Control & Suggestions */}
          <div className="p-3 bg-white border-t border-gray-100 space-y-3">
            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="px-2 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-[10px] text-gray-600 rounded-full border border-gray-200 hover:border-emerald-200 transition-colors duration-150 text-left cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about potholes, water leaks..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend(inputValue);
                }}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
              />
              <button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
