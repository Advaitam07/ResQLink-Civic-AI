import React, { useState, useEffect, useRef } from 'react';
import { 
  Newspaper, Search, Flame, ShieldAlert, Sparkles, MapPin, 
  AlertTriangle, Check, RotateCw, ThumbsUp, ChevronRight,
  ExternalLink, FileText, Send, BellRing, Eye, Globe, Zap,
  Volume2, VolumeX, Megaphone, Locate, Crosshair, AlertCircle,
  TrendingUp, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NewsItem {
  id: string;
  title: string;
  category: 'Wildfire' | 'Earthquake' | 'Flood' | 'Storm' | 'Infrastructure' | 'Gas Leak' | 'Hazardous';
  severity: 'Critical' | 'Warning' | 'Advisory';
  location: string;
  lat: number;
  lng: number;
  timestamp: string;
  description: string;
  impact: string;
  verifiedCount: number;
  hasUpvoted?: boolean;
  image: string;
  source: string;
}

export default function DisasterNews() {
  // Safe Default Location: Mission District, San Francisco
  const [userLat, setUserLat] = useState<number>(37.7599);
  const [userLng, setUserLng] = useState<number>(-122.4312);
  const [locationName, setLocationName] = useState<string>("Mission District, San Francisco (Default HQ)");
  const [locating, setLocating] = useState<boolean>(false);

  // Audio state
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);
  const [sirenMuted, setSirenMuted] = useState<boolean>(false);
  const [testSirenPlaying, setTestSirenPlaying] = useState<boolean>(false);

  // Web Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sirenIntervalRef = useRef<any>(null);

  const [news, setNews] = useState<NewsItem[]>([
    {
      id: 'news_1',
      title: 'Gas Line Rupture & Vapor Cloud Hazard on 24th Street',
      category: 'Gas Leak',
      severity: 'Critical',
      location: '24th St & Valencia, San Francisco, CA',
      lat: 37.7525,
      lng: -122.4208, // Approx 1.2 km from default user location! Should trigger siren!
      timestamp: 'Just now',
      description: 'A major 4-inch underground natural gas main was severed during utility excavation. PG&E emergency responders and SF Fire Department HazMat crews are on site. A safety perimeter has been established, and residents are advised to shelter in place with windows closed.',
      impact: 'Immediate localized flammability hazard. Evacuations in progress for immediate block.',
      verifiedCount: 14,
      image: 'https://images.unsplash.com/photo-1488330890490-c291ecf62711?auto=format&fit=crop&w=800&q=80',
      source: 'SF Fire Dispatch'
    },
    {
      id: 'news_2',
      title: 'Severe Wildfire Prompts Mandatory Evacuations in Eastern Santa Rosa',
      category: 'Wildfire',
      severity: 'Critical',
      location: 'Santa Rosa, California',
      lat: 38.4404,
      lng: -122.7141, // ~82 km away
      timestamp: '15 mins ago',
      description: 'High wind gusts of up to 45mph are pushing a fast-moving brush fire toward residential developments in Eastern Santa Rosa. Red flag warnings are active. Evacuation warnings have been elevated to immediate orders for Zones 4B and 5A. Fire crews are establishing containment lines.',
      impact: 'Critical smoke hazard, immediate structural loss risk, and partial closures on Highway 12.',
      verifiedCount: 42,
      image: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=800&q=80',
      source: 'State Fire Dispatch'
    },
    {
      id: 'news_3',
      title: 'Magnitude 6.2 Offshore Earthquake Shakes Oregon Coast',
      category: 'Earthquake',
      severity: 'Warning',
      location: 'Coos Bay, Oregon',
      lat: 43.3685,
      lng: -124.2173, // ~670 km away
      timestamp: '1 hour ago',
      description: 'A powerful M6.2 earthquake occurred approximately 75 miles west of Coos Bay at a shallow depth of 6.2 miles. The National Tsunami Warning Center confirms NO tsunami warning, advisory, or threat is in effect. Light shaking was felt along the Pacific Northwest coast.',
      impact: 'Coastal shaking detected. Port authorities and utility companies are assessing structural integrity.',
      verifiedCount: 52,
      image: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80',
      source: 'USGS Seismology'
    },
    {
      id: 'news_4',
      title: 'High-Voltage Transformer Fire Causes Local Grid Outage',
      category: 'Infrastructure',
      severity: 'Warning',
      location: 'Potrero Hill Substation, San Francisco, CA',
      lat: 37.7577,
      lng: -122.4026, // Approx 2.5 km away! Inside the 10km warning radius.
      timestamp: '2 hours ago',
      description: 'A transformer unit experienced structural electrical failure, generating dense black smoke. Fire suppression units have controlled the blaze. Utilities are rerouting transmission loops to restore power to approximately 8,500 local customers.',
      impact: 'Localized power grid interruption, traffic signals inactive at primary intersections.',
      verifiedCount: 26,
      image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
      source: 'SF Municipal Utility'
    },
    {
      id: 'news_5',
      title: 'Torrential Downpours Cause Major Flash Flooding in Downtown Houston',
      category: 'Flood',
      severity: 'Warning',
      location: 'Houston, Texas',
      lat: 29.7604,
      lng: -95.3698, // Multi-state away
      timestamp: '3 hours ago',
      description: 'Stationary thunderstorms dumped over 6.5 inches of rainfall within a narrow 4-hour window. High-water rescue teams are actively deployed to extract stranded motorists from flooded underpasses along Interstate 45 and Buffalo Bayou areas.',
      impact: 'Severe traffic paralysis, drainage system overload, and water damage to commercial ground levels.',
      verifiedCount: 29,
      image: 'https://images.unsplash.com/photo-1488330890490-c291ecf62711?auto=format&fit=crop&w=800&q=80',
      source: 'National Weather Desk'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // New News custom creation states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Wildfire' | 'Earthquake' | 'Flood' | 'Storm' | 'Infrastructure' | 'Gas Leak' | 'Hazardous'>('Hazardous');
  const [newSeverity, setNewSeverity] = useState<'Critical' | 'Warning' | 'Advisory'>('Warning');
  const [newLocation, setNewLocation] = useState('');
  const [newLat, setNewLat] = useState('37.7599');
  const [newLng, setNewLng] = useState('-122.4312');
  const [newDesc, setNewDesc] = useState('');
  const [newImpact, setNewImpact] = useState('');
  const [newSource, setNewSource] = useState('Community Spotter');

  // AI Briefing State
  const [aiBriefing, setAiBriefing] = useState<string>('');
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Geolocation trigger
  const requestLiveLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser browser, using default San Francisco coordinates.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLat(position.coords.latitude);
        setUserLng(position.coords.longitude);
        setLocationName(`Your GPS Coordinate (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
        setLocating(false);
      },
      (error) => {
        console.warn("Geolocation permission error", error);
        setLocating(false);
        alert("Could not fetch location automatically. Defaulting to pre-set headquarters.");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Helper formula to compute Haversine distance in km
  const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Check if any Critical or Warning item is within 10km of the user
  const nearbyCriticalAlerts = news.filter(item => {
    if (item.severity === 'Advisory') return false;
    const distance = getDistanceInKm(userLat, userLng, item.lat, item.lng);
    return distance <= 10;
  });

  // Dual Sweeping Oscillator Siren Synthesizer
  const startSirenAudio = () => {
    if (audioCtxRef.current) return; // already running
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const gainNode = ctx.createGain();
      gainNodeRef.current = gainNode;
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1); // Avoid pop sound
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      
      osc1Ref.current = osc1;
      osc2Ref.current = osc2;

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(560, ctx.currentTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, ctx.currentTime);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();

      let high = true;
      sirenIntervalRef.current = setInterval(() => {
        if (audioCtxRef.current && osc1Ref.current && osc2Ref.current) {
          const now = audioCtxRef.current.currentTime;
          if (high) {
            osc1Ref.current.frequency.exponentialRampToValueAtTime(780, now + 0.45);
            osc2Ref.current.frequency.exponentialRampToValueAtTime(620, now + 0.45);
          } else {
            osc1Ref.current.frequency.exponentialRampToValueAtTime(420, now + 0.45);
            osc2Ref.current.frequency.exponentialRampToValueAtTime(360, now + 0.45);
          }
          high = !high;
        }
      }, 500);

    } catch (err) {
      console.error("Web Audio API was blocked or unsupported", err);
    }
  };

  const stopSirenAudio = () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    if (gainNodeRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      gainNodeRef.current.gain.cancelScheduledValues(now);
      gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 0.1);
    }
    setTimeout(() => {
      try {
        if (osc1Ref.current) { osc1Ref.current.stop(); osc1Ref.current.disconnect(); osc1Ref.current = null; }
        if (osc2Ref.current) { osc2Ref.current.stop(); osc2Ref.current.disconnect(); osc2Ref.current = null; }
        if (gainNodeRef.current) { gainNodeRef.current.disconnect(); gainNodeRef.current = null; }
        if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
      } catch (e) {
        console.warn("Audio Context cleanup mismatch", e);
      }
    }, 120);
  };

  // Manage Siren Sound based on proximity checks and mute configs
  useEffect(() => {
    const hasNearbyThreat = nearbyCriticalAlerts.length > 0;
    
    if (hasNearbyThreat && !sirenMuted) {
      setIsSirenActive(true);
      startSirenAudio();
    } else {
      setIsSirenActive(false);
      stopSirenAudio();
    }

    return () => {
      stopSirenAudio();
    };
  }, [news, userLat, userLng, sirenMuted]);

  // Handle a manually triggered Audio Test (2-second siren sound preview)
  const triggerAudioTest = () => {
    if (testSirenPlaying) return;
    setTestSirenPlaying(true);
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const testCtx = new AudioContextClass();
      const tGain = testCtx.createGain();
      tGain.gain.setValueAtTime(0, testCtx.currentTime);
      tGain.gain.linearRampToValueAtTime(0.15, testCtx.currentTime + 0.05);

      const tOsc = testCtx.createOscillator();
      tOsc.type = 'triangle';
      tOsc.frequency.setValueAtTime(400, testCtx.currentTime);
      
      tOsc.connect(tGain);
      tGain.connect(testCtx.destination);
      tOsc.start();

      // Modulation sweep
      tOsc.frequency.exponentialRampToValueAtTime(800, testCtx.currentTime + 0.8);
      tOsc.frequency.exponentialRampToValueAtTime(400, testCtx.currentTime + 1.6);

      setTimeout(() => {
        try {
          tOsc.stop();
          tOsc.disconnect();
          tGain.disconnect();
          testCtx.close();
        } catch (e) {}
        setTestSirenPlaying(false);
      }, 1800);

    } catch (e) {
      console.error(e);
      setTestSirenPlaying(false);
    }
  };

  // Fetch initial briefing
  const fetchAIBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const response = await fetch('/api/gemini/disaster-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsItems: news })
      });
      const data = await response.json();
      if (data.briefing) {
        setAiBriefing(data.briefing);
      } else {
        setAiBriefing("Could not generate a response. AI model is currently offline.");
      }
    } catch (err) {
      console.error("Failed to generate AI disaster briefing", err);
      setAiBriefing("Failed to establish secure cognitive connection. Displaying local cache: Keep emergency frequencies clear. Monitor local NOAA weather bands. Establish clear egress pathways for Santa Rosa wildfire zones.");
    } finally {
      setLoadingBriefing(false);
    }
  };

  useEffect(() => {
    fetchAIBriefing();
  }, []);

  const handleUpvote = (id: string) => {
    setNews(prev => prev.map(item => {
      if (item.id === id) {
        const upvoted = !item.hasUpvoted;
        return {
          ...item,
          verifiedCount: upvoted ? item.verifiedCount + 1 : item.verifiedCount - 1,
          hasUpvoted: upvoted
        };
      }
      return item;
    }));
  };

  const handleAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newLocation) {
      alert("Please provide a title and location.");
      return;
    }

    const createdItem: NewsItem = {
      id: `custom_news_${Date.now()}`,
      title: newTitle,
      category: newCategory,
      severity: newSeverity,
      location: newLocation,
      lat: parseFloat(newLat) || 37.7599,
      lng: parseFloat(newLng) || -122.4312,
      timestamp: 'Just now',
      description: newDesc || 'A real-time community sourced emergency event was reported near this coordinate range.',
      impact: newImpact || 'Localized precautions advised. Standby for official confirmation.',
      verifiedCount: 1,
      image: newCategory === 'Wildfire' 
        ? 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1488330890490-c291ecf62711?auto=format&fit=crop&w=800&q=80',
      source: newSource
    };

    setNews(prev => [createdItem, ...prev]);
    setShowAddForm(false);
    // Reset form fields
    setNewTitle('');
    setNewLocation('');
    setNewDesc('');
    setNewImpact('');
    
    // Alert user if the news triggers the siren
    const dist = getDistanceInKm(userLat, userLng, createdItem.lat, createdItem.lng);
    if (dist <= 10 && createdItem.severity !== 'Advisory') {
      alert(`⚠️ HAZARD SOUND ALERT: Added disaster is only ${dist.toFixed(2)}km from your location. Siren synthesiser initiated!`);
    }
  };

  const categories = ['All', 'Wildfire', 'Earthquake', 'Flood', 'Storm', 'Infrastructure', 'Gas Leak', 'Hazardous'];

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getSeverityStyle = (severity: 'Critical' | 'Warning' | 'Advisory') => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      case 'Warning':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'Advisory':
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Wildfire':
        return <Flame className="h-4 w-4 text-orange-400" />;
      case 'Earthquake':
        return <Globe className="h-4 w-4 text-emerald-400" />;
      case 'Flood':
        return <Globe className="h-4 w-4 text-cyan-400" />;
      case 'Storm':
        return <Zap className="h-4 w-4 text-sky-400" />;
      case 'Infrastructure':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'Gas Leak':
        return <ShieldAlert className="h-4 w-4 text-yellow-400 animate-pulse" />;
      default:
        return <Newspaper className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 text-slate-300 text-left relative">
      
      {/* REAL-WORLD BREAKING NEWS TICKER */}
      <div className="w-full bg-rose-950/40 border-y border-rose-500/25 py-2 overflow-hidden flex items-center gap-3 rounded-xl">
        <div className="bg-rose-600 text-white font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 flex items-center gap-1 ml-4 animate-pulse">
          <Radio className="h-3 w-3 animate-ping" />
          <span>Breaking Stream</span>
        </div>
        
        <div className="relative flex-1 overflow-hidden h-4">
          <div className="absolute whitespace-nowrap text-[11px] font-mono font-medium text-rose-200 animate-marquee flex items-center gap-12">
            <span>🚨 SEVERE WILDFIRE EVACUATIONS MANDATED IN SANTA ROSA, CA • RED FLAG WINDS DETECTED</span>
            <span>🔥 ACTIVE PIPELINE GAS LEAK AT 24TH ST & VALENCIA SF • IMMEDIATE SHELTER-IN-PLACE ACTIVATED</span>
            <span>⚡ POWER POWER UTILITY SUBSTATION TRANSFORMER FAILURE CAUSES BLACKOUT TO 14,000 HOMES</span>
            <span>🌊 FLASH FLOOD WARNING ON BAYOU CHANNELS - HIGH-WATER RESCUE VEHICLES DEPLOYED</span>
            <span>📣 VERIFY LOCAL DISASTER BULLETINS BY CLICKING "VERIFY" COG ICON BELOW</span>
          </div>
        </div>
      </div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0a0c12]/90 p-5 border border-white/5 rounded-2xl gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
            <Newspaper className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-white">Disaster News & Crisis Stream</h3>
            <span className="text-[10px] text-slate-500 font-mono">Aggregated Regional Safety Bulletins, Live Feed, and AI Strategic Synthesis</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 bg-rose-900/40 hover:bg-rose-800 border border-rose-500/30 text-rose-300 font-mono text-[10.5px] font-bold rounded-xl transition cursor-pointer"
          >
            {showAddForm ? 'Cancel Submission' : 'Report Live Hazard'}
          </button>
          
          <button
            onClick={fetchAIBriefing}
            disabled={loadingBriefing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-mono text-[11px] font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-md shadow-indigo-500/10 shrink-0"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loadingBriefing ? 'animate-spin' : ''}`} />
            <span>{loadingBriefing ? 'Synthesizing...' : 'Sync AI Intel'}</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC SIREN AUDIO BROADCAST & GPS CONTROLLER BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* GPS Control center */}
        <div className="bg-[#080a10] border border-white/5 p-4 rounded-2xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400">
              <Crosshair className="h-4.5 w-4.5" />
              <h4 className="font-mono text-xs uppercase font-bold text-white tracking-wide">Live GPS Core Station</h4>
            </div>
            
            <button
              onClick={requestLiveLocation}
              disabled={locating}
              className="px-2 py-1 bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-mono rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <Locate className="h-3 w-3" />
              <span>{locating ? 'GPS Ping...' : 'Find My GPS'}</span>
            </button>
          </div>

          <div className="p-3 bg-[#0c0f1a] border border-indigo-500/10 rounded-xl space-y-2 text-[11px] font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Tracked Base HQ:</span>
              <span className="text-indigo-300 font-bold truncate max-w-[200px]">{locationName}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
              <div>
                <span className="text-[10px] text-slate-500 block">LATITUDE</span>
                <input
                  type="number"
                  step="0.0001"
                  value={userLat}
                  onChange={(e) => {
                    setUserLat(parseFloat(e.target.value) || 0);
                    setLocationName(`Custom Track Coordinates`);
                  }}
                  className="w-full bg-[#030408] border border-white/10 rounded-md py-1 px-2 text-white mt-1"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">LONGITUDE</span>
                <input
                  type="number"
                  step="0.0001"
                  value={userLng}
                  onChange={(e) => {
                    setUserLng(parseFloat(e.target.value) || 0);
                    setLocationName(`Custom Track Coordinates`);
                  }}
                  className="w-full bg-[#030408] border border-white/10 rounded-md py-1 px-2 text-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Quick preset coordinates */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Presets:</span>
            <button 
              onClick={() => { setUserLat(37.7599); setUserLng(-122.4312); setLocationName("Mission District HQ"); }}
              className="px-2 py-0.5 bg-[#0e111d] hover:bg-indigo-950/40 border border-white/5 rounded text-[10px] font-mono text-slate-400"
            >
              Mission District (SF)
            </button>
            <button 
              onClick={() => { setUserLat(38.4404); setUserLng(-122.7141); setLocationName("Santa Rosa Wildfire Sector"); }}
              className="px-2 py-0.5 bg-[#0e111d] hover:bg-indigo-950/40 border border-white/5 rounded text-[10px] font-mono text-slate-400"
            >
              Santa Rosa
            </button>
            <button 
              onClick={() => { setUserLat(29.7604); setUserLng(-95.3698); setLocationName("Houston Disaster Hub"); }}
              className="px-2 py-0.5 bg-[#0e111d] hover:bg-indigo-950/40 border border-white/5 rounded text-[10px] font-mono text-slate-400"
            >
              Houston TX
            </button>
          </div>
        </div>

        {/* 10km Emergency Alert Siren broadcast control */}
        <div className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
          isSirenActive 
            ? 'bg-rose-950/30 border-rose-500/30 shadow-md shadow-rose-500/5' 
            : 'bg-[#080a10] border-white/5'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Megaphone className={`h-4.5 w-4.5 ${isSirenActive ? 'text-rose-400 animate-bounce' : 'text-slate-400'}`} />
                <h4 className="font-mono text-xs uppercase font-bold text-white tracking-wide">Emergency Siren Station</h4>
              </div>

              {/* Real-time blinker light */}
              <div className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${isSirenActive ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`}></span>
                <span className="font-mono text-[9px] uppercase font-bold text-slate-400">
                  {isSirenActive ? 'SOUNDING' : 'STANDBY'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans mb-3">
              Automatically monitors for critical hazards inside a <strong className="text-white">10km radius</strong> of your tracking base. Initiates a dual-tone synthesised sweep when a threat is local.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
            <button
              onClick={() => setSirenMuted(!sirenMuted)}
              className={`py-2 px-3 rounded-xl border text-[10px] font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                sirenMuted 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' 
                  : 'bg-rose-600/15 border-rose-500/30 text-rose-400 hover:bg-rose-600/30'
              }`}
            >
              {sirenMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{sirenMuted ? "Siren Muted" : "Siren Enabled"}</span>
            </button>

            <button
              onClick={triggerAudioTest}
              disabled={testSirenPlaying}
              className="py-2 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-[10px] font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>{testSirenPlaying ? "Synthesizing..." : "Test Audio"}</span>
            </button>
          </div>
        </div>

      </div>

      {/* NEIGHBORHOOD HAZARD BANNER WARNING PANEL */}
      <AnimatePresence>
        {nearbyCriticalAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 bg-rose-500/25 border border-rose-500/30 rounded-xl flex items-center justify-center text-rose-400 shrink-0">
                <AlertCircle className="h-5 w-5 animate-pulse" />
              </div>
              <div className="text-left space-y-0.5">
                <span className="font-mono text-[10px] text-rose-400 font-bold uppercase tracking-wider block">⚠️ Threat Detected Inside 10km Radius</span>
                <p className="text-[11.5px] text-slate-300">
                  <strong className="text-white">{nearbyCriticalAlerts[0].title}</strong> is currently active at a distance of <strong className="text-rose-400">{getDistanceInKm(userLat, userLng, nearbyCriticalAlerts[0].lat, nearbyCriticalAlerts[0].lng).toFixed(2)} km</strong>.
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedNews(nearbyCriticalAlerts[0])}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/30 text-rose-300 font-mono text-[10px] font-bold rounded-lg transition"
            >
              Analyze Threat Coordinates
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FORM: SUBMIT NEW EMERGENCY REPORT */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#080a10]/95 border border-rose-500/20 rounded-2xl p-5 overflow-hidden text-left shadow-lg"
          >
            <h4 className="font-mono text-xs uppercase font-bold text-rose-400 tracking-wider mb-4 flex items-center gap-2">
              <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
              Submit Urgent Community Disaster Bulletin
            </h4>

            <form onSubmit={handleAddNews} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">DISASTER HEADLINE</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Broken Electrical Conduit Sparks, Gas Main Severed"
                    className="w-full bg-[#030408] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">SOURCE / REPORTING AUTHORITY</label>
                  <input
                    type="text"
                    required
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    placeholder="e.g. Civic Scanner, USGS Ground Sensor"
                    className="w-full bg-[#030408] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">DISASTER CATEGORY</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full bg-[#030408] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="Wildfire">Wildfire</option>
                    <option value="Earthquake">Earthquake</option>
                    <option value="Flood">Flood</option>
                    <option value="Storm">Storm</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Gas Leak">Gas Leak</option>
                    <option value="Hazardous">Hazardous</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">SEVERITY INDEX</label>
                  <select
                    value={newSeverity}
                    onChange={(e: any) => setNewSeverity(e.target.value)}
                    className="w-full bg-[#030408] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="Critical">Critical Priority</option>
                    <option value="Warning">Warning Level</option>
                    <option value="Advisory">Advisory Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">LOCATION NAME</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Dolores Park, San Francisco, CA"
                    className="w-full bg-[#030408] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">EVENT LATITUDE (TRIGGER SIREN IF WITHIN 10KM)</label>
                  <input
                    type="text"
                    required
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    placeholder="e.g. 37.7599"
                    className="w-full bg-[#030408] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">EVENT LONGITUDE</label>
                  <input
                    type="text"
                    required
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    placeholder="e.g. -122.4312"
                    className="w-full bg-[#030408] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">BRIEF DESCRIPTION</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detailed crisis report describing containment status, responders, or mandatory steps."
                  rows={2}
                  className="w-full bg-[#030408] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">OPERATIONAL STRATEGIC IMPACTS</label>
                <input
                  type="text"
                  value={newImpact}
                  onChange={(e) => setNewImpact(e.target.value)}
                  placeholder="e.g. Road closure on 18th St, power grid cycle delayed."
                  className="w-full bg-[#030408] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-transparent text-slate-400 hover:text-white font-mono text-[11px]"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-[11px] font-bold rounded-xl transition cursor-pointer"
                >
                  Publish to Local Feed
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Intelligence Briefing Panel */}
      <div className="bg-[#0e111a] border border-indigo-500/15 rounded-3xl p-6 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 h-32 w-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-2.5 mb-4">
          <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
          <h4 className="font-mono text-xs uppercase tracking-widest font-bold text-white">AI Command Intelligence Summary</h4>
        </div>

        {loadingBriefing ? (
          <div className="py-6 flex flex-col items-center justify-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
              <Sparkles className="absolute h-3 w-3 text-indigo-400 animate-ping" />
            </div>
            <p className="text-[10px] font-mono text-slate-400 animate-pulse">Consulting Commander AI Cognitive Network...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[11.5px] leading-relaxed text-slate-300 font-sans border-l-2 border-indigo-500/30 pl-4 whitespace-pre-line">
              {aiBriefing || "Initializing disaster stream intelligence..."}
            </p>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-emerald-500" />
                <span>Status: Connected to Global Command Database</span>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(aiBriefing);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="hover:text-white transition cursor-pointer"
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Briefing'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Stream Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Stream Filter & Search Side Deck */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-[#06080d]/80 border border-white/5 rounded-2xl p-4 space-y-4">
            <h4 className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stream Controls</h4>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search updates..."
                className="w-full bg-[#0a0c12] border border-white/5 focus:border-indigo-500/40 focus:outline-hidden rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 transition duration-150"
              />
            </div>

            {/* Category Filter Deck */}
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left flex items-center justify-between p-2.5 rounded-xl border transition text-xs cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-indigo-600/10 border-indigo-500/30 text-white font-bold' 
                      : 'bg-[#0a0c12]/40 border-transparent text-slate-400 hover:bg-[#0a0c12] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(cat)}
                    <span>{cat === 'All' ? 'All Channels' : cat}</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-600" />
                </button>
              ))}
            </div>

            {/* Quick Statistics Mini Deck */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500">Total Alerts:</span>
                <span className="text-white font-bold">{news.length}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500">Critical Priority:</span>
                <span className="text-rose-400 font-bold">
                  {news.filter(n => n.severity === 'Critical').length}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500">Unresolved Risk:</span>
                <span className="text-amber-400 font-bold">
                  {news.filter(n => n.severity === 'Warning').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live News Cards Deck */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Disaster Feed ({filteredNews.length})
            </h4>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live stream sync nominal
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredNews.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-12 text-center bg-[#06080d]/80 border border-white/5 rounded-3xl font-mono text-slate-500 text-xs"
              >
                No news items match the chosen parameters.
              </motion.div>
            ) : (
              <div className="space-y-4">
                {filteredNews.map((item) => {
                  const dist = getDistanceInKm(userLat, userLng, item.lat, item.lng);
                  const isLocal = dist <= 10;
                  
                  return (
                    <motion.div
                      key={item.id}
                      layoutId={`news-card-${item.id}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className={`bg-[#0a0c16]/75 hover:bg-[#0c0f1e] border hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col md:flex-row relative ${
                        isLocal && item.severity !== 'Advisory' ? 'border-rose-500/25 ring-1 ring-rose-500/10' : 'border-white/5'
                      }`}
                    >
                      {/* Event Banner Image */}
                      <div className="w-full md:w-44 h-32 md:h-auto relative shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="h-full w-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#030408]/90 via-[#030408]/30 to-transparent"></div>
                        
                        <div className="absolute top-2.5 left-2.5">
                          <span className={`text-[8.5px] uppercase font-mono font-bold px-2 py-0.5 rounded-md ${getSeverityStyle(item.severity)}`}>
                            {item.severity}
                          </span>
                        </div>
                      </div>

                      {/* Event Details Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 min-w-0">
                        <div>
                          {/* Upper row meta */}
                          <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 gap-1.5 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              {getCategoryIcon(item.category)}
                              <span className="text-white font-semibold">{item.category}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-500">{item.timestamp}</span>
                            </div>
                            <span className="text-indigo-400 font-semibold">{item.source}</span>
                          </div>

                          {/* Title & Description */}
                          <h4 className="text-xs font-bold text-white hover:text-indigo-300 transition duration-150 line-clamp-1 mb-2 flex items-center gap-1.5">
                            {isLocal && item.severity !== 'Advisory' && (
                              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping inline-block shrink-0"></span>
                            )}
                            <span className="truncate">{item.title}</span>
                          </h4>
                          
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        {/* Footer Info Row */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] font-mono gap-4">
                          <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
                            <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                            <span className="truncate max-w-[130px]">{item.location}</span>
                            <span className="text-slate-600 shrink-0">•</span>
                            <span className={`shrink-0 font-bold ${isLocal ? 'text-rose-400' : 'text-slate-500'}`}>
                              {dist.toFixed(1)} km
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Verify Report Button */}
                            <button
                              onClick={() => handleUpvote(item.id)}
                              className={`px-2.5 py-1 rounded-lg border transition duration-150 flex items-center gap-1 cursor-pointer ${
                                item.hasUpvoted 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold' 
                                  : 'bg-[#0e111a] border-white/5 text-slate-400 hover:text-white'
                              }`}
                            >
                              <ThumbsUp className="h-3 w-3" />
                              <span>{item.verifiedCount}</span>
                            </button>

                            {/* Inspect Modal Trigger */}
                            <button
                              onClick={() => setSelectedNews(item)}
                              className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-lg transition duration-150 flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Inspect</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Detailed News inspection Modal */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 bg-[#030408]/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0c16] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden relative shadow-2xl text-left"
            >
              {/* Image banner */}
              <div className="h-48 relative">
                <img 
                  src={selectedNews.image} 
                  alt={selectedNews.title} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c16] via-transparent to-transparent"></div>
                
                {/* Severity Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`text-[9px] uppercase font-mono font-bold px-2.5 py-1 rounded-md ${getSeverityStyle(selectedNews.severity)}`}>
                    {selectedNews.severity}
                  </span>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedNews(null)}
                  className="absolute top-4 right-4 h-7 w-7 bg-[#0a0c16]/80 hover:bg-rose-600 border border-white/10 rounded-lg flex items-center justify-center text-slate-300 hover:text-white transition duration-150 cursor-pointer"
                >
                  <span className="text-sm font-bold">×</span>
                </button>
              </div>

              {/* Content box */}
              <div className="p-6 space-y-5">
                {/* Header row */}
                <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(selectedNews.category)}
                    <span className="text-white font-bold">{selectedNews.category}</span>
                    <span>•</span>
                    <span>{selectedNews.timestamp}</span>
                  </div>
                  <span className="text-indigo-400 font-semibold">Source: {selectedNews.source}</span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-white uppercase leading-snug">
                  {selectedNews.title}
                </h3>

                {/* Full description */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Crisis Bulletin Details</h5>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed font-sans">
                    {selectedNews.description}
                  </p>
                </div>

                {/* Direct operational impacts */}
                <div className="p-3.5 bg-rose-950/15 border border-rose-500/10 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-rose-400 uppercase font-bold">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Operational Strategic Impact</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {selectedNews.impact}
                  </p>
                </div>

                {/* Footer operational alignment links */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] font-mono">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{selectedNews.location} ({getDistanceInKm(userLat, userLng, selectedNews.lat, selectedNews.lng).toFixed(2)} km away)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpvote(selectedNews.id)}
                      className={`px-3 py-1.5 rounded-lg border transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                        selectedNews.hasUpvoted 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold' 
                          : 'bg-[#0e111a] border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span>{selectedNews.verifiedCount} {selectedNews.hasUpvoted ? 'Verified' : 'Verify'}</span>
                    </button>
                    
                    <button
                      onClick={() => setSelectedNews(null)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition duration-150 cursor-pointer"
                    >
                      Acknowledge Report
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
