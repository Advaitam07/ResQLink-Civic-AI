import React, { useState, useMemo } from 'react';
import { 
  CloudRain, Eye, MapPin, TrendingUp, Plus, Activity, ShieldAlert, Users, 
  Star, Compass, ShieldCheck, Droplets, AlertTriangle, Wind, Navigation, HeartPulse, ChevronRight, Search, SlidersHorizontal 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CivicIssue } from '../types';

interface AIExecutionEngineProps {
  currentTask: { type: string; payload?: any } | null;
  selectedAssetId?: string;
  issues?: CivicIssue[];
  onSelectIssue?: (issue: CivicIssue) => void;
  onCreateMission?: () => void;
}

export default function AIExecutionEngine({ 
  currentTask, 
  selectedAssetId, 
  issues = [], 
  onSelectIssue, 
  onCreateMission 
}: AIExecutionEngineProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'active' | 'resolved'>('all');

  // Hardcoded agent parameters - styled beautifully as a live static feed with clean ambient animation
  const staticAgents = [
    {
      id: 'forecast',
      name: 'Forecast Agent',
      role: 'Weather & Risk Prognosis',
      icon: <CloudRain className="h-4.5 w-4.5" />,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      action: 'Monitoring regional radar & weather grids',
    },
    {
      id: 'vision',
      name: 'Vision Agent',
      role: 'Visual Evidence Analysis',
      icon: <Eye className="h-4.5 w-4.5" />,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      action: 'Scanning field imagery & EXIF data',
    },
    {
      id: 'location',
      name: 'Location Agent',
      role: 'GIS Coordinate Core',
      icon: <MapPin className="h-4.5 w-4.5" />,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      action: 'Mapping micro-spatial hazard parameters',
    },
    {
      id: 'impact',
      name: 'Impact Agent',
      role: 'Damage Cascade Modeler',
      icon: <TrendingUp className="h-4.5 w-4.5" />,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      action: 'Calculating civic infrastructure degradation',
    },
    {
      id: 'response',
      name: 'Response Agent',
      role: 'Tactical Incident Planner',
      icon: <HeartPulse className="h-4.5 w-4.5" />,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      action: 'Drafting recommended action checklists',
    },
    {
      id: 'coordinator',
      name: 'Coordinator Agent',
      role: 'Resource Dispatch Engine',
      icon: <Users className="h-4.5 w-4.5" />,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      action: 'Mapping optimal responder dispatch routing',
    },
    {
      id: 'commander',
      name: 'Commander AI',
      role: 'Tactical Central Orchestrator',
      icon: <Star className="h-4.5 w-4.5" />,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      action: 'Compounding multi-agent verdicts to ledger',
    }
  ];

  // Dynamic status counters based on REAL active issues
  const metrics = useMemo(() => {
    const total = issues.length;
    const critical = issues.filter(i => i.severity === 'Critical').length;
    const active = issues.filter(i => i.status !== 'Resolved').length;
    const resolved = issues.filter(i => i.status === 'Resolved').length;
    return { total, critical, active, resolved };
  }, [issues]);

  // Compute filtered issues to make this a genuine search/filter component!
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Search term match
      const matchesSearch = 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        issue.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Filter category match
      if (activeFilter === 'critical') {
        return issue.severity === 'Critical';
      }
      if (activeFilter === 'active') {
        return issue.status !== 'Resolved';
      }
      if (activeFilter === 'resolved') {
        return issue.status === 'Resolved';
      }
      return true; // 'all'
    });
  }, [issues, searchQuery, activeFilter]);

  // Helper to determine issue icons
  const getIssueIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('flood') || cat.includes('water')) return <Droplets className="h-4 w-4 text-blue-400" />;
    if (cat.includes('landslide') || cat.includes('earthquake') || cat.includes('pothole') || cat.includes('infrastructure') || cat.includes('road')) {
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    }
    if (cat.includes('wind') || cat.includes('cyclone') || cat.includes('hurricane') || cat.includes('storm')) {
      return <Wind className="h-4 w-4 text-rose-400" />;
    }
    return <Navigation className="h-4 w-4 text-emerald-400" />;
  };

  // Severity color maps
  const getSeverityBadgeClass = (severity: string) => {
    switch(severity) {
      case 'Critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'High':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Medium':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-y-auto p-4 bg-[#030408] space-y-6">
      
      {/* 1. AI AGENT ACTIVITY SECTION */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider font-mono">
              AI Forensics Fleet
            </h3>
          </div>
          <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/5 px-2 py-0.5 rounded-full border border-indigo-500/10">
            7 AGENTS READY
          </span>
        </div>

        {/* AGENTS HORIZONTAL/VERTICAL LIST with pure CSS ambient glow */}
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
          {staticAgents.map((agent) => (
            <div 
              key={agent.id}
              className="p-2.5 bg-[#070913]/60 border border-white/5 rounded-xl hover:border-indigo-500/20 transition-all duration-300 flex items-start gap-2.5 group relative overflow-hidden"
            >
              {/* Background light pulse */}
              <div className="absolute inset-0 bg-indigo-500/[0.01] group-hover:bg-indigo-500/[0.03] transition-colors pointer-events-none" />

              {/* Agent Icon */}
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border border-transparent shadow-xs ${agent.color} transition duration-300 group-hover:scale-105`}>
                {agent.icon}
              </div>

              {/* Agent Data */}
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-bold text-white tracking-wide group-hover:text-indigo-300 transition-colors">
                    {agent.name}
                  </h4>
                  <div className="flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[7px] font-mono text-emerald-400 uppercase font-black tracking-wider">STANDBY</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 truncate mt-0.5 font-sans leading-relaxed">
                  {agent.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. ACTIVE MISSIONS SECTION WITH FULL FILTERS */}
      <div className="space-y-4 border-t border-white/5 pt-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider font-mono">
              District Missions
            </h3>
            <span className="text-[9px] font-mono font-bold text-slate-400">
              {metrics.active} Active / {metrics.resolved} Resolved
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input 
              type="text"
              placeholder="Search active missions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070913] border border-white/5 rounded-lg py-1.5 pl-9 pr-3 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors font-medium"
            />
          </div>

          {/* Filter Pill Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#070913] rounded-lg border border-white/5">
            {[
              { id: 'all', label: 'All' },
              { id: 'critical', label: '🚨 Crit' },
              { id: 'active', label: 'Live' },
              { id: 'resolved', label: 'Done' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`py-1 rounded-md text-[9px] font-bold font-mono transition cursor-pointer text-center ${
                  activeFilter === tab.id 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable Missions List */}
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <div 
                  key={issue.id}
                  onClick={() => onSelectIssue && onSelectIssue(issue)}
                  className="p-2.5 bg-[#070913]/60 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all flex items-center justify-between cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 bg-slate-900 border border-white/5 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                      {getIssueIcon(issue.category)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                        {issue.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-[7px] font-mono font-bold px-1 py-0.2 rounded border uppercase tracking-wider ${getSeverityBadgeClass(issue.severity)}`}>
                          {issue.severity}
                        </span>
                        <span className="text-[8px] text-slate-500 font-medium font-mono">
                          #{issue.id}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${issue.status === 'Resolved' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                    <span className={`text-[8px] font-mono font-bold tracking-wider uppercase ${issue.status === 'Resolved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {issue.status}
                    </span>
                    <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-indigo-400 transition-colors ml-1" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-[10px] font-mono border border-dashed border-white/5 rounded-xl bg-[#070913]/20">
                No matching missions in ledger.
              </div>
            )}
          </div>
        </div>

        {/* 3. DEPLOY NEW MISSION TRIGGER */}
        <button 
          onClick={() => {
            if (onCreateMission) {
              onCreateMission();
            }
          }}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-md shadow-indigo-600/10 border border-indigo-500/25"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Deploy New Mission</span>
        </button>
      </div>

    </div>
  );
}

