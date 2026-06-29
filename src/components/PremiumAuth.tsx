import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Sparkles, Loader2, Globe, Lock, Key, Mail, Phone, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PremiumAuthProps {
  onAuthSuccess: (user: { name: string; email: string }) => void;
}

export default function PremiumAuth({ onAuthSuccess }: PremiumAuthProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [authMode, setAuthMode] = useState<'options' | 'email' | 'phone'>('options');

  const loadingTexts = [
    "Establishing secure connection to ResQLink regional node...",
    "Syncing Live GIS databases & weather radar streams...",
    "Initializing Commander AI Core & sub-agent directive matrix...",
    "Decrypting authorization payload... Access Granted."
  ];

  const handleStartAuth = (provider: string) => {
    setSelectedProvider(provider);
    setLoading(true);
    setLoadingStep(0);

    // Multi-stage loading animation for premium feel
    const interval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev >= loadingTexts.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            onAuthSuccess({
              name: "Command Coordinator",
              email: emailInput || "coordinator@resqlink.ai"
            });
          }, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'email' && !emailInput) return;
    if (authMode === 'phone' && !phoneInput) return;
    handleStartAuth(authMode === 'email' ? 'Email' : 'Phone Number');
  };

  return (
    <div className="min-h-screen bg-[#030408] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Absolute Ambient Grid & Glow Backdrops */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#080a15_1px,transparent_1px),linear-gradient(to_bottom,#080a15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25"></div>
      
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        <AnimatePresence mode="wait">
          {!loading ? (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="bg-[#060813]/80 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl shadow-indigo-500/5 space-y-6"
            >
              
              {/* ResQLink AI Logo */}
              <div className="text-center space-y-2.5">
                <div className="inline-flex h-12 w-12 bg-indigo-600/10 border border-indigo-500/30 rounded-2xl text-indigo-400 items-center justify-center shadow-lg shadow-indigo-500/10 animate-pulse">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h1 className="font-display font-black tracking-tight text-white text-xl">
                    ResQLink <span className="text-indigo-400">AI</span>
                  </h1>
                  <p className="text-[10.5px] text-slate-400 font-mono tracking-wider uppercase">
                    Tactical Disaster Dispatch & Command Platform
                  </p>
                </div>
              </div>

              {authMode === 'options' && (
                <div className="space-y-3 pt-2">
                  
                  {/* Google Button */}
                  <button
                    onClick={() => handleStartAuth("Google")}
                    className="w-full h-11 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 text-xs font-semibold text-slate-200 rounded-xl transition duration-150 flex items-center justify-center gap-3 cursor-pointer group"
                  >
                    {/* Google clean flat vector */}
                    <svg className="h-4 w-4 shrink-0 transition group-hover:scale-105" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.28 1.945 15.45 1 12.24 1 5.918 1 1 5.918 1 12s4.918 11 11.24 11c6.6 0 11-4.63 11-11.19 0-.75-.08-1.32-.19-1.825H12.24z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* GitHub Button */}
                  <button
                    onClick={() => handleStartAuth("GitHub")}
                    className="w-full h-11 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 text-xs font-semibold text-slate-200 rounded-xl transition duration-150 flex items-center justify-center gap-3 cursor-pointer group"
                  >
                    {/* GitHub flat vector */}
                    <svg className="h-4 w-4 fill-current text-white shrink-0 transition group-hover:scale-105" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span>Continue with GitHub</span>
                  </button>

                  {/* Microsoft Button */}
                  <button
                    onClick={() => handleStartAuth("Microsoft")}
                    className="w-full h-11 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 text-xs font-semibold text-slate-200 rounded-xl transition duration-150 flex items-center justify-center gap-3 cursor-pointer group"
                  >
                    {/* Microsoft flat vector */}
                    <svg className="h-3.5 w-3.5 shrink-0 transition group-hover:scale-105" viewBox="0 0 23 23">
                      <path fill="#f35325" d="M0 0h11v11H0z" />
                      <path fill="#81bc06" d="M12 0h11v11H12z" />
                      <path fill="#05a6f0" d="M0 12h11v11H0z" />
                      <path fill="#ffba08" d="M12 12h11v11H12z" />
                    </svg>
                    <span>Continue with Microsoft</span>
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 py-2">
                    <div className="h-[1px] bg-white/5 flex-1"></div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Standard Channels</span>
                    <div className="h-[1px] bg-white/5 flex-1"></div>
                  </div>

                  {/* Email & Phone Toggles */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setAuthMode('email')}
                      className="h-10 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl text-[10.5px] font-semibold text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition"
                    >
                      <Mail className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Email Code</span>
                    </button>
                    <button
                      onClick={() => setAuthMode('phone')}
                      className="h-10 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl text-[10.5px] font-semibold text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition"
                    >
                      <Phone className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Phone OTP</span>
                    </button>
                  </div>

                </div>
              )}

              {authMode !== 'options' && (
                <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      {authMode === 'email' ? 'Enter Work Email' : 'Enter Phone Number'}
                    </label>
                    <div className="relative">
                      {authMode === 'email' ? (
                        <>
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <input
                            type="email"
                            required
                            placeholder="coordinator@resqlink.ai"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="w-full bg-[#030408] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                          />
                        </>
                      ) : (
                        <>
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <input
                            type="tel"
                            required
                            placeholder="+1 (555) 019-2834"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            className="w-full bg-[#030408] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAuthMode('options')}
                      className="w-1/3 h-10 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl text-slate-300 transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/10"
                    >
                      <span>Send Authorization Code</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {/* Secure footer */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[8.5px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-emerald-500" />
                  SSL Encrypted
                </span>
                <span>Node: ResQ-Core-USA</span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3 text-indigo-500" />
                  WGS84 Aligned
                </span>
              </div>

            </motion.div>
          ) : (
            <motion.div
              key="auth-loader"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="bg-[#060813]/95 backdrop-blur-2xl border border-indigo-500/20 p-8 rounded-3xl shadow-2xl shadow-indigo-500/10 space-y-6 text-center"
            >
              
              {/* Spinning AI Core icon */}
              <div className="relative mx-auto h-16 w-16 bg-indigo-600/10 border border-indigo-500/30 rounded-2xl text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/15">
                <Cpu className="h-8 w-8 animate-spin-slow text-indigo-400" />
                <div className="absolute inset-0 border border-dashed border-indigo-400/20 rounded-2xl animate-spin-reverse-slow"></div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-bold text-sm text-white">Authenticating with {selectedProvider}...</h3>
                
                {/* Simulated Loading steps */}
                <div className="space-y-2 max-w-xs mx-auto pt-2">
                  {loadingTexts.map((text, idx) => {
                    const isCompleted = loadingStep > idx;
                    const isActive = loadingStep === idx;
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-2.5 text-left text-[10px] transition-all duration-300 ${
                          isCompleted 
                            ? 'text-emerald-400' 
                            : isActive 
                              ? 'text-indigo-400 font-bold' 
                              : 'text-slate-600'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {isCompleted ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          ) : isActive ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                          ) : (
                            <div className="h-3 w-3 rounded-full border border-slate-700"></div>
                          )}
                        </div>
                        <p className="leading-tight">{text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
