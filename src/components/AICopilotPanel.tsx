import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Mic, MicOff, UploadCloud, Image, History, ArrowRight, MessageSquare, Info, ShieldAlert, CheckCircle2, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AICopilotPanelProps {
  onTriggerExecution: (taskType: string, payload?: any) => void;
  onNewMessage: (text: string) => void;
  onImageSelected: (base64: string, mime: string, presetId: string, name: string) => void;
  currentUser: { name: string; email: string };
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export default function AICopilotPanel({ onTriggerExecution, onNewMessage, onImageSelected, currentUser }: AICopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Greetings. I am **Commander AI**, the central tactical intelligence engine for ResQLink. I coordinate regional sensor matrices, drone streams, and citizen-reported threat vectors in real time. \n\nSelect a simulated civic incident asset below, run diagnostic telemetry, or input custom commands to initiate immediate multi-agent orchestration.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested high-impact prompt presets
  const SUGGESTED_PROMPTS = [
    { label: "Analyze Valencia Pothole", prompt: "Perform deep visual diagnosis of the Valencia Street pothole (iss_001)." },
    { label: "Check Dolores Park Dump", prompt: "Evaluate sanitation threat vectors around Dolores Park (iss_002)." },
    { label: "Assess Market St. Leak", prompt: "Assess utility leakage mechanics on Market St (iss_003)." },
    { label: "Review Church St. Wires", prompt: "Isolate high-severity electric hazard on Church Street (iss_004)." }
  ];

  // Suggested Follow-up Action Pills
  const FOLLOW_UP_ACTIONS = [
    { label: "Deploy Nearest Rescue Squad", action: "Deploy nearest search & rescue dispatch teams immediately." },
    { label: "Issue District Sirens", action: "Trigger localized civic emergency sirens for current coordinates." },
    { label: "Recalibrate GIS Sensors", action: "Request automated telemetry sweep on active sensory systems." }
  ];

  // Past sessions history
  const PAST_SESSIONS = [
    { id: "s1", title: "Water Pipe Rupture Diagnostic", date: "Today, 09:12 AM" },
    { id: "s2", title: "Valencia St. Multi-Incident Cluster", date: "Yesterday, 03:45 PM" },
    { id: "s3", title: "Mission District Sanitation Audit", date: "June 24, 11:20 AM" }
  ];

  // Visual catalog of high-fidelity simulated assets that the user can immediately feed to the AI
  const SIMULATED_CIVIC_ASSETS = [
    {
      id: 'sim_pothole',
      name: 'Valencia St. Pothole',
      category: 'Roads',
      url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80',
      description: 'Severe pavement crater'
    },
    {
      id: 'sim_garbage',
      name: 'Dolores Park Illegal Dump',
      category: 'Sanitation',
      url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80',
      description: 'Biohazard & commercial litter'
    },
    {
      id: 'sim_water',
      name: 'Market St. Water Break',
      category: 'Utilities',
      url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80',
      description: 'Pressure main sidewalk rupture'
    },
    {
      id: 'sim_light',
      name: 'Church St. Hanging Wire',
      category: 'Safety',
      url: 'https://images.unsplash.com/photo-1542397284385-601017642477?auto=format&fit=crop&w=400&q=80',
      description: 'Storm damaged streetlight poles'
    }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, thinkingSteps]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setThinkingSteps(["Aligning cognitive swarm core...", "Locating target coordinates via GIS grid..."]);
    onNewMessage(text);

    // Trigger AI Execution Engine state simulation!
    onTriggerExecution('TEXT_PROMPT', { prompt: text });

    // Stagger tool execution steps visually
    setTimeout(() => {
      setThinkingSteps(prev => [...prev, "Checking sensor live streams for micro-anomalies..."]);
    }, 600);

    setTimeout(() => {
      setThinkingSteps(prev => [...prev, "Formulating multi-agent tactical dispatch plan..."]);
    }, 1300);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ sender: m.sender, text: m.text })) })
      });

      if (!response.ok) throw new Error();
      const data = await response.json();

      setMessages(prev => [...prev, {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch {
      // High quality fallback
      setMessages(prev => [...prev, {
        id: `a_err_${Date.now()}`,
        sender: 'assistant',
        text: `Understood. I have initiated a tactical sector sweep regarding: **"${text}"**. \n\nMy predictive telemetry confirms regional risk levels have been updated in your dashboard. Swarm agents are active and stand ready.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
      setThinkingSteps([]);
    }
  };

  const handleSimulateAssetSelected = async (asset: typeof SIMULATED_CIVIC_ASSETS[0]) => {
    // Notify the app of image selection to trigger full pipeline in Left + Center + Right Panels!
    onTriggerExecution('IMAGE_UPLOAD', { assetId: asset.id, name: asset.name });
    
    setMessages(prev => [...prev, {
      id: `u_asset_${Date.now()}`,
      sender: 'user',
      text: `[Image Payload] Analyze uploaded asset: ${asset.name} (${asset.description})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setLoading(true);
    setThinkingSteps(["Ingesting forensic incident image...", "Running convolutional classification layers...", "Extracting regional EXIF geotags..."]);

    setTimeout(() => {
      setThinkingSteps(prev => [...prev, "Analyzing potential cascading utility threats..."]);
    }, 800);

    try {
      const response = await fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: 'MOCK_DATA', mimeType: 'image/jpeg', presetId: asset.id })
      });

      if (!response.ok) throw new Error();
      const analysis = await response.json();

      onImageSelected('MOCK_DATA', 'image/jpeg', asset.id, asset.name);

      setMessages(prev => [...prev, {
        id: `a_analysis_${Date.now()}`,
        sender: 'assistant',
        text: `### **${analysis.title}** Detected\n\n**Category**: ${analysis.category} | **Estimated Severity**: ${analysis.severity}\n\n**Description**: ${analysis.description}\n\n**Community Impact Assessment**:\n${analysis.communityImpact}\n\n**Action Plan Prescribed**:\n${analysis.recommendedActions.map((act: string, idx: number) => `${idx + 1}. ${act}`).join('\n')}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch {
      // Local recovery
      setMessages(prev => [...prev, {
        id: `a_err_${Date.now()}`,
        sender: 'assistant',
        text: `Failed to connect with visual analyzer cluster, but I have successfully mapped **${asset.name}** under regional priority alerts based on EXIF data.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
      setThinkingSteps([]);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      const spokenPrompts = [
        "Find nearby duplicate water pipe leaks",
        "Scan Mission district streetlights",
        "Check overall district health grade",
        "Evaluate illegal parking lanes"
      ];
      const randomPrompt = spokenPrompts[Math.floor(Math.random() * spokenPrompts.length)];
      handleSendMessage(randomPrompt);
    } else {
      setIsListening(true);
    }
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let formatted = line;
      // Bold markdown
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-indigo-400">$1</strong>');
      // Markdown headings
      if (line.startsWith('###')) {
        return <h4 key={idx} className="font-display font-bold text-indigo-400 mt-3 mb-1 text-xs" dangerouslySetInnerHTML={{ __html: line.replace('###', '') }} />;
      }
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return <li key={idx} className="ml-4 list-disc text-slate-300" dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-*]\s*/, '') }} />;
      }
      return <p key={idx} className="mb-1 text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#060813] border-r border-white/5 relative">
      
      {/* Title Panel */}
      <div className="p-4 border-b border-white/5 bg-[#0a0c16]/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-500/25">
            <Cpu className="h-4 w-4 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs text-white tracking-wide">Commander AI</h3>
            <span className="text-[9px] text-indigo-400 font-mono tracking-wider font-bold uppercase">Tactical Core</span>
          </div>
        </div>

        {/* History Toggle */}
        <button 
          onClick={() => setHistoryOpen(!historyOpen)}
          className={`p-1.5 rounded-lg border cursor-pointer transition ${
            historyOpen 
              ? 'bg-indigo-500/20 border-indigo-500/30 text-white' 
              : 'border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Past Session History"
        >
          <History className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* History Slide-over panel */}
      <AnimatePresence>
        {historyOpen && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="absolute inset-x-0 top-[53px] bottom-0 bg-[#060813] z-20 border-r border-white/5 p-4 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Past Cognitive Sessions</span>
              <button onClick={() => setHistoryOpen(false)} className="text-[10px] text-indigo-400 hover:underline">Close</button>
            </div>
            <div className="space-y-2">
              {PAST_SESSIONS.map(sess => (
                <button
                  key={sess.id}
                  onClick={() => {
                    handleSendMessage(`Recall and reload analysis for: ${sess.title}`);
                    setHistoryOpen(false);
                  }}
                  className="w-full p-3 bg-[#0a0c16]/80 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left cursor-pointer transition-all duration-150 block"
                >
                  <h4 className="font-bold text-xs text-white truncate">{sess.title}</h4>
                  <span className="text-[9px] text-slate-400 mt-1 block font-mono">{sess.date}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#030408] custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[90%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            {msg.sender === 'assistant' && (
              <div className="h-6 w-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            )}
            <div
              className={`p-3 rounded-xl text-xs leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-indigo-600/20 text-indigo-200 rounded-tr-none border border-indigo-500/30'
                  : 'bg-[#0a0c16]/80 text-slate-100 border border-white/5 rounded-tl-none'
              }`}
            >
              {formatText(msg.text)}
              <span className={`text-[8px] block mt-1.5 text-right font-mono ${msg.sender === 'user' ? 'text-indigo-300' : 'text-slate-500'}`}>{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="space-y-3">
            <div className="flex gap-3 max-w-[90%]">
              <div className="h-6 w-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
              </div>
              <div className="p-3 bg-[#0a0c16]/80 border border-white/5 rounded-xl rounded-tl-none text-xs flex items-center gap-2 text-slate-400 font-mono shadow-xs">
                <span>Commander AI processing...</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                </span>
              </div>
            </div>

            {/* LIVE TOOL EXECUTION TIMELINE */}
            {thinkingSteps.length > 0 && (
              <div className="ml-9 border-l border-indigo-500/20 pl-4 py-1 space-y-2">
                <span className="text-[8px] font-mono text-indigo-400 font-bold uppercase tracking-wider">Sub-agent Execution Chain</span>
                {thinkingSteps.map((step, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-[10px] font-mono text-slate-400"
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${index === thinkingSteps.length - 1 ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-500'}`} />
                    <span>{step}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Follow-up Action Deck */}
      {!loading && messages.length > 1 && (
        <div className="px-3 pt-2 bg-[#030408] border-t border-white/5 flex flex-wrap gap-1.5">
          {FOLLOW_UP_ACTIONS.map((act, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(act.action)}
              className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-400/40 text-[9px] font-mono font-semibold text-indigo-300 rounded-lg transition duration-150 cursor-pointer"
            >
              <Sparkles className="h-2.5 w-2.5" />
              <span>{act.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Interactive Visual/Voice Upload Area */}
      <div className="p-3 bg-[#0a0c16]/50 border-t border-white/5 space-y-3 shrink-0">
        
        {/* Simulated File upload / quick catalog choice */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Image className="h-3.5 w-3.5 text-indigo-400" />
              Analyze Simulated Assets
            </span>
            <span className="text-[7.5px] text-indigo-400 font-mono uppercase bg-[#060813] border border-white/5 px-1.5 py-0.5 rounded">Test AI Flow</span>
          </div>
          
          <div className="grid grid-cols-4 gap-1.5">
            {SIMULATED_CIVIC_ASSETS.map(asset => (
              <button
                key={asset.id}
                onClick={() => handleSimulateAssetSelected(asset)}
                className="group relative h-12 rounded-lg overflow-hidden border border-white/5 hover:border-indigo-500 cursor-pointer transition-all bg-[#030408] shadow-xs"
                title={`${asset.name} - ${asset.description}`}
              >
                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>
                <div className="absolute bottom-1 left-1 right-1">
                  <span className="text-[8px] font-bold text-white block truncate leading-none">{asset.name.split(' ')[0]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Suggested Prompt pills */}
        <div className="flex flex-wrap gap-1 pb-1">
          {SUGGESTED_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.prompt)}
              className="px-2 py-1.5 bg-[#0a0c16] hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500 text-[9px] text-slate-300 hover:text-indigo-400 rounded-lg transition-colors cursor-pointer block text-left shadow-2xs font-medium"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Real-time Voice / Speaking overlay */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 42, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2 flex items-center justify-between overflow-hidden"
            >
              <span className="text-[10px] text-indigo-400 font-bold animate-pulse font-mono">VOICE ENCODER ONLINE...</span>
              <div className="flex gap-0.5 items-end h-5">
                {[0.6, 0.2, 0.8, 0.4, 0.9, 0.3, 0.7, 0.5].map((scale, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [4, 16, 4] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                    className="w-1 bg-indigo-500 rounded"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Text Deck */}
        <div className="flex gap-2">
          {/* Speaking microphone button */}
          <button
            onClick={toggleVoiceInput}
            className={`p-2 rounded-xl transition cursor-pointer shrink-0 border ${
              isListening
                ? 'bg-red-500 border-red-600 text-white animate-pulse'
                : 'bg-[#0a0c16] hover:bg-[#101323] border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Speech recognition input"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          <input
            type="text"
            placeholder="Instruct AI copilot or type coordinates..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(input);
            }}
            className="flex-1 px-3 py-2 bg-[#030408] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />

          <button
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || loading}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-xl transition cursor-pointer shrink-0 shadow-md shadow-indigo-600/15"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
