import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, ShieldAlert, Activity, Droplets, Wind, Flame, AlertTriangle, 
  Send, RefreshCw, CheckCircle2, Volume2, Sparkles, VolumeX, Trash2, ShieldCheck, Zap,
  Globe, CloudRain, Sun, Compass, Play, Square, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClimateStream {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'Nominal' | 'Alert' | 'Re-syncing';
  icon: React.ComponentType<any>;
}

interface CivicAlert {
  id: string;
  title: string;
  message: string;
  severity: 'Critical' | 'Warning' | 'Advisory';
  timestamp: string;
  broadcaster: string;
}

export default function WorkspaceAlerts() {
  const [climateStreams, setClimateStreams] = useState<ClimateStream[]>([
    { id: 'soil_aridity', name: 'Google Climate Soil Aridity (GCE)', value: 1.04, unit: 'kPa', status: 'Nominal', icon: Activity },
    { id: 'radar_precip', name: 'Atmospheric Weather Radar (Rainfall)', value: 0.12, unit: 'mm/h', status: 'Nominal', icon: Droplets },
    { id: 'satellite_wind', name: 'NOAA Satellite Wind Velocity Vector', value: 14.5, unit: 'mph', status: 'Nominal', icon: Wind },
    { id: 'sentinel_thermal', name: 'Sentinel-2 Surface Heat Index', value: 18.2, unit: '°C', status: 'Nominal', icon: Flame }
  ]);

  const [alerts, setAlerts] = useState<CivicAlert[]>([
    { id: 'alt_1', title: 'Google Climate Weather Alert', message: 'Atmospheric moisture columns forecast +38% rainfall volume. Google Climate models advise proactive Sandbag dispatch.', severity: 'Warning', timestamp: '10 mins ago', broadcaster: 'Google Climate Agent' },
    { id: 'alt_2', title: 'High Wind Velocity Warning', message: 'NOAA Doppler Satellite indicates high wind gusts exceeding 45mph in local micro-zones. Fire risk upgraded.', severity: 'Critical', timestamp: '45 mins ago', broadcaster: 'NOAA Wind Agent' },
    { id: 'alt_3', title: 'Dolores Sector Aridity advisory', message: 'Thermal infrared mapping indicates persistent dry zone cluster. Monitor regional water pipeline pressures.', severity: 'Advisory', timestamp: '1 hour ago', broadcaster: 'Sentinel-2 Thermal Agent' }
  ]);

  const [alertForm, setAlertForm] = useState({
    title: '',
    message: '',
    severity: 'Warning' as 'Critical' | 'Warning' | 'Advisory'
  });

  const [soundOn, setSoundOn] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Audio and physical vibration refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const primaryOscRef = useRef<OscillatorNode | null>(null);
  const subRumbleOscRef = useRef<OscillatorNode | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  const sweepIntervalRef = useRef<any>(null);
  const vibrationIntervalRef = useRef<any>(null);

  // Simulate passive drift of satellite live feeds from GCE API
  useEffect(() => {
    const interval = setInterval(() => {
      setClimateStreams(prev => prev.map(stream => {
        if (stream.status === 'Re-syncing') return stream;
        
        // Passive variation helper representing satellite telemetry updates
        let drift = 0;
        if (stream.id === 'soil_aridity') drift = parseFloat((Math.random() * 0.04 - 0.02).toFixed(2));
        if (stream.id === 'radar_precip') drift = parseFloat((Math.random() * 0.06 - 0.03).toFixed(2));
        if (stream.id === 'satellite_wind') drift = parseFloat((Math.random() * 1.5 - 0.75).toFixed(1));
        if (stream.id === 'sentinel_thermal') drift = parseFloat((Math.random() * 0.8 - 0.4).toFixed(1));

        const updatedVal = parseFloat(Math.max(0.01, stream.value + drift).toFixed(stream.id === 'soil_aridity' ? 2 : 1));
        
        return {
          ...stream,
          value: updatedVal
        };
      }));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Check if any active alerts are Critical
  const hasActiveCriticalAlert = alerts.some(al => al.severity === 'Critical');

  // Starts the big vibrating sound (primary sweeping alarm + heavy sub-bass vibration rumble)
  const startBigSiren = () => {
    if (audioCtxRef.current) return; // already active

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Master Gain
      const masterGain = ctx.createGain();
      mainGainRef.current = masterGain;
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1); // High but safe volume

      // Primary sweeping siren oscillator (Sawtooth for high intensity piercing alarm)
      const primaryOsc = ctx.createOscillator();
      primaryOscRef.current = primaryOsc;
      primaryOsc.type = 'sawtooth';
      primaryOsc.frequency.setValueAtTime(480, ctx.currentTime);

      // Low frequency rumble sub-bass oscillator (Sine wave at 55Hz for heavy physical speaker vibration)
      const subRumbleOsc = ctx.createOscillator();
      subRumbleOscRef.current = subRumbleOsc;
      subRumbleOsc.type = 'sine';
      subRumbleOsc.frequency.setValueAtTime(55, ctx.currentTime);

      // Connect nodes
      primaryOsc.connect(masterGain);
      subRumbleOsc.connect(masterGain);
      masterGain.connect(ctx.destination);

      primaryOsc.start();
      subRumbleOsc.start();

      // Sweeping frequency modulation & sub-bass pulsation
      let toggle = true;
      sweepIntervalRef.current = setInterval(() => {
        if (audioCtxRef.current && primaryOscRef.current && subRumbleOscRef.current) {
          const now = audioCtxRef.current.currentTime;
          if (toggle) {
            // Sweeping up
            primaryOscRef.current.frequency.exponentialRampToValueAtTime(880, now + 0.35);
            subRumbleOscRef.current.frequency.linearRampToValueAtTime(75, now + 0.35);
          } else {
            // Sweeping down
            primaryOscRef.current.frequency.exponentialRampToValueAtTime(440, now + 0.35);
            subRumbleOscRef.current.frequency.linearRampToValueAtTime(50, now + 0.35);
          }
          toggle = !toggle;
        }
      }, 400);

      // Physical phone hardware vibration API integration
      if (navigator.vibrate) {
        // Vibrate in sync with the high/low dual sweep
        navigator.vibrate([300, 100, 300, 100]);
        vibrationIntervalRef.current = setInterval(() => {
          navigator.vibrate([300, 100, 300, 100]);
        }, 800);
      }

    } catch (err) {
      console.warn("Web Audio Context blocked or unsupported on device:", err);
    }
  };

  const stopBigSiren = () => {
    if (sweepIntervalRef.current) {
      clearInterval(sweepIntervalRef.current);
      sweepIntervalRef.current = null;
    }
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }

    if (navigator.vibrate) {
      navigator.vibrate(0); // Kill any active hardware vibration
    }

    if (mainGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      mainGainRef.current.gain.cancelScheduledValues(now);
      mainGainRef.current.gain.linearRampToValueAtTime(0, now + 0.1);
    }

    setTimeout(() => {
      try {
        if (primaryOscRef.current) {
          primaryOscRef.current.stop();
          primaryOscRef.current.disconnect();
          primaryOscRef.current = null;
        }
        if (subRumbleOscRef.current) {
          subRumbleOscRef.current.stop();
          subRumbleOscRef.current.disconnect();
          subRumbleOscRef.current = null;
        }
        if (mainGainRef.current) {
          mainGainRef.current.disconnect();
          mainGainRef.current = null;
        }
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
          audioCtxRef.current = null;
        }
      } catch (err) {
        console.warn("Error cleaning up audio nodes:", err);
      }
    }, 150);
  };

  // Manage Sound based on active critical alerts and toggled setting
  useEffect(() => {
    if (hasActiveCriticalAlert && soundOn) {
      startBigSiren();
    } else {
      stopBigSiren();
    }

    return () => {
      stopBigSiren();
    };
  }, [alerts, soundOn]);

  const handleReSyncStream = (streamId: string) => {
    setClimateStreams(prev => prev.map(stream => {
      if (stream.id === streamId) {
        return { ...stream, status: 'Re-syncing', value: 0 };
      }
      return stream;
    }));

    setFeedbackMessage(`Requesting latest Google Climate Engine orbital passes for ${streamId.replace('_', ' ').toUpperCase()}...`);

    setTimeout(() => {
      setClimateStreams(prev => prev.map(stream => {
        if (stream.id === streamId) {
          let baseVal = 1.00;
          if (stream.id === 'radar_precip') baseVal = 0.10;
          if (stream.id === 'satellite_wind') baseVal = 12.0;
          if (stream.id === 'sentinel_thermal') baseVal = 16.5;
          return { ...stream, status: 'Nominal', value: baseVal };
        }
        return stream;
      }));
      setFeedbackMessage(`Google Climate Engine API stream synchronized. Telemetry re-established.`);
      setTimeout(() => setFeedbackMessage(null), 3500);
    }, 1800);
  };

  const handleSimulateHazardSpike = (streamId: string) => {
    setClimateStreams(prev => prev.map(stream => {
      if (stream.id === streamId) {
        let spikeValue = stream.value;
        if (stream.id === 'soil_aridity') spikeValue = 4.25; // extreme dryness anomaly
        if (stream.id === 'radar_precip') spikeValue = 25.8;   // extreme downpour
        if (stream.id === 'satellite_wind') spikeValue = 54.0;    // gale force wind vectors
        if (stream.id === 'sentinel_thermal') spikeValue = 92.4; // wildfire heat signature detected

        return { ...stream, status: 'Alert', value: spikeValue };
      }
      return stream;
    }));

    // Generate a corresponding critical warning automatically to trigger the big sound!
    const targetName = streamId.replace('_', ' ').toUpperCase();
    const mockAlert: CivicAlert = {
      id: `sim_${Date.now()}`,
      title: `CRITICAL SATELLITE ALERT: ${targetName} SPIKE DETECTED`,
      message: `Google Climate multi-spectral orbits indicate high-risk hazard readings on ${targetName}. Activating emergency regional warning networks immediately!`,
      severity: 'Critical',
      timestamp: 'Just now',
      broadcaster: 'GCE Automated Sensor Node'
    };

    setAlerts(prev => [mockAlert, ...prev]);
    setSoundOn(true); // Automatically toggle sound ON on interaction!

    setFeedbackMessage(`⚠️ WARNING: Critical Satellite Anomaly Spike for ${targetName}. Google Climate Alerts and vibrating siren triggered!`);
    setTimeout(() => setFeedbackMessage(null), 6000);
  };

  const handleBroadcastAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertForm.title.trim() || !alertForm.message.trim()) return;

    const newAlert: CivicAlert = {
      id: `alt_${Date.now()}`,
      title: alertForm.title,
      message: alertForm.message,
      severity: alertForm.severity,
      timestamp: 'Just now',
      broadcaster: 'Climate Command'
    };

    setAlerts(prev => [newAlert, ...prev]);
    
    // Auto turn sound ON if severity is Critical to immediately alert the user!
    if (alertForm.severity === 'Critical') {
      setSoundOn(true);
    }

    setAlertForm({ title: '', message: '', severity: 'Warning' });
    setFeedbackMessage(`EAS BROADCAST SUCCESSFUL: Google Climate Regional warning published on municipal public channels.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const deleteAlertHandler = (id: string) => {
    setAlerts(prev => prev.filter(al => al.id !== id));
  };

  return (
    <div className="space-y-6 text-slate-300 text-left">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0a0c12] p-4 border border-white/5 rounded-2xl gap-3">
        <div className="flex items-center gap-2.5">
          <Globe className="h-4.5 w-4.5 text-indigo-400 animate-spin-slow" />
          <div>
            <h3 className="font-display font-semibold text-xs text-white uppercase tracking-wide">Google Climate & Weather Satellite radar</h3>
            <span className="text-[9px] text-slate-500 font-mono">Simulated Regional Satellite Orbits • Multi-spectral Imagery Analysis • Alerts Stream</span>
          </div>
        </div>
        
        {/* Audio notification toggle simulation */}
        <div className="flex items-center gap-2">
          {soundOn && hasActiveCriticalAlert && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          )}
          <button
            onClick={() => {
              const nextVal = !soundOn;
              setSoundOn(nextVal);
              if (nextVal && hasActiveCriticalAlert) {
                // Ensure audio context triggers on click due to user interaction policy
                setTimeout(() => {
                  startBigSiren();
                }, 50);
              }
            }}
            className={`p-2 border rounded-xl cursor-pointer transition text-[10.5px] font-mono font-bold flex items-center gap-2 ${
              soundOn 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                : 'bg-white/5 border-white/5 text-slate-400'
            }`}
          >
            {soundOn ? <Volume2 className="h-4 w-4 animate-bounce" /> : <VolumeX className="h-4 w-4" />}
            <span>{soundOn ? 'SIREN SOUNDING ENABLED' : 'ACTIVATE SIREN AUDIO'}</span>
          </button>
        </div>
      </div>

      {/* BIG Pulsating Emergency Sound Dashboard Banner */}
      {hasActiveCriticalAlert && (
        <div className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
          soundOn 
            ? 'bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/20 shadow-lg shadow-rose-500/5' 
            : 'bg-[#0f0d11] border-amber-500/20'
        }`}>
          {soundOn && (
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500 animate-pulse" />
          )}

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center border shrink-0 ${
                soundOn 
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                <ShieldAlert className="h-5 w-5 animate-bounce" />
              </div>
              <div className="text-left space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/20">
                    EAS BROADCAST ACTIVE
                  </span>
                  {navigator.vibrate && soundOn && (
                    <span className="font-mono text-[9px] text-indigo-400 font-bold animate-pulse">
                      📳 PHYSICAL VIBRATION ACTIVE
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white leading-tight">
                  Critical Multi-Spectral Anomalies Triggered Deep Frequency Alarms
                </h4>
                <p className="text-[11.5px] text-slate-400 font-sans max-w-2xl leading-relaxed">
                  Synthesized low-frequency sub-bass waves (55Hz) are vibrating the audio channels to emulate heavy earthquake/disaster rumblings. Check active alerts below immediately.
                </p>
              </div>
            </div>

            {/* Visual sound equalizer waves */}
            {soundOn ? (
              <div className="flex items-end gap-1 h-8 shrink-0 py-1 px-4 border border-rose-500/10 bg-rose-500/[0.02] rounded-xl">
                <span className="w-1 bg-rose-500 h-6 rounded-xs animate-pulse"></span>
                <span className="w-1 bg-rose-400 h-4 rounded-xs animate-pulse delay-75"></span>
                <span className="w-1 bg-rose-500 h-7 rounded-xs animate-pulse delay-150"></span>
                <span className="w-1 bg-rose-400 h-3 rounded-xs animate-pulse delay-100"></span>
                <span className="w-1 bg-rose-500 h-5 rounded-xs animate-pulse delay-200"></span>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setSoundOn(true);
                  setTimeout(() => {
                    startBigSiren();
                  }, 50);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-[11px] font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/15"
              >
                <Play className="h-3.5 w-3.5" />
                <span>UNMUTE SIREN SOUND</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dynamic feedback message toast */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-3.5 rounded-2xl text-[11px] flex items-center gap-2.5 font-medium border ${
              feedbackMessage.includes('WARNING') 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            }`}
          >
            <AlertTriangle className="h-4.5 w-4.5 animate-pulse" />
            <span>{feedbackMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Google Climate Engine Streams Deck (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Google Climate Satellite Stream Layer</span>
            <span className="text-[8.5px] font-mono text-slate-500 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              GCE Satellite Intercept Feed (No physical device IoT sensors required)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {climateStreams.map((stream) => {
              const Icon = stream.icon;
              const isAlert = stream.status === 'Alert';
              const isResyncing = stream.status === 'Re-syncing';

              return (
                <div key={stream.id} className="bg-[#060813] border border-white/5 p-4 rounded-3xl flex flex-col justify-between h-48 relative overflow-hidden">
                  
                  {/* Subtle alarm pulse background */}
                  {isAlert && (
                    <div className="absolute inset-0 bg-rose-500/[0.04] animate-pulse pointer-events-none" />
                  )}

                  <div className="space-y-1.5 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className={`p-1.5 rounded-lg border shrink-0 ${
                        isAlert 
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                          : isResyncing 
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 animate-spin' 
                            : 'bg-indigo-500/5 border-indigo-500/10 text-indigo-400'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                        isAlert 
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' 
                          : isResyncing 
                            ? 'bg-indigo-500/15 text-indigo-400 animate-pulse' 
                            : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {stream.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-white pt-1">{stream.name}</h4>
                  </div>

                  {/* Telemetry Output Display */}
                  <div className="my-2 relative z-10">
                    {isResyncing ? (
                      <span className="text-xl font-black font-mono text-indigo-400 animate-pulse">RE-SYNCING</span>
                    ) : (
                      <div className="flex items-baseline gap-1 select-all">
                        <span className={`text-2xl font-black font-mono leading-none ${isAlert ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                          {stream.value}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{stream.unit}</span>
                      </div>
                    )}
                  </div>

                  {/* Operational Calibrators */}
                  <div className="flex gap-2 relative z-10">
                    <button
                      onClick={() => handleReSyncStream(stream.id)}
                      disabled={isResyncing}
                      className="flex-1 py-1 bg-[#0a0c16] hover:bg-[#101323] border border-white/5 hover:border-indigo-500/30 text-[9px] font-bold text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer disabled:opacity-30"
                    >
                      Re-Sync Orbit
                    </button>
                    <button
                      onClick={() => handleSimulateHazardSpike(stream.id)}
                      disabled={isResyncing || isAlert}
                      className="flex-1 py-1 bg-white/5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 rounded-lg text-[9px] font-medium text-slate-400 hover:text-rose-400 transition-all cursor-pointer disabled:opacity-30"
                    >
                      Trigger Simulation
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Broadcast EAS Form & Active alerts backlog (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Create Alert Broadcast */}
          <div className="p-5 bg-[#060813] border border-white/5 rounded-3xl space-y-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">Emergency Climate Broadcast Station</span>
            
            <form onSubmit={handleBroadcastAlert} className="space-y-3.5">
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 block mb-1 uppercase">Alert Heading</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extreme Google Climate Precipitation Anomaly..."
                  value={alertForm.title}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-[#030408] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 block mb-1 uppercase">Alert Message Details</label>
                <textarea
                  required
                  placeholder="Write regional safety alerts, satellite forecast predictions, and weather warnings..."
                  rows={2}
                  value={alertForm.message}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full bg-[#030408] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-mono font-bold text-slate-400 block mb-1 uppercase">Severity</label>
                  <select
                    value={alertForm.severity}
                    onChange={(e) => setAlertForm(prev => ({ ...prev, severity: e.target.value as any }))}
                    className="w-full bg-[#030408] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Critical">Critical (Siren + Vibe)</option>
                    <option value="Warning">Warning (Standard)</option>
                    <option value="Advisory">Advisory (Notice)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={!alertForm.title.trim() || !alertForm.message.trim()}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/10 animate-pulse"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Broadcast EAS</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Active EAS Warning log */}
          <div className="p-5 bg-[#060813] border border-white/5 rounded-3xl space-y-4 flex-1 flex flex-col justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">Live Warning Broadcast History</span>
            
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic py-4 text-center">No active broadcasts logged.</p>
              ) : (
                alerts.map(al => {
                  const isCritical = al.severity === 'Critical';
                  const isWarning = al.severity === 'Warning';
                  return (
                    <div key={al.id} className={`p-3 border rounded-2xl relative group ${
                      isCritical 
                        ? 'bg-rose-500/5 border-rose-500/15 ring-1 ring-rose-500/10' 
                        : isWarning 
                          ? 'bg-amber-500/5 border-amber-500/15' 
                          : 'bg-indigo-500/5 border-indigo-500/15'
                    }`}>
                      
                      {/* Delete alert button */}
                      <button
                        onClick={() => deleteAlertHandler(al.id)}
                        className="absolute right-2 top-2 p-1 hover:bg-white/5 text-slate-500 hover:text-rose-400 rounded-md opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                      <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-500 mb-1">
                        <span className="font-bold text-slate-400">Broadcaster: {al.broadcaster}</span>
                        <span>{al.timestamp}</span>
                      </div>
                      
                      <div className="flex items-start gap-1.5">
                        <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                          isCritical ? 'text-rose-400 animate-pulse' : isWarning ? 'text-amber-400' : 'text-indigo-400'
                        }`} />
                        <h5 className={`font-bold text-xs ${isCritical ? 'text-rose-400' : 'text-white'}`}>{al.title}</h5>
                      </div>

                      <p className="text-[10px] text-slate-300 mt-1 leading-normal font-medium">{al.message}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
