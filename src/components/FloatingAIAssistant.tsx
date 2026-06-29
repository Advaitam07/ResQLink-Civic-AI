import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, HelpCircle, AlertOctagon, TrendingUp, HelpCircle as HelpIcon, MessageSquare, CornerDownLeft } from 'lucide-react';
import { CivicBotMessage } from '../types';

interface FloatingAIAssistantProps {
  onNavigate: (view: string) => void;
}

export default function FloatingAIAssistant({ onNavigate }: FloatingAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CivicBotMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your ResQLink Commander AI. I analyze real-time hazard data, safety reports, and city telemetry to help coordinate operations. How can I assist you today?",
      createdAt: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    if (!textToSend) {
      setInputValue("");
    }

    const userMsg: CivicBotMessage = {
      id: Math.random().toString(),
      sender: "user",
      text,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: CivicBotMessage = {
          id: Math.random().toString(),
          sender: "assistant",
          text: data.reply,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error("Chat response error");
      }
    } catch (err) {
      console.error(err);
      const errorMsg: CivicBotMessage = {
        id: Math.random().toString(),
        sender: "assistant",
        text: "I encountered a sync error connecting to the municipal intelligence stream. Please verify your connection or try again.",
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    { text: "Explain community score", icon: <TrendingUp className="h-3 w-3" /> },
    { text: "What are the active critical risks?", icon: <AlertOctagon className="h-3 w-3" /> },
    { text: "Recommend public works actions", icon: <Sparkles className="h-3 w-3" /> },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            layoutId="ai-assistant-container"
            onClick={() => setIsOpen(true)}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2.5 px-4.5 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 text-white rounded-full shadow-[0_8px_30px_rgb(79,70,229,0.3)] border border-white/15 cursor-pointer relative overflow-hidden group"
          >
            {/* Background shimmer */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            
            <div className="relative flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-indigo-200 animate-pulse" />
              <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-300"></span>
              </span>
            </div>
            
            <span className="text-xs font-semibold tracking-wide font-display">AI Copilot</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            layoutId="ai-assistant-container"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-[380px] h-[520px] bg-white/95 dark:bg-[#0c0f17]/95 border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8.5 w-8.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold font-display text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    ResQLink Intelligence
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-medium">Grounded in SF Telemetry</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/5' 
                      : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/20 dark:border-white/[0.02]'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-white/5 border border-slate-200/20 dark:border-white/[0.02] rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Container */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-transparent flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(qp.text)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-indigo-950/30 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 border border-slate-200/50 dark:border-white/5 transition cursor-pointer"
                >
                  {qp.icon}
                  {qp.text}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#0c0f17]">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200/50 dark:border-white/5 p-1 px-2 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-200"
              >
                <input
                  type="text"
                  placeholder="Ask the AI copilot..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-transparent text-xs py-2 px-1 focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
                
                <button
                  type="submit"
                  disabled={loading || !inputValue.trim()}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-lg transition cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
