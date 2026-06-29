import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ShieldCheck, ClipboardCheck, ArrowLeftRight, Clock, FileText, 
  CheckCircle, AlertTriangle, Hammer, MessageSquare, History, MapPin, 
  ThumbsUp, User, Tag, Calendar, ShieldAlert, Navigation, Send, Compass, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CivicIssue, IssueStatus, CivicComment, MultiAgentInvestigation, ReplayStep } from '../types';

interface WorkspaceInvestigationsProps {
  selectedIssue: CivicIssue;
  onUpdateStatus: (id: string, status: IssueStatus) => void;
  onTriggerExecution: (taskType: string, payload?: any) => void;
  currentUser?: { name: string; email: string };
  onRefreshIssues?: () => Promise<void>;
}

export default function WorkspaceInvestigations({ 
  selectedIssue, 
  onUpdateStatus, 
  onTriggerExecution,
  currentUser = { name: "Aditya Sharma", email: "adityapradipsharma@gmail.com" },
  onRefreshIssues
}: WorkspaceInvestigationsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'investigation' | 'action' | 'discussion' | 'history'>('overview');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [actionsCompleted, setActionsCompleted] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  const [investigating, setInvestigating] = useState(false);
  const [investigation, setInvestigation] = useState<MultiAgentInvestigation | undefined>(selectedIssue.investigation);
  const [currentReplayStepIndex, setCurrentReplayStepIndex] = useState<number>(-1);
  const [replayStepsList, setReplayStepsList] = useState<ReplayStep[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<'forecast' | 'vision' | 'location' | 'impact' | 'response' | 'coordinator' | 'commander' | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  // Auto-scroll logic ref for terminal
  const terminalEndRef = React.useRef<HTMLDivElement>(null);
  const [prevIssueId, setPrevIssueId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedIssue.id !== prevIssueId) {
      setPrevIssueId(selectedIssue.id);
      setInvestigation(selectedIssue.investigation);
      setInvestigating(false);
      setCurrentReplayStepIndex(-1);
      setReplayStepsList([]);
      setActiveAgentId(null);
      setExpandedAgent(null);

      // Auto-trigger full forensic investigation if a newly reported issue lacks analysis
      if (!selectedIssue.investigation && selectedIssue.status === 'Reported') {
        const timer = setTimeout(() => {
          handleRunInvestigation();
        }, 500);
        return () => clearTimeout(timer);
      }
    } else {
      // If same issue but backend updated, only update local state if we aren't actively running a playback
      if (!investigating) {
        setInvestigation(selectedIssue.investigation);
      }
    }
  }, [selectedIssue, prevIssueId, investigating]);


  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replayStepsList]);

  // Set actions state initially from selectedIssue
  useEffect(() => {
    const initialState: Record<string, boolean> = {};
    selectedIssue.recommendedActions.forEach((act, i) => {
      // simulate some pre-completed items for visual rhythm!
      initialState[act] = i === 0 && selectedIssue.status !== 'Reported';
    });
    setActionsCompleted(initialState);
  }, [selectedIssue]);

  // Image comparisons
  const forensicRenders: Record<string, { before: string; after: string }> = {
    iss_001: {
      before: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80",
      after: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80" // Repaved clean street
    },
    iss_002: {
      before: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80",
      after: "https://images.unsplash.com/photo-1595181895604-a8352fc247e6?auto=format&fit=crop&w=800&q=80" // Clean green park area
    },
    iss_003: {
      before: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
      after: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80" // Dry clean sidewalk
    },
    iss_004: {
      before: "https://images.unsplash.com/photo-1542397284385-601017642477?auto=format&fit=crop&w=800&q=80",
      after: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=800&q=80" // Clean lit streetlight
    }
  };

  const currentComparison = forensicRenders[selectedIssue.id] || {
    before: selectedIssue.imageUrl || "https://images.unsplash.com/photo-1488330890490-c291ecf62711?auto=format&fit=crop&w=800&q=80",
    after: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=800&q=80"
  };

  const handleSliderMove = (clientX: number, containerRect: DOMRect) => {
    const x = clientX - containerRect.left;
    const percentage = Math.max(0, Math.min(100, (x / containerRect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const container = e.currentTarget.getBoundingClientRect();
    handleSliderMove(e.touches[0].clientX, container);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1 || isDragging) {
      const container = e.currentTarget.getBoundingClientRect();
      handleSliderMove(e.clientX, container);
    }
  };

  const toggleAction = (act: string) => {
    setActionsCompleted(prev => ({ ...prev, [act]: !prev[act] }));
    onTriggerExecution('CHECKLIST_TOGGLED', { action: act });
  };

  const handleStatusChange = (status: IssueStatus) => {
    onUpdateStatus(selectedIssue.id, status);
    onTriggerExecution('STATUS_CHANGED', { issueId: selectedIssue.id, status });
  };

  // Upvote integration
  const handleUpvote = async () => {
    if (upvoting) return;
    setUpvoting(true);
    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email })
      });
      if (res.ok && onRefreshIssues) {
        await onRefreshIssues();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpvoting(false);
    }
  };

  // Comment posting integration
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;
    setSubmittingComment(true);

    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser.name,
          email: currentUser.email,
          text: newComment
        })
      });
      if (res.ok) {
        setNewComment('');
        if (onRefreshIssues) {
          await onRefreshIssues();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Trigger multi-agent investigation
  const handleRunInvestigation = async () => {
    if (investigating) return;
    setInvestigating(true);
    setCurrentReplayStepIndex(-1);
    setReplayStepsList([]);
    setActiveAgentId(null);

    // Switch to investigation tab to watch live animation
    setActiveTab('investigation');

    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/investigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data: MultiAgentInvestigation = await res.json();
        setInvestigation(data);
        
        // Step-by-step playback animation
        let step = 0;
        const interval = setInterval(() => {
          if (step < data.replaySteps.length) {
            setReplayStepsList(prev => [...prev, data.replaySteps[step]]);
            setCurrentReplayStepIndex(step);
            
            const name = data.replaySteps[step].agentName.toLowerCase();
            if (name.includes('forecast')) setActiveAgentId('forecast');
            else if (name.includes('vision')) setActiveAgentId('vision');
            else if (name.includes('location') || name.includes('geo')) setActiveAgentId('location');
            else if (name.includes('impact') || name.includes('risk')) setActiveAgentId('impact');
            else if (name.includes('response') || name.includes('resolution')) setActiveAgentId('response');
            else if (name.includes('coordinator')) setActiveAgentId('coordinator');
            else if (name.includes('commander')) setActiveAgentId('commander');

            step++;
          } else {
            clearInterval(interval);
            setInvestigating(false);
            setActiveAgentId(null);
            if (onRefreshIssues) {
              onRefreshIssues();
            }
          }
        }, 800);
      } else {
        console.error("Failed to run investigation");
        setInvestigating(false);
      }
    } catch (err) {
      console.error(err);
      setInvestigating(false);
    }
  };

  const handleReplay = () => {
    if (!investigation) return;
    setInvestigating(true);
    setCurrentReplayStepIndex(-1);
    setReplayStepsList([]);
    setActiveAgentId(null);

    let step = 0;
    const interval = setInterval(() => {
      if (step < investigation.replaySteps.length) {
        setReplayStepsList(prev => [...prev, investigation.replaySteps[step]]);
        setCurrentReplayStepIndex(step);
        
        const name = investigation.replaySteps[step].agentName.toLowerCase();
        if (name.includes('forecast')) setActiveAgentId('forecast');
        else if (name.includes('vision')) setActiveAgentId('vision');
        else if (name.includes('location') || name.includes('geo')) setActiveAgentId('location');
        else if (name.includes('impact') || name.includes('risk')) setActiveAgentId('impact');
        else if (name.includes('response') || name.includes('resolution')) setActiveAgentId('response');
        else if (name.includes('coordinator')) setActiveAgentId('coordinator');
        else if (name.includes('commander')) setActiveAgentId('commander');

        step++;
      } else {
        clearInterval(interval);
        setInvestigating(false);
        setActiveAgentId(null);
      }
    }, 600);
  };

  const handleSkipReplay = () => {
    if (!investigation) return;
    setReplayStepsList(investigation.replaySteps);
    setCurrentReplayStepIndex(investigation.replaySteps.length - 1);
    setInvestigating(false);
    setActiveAgentId(null);
  };

  const isUpvoted = selectedIssue.upvotedBy?.includes(currentUser.email);

  return (
    <div className="space-y-6 text-slate-300 text-left">
      
      {/* Dynamic Header Block */}
      <div className="p-6 bg-[#0a0c12] border border-white/5 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
              Mission #{selectedIssue.id}
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
              {selectedIssue.category}
            </span>
          </div>
          <h2 className="font-display font-black text-lg md:text-xl text-white tracking-tight leading-tight">
            {selectedIssue.title}
          </h2>
          <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-orange-500" />
            <span>SF block coords: {selectedIssue.location.lat.toFixed(6)}, {selectedIssue.location.lng.toFixed(6)}</span>
          </p>
        </div>

        {/* Status switcher controls */}
        <div className="flex flex-wrap gap-1.5 bg-white/5 p-1.5 border border-white/5 rounded-2xl shrink-0">
          {(['Reported', 'Assigned', 'In Progress', 'Resolved'] as IssueStatus[]).map((stat) => (
            <button
              key={stat}
              onClick={() => handleStatusChange(stat)}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-mono font-bold transition cursor-pointer ${
                selectedIssue.status === stat
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {stat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs navigation panel */}
      <div className="flex overflow-x-auto pb-1 border-b border-white/5 gap-1 scrollbar-none">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-display text-xs font-bold uppercase tracking-wider border-b-2 transition shrink-0 cursor-pointer ${
            activeTab === 'overview' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Overview & Map
        </button>
        <button 
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2 font-display text-xs font-bold uppercase tracking-wider border-b-2 transition shrink-0 cursor-pointer ${
            activeTab === 'evidence' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Evidence Slider
        </button>
        <button 
          onClick={() => setActiveTab('investigation')}
          className={`px-4 py-2 font-display text-xs font-bold uppercase tracking-wider border-b-2 transition shrink-0 cursor-pointer ${
            activeTab === 'investigation' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          AI Investigation
        </button>
        <button 
          onClick={() => setActiveTab('action')}
          className={`px-4 py-2 font-display text-xs font-bold uppercase tracking-wider border-b-2 transition shrink-0 cursor-pointer ${
            activeTab === 'action' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Action Plan
        </button>
        <button 
          onClick={() => setActiveTab('discussion')}
          className={`px-4 py-2 font-display text-xs font-bold uppercase tracking-wider border-b-2 transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'discussion' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Discussion</span>
          {selectedIssue.comments && selectedIssue.comments.length > 0 && (
            <span className="bg-orange-500/10 text-orange-400 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-orange-500/25">
              {selectedIssue.comments.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-display text-xs font-bold uppercase tracking-wider border-b-2 transition shrink-0 cursor-pointer ${
            activeTab === 'history' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Audit History
        </button>
      </div>

      {/* Tabs panels container */}
      <div className="bg-[#0a0c12] border border-white/5 rounded-3xl p-6 min-h-[380px] shadow-sm">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: OVERVIEW & MAP */}
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Description and reporter info */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-wider">Mission Statement</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#0e111a] p-4 border border-white/5 rounded-2xl shadow-2xs">
                      {selectedIssue.description}
                    </p>
                  </div>

                  {/* MULTI-AGENT COGNITIVE ENGINE DECK */}
                  <div className="p-5 bg-[#0a0c12] border border-white/5 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className={`h-4.5 w-4.5 ${investigation ? 'text-orange-500 animate-pulse' : 'text-slate-500'}`} />
                        <div>
                          <span className="text-[8px] text-slate-400 font-mono uppercase block">Forensic Intelligence</span>
                          <span className="text-xs font-bold text-white uppercase font-display tracking-wider">ResQ AI Orchestrator Deck</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        investigation 
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                          : 'bg-white/5 text-slate-400 border border-white/5'
                      }`}>
                        {investigation ? 'ANALYSIS COMPLETE' : 'AWAITING AUDIT'}
                      </span>
                    </div>

                    {investigation ? (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {investigation.orchestratorSummary}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                          <div className="bg-[#0e111a] p-2.5 border border-white/5 rounded-xl text-left">
                            <span className="text-slate-400 block text-[8px]">SEVERITY</span>
                            <span className="text-white font-extrabold block mt-0.5 text-xs">{investigation.severityScore}/10</span>
                          </div>
                          <div className="bg-[#0e111a] p-2.5 border border-white/5 rounded-xl text-left">
                            <span className="text-slate-400 block text-[8px]">CONFIDENCE</span>
                            <span className="text-emerald-400 font-extrabold block mt-0.5 text-xs">{investigation.confidencePercentage}%</span>
                          </div>
                          <div className="bg-[#0e111a] p-2.5 border border-white/5 rounded-xl text-left">
                            <span className="text-slate-400 block text-[8px]">DISPATCH GROUP</span>
                            <span className="text-orange-400 font-extrabold block mt-0.5 text-[10px] truncate">{investigation.agents?.resolution?.findings?.assignedDepartment || 'SF Public Works'}</span>
                          </div>
                          <div className="bg-[#0e111a] p-2.5 border border-white/5 rounded-xl text-left">
                            <span className="text-slate-400 block text-[8px]">DUPLICATE</span>
                            <span className="text-amber-400 font-extrabold block mt-0.5 text-[9px] truncate">{investigation.duplicateDetectionResult}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            onClick={() => {
                              setActiveTab('investigation');
                            }}
                            className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-md shadow-orange-500/10"
                          >
                            <span>Open Deep Audit</span>
                            <span>→</span>
                          </button>
                          <button
                            onClick={handleReplay}
                            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer border border-white/10"
                          >
                            <History className="h-3 w-3 text-slate-400" />
                            <span>Replay Mission Investigation</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          This civic incident is awaiting multi-agent forensics. ResQ Commander coordinates 6 specialized agents (Vision, Geo, Cluster, Risk, Resolution) to compound visual context, coordinate database logs, map geographic vulnerabilities, and output a complete resolution.
                        </p>
                        <button
                          onClick={handleRunInvestigation}
                          disabled={investigating}
                          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/15 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="h-4 w-4 text-orange-200" />
                          <span>ORCHESTRATE MULTI-AGENT INVESTIGATION</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reporter details */}
                  <div className="p-4 bg-[#0e111a] border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center font-bold font-mono border border-orange-500/20">
                        {selectedIssue.reporter?.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-mono uppercase block">Sentinel Witness</span>
                        <span className="text-xs font-bold text-white block">{selectedIssue.reporter?.name || 'Civic Citizen'}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{selectedIssue.reporter?.email || 'citizen@resqlink.org'}</span>
                      </div>
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-left sm:text-right font-mono">
                      <span className="text-[8px] text-slate-400 uppercase block">Registered date</span>
                      <span className="text-[10px] text-slate-400 block font-bold">{new Date(selectedIssue.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Upvote support bar */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleUpvote}
                      disabled={upvoting}
                      className={`px-4 py-2 border rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                        isUpvoted 
                          ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                          : 'bg-[#0a0c12] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <ThumbsUp className={`h-4 w-4 ${isUpvoted ? 'fill-orange-500 stroke-orange-400' : ''}`} />
                      <span>{isUpvoted ? 'Verification Endorsed' : 'Endorse Report Validity'}</span>
                    </button>
                    <span className="text-[10px] font-mono text-slate-400">
                      Endorsed by <strong className="font-bold text-white">{selectedIssue.upvotes || 0}</strong> other sentinel accounts
                    </span>
                  </div>
                </div>

                {/* Quick Map Coordinates Area */}
                <div className="p-4 bg-[#0a0c12] border border-white/5 rounded-2xl flex flex-col justify-between h-64 relative overflow-hidden group shadow-2xs">
                  <div className="absolute inset-0 bg-white/[0.01] pointer-events-none"></div>
                  
                  <div className="space-y-1 relative z-10">
                    <span className="text-[8px] font-mono font-bold uppercase text-slate-400 tracking-wider">Geospatial Marker Location</span>
                    <h4 className="text-xs font-bold text-white leading-tight mt-1">{selectedIssue.location.address}</h4>
                  </div>

                  {/* Simulated Blueprint Map drawing */}
                  <div className="h-28 border border-white/5 bg-[#05060a] rounded-xl relative overflow-hidden flex items-center justify-center p-2 mt-2">
                    {/* Simulated vector grid background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                    <div className="relative text-center space-y-1.5 z-10">
                      <div className="h-6 w-6 bg-orange-500/10 border border-orange-500 text-orange-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
                        <MapPin className="h-3 w-3" />
                      </div>
                      <span className="text-[8px] text-slate-400 font-mono uppercase tracking-wider block font-bold">Lat: {selectedIssue.location.lat.toFixed(5)} / Lng: {selectedIssue.location.lng.toFixed(5)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('evidence')}
                    className="w-full mt-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 transition shadow-md shadow-orange-500/10 cursor-pointer"
                  >
                    <span>Inspect Forensics</span>
                    <span>→</span>
                  </button>
                </div>

              </div>
            </motion.div>
          )}
          
          {/* TAB 2: EVIDENCE SLIDER */}
          {activeTab === 'evidence' && (
            <motion.div 
              key="evidence"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-display tracking-wider">
                    <ArrowLeftRight className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
                    Interactive Reconstruction forensics Slider
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">Slide to compare original field report photo against our target AI-rendered resolution blueprint.</p>
                </div>
              </div>

              {/* Slider frame */}
              <div 
                className="w-full aspect-[16/9] max-h-[420px] bg-[#030408] border border-white/5 rounded-3xl overflow-hidden relative select-none cursor-ew-resize mx-auto shadow-sm"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
                {/* After image */}
                <img 
                  src={currentComparison.after} 
                  alt="AI Target Resolution Render" 
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
                <div className="absolute top-4 right-4 bg-black/75 border border-emerald-500/35 rounded-xl px-3 py-1.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider font-mono z-10 shadow-xs select-none pointer-events-none">
                  AI Target Resolution blueprint
                </div>

                {/* Before image */}
                <div 
                  className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none border-r border-white/10"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img 
                    src={currentComparison.before} 
                    alt="Original Field Report Photo" 
                    className="absolute inset-y-0 left-0 w-full h-full object-cover pointer-events-none max-w-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                  <div className="absolute top-4 left-4 bg-black/75 border border-orange-500/35 rounded-xl px-3 py-1.5 text-[9px] font-bold text-orange-400 uppercase tracking-wider font-mono z-10 shadow-xs select-none pointer-events-none">
                    Original Field Report photo
                  </div>
                </div>

                {/* Slider bar */}
                <div 
                  className="absolute inset-y-0 w-0.5 bg-white/90 z-10 pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 bg-orange-500 border border-white rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/30 pointer-events-none cursor-pointer">
                    <ArrowLeftRight className="h-4.5 w-4.5" />
                  </div>
                </div>
              </div>

              {/* Sensor Diagnostics */}
              <div className="p-4 bg-[#0a0c12] border border-white/5 rounded-2xl space-y-3">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-400 block border-b border-white/5 pb-2">Forensic Photographic EXIF payload</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-mono">
                  <div className="bg-[#0e111a] p-3 border border-white/5 rounded-xl">
                    <span className="text-slate-400 block">GPS PRECISION</span>
                    <span className="text-orange-400 font-extrabold block mt-1">± 2.4 Meters</span>
                  </div>
                  <div className="bg-[#0e111a] p-3 border border-white/5 rounded-xl">
                    <span className="text-slate-400 block">INTELLIGENCE CONFIDENCE</span>
                    <span className="text-emerald-400 font-extrabold block mt-1">94.2% Verified</span>
                  </div>
                  <div className="bg-[#0e111a] p-3 border border-white/5 rounded-xl">
                    <span className="text-slate-400 block">EXPOSURE MATRIX</span>
                    <span className="text-white font-extrabold block mt-1">1/120s @ f/4.0</span>
                  </div>
                  <div className="bg-[#0e111a] p-3 border border-white/5 rounded-xl">
                    <span className="text-slate-400 block">RECONSTRUCTION BIAS</span>
                    <span className="text-amber-400 font-extrabold block mt-1">0.03 Offset</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: AI INVESTIGATION */}
          {activeTab === 'investigation' && (
            <motion.div 
              key="investigation"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              {!investigation && !investigating ? (
                <div className="text-center py-16 px-4 max-w-xl mx-auto space-y-6">
                  <div className="h-16 w-16 bg-orange-500/10 border border-orange-500/20 text-orange-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">Awaiting Forensic Orchestration</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      No multi-agent cognitive investigation has been run on this incident. Trigger ResQ Commander to coordinate the Vision, Geo, Cluster, Risk, and Resolution agents in real-time to analyze structural damage, verify historical duplicates, and estimate risk.
                    </p>
                  </div>
                  <button
                    onClick={handleRunInvestigation}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/15 flex items-center gap-2 mx-auto transition cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>ORCHESTRATE COGNITIVE RUN</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progress Header */}
                  <div className="p-4 bg-[#0a0c12] border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2.5">
                      {investigating ? (
                        <div className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                      ) : (
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      )}
                      <div>
                        <span className="text-[8px] text-slate-400 font-mono uppercase block">System Status</span>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">
                          {investigating 
                            ? 'Orchestrating 6-Agent Forensics Chain...' 
                            : 'Forensic Cognitive Engine Run Complete'}
                        </h3>
                      </div>
                    </div>
                    {investigating ? (
                      <button
                        onClick={handleSkipReplay}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[10px] font-semibold rounded-lg transition cursor-pointer"
                      >
                        Skip Replay
                      </button>
                    ) : (
                      <button
                        onClick={handleReplay}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-md shadow-orange-500/10"
                      >
                        <History className="h-3 w-3" />
                        <span>Replay Audit</span>
                      </button>
                    )}
                  </div>

                  {/* 7-Agent Status Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-2.5">
                    {[
                      { id: 'forecast', name: 'Forecast Agent', role: 'Risk Prognosis', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
                      { id: 'vision', name: 'Vision Agent', role: 'Debris/Hazard Scan', icon: Sparkles, color: 'text-sky-400', bg: 'bg-sky-500/5', border: 'border-sky-500/20' },
                      { id: 'location', name: 'Location Agent', role: 'GIS Coordinator', icon: MapPin, color: 'text-teal-400', bg: 'bg-teal-500/5', border: 'border-teal-500/20' },
                      { id: 'impact', name: 'Impact Agent', role: 'Cascade Modeler', icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/5', border: 'border-rose-500/20' },
                      { id: 'response', name: 'Response Agent', role: 'Tactical Planner', icon: ClipboardCheck, color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
                      { id: 'coordinator', name: 'Coordinator Agent', role: 'Rescue Dispatcher', icon: ArrowLeftRight, color: 'text-purple-400', bg: 'bg-purple-500/5', border: 'border-purple-500/20' },
                      { id: 'commander', name: 'Commander AI', role: 'Strategic Director', icon: ShieldCheck, color: 'text-orange-400', bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
                    ].map((ag) => {
                      const agentOutput = investigation?.agents?.[ag.id as keyof typeof investigation.agents];
                      const isAgentActive = investigating && activeAgentId === ag.id;
                      const isAgentCompleted = !investigating || (agentOutput && agentOutput.status === 'Completed');

                      return (
                        <div 
                          key={ag.id} 
                          className={`p-3 border rounded-xl flex flex-col justify-between h-28 transition-all shadow-2xs ${
                            isAgentActive 
                              ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.15)] scale-[1.02]' 
                              : isAgentCompleted 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                : 'bg-white/5 border-white/5 opacity-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className={`p-1.5 rounded-lg bg-white/5 ${ag.color}`}>
                              <ag.icon className="h-3.5 w-3.5" />
                            </div>
                            <span className={`text-[8px] font-mono font-bold uppercase ${
                              isAgentActive 
                                ? 'text-orange-400 animate-pulse' 
                                : isAgentCompleted 
                                  ? 'text-emerald-400' 
                                  : 'text-slate-500'
                            }`}>
                              {isAgentActive ? 'RUNNING' : isAgentCompleted ? 'COMPLETE' : 'PENDING'}
                            </span>
                          </div>

                          <div className="space-y-0.5 text-left mt-2">
                            <span className="text-[10px] font-bold text-white block truncate">{ag.name}</span>
                            <span className="text-[8px] text-slate-400 font-mono block truncate">{ag.role}</span>
                          </div>

                          <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 mt-1 pt-1 border-t border-white/5">
                            <span>Conf: {isAgentCompleted && agentOutput ? `${agentOutput.confidenceScore}%` : '-'}</span>
                            <span>Time: {isAgentCompleted && agentOutput ? `${agentOutput.executionTimeMs}ms` : '-'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Split View: Console & Briefing */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Retro Console / Terminal Logs */}
                    <div className="lg:col-span-5 flex flex-col h-[400px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative shadow-inner text-slate-200">
                      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
                        <span className="text-[9px] font-mono text-slate-300 flex items-center gap-1.5 uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Core Cognitive Audit Logs
                        </span>
                        <span className="text-[8px] font-mono text-slate-600">UTC-6 SECURITY CHANNELS</span>
                      </div>

                      {/* Monospaced Body */}
                      <div className="flex-1 p-4 overflow-y-auto font-mono text-[10px] space-y-2 scrollbar-thin select-text text-left">
                        {replayStepsList.length === 0 && (
                          <div className="text-slate-500 italic">Initializing satellite uplink channels...</div>
                        )}
                        {replayStepsList.map((step, idx) => {
                          if (!step) return null;
                          const stepTimestamp = step.timestamp || new Date().toISOString();
                          const timeStr = new Date(stepTimestamp).toLocaleTimeString([], { hour12: false });
                          let lineClass = 'text-slate-300';
                          let prefix = 'LOG';

                          if (step.type === 'thought') {
                            lineClass = 'text-orange-300 italic';
                            prefix = 'THOUGHT';
                          } else if (step.type === 'action') {
                            lineClass = 'text-sky-300 font-bold';
                            prefix = 'ACTION';
                          } else if (step.type === 'finding') {
                            lineClass = 'text-emerald-300 font-semibold';
                            prefix = 'FIND';
                          } else if (step.type === 'error') {
                            lineClass = 'text-rose-300 font-bold';
                            prefix = 'ERR';
                          }

                          return (
                            <div key={idx} className={`leading-relaxed border-b border-slate-800/50 pb-1 hover:bg-slate-800/40 transition-colors ${lineClass}`}>
                              <span className="text-slate-500 mr-1.5">[{timeStr}]</span>
                              <span className="text-slate-400 mr-1.5">[{prefix}]</span>
                              <span>{step.message}</span>
                            </div>
                          );
                        })}
                        <div ref={terminalEndRef} />
                      </div>
                    </div>

                    {/* Executive Assessment Briefing */}
                    <div className="lg:col-span-7 flex flex-col">
                      {investigating && replayStepsList.length < 12 ? (
                        <div className="flex-1 p-6 bg-[#0a0c12] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 h-[400px]">
                          <div className="h-10 w-10 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Commander Synthesis in Progress</h4>
                            <p className="text-[10px] text-slate-400">Wait for the ResQ Commander to synthesize inputs and authorize the civic dispatch.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 p-5 bg-[#0a0c12] border border-white/5 rounded-2xl space-y-4 h-[400px] overflow-y-auto scrollbar-thin text-left shadow-2xs">
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="h-4 w-4 text-orange-400" />
                              <span className="text-xs font-bold text-white uppercase font-display tracking-wider">Commander Executive Briefing</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono">
                              <span className="text-slate-400">SEVERITY:</span>
                              <span className="text-rose-400 font-black">{investigation?.severityScore}/10</span>
                            </div>
                          </div>

                          <div className="space-y-4 text-xs">
                            <div>
                              <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">Investigation Executive Verdict</span>
                              <p className="text-slate-300 mt-1 leading-relaxed bg-[#0e111a] p-3 border border-white/5 rounded-xl font-sans shadow-2xs">
                                {investigation?.orchestratorSummary}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-[#0e111a] p-3 border border-white/5 rounded-xl space-y-1 shadow-2xs">
                                <span className="text-[8.5px] font-mono uppercase text-slate-400 block font-bold">Root Cause Analysis</span>
                                <p className="text-slate-300 leading-normal text-[11px] font-sans">
                                  {investigation?.rootCauseAnalysis || 'Corrosion and material structural breakdown verified via visual scan and spatial age databases.'}
                                </p>
                              </div>
                              <div className="bg-[#0e111a] p-3 border border-white/5 rounded-xl space-y-1 shadow-2xs">
                                <span className="text-[8.5px] font-mono uppercase text-slate-400 block font-bold">Community Impact Matrix</span>
                                <p className="text-slate-300 leading-normal text-[11px] font-sans">
                                  {investigation?.communityImpact || 'Significant pedestrian traffic degradation. Estimated ~1,450 local residents directly affected.'}
                                </p>
                              </div>
                            </div>

                            <div className="bg-[#0e111a] p-3 border border-white/5 rounded-xl shadow-2xs">
                              <span className="text-[8.5px] font-mono uppercase text-orange-400 block font-bold">Follow-Up suggestions</span>
                              <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-400 text-[11px] font-sans pl-1">
                                {investigation?.followUpSuggestions.map((item, idx) => (
                                  <li key={idx} className="leading-relaxed">{item}</li>
                                )) || (
                                  <>
                                    <li>Schedule physical verification audit with public works team.</li>
                                    <li>Install temporary hazard warning flags surrounding fault block.</li>
                                  </>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deep Agent JSON Payload Explorer */}
                  {!investigating && investigation && (
                    <div className="p-5 bg-[#0a0c12] border border-white/5 rounded-2xl space-y-4 text-left shadow-2xs">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                        <Compass className="h-4 w-4 text-orange-400 animate-pulse" />
                        <span className="text-xs font-bold text-white uppercase font-display tracking-wider">Deep Agent Output telemetry Explorer</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Click on any agent block to inspect the precise structured JSON output generated by their independent processing functions.</p>

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                        {[
                          { id: 'forecast', name: 'Forecast Agent' },
                          { id: 'vision', name: 'Vision Agent' },
                          { id: 'location', name: 'Location Agent' },
                          { id: 'impact', name: 'Impact Agent' },
                          { id: 'response', name: 'Response Agent' },
                          { id: 'coordinator', name: 'Coordinator Agent' }
                        ].map((ag) => (
                          <button
                            key={ag.id}
                            type="button"
                            onClick={() => setExpandedAgent(expandedAgent === ag.id ? null : ag.id)}
                            className={`px-3 py-2 border rounded-xl text-[10px] font-mono font-bold transition-all text-center flex items-center justify-between cursor-pointer ${
                              expandedAgent === ag.id 
                                ? 'bg-orange-500/10 border-orange-500 text-orange-400' 
                                : 'bg-[#030408] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span>{ag.name}</span>
                            <span>{expandedAgent === ag.id ? '▼' : '▶'}</span>
                          </button>
                        ))}
                      </div>

                      <AnimatePresence>
                        {expandedAgent && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden bg-[#030408] border border-white/5 rounded-xl font-mono text-[10px]"
                          >
                            <div className="p-3 border-b border-white/5 bg-[#0a0c12]/50 text-slate-400 flex justify-between items-center">
                              <span>Structured JSON Payload for: <strong className="font-bold text-slate-300">{expandedAgent.toUpperCase()}_AGENT</strong></span>
                              <span className="text-[8px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full font-bold">200 OK</span>
                            </div>
                            <pre className="p-4 overflow-x-auto text-emerald-400 max-h-72 scrollbar-thin text-left select-text bg-[#010204]">
                              {JSON.stringify(investigation.agents[expandedAgent as keyof typeof investigation.agents], null, 2)}
                            </pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: RECOMMENDED ACTIONS */}
          {activeTab === 'action' && (
            <motion.div 
              key="action"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              <div className="text-left space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-display uppercase tracking-wider">
                  <ClipboardCheck className="h-4 w-4 text-orange-500" />
                  Prescribed Action Blueprint Checklist
                </h4>
                <p className="text-[10px] text-slate-400">Mark complete to document civic resolution steps in the chronological ledger.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedIssue.recommendedActions.map((act, idx) => {
                  const isDone = actionsCompleted[act] || false;
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleAction(act)}
                      className={`p-4 border rounded-2xl cursor-pointer flex items-start gap-3.5 transition select-none shadow-2xs ${
                        isDone 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-[#030408] border-white/5 hover:border-orange-500/30 text-slate-300'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        <div className={`h-4.5 w-4.5 rounded-lg border flex items-center justify-center transition-all ${
                          isDone 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-white/10 bg-[#0a0c12]'
                        }`}>
                          {isDone && <CheckCircle className="h-3.5 w-3.5 fill-emerald-500 stroke-white" />}
                        </div>
                      </div>
                      <div className="leading-tight">
                        <h5 className={`text-xs font-bold ${isDone ? 'line-through text-emerald-400/80' : 'text-white'}`}>Action Step {idx + 1}</h5>
                        <p className={`text-[10.5px] mt-1.5 leading-relaxed ${isDone ? 'line-through text-slate-500' : 'text-slate-300'}`}>{act}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 5: DISCUSSION */}
          {activeTab === 'discussion' && (
            <motion.div 
              key="discussion"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
                     {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} className="space-y-3 max-w-2xl">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-400 block">Post discussion payload to mission ledger</span>
                <div className="flex gap-2.5 items-end">
                  <div className="flex-1 bg-[#0e111a] border border-white/5 focus-within:border-orange-500 rounded-2xl p-2.5 transition shadow-2xs">
                    <textarea 
                      placeholder="Input report verification details, physical crew findings, or neighborhood notes..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none resize-none font-medium"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={submittingComment || !newComment.trim()}
                    className="h-10 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition shadow-md shadow-orange-500/10"
                  >
                    <Send className="h-3 w-3" />
                    <span>Send</span>
                  </button>
                </div>
              </form>

              {/* Comments Feed list */}
              <div className="space-y-4 max-w-2xl pt-2">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-400 block border-b border-white/5 pb-2">Active Sentinel Logs ({selectedIssue.comments?.length || 0})</span>
                
                {selectedIssue.comments && selectedIssue.comments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedIssue.comments.map((cmt) => (
                      <div key={cmt.id} className="p-4 bg-[#0e111a] border border-white/5 rounded-2xl space-y-2 text-left shadow-2xs">
                        <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white block">{cmt.user}</span>
                            <span className="text-slate-400 text-[8px] font-mono block">({cmt.userEmail})</span>
                          </div>
                          <span className="text-slate-400 block">{new Date(cmt.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed pt-1">{cmt.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-[11px] font-mono bg-white/5 border border-dashed border-white/10 rounded-2xl">
                    No active discussion markers registered. Start the verification conversation below.
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* TAB 6: AUDIT HISTORY */}
          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              <div className="text-left space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-display uppercase tracking-wider">
                  <History className="h-4 w-4 text-orange-500" />
                  Mission Chronology Ledger
                </h4>
                <p className="text-[10px] text-slate-400">Verifiable sequential log of status shifts, AI inspections, and worker dispatches.</p>
              </div>

              <div className="space-y-4 relative pl-3.5 border-l border-white/5 ml-2.5 pt-2 max-w-2xl">
                {selectedIssue.timeline && selectedIssue.timeline.map((event, idx) => {
                  const isAI = event.actor === 'Civic AI';
                  return (
                    <div key={idx} className="relative space-y-1 text-left">
                      {/* Node point */}
                      <div className={`absolute left-0 -translate-x-[20px] h-3.5 w-3.5 rounded-full border border-white/5 flex items-center justify-center bg-[#05060a] z-10`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${isAI ? 'bg-orange-500' : 'bg-slate-500'}`}></div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono leading-none text-slate-400">
                        <span className="font-bold text-slate-300">{event.actor}</span>
                        <span>•</span>
                        <span className="text-[8.5px] uppercase font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/10">
                          {event.status}
                        </span>
                        <span>•</span>
                        <span>{event && event.timestamp ? new Date(event.timestamp).toLocaleString() : new Date().toLocaleString()}</span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        {event.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
