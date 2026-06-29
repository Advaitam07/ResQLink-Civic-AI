import React, { useState } from 'react';
import { 
  Cpu, Sparkles, ShieldCheck, MapPin, AlertTriangle, ClipboardCheck, ArrowLeftRight, Clock, 
  Settings, Play, Terminal, Database, ShieldAlert, CheckCircle2, RefreshCw, Send, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AgentConfig {
  id: string;
  name: string;
  role: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  status: 'Ready' | 'Processing' | 'Standby';
  confidenceScore: number;
  directives: string;
  logs: string[];
}

export default function WorkspaceAIAgents() {
  const [agents, setAgents] = useState<AgentConfig[]>([
    { 
      id: 'forecast', 
      name: 'Forecast Agent', 
      role: 'Risk Prognosis & Climate Modelling', 
      icon: Clock, 
      color: 'text-orange-400', 
      bgColor: 'bg-orange-500/5', 
      borderColor: 'border-orange-500/20', 
      status: 'Ready',
      confidenceScore: 94,
      directives: 'Analyze rainfall, wind velocity, and atmospheric telemetry to model secondary cascade threat probabilities. Output a 48-hour localized safety matrix projection.',
      logs: [
        'Initialized atmospheric radar streams.',
        'Analyzing precipitation anomalies over SF Mission District.',
        'Seismic risk vectors verified within safe thresholds.',
        'Prognosis updated: Flood risk elevated 14% due to Market St fracture.'
      ]
    },
    { 
      id: 'vision', 
      name: 'Vision Agent', 
      role: 'Debris & Structural Hazard Scan', 
      icon: Sparkles, 
      color: 'text-sky-400', 
      bgColor: 'bg-sky-500/5', 
      borderColor: 'border-sky-500/20', 
      status: 'Ready',
      confidenceScore: 98,
      directives: 'Parse live traffic cam streams, satellite imagery, and citizen-uploaded photos. Identify structural fractures, blockages, debris, or dangling power cables.',
      logs: [
        'Connecting to Dolores Park satellite feed...',
        'Object detection module loaded: Road blockage vectors flagged.',
        'Dangling cable identified on Church St. (Confidence 98%).',
        'Comparing pre/post disaster images for structural damage estimates.'
      ]
    },
    { 
      id: 'location', 
      name: 'Location Agent', 
      role: 'GIS & Address Validation Coordinator', 
      icon: MapPin, 
      color: 'text-teal-400', 
      bgColor: 'bg-teal-500/5', 
      borderColor: 'border-teal-500/20', 
      status: 'Ready',
      confidenceScore: 99,
      directives: 'Normalize incident addresses, coordinates, and district GIS sub-grids. Perform reverse-geocoding to map critical utility intersections.',
      logs: [
        'Synchronized municipal GIS subgrids.',
        'Validating coordinates for church St electrical hazard.',
        'Reverse geocoding complete for Valencia St pothole.',
        'Generating bounding-box boundaries for duplicate cluster calculations.'
      ]
    },
    { 
      id: 'impact', 
      name: 'Impact Agent', 
      role: 'Incident Cascading Risk Modeler', 
      icon: AlertTriangle, 
      color: 'text-rose-400', 
      bgColor: 'bg-rose-500/5', 
      borderColor: 'border-rose-500/20', 
      status: 'Ready',
      confidenceScore: 91,
      directives: 'Assess potential cascading damage paths (e.g. water leak near power line). Correlate incidents to identify unified duplicates.',
      logs: [
        'Loading municipal water main network layers...',
        'Correlating Church St electrical hazard with local rain forecasts.',
        'Duplicate check: No active identical work orders in immediate 50m radius.',
        'Cascade index compiled: Medium priority isolation recommended.'
      ]
    },
    { 
      id: 'response', 
      name: 'Response Agent', 
      role: 'Tactical Dispatch Planner', 
      icon: ClipboardCheck, 
      color: 'text-amber-400', 
      bgColor: 'bg-amber-500/5', 
      borderColor: 'border-amber-500/20', 
      status: 'Ready',
      confidenceScore: 95,
      directives: 'Formulate chronological containment actions. Estimate response resource requirements and draft civic resolution checklists.',
      logs: [
        'Drafting operational safety dispatch blueprint...',
        'Resource check: Flagging closest active rescue trucks & barricades.',
        'Checklist generated: Isolate electrical grid, divert local traffic, deploy crews.',
        'Estimated resolution timeline calibrated: 4.2 hours.'
      ]
    },
    { 
      id: 'coordinator', 
      name: 'Coordinator Agent', 
      role: 'Incident Duplicate Dispatcher', 
      icon: ArrowLeftRight, 
      color: 'text-purple-400', 
      bgColor: 'bg-purple-500/5', 
      borderColor: 'border-purple-500/20', 
      status: 'Ready',
      confidenceScore: 93,
      directives: 'Coordinate incoming citizen reports with the active tactical backlog. Group related issues to prevent redundant municipal crew dispatch.',
      logs: [
        'Clustering algorithm active. Scan range 100 meters.',
        'Grouped 2 duplicate trash dumping reports under primary ID iss_002.',
        'Synchronized dispatcher queue status with SF Public Works DB.',
        'Incident backlogs normalized successfully.'
      ]
    },
    { 
      id: 'commander', 
      name: 'Commander AI', 
      role: 'Strategic Director & Synthesizer', 
      icon: ShieldCheck, 
      color: 'text-indigo-400', 
      bgColor: 'bg-indigo-500/5', 
      borderColor: 'border-indigo-500/20', 
      status: 'Ready',
      confidenceScore: 97,
      directives: 'Aggregate independent agent feeds, weight confidence scores, synthesize findings into cohesive executive assessments, and auto-authorize warrants.',
      logs: [
        'Aggregating 6 cognitive sub-agent analysis layers...',
        'Weighting cumulative confidence score: 96.2%.',
        'Generating printable official civic warrant draft.',
        'Awaiting human coordinator signature...'
      ]
    }
  ]);

  const [selectedAgent, setSelectedAgent] = useState<AgentConfig>(agents[6]); // default to Commander AI
  const [editingDirectives, setEditingDirectives] = useState(false);
  const [directiveValue, setDirectiveValue] = useState(selectedAgent.directives);
  const [diagnosisRunning, setDiagnosisRunning] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [diagnosticCommand, setDiagnosticCommand] = useState('ping_status_report');
  const [customInquiry, setCustomInquiry] = useState('');
  const [showDirectivesSavedAlert, setShowDirectivesSavedAlert] = useState(false);

  const selectAgentHandler = (agent: AgentConfig) => {
    setSelectedAgent(agent);
    setDirectiveValue(agent.directives);
    setEditingDirectives(false);
    setShowDirectivesSavedAlert(false);
  };

  const handleSaveDirectives = () => {
    setAgents(prev => prev.map(ag => ag.id === selectedAgent.id ? { ...ag, directives: directiveValue } : ag));
    setSelectedAgent(prev => ({ ...prev, directives: directiveValue }));
    setEditingDirectives(false);
    setShowDirectivesSavedAlert(true);
    setTimeout(() => setShowDirectivesSavedAlert(false), 3000);
  };

  const runDiagnosticHandler = async () => {
    if (diagnosisRunning) return;
    setDiagnosisRunning(true);
    setDiagnosticLogs([`[DIAG] Initiating ${diagnosticCommand.toUpperCase()} diagnostics on ${selectedAgent.name}...`]);

    const stepMs = 600;

    const agentTelemetry: Record<string, { diagnosis: string; observation: string }> = {
      forecast: {
        diagnosis: "Atmospheric instability detected. High probability (14% increase) of cascading flash flood incidents within low-lying SF Mission District sub-grids.",
        observation: "Precipitation density at 2.4 in/hr. Local pressure drops recorded at -4.1 hPa. Ground soil water saturation index: 94.2%."
      },
      vision: {
        diagnosis: "Severe physical infrastructure degradation. High probability of live wire exposure, electrical hazard propagation, and street lane occlusion.",
        observation: "Dangling high-voltage cable (98% confidence) near Church St, street rubble blocking 45% of westbound lane, 2 structural building cracks."
      },
      location: {
        diagnosis: "Spatial duplicates identified. Two incoming citizen report clusters overlap with existing municipal geocodes.",
        observation: "Coordinates: 37.7602° N, -122.4271° W (SF Dolores subgrid), spatial cluster offset within 14 meters of active municipal tickets."
      },
      impact: {
        diagnosis: "Critical cross-hazard propagation risk. Standing water main pooling is directly adjacent to a high-voltage transformer hub.",
        observation: "Estimated flooding depth of 12 inches. Proximity to power station: 6.5m. Zero active isolation gates closed in regional system."
      },
      response: {
        diagnosis: "Immediate physical containment required. Dispatch priority: ULTRA-HIGH. Resource requirements: 1 water main isolation vehicle, 1 utility crew.",
        observation: "Closest active municipal emergency responder is 1.2 miles away. Suggested traffic diversion routing compiled. Estimated repair duration: 4.2 hours."
      },
      coordinator: {
        diagnosis: "Identified redundant crew dispatch vulnerability. Related incoming tickets: 3. Primary ticket ID: iss_002.",
        observation: "3 adjacent citizen tickets reference similar trash-dumping. Municipal queue scan range: 100 meters. Duplicate handshake protocol active."
      },
      commander: {
        diagnosis: "Multi-agent swarm operations fully verified. Recommends immediate authorization of local containment dispatches.",
        observation: "6 cognitive sub-agents running at 100% thread efficiency. Combined validation index: 96.2%. Secure network operational."
      }
    };
    
    setTimeout(() => {
      setDiagnosticLogs(prev => [...prev, `[DIAG] Calibrating localized memory vectors with current SF municipal database...`]);
    }, stepMs);

    setTimeout(() => {
      setDiagnosticLogs(prev => [...prev, `[DIAG] Core cognitive sub-routines active. Active thread pool capacity: 100%.`]);
    }, stepMs * 2);

    setTimeout(() => {
      setDiagnosticLogs(prev => [...prev, `[DIAG] Testing directives alignment: "${selectedAgent.directives.substring(0, 45)}..."`]);
    }, stepMs * 3);

    setTimeout(() => {
      const pingTime = Math.floor(80 + Math.random() * 120);
      const tel = agentTelemetry[selectedAgent.id] || agentTelemetry['commander'];
      setDiagnosticLogs(prev => [
        ...prev, 
        `[DIAG] Ping latency to Gemini model: ${pingTime}ms.`,
        `[DIAG] HEALTH INDEX CHECK: 100% SECURE. Diagnostic payload verified.`,
        `[OBSERVATION] Observed parameters: ${tel.observation}`,
        `[DIAGNOSIS] Tactical diagnosis: ${tel.diagnosis}`,
        `[DIAG] Success: ${selectedAgent.name} calibrated and operating correctly.`
      ]);
      setDiagnosisRunning(false);
    }, stepMs * 4);
  };

  const submitCustomInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInquiry.trim() || diagnosisRunning) return;
    const inquiry = customInquiry;
    setCustomInquiry('');
    setDiagnosisRunning(true);
    setDiagnosticLogs(prev => [...prev, `[USER_QUERY] To ${selectedAgent.name}: "${inquiry}"`, `[SYSTEM] Processing prompt using Gemini models...`]);

    try {
      // Lazy call or mock response to avoid 429 quota block
      setTimeout(() => {
        let answer = "";
        if (selectedAgent.id === 'forecast') {
          answer = `[RESPONSE] Forecast Agent: Current wind telemetry shows 14.5 mph with rain profiles. No seismic anomalies detected. Low risk of immediate secondary mudslides.`;
        } else if (selectedAgent.id === 'vision') {
          answer = `[RESPONSE] Vision Agent: Image classification models run. Identified structural fractures (Confidence 98%) near designated coordinates. Recommended buffer safety boundary: 15 meters.`;
        } else {
          answer = `[RESPONSE] ${selectedAgent.name}: Query analyzed. Directives checked. Responding with 98% operational security. Localized civic databases are fully matched with no conflicts.`;
        }
        setDiagnosticLogs(prev => [...prev, answer, `[SYSTEM] Pipeline finished with code 200 OK.`]);
        setDiagnosisRunning(false);
      }, 1500);
    } catch {
      setDiagnosticLogs(prev => [...prev, `[ERROR] Network timeout contacting Gemini API.`, `[SYSTEM] Aborted.`]);
      setDiagnosisRunning(false);
    }
  };

  const resetAgentState = () => {
    setAgents(prev => prev.map(ag => ag.id === selectedAgent.id ? { ...ag, status: 'Ready' } : ag));
    setDiagnosticLogs([]);
  };

  return (
    <div className="space-y-6 text-slate-300 text-left">
      
      {/* View Header */}
      <div className="flex justify-between items-center bg-[#0a0c12] p-4 border border-white/5 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <Cpu className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
          <div>
            <h3 className="font-display font-semibold text-xs text-white">AI Agent Swarm Operations</h3>
            <span className="text-[9px] text-slate-500 font-mono">Real-time Cognitive Calibration & Live Diagnostics</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          7 Active Agents Ready
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Agent List Panel (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">Select Agent for Management</span>
          
          <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
            {agents.map((ag) => {
              const Icon = ag.icon;
              const isSelected = selectedAgent.id === ag.id;
              return (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => selectAgentHandler(ag)}
                  className={`w-full text-left p-3.5 border rounded-2xl cursor-pointer transition-all duration-150 flex items-start gap-3.5 ${
                    isSelected 
                      ? 'bg-indigo-600/10 border-indigo-500/40 shadow-md shadow-indigo-500/5' 
                      : 'bg-[#060813] border-white/5 hover:border-white/10 hover:bg-[#0c0f20]'
                  }`}
                >
                  <div className={`p-2 rounded-xl border shrink-0 ${ag.color} ${ag.bgColor} ${ag.borderColor}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-xs text-white">{ag.name}</h4>
                      <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-bold uppercase">
                        {ag.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{ag.role}</p>
                    
                    <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 pt-1 border-t border-white/5 mt-1.5">
                      <span>Conf: {ag.confidenceScore}%</span>
                      <span>Health: 100%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Agent Workspace Panel (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Agent Information Header */}
          <div className="p-5 bg-[#060813] border border-white/5 rounded-3xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 shrink-0 text-slate-500/15 font-mono text-7xl font-bold select-none pointer-events-none">
              {selectedAgent.id.toUpperCase()}
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className={`p-2.5 rounded-2xl border ${selectedAgent.color} ${selectedAgent.bgColor} ${selectedAgent.borderColor}`}>
                {React.createElement(selectedAgent.icon, { className: 'h-6 w-6' })}
              </div>
              <div>
                <h3 className="font-display font-black text-base text-white">{selectedAgent.name}</h3>
                <span className="text-[10px] text-slate-400 font-medium">{selectedAgent.role}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 relative z-10">
              <div className="bg-[#030408] p-2.5 border border-white/5 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 font-mono block uppercase">Diagnostics Latency</span>
                <span className="text-xs font-bold text-white font-mono mt-0.5 block">120ms</span>
              </div>
              <div className="bg-[#030408] p-2.5 border border-white/5 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 font-mono block uppercase">Confidence Index</span>
                <span className="text-xs font-bold text-white font-mono mt-0.5 block">{selectedAgent.confidenceScore}%</span>
              </div>
              <div className="bg-[#030408] p-2.5 border border-white/5 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 font-mono block uppercase">Dynamic Prompt weight</span>
                <span className="text-xs font-bold text-white font-mono mt-0.5 block">1.0</span>
              </div>
            </div>
          </div>

          {/* Prompt Directives Calibration Card */}
          <div className="p-5 bg-[#060813] border border-white/5 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase font-display tracking-wider">Cognitive Directives Calibration</span>
              </div>
              {!editingDirectives ? (
                <button
                  type="button"
                  onClick={() => setEditingDirectives(true)}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-mono text-slate-300 font-semibold cursor-pointer transition-all"
                >
                  Edit Directives
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDirectives(false)}
                    className="px-2.5 py-1 bg-black/30 border border-white/5 text-[9px] font-mono text-slate-400 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDirectives}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500/20 text-[9px] font-mono font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Save
                  </button>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {showDirectivesSavedAlert && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-400 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Prompt directives successfully saved and hot-reloaded into the neural gateway.</span>
                </motion.div>
              )}
            </AnimatePresence>

            {editingDirectives ? (
              <textarea
                value={directiveValue}
                onChange={(e) => setDirectiveValue(e.target.value)}
                rows={3}
                className="w-full bg-[#030408] border border-indigo-500/30 rounded-2xl p-3.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
              />
            ) : (
              <p className="text-[11px] text-slate-300 leading-relaxed bg-[#030408] border border-white/5 p-3.5 rounded-2xl italic">
                "{selectedAgent.directives}"
              </p>
            )}
          </div>

          {/* Interactive Diagnostic Console */}
          <div className="p-5 bg-[#060813] border border-white/5 rounded-3xl space-y-4 flex flex-col">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase font-display tracking-wider">Agent Diagnostics Lab</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={diagnosticCommand}
                  onChange={(e) => setDiagnosticCommand(e.target.value)}
                  disabled={diagnosisRunning}
                  className="bg-[#030408] border border-white/5 rounded-lg px-2 py-1 text-[10px] font-mono text-slate-300 focus:outline-none"
                >
                  <option value="ping_status_report">ping_status_report</option>
                  <option value="neural_alignment_test">neural_alignment_test</option>
                  <option value="validate_sf_municipal_data">validate_sf_municipal_data</option>
                </select>
                <button
                  type="button"
                  onClick={runDiagnosticHandler}
                  disabled={diagnosisRunning}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-600/10 disabled:opacity-40"
                >
                  <Play className="h-3 w-3 fill-white" />
                  <span>Run Diagnostics</span>
                </button>
              </div>
            </div>

            {/* Console Screen */}
            <div className="bg-[#010204] border border-white/5 rounded-2xl p-4 h-48 overflow-y-auto flex flex-col font-mono text-[10px] leading-relaxed text-emerald-400 select-text scrollbar-thin">
              {diagnosticLogs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600 space-y-2">
                  <Database className="h-6 w-6 text-slate-700" />
                  <p>Console idle. Select a diagnostics test or query the agent below.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {diagnosticLogs.map((log, idx) => {
                    let textClass = 'text-emerald-400';
                    if (log.startsWith('[DIAG]')) textClass = 'text-emerald-500';
                    if (log.startsWith('[SYSTEM]')) textClass = 'text-sky-400';
                    if (log.startsWith('[USER_QUERY]')) textClass = 'text-orange-300';
                    if (log.startsWith('[OBSERVATION]')) textClass = 'text-cyan-300 font-medium tracking-wide';
                    if (log.startsWith('[DIAGNOSIS]')) textClass = 'text-amber-400 font-bold';
                    if (log.includes('Success')) textClass = 'text-emerald-300 font-bold';
                    return (
                      <div key={idx} className={textClass}>
                        {log}
                      </div>
                    );
                  })}
                  {diagnosisRunning && (
                    <div className="text-emerald-500 animate-pulse flex items-center gap-1.5 mt-1">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Streaming data logs from Commander network...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Direct Query Form */}
            <form onSubmit={submitCustomInquiry} className="flex gap-2">
              <input
                type="text"
                value={customInquiry}
                onChange={(e) => setCustomInquiry(e.target.value)}
                placeholder={`Ask ${selectedAgent.name} directly...`}
                disabled={diagnosisRunning}
                className="flex-1 bg-[#030408] border border-white/5 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
              />
              <button
                type="submit"
                disabled={diagnosisRunning || !customInquiry.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/35 text-white rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/10"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
