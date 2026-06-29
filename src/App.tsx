import React, { useState, useEffect } from 'react';
import { CivicIssue, IssueStatus } from './types';
import { 
  LayoutDashboard, Map, ShieldAlert, HeartPulse, FileText, Sparkles, 
  Settings, Menu, X, ChevronLeft, ChevronRight, Cpu, Radio, Sliders, User,
  Truck, Users, TrendingUp, ShieldCheck, Bell, Newspaper, WifiOff
} from 'lucide-react';

import AICopilotPanel from './components/AICopilotPanel';
import AIExecutionEngine from './components/AIExecutionEngine';
import WorkspaceCommandCenter from './components/WorkspaceCommandCenter';
import WorkspaceMap from './components/WorkspaceMap';
import WorkspaceInvestigations from './components/WorkspaceInvestigations';
import WorkspaceHealth from './components/WorkspaceHealth';
import WorkspaceReports from './components/WorkspaceReports';
import WorkspaceInsights from './components/WorkspaceInsights';
import WorkspaceMutualAid from './components/WorkspaceMutualAid';
import WorkspaceSafeguard from './components/WorkspaceSafeguard';
import WorkspaceAIAgents from './components/WorkspaceAIAgents';
import WorkspaceResourceHub from './components/WorkspaceResourceHub';
import WorkspaceAlerts from './components/WorkspaceAlerts';
import PremiumAuth from './components/PremiumAuth';
import DisasterNews from './components/DisasterNews';
import WorkspaceOfflineChat from './components/WorkspaceOfflineChat';

