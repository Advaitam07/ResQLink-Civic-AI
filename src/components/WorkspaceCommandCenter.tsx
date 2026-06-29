import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ShieldAlert, Cpu, CheckCircle2, TrendingUp, AlertTriangle, Radio, 
  Activity, RefreshCw, Layers, ArrowRight, Search, Zap, Check, Eye, MapPin, 
  Shield, Flame, Wind, Droplets, HeartPulse, HelpCircle, AlertCircle, Compass, Truck, Clock, Users,
  Settings, User, Mail, Smartphone, Globe, Key, X, Bluetooth
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CivicIssue } from '../types';
import ReportIssueModal from './ReportIssueModal';

interface WorkspaceCommandCenterProps {
  issues: CivicIssue[];
  onSelectIssue: (issue: CivicIssue) => void;
  onNavigateToView: (view: string) => void;
  onTriggerExecution?: (taskType: string, payload?: any) => void;
  onNewMessage?: (text: string) => void;
  onSubmitReport?: (reportData: any) => Promise<void>;
}

export default function WorkspaceCommandCenter({ 
  issues, 
  onSelectIssue, 
  onNavigateToView,
  onTriggerExecution,
  onNewMessage,
  onSubmitReport
}: WorkspaceCommandCenterProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profileName, setProfileName] = useState(() => localStorage.getItem('resqlink_user_name') || 'Coordinator');
  const [profileEmail, setProfileEmail] = useState(() => localStorage.getItem('resqlink_user_email') || 'coordinator@resqlink.ai');
  const [profileCallsign, setProfileCallsign] = useState(() => localStorage.getItem('resqlink_mesh_callsign') || 'Comms_Volunteer');
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanState, setScanState] = useState('System Idle');
  const [inquiryText, setInquiryText] = useState('');
  
  // Real-time Google Climate Satellite streams
  const [climateStreams, setClimateStreams] = useState({
    soilAridity: 1.04,
    radarPrecip: 0.12,
    atmosphericWind: 14.5,
    thermalAnomaly: 18.2
  });

  // Real-time resource availability
  const [resources, setResources] = useState({
    ambulances: 14,
    searchAndRescue: 8,
    fireEngines: 19,
    shelterCapacity: 84
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setClimateStreams(prev => ({
        soilAridity: parseFloat((0.8 + Math.random() * 0.5).toFixed(2)),
        radarPrecip: parseFloat((0.05 + Math.random() * 0.15).toFixed(2)),
        atmosphericWind: parseFloat((12.0 + Math.random() * 6).toFixed(1)),
        thermalAnomaly: parseFloat((16.5 + Math.random() * 4).toFixed(1))
      }));
      setResources(prev => ({
        ambulances: Math.max(2, Math.min(20, prev.ambulances + (Math.random() > 0.5 ? 1 : -1))),
        searchAndRescue: Math.max(1, Math.min(12, prev.searchAndRescue + (Math.random() > 0.6 ? 1 : -1))),
        fireEngines: Math.max(4, Math.min(24, prev.fireEngines + (Math.random() > 0.5 ? 1 : -1))),
        shelterCapacity: Math.max(10, Math.min(100, prev.shelterCapacity + (Math.random() > 0.5 ? 2 : -2)))
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const triggerDisasterScan = () => {
    if (scanning) return;
    setScanning(true);
    setScanState('Calibrating seismic radar arrays...');
    
    setTimeout(() => {
      setScanState('Scanning utility sub-grids & seismic fault vectors...');
    }, 1000);

    setTimeout(() => {
      setScanState('Analyzing visual flood lines via satellite multi-spectral stream...');
    }, 2000);

    setTimeout(() => {
      setScanning(false);
      setScanState('Command scan completed. No immediate secondary eruptions detected.');
    }, 4000);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim()) return;
    
    if (onNewMessage) {
      onNewMessage(inquiryText);
    }
    if (onTriggerExecution) {
      onTriggerExecution('TEXT_PROMPT', { prompt: inquiryText });
    }
    setInquiryText('');
  };

  const handleQuickPrompt = (promptText: string, associatedIssueId?: string) => {
    if (onNewMessage) {
      onNewMessage(promptText);
    }
    if (onTriggerExecution) {
      onTriggerExecution('TEXT_PROMPT', { prompt: promptText });
    }
    if (associatedIssueId) {
      const matched = issues.find(i => i.id === associatedIssueId);
      if (matched) {
        onSelectIssue(matched);
      }
    }
  };

  const [myBluetoothAddress] = useState(() => {
    return localStorage.getItem('resqlink_mesh_bt_address') || 'BC:3A:E1:92:DF:4C';
  });
  
  const [myNodeId] = useState(() => {
    return localStorage.getItem('resqlink_mesh_node_id') || 'node_4812';
  });

  const handleSaveSettings = () => {
    localStorage.setItem('resqlink_user_name', profileName);
    localStorage.setItem('resqlink_user_email', profileEmail);
    const cleanedCallsign = profileCallsign.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
    localStorage.setItem('resqlink_mesh_callsign', cleanedCallsign || 'Comms_Volunteer');
    
    // Dispatch custom event to notify App.tsx or other components (like offline chat)
    window.dispatchEvent(new CustomEvent('resqlink_profile_updated', {
      detail: { 
        name: profileName, 
        email: profileEmail, 
        callsign: cleanedCallsign || 'Comms_Volunteer' 
      }
    }));

    setShowSavedNotification(true);
    setTimeout(() => {
      setShowSavedNotification(false);
      setIsSettingsOpen(false);
    }, 1200);
  };

  const activeIssues = issues.filter(i => i.status !== 'Resolved');
  const criticalMissionsCount = activeIssues.filter(i => i.severity === 'Critical').length;
  const highMissionsCount = activeIssues.filter(i => i.severity === 'High').length;

  const baseSafetyIndex = 98.2;
  const currentSafetyIndex = parseFloat((baseSafetyIndex - (criticalMissionsCount * 4.5) - (highMissionsCount * 1.8)).toFixed(1));
  const safetyGrade = currentSafetyIndex >= 92 ? 'A+' : currentSafetyIndex >= 85 ? 'A' : currentSafetyIndex >= 75 ? 'B' : 'C';

  const TIMELINE_EVENTS = [
    { type: 'alert', message: 'Atmospheric pressure anomaly: Rain volumes forecasted at +38% tomorrow.', time: '10m ago', agent: 'Forecast Agent' },
    { type: 'geo', message: 'Seismic fault strain baseline registered at normal threshold.', time: '28m ago', agent: 'Location Agent' },
    { type: 'dispatch', message: 'Task Force 4 deployed to verify Church St. dangling wire hazard.', time: '1h ago', agent: 'Coordinator Agent' },
    { type: 'system', message: 'Commander AI authorized tactical bypass containment blueprint.', time: '2h ago', agent: 'Commander AI' }
  ];

  return (
    <div className="space-y-8 text-slate-100">
      
      {/* 1. TOP HERO: AI DISASTER COMMAND CENTER */}
      <div className="py-10 px-8 bg-radial-gradient bg-[#060813] border-2 border-indigo-500/20 rounded-3xl text-center space-y-6 relative overflow-hidden shadow-2xl shadow-indigo-500/[0.03]">
        
        {/* Settings button in top-right of the hero block */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="absolute right-6 top-6 z-20 p-2 bg-indigo-500/10 hover:bg-[#0d122d] border border-indigo-500/25 hover:border-indigo-400/50 rounded-xl text-indigo-400 hover:text-indigo-300 transition-all duration-200 cursor-pointer shadow-lg shadow-black/30 group"
          title="Responder Profile & Settings"
        >
          <Settings className="h-4.5 w-4.5 group-hover:rotate-45 transition-transform duration-300" />
        </button>

        {/* Radar Map Swarm Scan Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-40"></div>
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent animate-pulse pointer-events-none"></div>

        {/* Sonar sweep effect inside background */}
        <div className="absolute right-6 top-6 h-28 w-28 rounded-full border border-indigo-500/10 pointer-events-none flex items-center justify-center opacity-65">
          <div className="h-20 w-20 rounded-full border border-indigo-500/15 animate-ping"></div>
          <div className="h-10 w-10 rounded-full bg-indigo-500/5 flex items-center justify-center">
            <Radio className="h-4 w-4 text-indigo-500/50 animate-pulse" />
          </div>
        </div>

        {/* Abstract blue light pulse ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-3.5 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest shadow-inner"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <Cpu className="h-3.5 w-3.5 animate-pulse text-indigo-400" />
            Commander AI Platform Operations Active
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display font-black text-3xl md:text-5xl text-white tracking-tight leading-none mt-2"
          >
            ResQLink <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Mission Control</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs md:text-sm text-slate-400 font-medium tracking-wide max-w-xl mx-auto leading-relaxed"
          >
            Predicting, coordinating, and resolving civic emergencies with specialized agent swarms.
          </motion.p>
        </div>

        {/* Dynamic central search bar styled with indigo button */}
        <motion.form 
          onSubmit={handleInquirySubmit}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto relative z-10"
        >
          <div className="relative flex items-center bg-[#030408]/90 border border-white/10 hover:border-indigo-500 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-2xl p-1.5 transition-all duration-300 shadow-xl">
            <div className="pl-3.5 text-slate-500 shrink-0">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Ask Commander AI to forecast risks, dispatch units, or isolate hazards..."
              value={inquiryText}
              onChange={(e) => setInquiryText(e.target.value)}
              className="w-full bg-transparent px-3 py-2.5 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none font-medium"
            />
            <button 
              type="submit" 
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shrink-0 shadow-lg shadow-indigo-600/25 active:scale-95"
            >
              <span>Scan Region</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.form>

        {/* Quick prompt links with indigo accents */}
        <div className="space-y-3 relative z-10 pt-2">
          <span className="text-[9px] font-mono font-bold uppercase text-slate-500 tracking-widest block">Activate Autonomous Agent Sweeps</span>
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            <button 
              type="button"
              onClick={() => handleQuickPrompt("Perform deep visual diagnosis of the Valencia Street pothole (iss_001).", "iss_001")}
              className="px-3.5 py-2 bg-[#0a0c16]/90 hover:bg-[#101323] border border-white/5 hover:border-indigo-500 text-[10px] text-slate-300 hover:text-indigo-400 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-semibold shadow-xs"
            >
              <Zap className="h-3 w-3 text-indigo-400" />
              Analyze Valencia St. Pothole
            </button>
            <button 
              type="button"
              onClick={() => handleQuickPrompt("Evaluate sanitation threat vectors around Dolores Park (iss_002).", "iss_002")}
              className="px-3.5 py-2 bg-[#0a0c16]/90 hover:bg-[#101323] border border-white/5 hover:border-indigo-500 text-[10px] text-slate-300 hover:text-indigo-400 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-semibold shadow-xs"
            >
              <Zap className="h-3 w-3 text-indigo-400" />
              Dolores Park Waste Dump
            </button>
            <button 
              type="button"
              onClick={() => handleQuickPrompt("Assess utility leakage mechanics on Market St (iss_003).", "iss_003")}
              className="px-3.5 py-2 bg-[#0a0c16]/90 hover:bg-[#101323] border border-white/5 hover:border-indigo-500 text-[10px] text-slate-300 hover:text-indigo-400 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-semibold shadow-xs"
            >
              <Zap className="h-3 w-3 text-indigo-400" />
              Market St. Water Leak
            </button>
            <button 
              type="button"
              onClick={() => handleQuickPrompt("Isolate high-severity electric hazard on Church Street (iss_004).", "iss_004")}
              className="px-3.5 py-2 bg-[#0a0c16]/90 hover:bg-[#101323] border border-white/5 hover:border-indigo-500 text-[10px] text-slate-300 hover:text-indigo-400 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-semibold shadow-xs"
            >
              <Zap className="h-3 w-3 text-indigo-400" />
              Church St. Hanging Wire
            </button>
          </div>
        </div>

      </div>

      {/* 2. LIVE SECTORS GRID: SAFETY INDEX, ACTIVE THREATS & ANOMALIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL A: COMMUNITY SAFETY INDEX & GENERAL METRIC */}
        <div className="p-6 bg-[#060813] border border-white/5 rounded-3xl shadow-lg space-y-4 hover:border-indigo-500/20 transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Community Safety Index</span>
            <Shield className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
          </div>
          
          <div className="flex items-center gap-5 pt-1">
            <div className="h-24 w-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 border-r-indigo-500/80 flex flex-col items-center justify-center relative shadow-xl shrink-0 bg-[#030408]">
              <span className="text-2xl font-black text-white leading-none tracking-tight">{currentSafetyIndex}%</span>
              <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase tracking-wider font-bold">GRADE {safetyGrade}</span>
            </div>
            <div className="space-y-1.5 text-left">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sector Operations status</h4>
              <p className="text-[10.5px] text-slate-400 leading-relaxed font-medium">
                Incident density is within safe baselines. AI-coordinated responders have mitigated risk propagation vectors by 88%.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] font-mono font-semibold">
            <span className="text-slate-500 uppercase">Active Disaster Envelopes:</span>
            <span className="text-indigo-400 font-bold font-mono bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">{activeIssues.length} Active</span>
          </div>
        </div>

        {/* PANEL B: AI RISK ALERTS & HIGH-RISK ZONES */}
        <div className="p-6 bg-[#060813] border border-white/5 rounded-3xl shadow-lg space-y-4 hover:border-indigo-500/20 transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">AI Hazard Risk Alerts</span>
            <AlertTriangle className="h-4.5 w-4.5 text-rose-500 animate-bounce" />
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 transition hover:bg-rose-500/[0.12]">
              <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="min-w-0 text-left">
                <span className="text-[8px] font-mono font-bold text-rose-400 block uppercase tracking-wider">CRITICAL PATH MULTIPLIER</span>
                <p className="text-[10px] text-slate-300 font-semibold leading-normal mt-0.5">
                  High flood risk at Market St. due to utility fracture and heavy rain model.
                </p>
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 transition hover:bg-amber-500/[0.12]">
              <Wind className="h-4.5 w-4.5 text-amber-400 shrink-0 mt-0.5" />
              <div className="min-w-0 text-left">
                <span className="text-[8px] font-mono font-bold text-amber-400 block uppercase tracking-wider">ATMOSPHERIC WIND DRIFT</span>
                <p className="text-[10px] text-slate-300 font-semibold leading-normal mt-0.5">
                  Wind speeds reaching 19.5 mph. Elevated structural drift risks on Church St. wires.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL C: ACTIVE EMERGENCY RESOURCES STATUS */}
        <div className="p-6 bg-[#060813] border border-white/5 rounded-3xl shadow-lg space-y-4 hover:border-indigo-500/20 transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Emergency Supplies & Resources</span>
            <Truck className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#030408]/80 hover:bg-[#0a0c16] transition p-2.5 border border-white/5 rounded-xl flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg font-bold shrink-0">
                <HeartPulse className="h-4 w-4" />
              </div>
              <div className="min-w-0 text-left">
                <span className="text-[8px] text-slate-500 font-mono uppercase block font-bold">Ambulances</span>
                <span className="text-xs font-bold text-white font-mono">{resources.ambulances} Active</span>
              </div>
            </div>

            <div className="bg-[#030408]/80 hover:bg-[#0a0c16] transition p-2.5 border border-white/5 rounded-xl flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg font-bold shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0 text-left">
                <span className="text-[8px] text-slate-500 font-mono uppercase block font-bold">Rescue S&R</span>
                <span className="text-xs font-bold text-white font-mono">{resources.searchAndRescue} Units</span>
              </div>
            </div>

            <div className="bg-[#030408]/80 hover:bg-[#0a0c16] transition p-2.5 border border-white/5 rounded-xl flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg font-bold shrink-0">
                <Flame className="h-4 w-4" />
              </div>
              <div className="min-w-0 text-left">
                <span className="text-[8px] text-slate-500 font-mono uppercase block font-bold">Fire Engines</span>
                <span className="text-xs font-bold text-white font-mono">{resources.fireEngines} Ready</span>
              </div>
            </div>

            <div className="bg-[#030408]/80 hover:bg-[#0a0c16] transition p-2.5 border border-white/5 rounded-xl flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg font-bold shrink-0">
                <Compass className="h-4 w-4" />
              </div>
              <div className="min-w-0 text-left">
                <span className="text-[8px] text-slate-500 font-mono uppercase block font-bold">Shelter Slots</span>
                <span className="text-xs font-bold text-white font-mono">{resources.shelterCapacity} Open</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. DISTRICT IOT LIVE TELEMETRY RADAR SENSORS */}
      <div className="p-4 bg-[#060813] border border-white/5 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Radio className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
            <h3 className="font-display font-semibold text-xs text-white uppercase tracking-wide">Google Climate Satellite Stream Feeds</h3>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            Satellite Synced
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="p-3 bg-[#030408] border border-white/5 rounded-xl flex items-center gap-3 shadow-2xs">
            <div className="h-8 w-8 bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
              <Activity className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-[8px] text-slate-400 font-mono block">SOIL ARIDITY</span>
              <span className="text-xs font-bold text-white font-mono truncate block">{climateStreams.soilAridity} kPa (GCE)</span>
            </div>
          </div>

          <div className="p-3 bg-[#030408] border border-white/5 rounded-xl flex items-center gap-3 shadow-2xs">
            <div className="h-8 w-8 bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
              <Droplets className="h-4.5 w-4.5 animate-bounce" />
            </div>
            <div className="min-w-0">
              <span className="text-[8px] text-slate-400 font-mono block">RADAR PRECIP</span>
              <span className="text-xs font-bold text-white font-mono truncate block">{climateStreams.radarPrecip} mm/h (Radar)</span>
            </div>
          </div>

          <div className="p-3 bg-[#030408] border border-white/5 rounded-xl flex items-center gap-3 shadow-2xs">
            <div className="h-8 w-8 bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
              <Wind className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-[8px] text-slate-400 font-mono block">WIND VELOCITY</span>
              <span className="text-xs font-bold text-white font-mono truncate block">{climateStreams.atmosphericWind} mph (NOAA)</span>
            </div>
          </div>

          <div className="p-3 bg-[#030408] border border-white/5 rounded-xl flex items-center gap-3 shadow-2xs">
            <div className="h-8 w-8 bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
              <Flame className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[8px] text-slate-400 font-mono block">THERMAL INDEX</span>
              <span className="text-xs font-bold text-white font-mono truncate block">{climateStreams.thermalAnomaly}°C (Sentinel)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SPLIT GRID: LIVE OPERATIONS MAP CARD & MISSION TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MAP PREVIEW LINK */}
        <div className="lg:col-span-8 p-5 bg-[#060813] border border-white/5 rounded-3xl shadow-sm flex flex-col justify-between h-[300px] relative overflow-hidden">
          {/* Abstract map graphic background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Live Operations Map Center</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed max-w-md">
              The operational center of the application, displaying real-time incidents, response teams, hospital capacities, and live mission tracking.
            </p>
          </div>

          <div className="border border-white/5 bg-[#030408] rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-8.5 w-8.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                MAP
              </div>
              <div>
                <span className="text-[9px] text-slate-500 font-mono block">GPS SECTOR CO-ORDINATES</span>
                <span className="text-xs font-bold text-white block">San Francisco Grid Sector</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => onNavigateToView("Live Map")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-xl cursor-pointer transition flex items-center gap-1 shadow-md shadow-indigo-600/15"
            >
              <span>Launch Live Map</span>
              <Compass className="h-3.5 w-3.5 animate-spin-slow" />
            </button>
          </div>
        </div>

        {/* MISSION TIMELINE */}
        <div className="lg:col-span-4 p-5 bg-[#060813] border border-white/5 rounded-3xl shadow-sm flex flex-col h-[300px]">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide">Emergency Mission Timeline</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>

          <div className="flex-1 overflow-y-auto mt-4 space-y-3.5 pr-1 text-left scrollbar-thin">
            {TIMELINE_EVENTS.map((evt, idx) => (
              <div key={idx} className="flex gap-2.5 items-start">
                <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-white leading-snug">{evt.message}</p>
                  <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-500 mt-0.5">
                    <span className="font-bold text-indigo-400">{evt.agent}</span>
                    <span>•</span>
                    <span>{evt.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. INCIDENT LIST DECK (ACTIVE DISASTER MISSIONS) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-indigo-400" />
            Active Incident & Disaster Response Missions
          </span>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500/20 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/15 animate-pulse"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Deploy New Emergency Mission</span>
            </button>
            <button 
              type="button"
              onClick={() => onNavigateToView("Missions")}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-bold"
            >
              <span>Launch Forensic Lab</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Disaster card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {issues.map(iss => {
            const isCritical = iss.severity === 'Critical';
            const isHigh = iss.severity === 'High';
            
            return (
              <div
                key={iss.id}
                onClick={() => {
                  onSelectIssue(iss);
                  onNavigateToView("Missions");
                }}
                className="p-4 bg-[#060813] hover:bg-[#0c0f20] border border-white/5 hover:border-indigo-500/30 rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-40 group hover:shadow-md"
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[9px] font-bold font-mono text-slate-500 uppercase">{iss.category} • Incident #{iss.id}</span>
                    <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded ${
                      isCritical
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : isHigh
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {iss.severity}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white truncate leading-tight group-hover:text-indigo-400 transition-colors">{iss.title}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{iss.description}</p>
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-2.5 mt-2">
                  <span className="text-[9px] text-slate-500 truncate max-w-[180px] font-medium">{iss.location.address}</span>
                  <span className="text-[9px] font-bold text-indigo-400 flex items-center gap-1 font-mono uppercase">
                    <span>Investigate</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ReportIssueModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        onSubmitReport={async (reportData) => {
          if (onSubmitReport) {
            await onSubmitReport(reportData);
          }
          setIsReportModalOpen(false);
        }}
        selectedCoords={null}
      />

      {/* 2. REGIONAL COORDINATOR SETTINGS & PROFILE MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#030408] border border-white/10 rounded-3xl max-w-md w-full p-6 relative shadow-2xl space-y-6 overflow-hidden text-left"
            >
              {/* Radial background ambient decoration */}
              <div className="absolute -top-10 -right-10 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Modal Close Button */}
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Modal Header */}
              <div className="space-y-1.5 pr-8">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <Settings className="h-4 w-4 animate-spin-slow" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Mission Control Settings</h3>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Configure local responder identity and P2P mesh network parameters.
                </p>
              </div>

              {/* Settings Input Fields */}
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Responder Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. Coordinator Adams"
                      className="w-full bg-[#060813] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Strategic Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="e.g. adams@resqlink.ai"
                      className="w-full bg-[#060813] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Mesh Callsign */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">P2P Wireless Mesh Callsign</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={profileCallsign}
                      onChange={(e) => setProfileCallsign(e.target.value)}
                      placeholder="e.g. Responder_Alpha"
                      className="w-full bg-[#060813] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    />
                  </div>
                  <span className="text-[8px] text-slate-500 font-sans block leading-normal">
                    This callsign will represent your physical device node during offline mesh operations and chat exchanges.
                  </span>
                </div>
              </div>

              {/* Hardware / Mesh Network Node Diagnostics */}
              <div className="p-4 bg-[#060813] border border-white/5 rounded-2xl space-y-2.5 text-xs font-mono">
                <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider border-b border-white/5 pb-1 font-mono">
                  📻 Device Node Telemetry Details
                </span>
                
                <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 uppercase font-black text-[8px]">Network Node ID:</span>
                    <span className="text-indigo-300 font-bold truncate">{myNodeId}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 uppercase font-black text-[8px]">BT Hardware MAC:</span>
                    <span className="text-indigo-400 font-bold tracking-widest">{myBluetoothAddress}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 pt-1">
                    <span className="text-slate-500 uppercase font-black text-[8px]">BLE Signal Channel:</span>
                    <span className="text-slate-300 font-medium">Ch. 37 (Passive Advert)</span>
                  </div>
                  <div className="flex flex-col gap-0.5 pt-1">
                    <span className="text-slate-500 uppercase font-black text-[8px]">Access Clearance:</span>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider">District IV HQ</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-2.5 bg-transparent hover:bg-white/5 border border-white/10 text-slate-300 hover:text-white font-mono text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={showSavedNotification}
                  className={`flex-grow py-2.5 text-white font-mono text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    showSavedNotification 
                      ? 'bg-emerald-600 hover:bg-emerald-600 border border-emerald-500' 
                      : 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30'
                  }`}
                >
                  {showSavedNotification ? (
                    <>
                      <Check className="h-4 w-4 text-white animate-bounce" />
                      <span>Saved Successfully!</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