import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<string>("Mission Control");
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('resqlink_auth') === 'true';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const savedName = localStorage.getItem('resqlink_user_name');
    const savedEmail = localStorage.getItem('resqlink_user_email');
    return {
      name: savedName || "Coordinator",
      email: savedEmail || "coordinator@resqlink.ai"
    };
  });

  // Sidebar sizing & collapsible states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [copilotWidth, setCopilotWidth] = useState(() => {
    const saved = localStorage.getItem('resqlink_copilot_width');
    return saved ? parseInt(saved, 10) : 340;
  });

  const [engineWidth, setEngineWidth] = useState(() => {
    const saved = localStorage.getItem('resqlink_engine_width');
    return saved ? parseInt(saved, 10) : 320;
  });

  const [copilotExpanded, setCopilotExpanded] = useState(() => {
    const saved = localStorage.getItem('resqlink_copilot_expanded');
    return saved !== 'false';
  });

  const [engineExpanded, setEngineExpanded] = useState(() => {
    const saved = localStorage.getItem('resqlink_engine_expanded');
    return saved !== 'false';
  });

  const [isResizingCopilot, setIsResizingCopilot] = useState(false);
  const [isResizingEngine, setIsResizingEngine] = useState(false);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('resqlink_copilot_width', copilotWidth.toString());
  }, [copilotWidth]);

  useEffect(() => {
    localStorage.setItem('resqlink_engine_width', engineWidth.toString());
  }, [engineWidth]);

  useEffect(() => {
    localStorage.setItem('resqlink_copilot_expanded', copilotExpanded.toString());
  }, [copilotExpanded]);

  useEffect(() => {
    localStorage.setItem('resqlink_engine_expanded', engineExpanded.toString());
  }, [engineExpanded]);

  // Window Resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingCopilot) {
        const newWidth = Math.max(260, Math.min(480, e.clientX));
        setCopilotWidth(newWidth);
      } else if (isResizingEngine) {
        const newWidth = Math.max(240, Math.min(450, window.innerWidth - e.clientX));
        setEngineWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingCopilot(false);
      setIsResizingEngine(false);
    };

    if (isResizingCopilot || isResizingEngine) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingCopilot, isResizingEngine]);

  const handleAuthSuccess = (user: { name: string; email: string }) => {
    localStorage.setItem('resqlink_auth', 'true');
    localStorage.setItem('resqlink_user_name', user.name);
    localStorage.setItem('resqlink_user_email', user.email);
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('resqlink_auth');
    setIsAuthenticated(false);
  };

  // Listen to profile updates from settings modal in real-time
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.name && customEvent.detail.email) {
        setCurrentUser({
          name: customEvent.detail.name,
          email: customEvent.detail.email
        });
      }
    };
    window.addEventListener('resqlink_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('resqlink_profile_updated', handleProfileUpdate);
  }, []);

  // Global AI Core Task triggers
  const [currentTask, setCurrentTask] = useState<{ type: string; payload?: any } | null>(null);

  // Fetch telemetry records
  const fetchIssues = async (shouldAutoSelect = false) => {
    try {
      const res = await fetch("/api/issues");
      if (res.ok) {
        const data: CivicIssue[] = await res.json();
        setIssues(data);
        
        if (data.length > 0) {
          if (shouldAutoSelect || !selectedIssue) {
            setSelectedIssue(data[0]);
          } else {
            const currentUpdated = data.find(i => i.id === selectedIssue.id);
            if (currentUpdated) {
              setSelectedIssue(currentUpdated);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to sync issues database", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues(true);
    const interval = setInterval(() => fetchIssues(false), 8000);
    return () => clearInterval(interval);
  }, []);

  // Update Status Handler (Simulates Public Works Dispatch)
  const handleUpdateStatus = async (id: string, status: IssueStatus) => {
    try {
      const res = await fetch(`/api/issues/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          workerName: "Inspector Dave (Public Works Division)"
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues(prev => prev.map(issue => (issue.id === id ? updated : issue)));
        setSelectedIssue(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit a brand new civic issue and automatically start an investigation mission!
  const handleCreateIssue = async (reportData: any) => {
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData)
      });
      if (res.ok) {
        const newIssue: CivicIssue = await res.json();
        
        // Refresh full issues database so the new one shows in lists
        await fetchIssues(false);
        
        // Select this new issue immediately
        setSelectedIssue(newIssue);
        
        // Teleport the user to the Investigations Workspace to watch live orchestration
        setActiveWorkspaceView("Missions");
      } else {
        console.error("Failed to submit new issue payload");
      }
    } catch (err) {
      console.error("Network error submitting new issue", err);
    }
  };

  // Trigger automated AI Execution Engine simulations
  const handleTriggerExecution = (taskType: string, payload?: any) => {
    setCurrentTask({ type: taskType, payload });
    // If the task corresponds to a selected issue change, load it
    if (taskType === 'MAP_PIN_CLICKED' && payload?.issueId) {
      const matched = issues.find(i => i.id === payload.issueId);
      if (matched) {
        setSelectedIssue(matched);
      }
    }
  };

  const handleNewMessage = (text: string) => {
    // Dynamic tab switching based on user prompts to feel highly AI-native!
    const query = text.toLowerCase();
    if (query.includes('map') || query.includes('heatmap') || query.includes('cluster')) {
      setActiveWorkspaceView('Live Map');
    } else if (query.includes('health') || query.includes('score') || query.includes('grade')) {
      setActiveWorkspaceView('Risk Forecast');
    } else if (query.includes('report') || query.includes('brief') || query.includes('warrant')) {
      setActiveWorkspaceView('Reports');
    } else if (query.includes('forecast') || query.includes('trend') || query.includes('prediction')) {
      setActiveWorkspaceView('Risk Forecast');
    } else if (query.includes('profile') || query.includes('aid') || query.includes('mutual') || query.includes('community')) {
      setActiveWorkspaceView('Mutual Aid');
    } else if (query.includes('safeguard') || query.includes('final message') || query.includes('loved ones') || query.includes('record')) {
      setActiveWorkspaceView('Life-Line Safeguard');
    } else if (query.includes('news') || query.includes('disaster') || query.includes('bulletin') || query.includes('feed')) {
      setActiveWorkspaceView('Disaster News');
    } else if (query.includes('pothole') || query.includes('waste') || query.includes('water') || query.includes('wire') || query.includes('detail')) {
      setActiveWorkspaceView('Missions');
    }
  };

  const handleImageSelected = (base64: string, mime: string, presetId: string, name: string) => {
    // Switch immediately to Missions to inspect forensic slider outputs!
    setActiveWorkspaceView('Missions');
  };

  const WORKSPACE_VIEWS = [
    { name: "Mission Control", icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
    { name: "AI Agents", icon: <Cpu className="h-4.5 w-4.5" /> },
    { name: "Risk Forecast", icon: <Sparkles className="h-4.5 w-4.5" /> },
    { name: "Live Map", icon: <Map className="h-4.5 w-4.5" /> },
    { name: "Missions", icon: <ShieldAlert className="h-4.5 w-4.5" /> },
    { name: "Resource Hub", icon: <Truck className="h-4.5 w-4.5" /> },
    { name: "Alerts", icon: <Radio className="h-4.5 w-4.5" /> },
    { name: "Reports", icon: <FileText className="h-4.5 w-4.5" /> },
    { name: "Mutual Aid", icon: <Users className="h-4.5 w-4.5" /> },
    { name: "Life-Line Safeguard", icon: <HeartPulse className="h-4.5 w-4.5" /> },
    { name: "Disaster News", icon: <Newspaper className="h-4.5 w-4.5" /> },
    { name: "Offline Mesh Chat", icon: <WifiOff className="h-4.5 w-4.5" /> }
  ];

  const renderWorkspaceView = () => {
    switch (activeWorkspaceView) {
      case "Mission Control":
        return (
          <WorkspaceCommandCenter
            issues={issues}
            onSelectIssue={(iss) => {
              setSelectedIssue(iss);
              setActiveWorkspaceView("Missions");
            }}
            onNavigateToView={(v) => setActiveWorkspaceView(v)}
            onTriggerExecution={handleTriggerExecution}
            onNewMessage={handleNewMessage}
            onSubmitReport={handleCreateIssue}
          />
        );
      case "AI Agents":
        return <WorkspaceAIAgents />;
      case "Live Map":
        return (
          <WorkspaceMap
            issues={issues}
            selectedIssueId={selectedIssue?.id || null}
            onSelectIssue={(iss) => {
              setSelectedIssue(iss);
            }}
            onTriggerExecution={handleTriggerExecution}
            onSubmitReport={handleCreateIssue}
          />
        );
      case "Missions":
        return selectedIssue ? (
          <WorkspaceInvestigations
            selectedIssue={selectedIssue}
            onUpdateStatus={handleUpdateStatus}
            onTriggerExecution={handleTriggerExecution}
            currentUser={currentUser}
            onRefreshIssues={() => fetchIssues(false)}
          />
        ) : (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 font-mono text-xs border border-white/5 rounded-3xl bg-[#0e111a] p-8 text-center max-w-md mx-auto my-12 shadow-sm">
            <ShieldAlert className="h-10 w-10 text-orange-500/80 mb-3" />
            <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-1">No Active Mission Selected</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed mb-4">Awaiting selection payload from map or copilot. Choose an issue from Mission Control or ask the AI to start investigating.</p>
            <button onClick={() => setActiveWorkspaceView("Mission Control")} className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] rounded-lg transition-all shadow-md shadow-orange-500/10 cursor-pointer">Go to Mission Control</button>
          </div>
        );
      case "Reports":
        return selectedIssue ? (
          <WorkspaceReports
            selectedIssue={selectedIssue}
            onTriggerExecution={handleTriggerExecution}
          />
        ) : (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 font-mono text-xs border border-white/5 rounded-3xl bg-[#0e111a] p-8 text-center max-w-md mx-auto my-12 shadow-sm">
            <FileText className="h-10 w-10 text-orange-500/80 mb-3" />
            <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-1">No Active Case Selected</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed mb-4">Select an active investigation to generate printable municipality reports.</p>
            <button onClick={() => setActiveWorkspaceView("Mission Control")} className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] rounded-lg transition-all shadow-md shadow-orange-500/10 cursor-pointer">Go to Mission Control</button>
          </div>
        );
      case "Risk Forecast":
        return <WorkspaceInsights />;
      case "Resource Hub":
        return <WorkspaceResourceHub />;
      case "Alerts":
        return <WorkspaceAlerts />;
      case "Mutual Aid":
        return <WorkspaceMutualAid currentUser={currentUser} />;
      case "Life-Line Safeguard":
        return <WorkspaceSafeguard currentUser={currentUser} issues={issues} />;
      case "Disaster News":
        return <DisasterNews />;
      case "Offline Mesh Chat":
        return <WorkspaceOfflineChat />;
      default:
        return (
          <WorkspaceCommandCenter
            issues={issues}
            onSelectIssue={(iss) => {
              setSelectedIssue(iss);
              setActiveWorkspaceView("Missions");
            }}
            onNavigateToView={(v) => setActiveWorkspaceView(v)}
            onTriggerExecution={handleTriggerExecution}
            onNewMessage={handleNewMessage}
            onSubmitReport={handleCreateIssue}
          />
        );
    }
  };

  if (!isAuthenticated) {
    return <PremiumAuth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#030408] text-slate-100 flex overflow-hidden font-sans">
      
      {/* 1. NARROW SIDEBAR DRAWER (Navigation & Brand logo) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 bg-[#060813] border-r border-white/5 flex flex-col justify-between transform transition-all duration-300 md:translate-x-0 md:static shrink-0 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8.5 w-8.5 bg-indigo-600/20 border border-indigo-500/35 rounded-xl text-indigo-400 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/10 animate-pulse">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              {!sidebarCollapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-left">
                  <h1 className="font-display font-black tracking-wider text-white text-sm leading-none flex items-center gap-1">
                    ResQLink AI
                  </h1>
                  <span className="text-[8.5px] text-blue-400 font-mono font-bold tracking-widest mt-1.5 block uppercase">
                    Predict. Coordinate. Save.
                  </span>
                </motion.div>
              )}
            </div>
            
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
              className="hidden md:block p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white cursor-pointer"
            >
              {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Navigation link deck */}
          <nav className="px-2.5 py-4 space-y-1">
            {WORKSPACE_VIEWS.map((item) => {
              const isActive = activeWorkspaceView === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveWorkspaceView(item.name);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center transition-all duration-150 border border-transparent rounded-xl cursor-pointer ${
                    sidebarCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 gap-3'
                  } ${
                    isActive
                      ? 'bg-indigo-600/15 text-white border-indigo-500/20 font-bold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-indigo-400' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="text-[11.5px] font-semibold tracking-wide">
                      {item.name}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        {!sidebarCollapsed && (
          <div className="p-3 m-3 mt-0 bg-[#0a0c16]/50 border border-white/5 rounded-2xl flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-500/20 shrink-0 font-bold text-xs uppercase">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h4 className="text-[10px] font-bold text-white truncate leading-tight">{currentUser.name}</h4>
                <p className="text-[8px] text-slate-400 truncate mt-0.5 leading-none">{currentUser.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-[9px] font-mono text-rose-400 hover:text-rose-300 hover:underline cursor-pointer pl-2 shrink-0"
              title="Sign Out"
            >
              Exit
            </button>
          </div>
        )}

        {/* System Health Card */}
        {!sidebarCollapsed && (
          <div className="p-3.5 m-3 mt-0 bg-[#0a0c16]/80 border border-white/5 rounded-2xl flex items-center gap-3 shadow-xs shrink-0">
            <div className="h-8 w-8 bg-emerald-500/15 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20 shrink-0">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[9.5px] font-bold text-white uppercase tracking-wider">System Health</h4>
              <p className="text-[8px] text-emerald-400 font-bold truncate mt-0.5">100% Operational</p>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile background shade overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"></div>
      )}

      {/* 2. THREE-PANEL CO-ORDINATED WORKSPACE WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#030408]">
        
        {/* Mobile Header (Sticky top) */}
        <header className="md:hidden bg-[#060813] border-b border-white/5 p-4 flex items-center justify-between shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1 text-slate-400 hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display font-black text-xs tracking-wider text-white">RESQLINK AI</span>
          <div className="w-5 h-5" />
        </header>

        {/* Core three-panel flex column/row body */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* PANEL 1: AI COPILOT BOARD (LEFT COLUMN) */}
          <AnimatePresence initial={false}>
            {copilotExpanded && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: copilotWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{ width: copilotWidth }}
                className="hidden md:block shrink-0 h-full relative overflow-hidden"
              >
                <AICopilotPanel
                  onTriggerExecution={handleTriggerExecution}
                  onNewMessage={handleNewMessage}
                  onImageSelected={handleImageSelected}
                  currentUser={currentUser}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* LEFT RESIZE DRAG HANDLE */}
          {copilotExpanded && (
            <div
              onMouseDown={() => setIsResizingCopilot(true)}
              className="hidden md:block w-1 hover:w-1.5 bg-white/5 hover:bg-indigo-500/25 active:bg-indigo-500/55 cursor-col-resize select-none transition-all h-full z-20 shrink-0 border-r border-white/5 relative group"
            >
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/5 group-hover:bg-indigo-500/40"></div>
            </div>
          )}

          {/* PANEL 2: CENTER WORKSPACE CANVAS (MIDDLE COLUMN) */}
          <section className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto p-6 lg:p-8 bg-[#030408]">
            {/* Collapse Panel Buttons Deck */}
            <div className="hidden md:flex justify-between items-center pb-4 border-b border-white/5 mb-6 shrink-0">
              <button 
                onClick={() => setCopilotExpanded(!copilotExpanded)}
                className="p-1.5 bg-[#0a0c16]/85 hover:bg-[#101323] border border-white/5 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 rounded-lg transition duration-150 cursor-pointer flex items-center justify-center shadow-xs"
                title={copilotExpanded ? "Collapse Commander AI" : "Expand Commander AI"}
              >
                <ChevronLeft className={`h-4.5 w-4.5 transition duration-200 transform ${copilotExpanded ? '' : 'rotate-180'}`} />
              </button>

              <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">
                <Radio className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                <span>WORKSPACE MODULE: {activeWorkspaceView}</span>
              </div>

              <button 
                onClick={() => setEngineExpanded(!engineExpanded)}
                className="p-1.5 bg-[#0a0c16]/85 hover:bg-[#101323] border border-white/5 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 rounded-lg transition duration-150 cursor-pointer flex items-center justify-center shadow-xs"
                title={engineExpanded ? "Collapse Execution Engine" : "Expand Execution Engine"}
              >
                <ChevronRight className={`h-4.5 w-4.5 transition duration-200 transform ${engineExpanded ? '' : 'rotate-180'}`} />
              </button>
            </div>

            {/* Render the selected workspace component */}
            <div className="flex-1">
              {renderWorkspaceView()}
            </div>
          </section>

          {/* RIGHT RESIZE DRAG HANDLE */}
          {engineExpanded && (
            <div
              onMouseDown={() => setIsResizingEngine(true)}
              className="hidden lg:block w-1 hover:w-1.5 bg-white/5 hover:bg-indigo-500/25 active:bg-indigo-500/55 cursor-col-resize select-none transition-all h-full z-20 shrink-0 border-l border-white/5 relative group"
            >
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/5 group-hover:bg-indigo-500/40"></div>
            </div>
          )}

          {/* PANEL 3: REAL-TIME ENGINE STATUS (RIGHT COLUMN) */}
          <AnimatePresence initial={false}>
            {engineExpanded && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: engineWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{ width: engineWidth }}
                className="hidden lg:block shrink-0 h-full border-l border-white/5 bg-[#05060a] relative overflow-hidden"
              >
                <AIExecutionEngine
                  currentTask={currentTask}
                  selectedAssetId={selectedIssue?.id ? (selectedIssue.id === 'iss_001' ? 'sim_pothole' : selectedIssue.id === 'iss_002' ? 'sim_garbage' : selectedIssue.id === 'iss_003' ? 'sim_water' : selectedIssue.id === 'iss_004' ? 'sim_light' : undefined) : undefined}
                  issues={issues}
                  onSelectIssue={(iss) => {
                    setSelectedIssue(iss);
                    setActiveWorkspaceView("Missions");
                  }}
                  onCreateMission={() => {
                    // Triggers the deploy mission callback
                    const customEvent = new CustomEvent('trigger-deploy-mission');
                    window.dispatchEvent(customEvent);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
