import React, { useState, useEffect } from 'react';
import { 
  Truck, ShieldCheck, HeartPulse, Flame, Users, Compass, ShieldAlert, CheckCircle2, 
  Sparkles, RefreshCw, ChevronRight, Activity, Zap, Play, Check, AlertCircle, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ResourceItem {
  id: string;
  name: string;
  total: number;
  active: number;
  standby: number;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface DispatchSquad {
  id: string;
  name: string;
  type: string;
  status: 'In Transit' | 'On Site' | 'Standby';
  incident: string;
  eta: string;
  manpower: number;
}

interface ContactDetails {
  leader: string;
  phone: string;
}

export default function WorkspaceResourceHub() {
  const [resources, setResources] = useState<ResourceItem[]>([
    {
      id: 'ambulances',
      name: 'Paramedic Ambulances',
      total: 20,
      active: 14,
      standby: 6,
      description: 'First responder critical life-support transport squads. Managed by SF General Hospital.',
      icon: HeartPulse,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/5',
      borderColor: 'border-rose-500/20'
    },
    {
      id: 'rescue',
      name: 'Search & Rescue S&R',
      total: 12,
      active: 8,
      standby: 4,
      description: 'Heavy hazard isolation, excavation, and structural collapse containment specialists.',
      icon: Users,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/5',
      borderColor: 'border-indigo-500/20'
    },
    {
      id: 'fire',
      name: 'Heavy Fire Engines',
      total: 25,
      active: 19,
      standby: 6,
      description: 'Chemical response, suppression, and high-pressure utility flood mitigation crews.',
      icon: Flame,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/5',
      borderColor: 'border-orange-500/20'
    },
    {
      id: 'shelter',
      name: 'Emergency Shelter Slots',
      total: 150,
      active: 84,
      standby: 66,
      description: 'Local gymnasiums and disaster shelters converted for temporary displaced housing.',
      icon: Compass,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/5',
      borderColor: 'border-teal-500/20'
    }
  ]);

  const [squads, setSquads] = useState<DispatchSquad[]>([
    { id: 'sq_1', name: 'Squad Alpha', type: 'Paramedic Team', status: 'In Transit', incident: 'Market St. Water Leak (iss_003)', eta: '3 mins', manpower: 4 },
    { id: 'sq_2', name: 'Team Bravo', type: 'Rescue Specialist', status: 'On Site', incident: 'Church St. Hanging Wire (iss_004)', eta: 'Arrived', manpower: 6 },
    { id: 'sq_3', name: 'Task Force 4', type: 'Suppression Crew', status: 'Standby', incident: 'None', eta: '--', manpower: 8 },
    { id: 'sq_4', name: 'Shelter Coordinator C', type: 'Logistics Liaison', status: 'On Site', incident: 'Mission Shelter Intake', eta: 'Arrived', manpower: 3 }
  ]);

  const crewContacts: Record<string, ContactDetails> = {
    ambulances: { leader: "Chief Paramedic Marcus Vance", phone: "+1 (415) 555-0143" },
    rescue: { leader: "Captain Sarah Jenkins", phone: "+1 (415) 555-0177" },
    fire: { leader: "Battalion Chief David Torres", phone: "+1 (415) 555-0125" },
    shelter: { leader: "Director Elaine Vance", phone: "+1 (415) 555-0199" },
    sq_1: { leader: "Sergeant Leo Carter", phone: "+1 (415) 555-0211" },
    sq_2: { leader: "Officer Aisha Diallo", phone: "+1 (415) 555-0233" },
    sq_3: { leader: "Commander Ryan Foster", phone: "+1 (415) 555-0255" },
    sq_4: { leader: "Coordinator Clara Webb", phone: "+1 (415) 555-0277" }
  };

  const [activeIncidents, setActiveIncidents] = useState<{ id: string; title: string }[]>([
    { id: 'iss_003', title: 'Market St. Water Leak (iss_003)' },
    { id: 'iss_002', title: 'Dolores Park Waste Dump (iss_002)' }
  ]);

  const [selectedIncidentId, setSelectedIncidentId] = useState('iss_003');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rebalancing, setRebalancing] = useState(false);
  const [deviceAlerts, setDeviceAlerts] = useState<any[]>([]);

  // Load actual active incidents from DB
  const loadIncidents = async () => {
    try {
      const res = await fetch("/api/issues");
      if (res.ok) {
        const issues = await res.json();
        const activeList = issues
          .filter((i: any) => i.status !== "Resolved")
          .map((i: any) => ({ id: i.id, title: `${i.title} (${i.id})` }));
        
        if (activeList.length > 0) {
          setActiveIncidents(activeList);
          setSelectedIncidentId(activeList[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load active incidents from database", err);
    }
  };

  // Load real transmitted device alerts from Firestore
  const loadDeviceAlerts = async () => {
    try {
      const res = await fetch("/api/resources/alerts");
      if (res.ok) {
        const data = await res.json();
        setDeviceAlerts(data);
      }
    } catch (err) {
      console.error("Failed to fetch device alerts from backend", err);
    }
  };

  useEffect(() => {
    loadIncidents();
    loadDeviceAlerts();

    // Set up a refresh polling loop to keep alerts real-time
    const interval = setInterval(loadDeviceAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDeployResource = async (resId: string) => {
    const resItem = resources.find(r => r.id === resId);
    if (!resItem) return;

    const contact = crewContacts[resId] || { leader: "Dispatch Commander", phone: "+1 (415) 555-0100" };
    const targetIncident = activeIncidents.find(i => i.id === selectedIncidentId)?.title || `Incident ID: ${selectedIncidentId}`;

    setResources(prev => prev.map(res => {
      if (res.id === resId) {
        if (res.standby > 0) {
          const isShelter = res.id === 'shelter';
          const incrementStep = isShelter ? 5 : 1;
          const targetStandby = res.standby - incrementStep;
          if (targetStandby >= 0) {
            return {
              ...res,
              active: res.active + incrementStep,
              standby: targetStandby
            };
          }
        }
      }
      return res;
    }));

    // Post a real, persistent alert to Firestore
    try {
      const alertMsg = `CRITICAL DISPATCH: Deploy immediately to coordinate with responders at ${targetIncident}. Keep channels open.`;
      const response = await fetch("/api/resources/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crewId: resId,
          crewName: resItem.name,
          leaderName: contact.leader,
          leaderPhone: contact.phone,
          message: alertMsg
        })
      });

      if (response.ok) {
        loadDeviceAlerts();
      }
    } catch (err) {
      console.error("Failed to send real-time alert", err);
    }

    setSuccessMessage(`Tactical authorization granted. Alert sent to ${contact.leader}'s device (${contact.phone}).`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleRecallResource = async (resId: string) => {
    const resItem = resources.find(r => r.id === resId);
    if (!resItem) return;

    const contact = crewContacts[resId] || { leader: "Dispatch Commander", phone: "+1 (415) 555-0100" };

    setResources(prev => prev.map(res => {
      if (res.id === resId) {
        if (res.active > 0) {
          const isShelter = res.id === 'shelter';
          const decrementStep = isShelter ? 5 : 1;
          const targetActive = res.active - decrementStep;
          if (targetActive >= 0) {
            return {
              ...res,
              active: targetActive,
              standby: res.standby + decrementStep
            };
          }
        }
      }
      return res;
    }));

    // Post recall alert
    try {
      const alertMsg = `RECALL NOTICE: Return to base depot immediately. Operational stand-down ordered.`;
      const response = await fetch("/api/resources/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crewId: resId,
          crewName: resItem.name,
          leaderName: contact.leader,
          leaderPhone: contact.phone,
          message: alertMsg
        })
      });

      if (response.ok) {
        loadDeviceAlerts();
      }
    } catch (err) {
      console.error("Failed to send recall alert", err);
    }

    setSuccessMessage(`Recall signal transmitted. ${resItem.name} crew returned to depot standby pool.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleDeploySquadToIncident = async (squadId: string) => {
    const squadItem = squads.find(s => s.id === squadId);
    if (!squadItem) return;

    const contact = crewContacts[squadId] || { leader: "Field Liaison", phone: "+1 (415) 555-0200" };
    const targetIncident = activeIncidents.find(i => i.id === selectedIncidentId)?.title || `Incident ID: ${selectedIncidentId}`;

    setSquads(prev => prev.map(sq => {
      if (sq.id === squadId) {
        return {
          ...sq,
          status: 'In Transit',
          incident: targetIncident,
          eta: '6 mins'
        };
      }
      return sq;
    }));

    // Post a real, persistent squad alert to Firestore
    try {
      const alertMsg = `SQUAD REROUTE: Reroute tactical force ${squadItem.name} immediately to secure perimeter at ${targetIncident}.`;
      const response = await fetch("/api/resources/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crewId: squadId,
          crewName: squadItem.name,
          leaderName: contact.leader,
          leaderPhone: contact.phone,
          message: alertMsg
        })
      });

      if (response.ok) {
        loadDeviceAlerts();
      }
    } catch (err) {
      console.error("Failed to post squad alert", err);
    }

    setSuccessMessage(`Squad ${squadItem.name} rerouted. Mobile alert dispatched to ${contact.leader} (${contact.phone}).`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const runRebalancingSimulation = () => {
    if (rebalancing) return;
    setRebalancing(true);
    setSuccessMessage("Analyzing local shelter density, fire department dispatch logs, and hospital ambulance vectors...");

    setTimeout(() => {
      setResources(prev => prev.map(res => {
        const change = res.id === 'shelter' ? 10 : 2;
        return {
          ...res,
          total: res.total + change,
          standby: res.standby + change
        };
      }));
      setSuccessMessage("Resource Replenishment Completed. Added safety buffers to emergency pools.");
      setRebalancing(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 text-slate-300 text-left">
      
      {/* View Header */}
      <div className="flex justify-between items-center bg-[#0a0c12] p-4 border border-white/5 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <Truck className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
          <div>
            <h3 className="font-display font-semibold text-xs text-white">Emergency Resource Hub</h3>
            <span className="text-[9px] text-slate-500 font-mono">Dynamic Dispatch Operations & Equipment Tracking</span>
          </div>
        </div>
        <button
          onClick={runRebalancingSimulation}
          disabled={rebalancing}
          className="p-1.5 bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/20 text-indigo-400 rounded-lg cursor-pointer transition text-[10px] font-mono font-bold flex items-center gap-1.5 disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${rebalancing ? 'animate-spin' : ''}`} />
          <span>Optimize Logistics Pool</span>
        </button>
      </div>

      {/* Deploy alert banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[11px] text-indigo-400 flex items-center gap-2.5 font-medium"
          >
            <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Logistics Supply Matrix (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">Municipal Supply Matrix</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((res) => {
              const Icon = res.icon;
              const percentActive = Math.round((res.active / res.total) * 100);
              const contact = crewContacts[res.id] || { leader: "Unknown Lead", phone: "N/A" };
              
              return (
                <div key={res.id} className="bg-[#060813] border border-white/5 p-4 rounded-3xl space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className={`p-1.5 rounded-lg border shrink-0 ${res.color} ${res.bgColor} ${res.borderColor}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">POOL ID: {res.id.toUpperCase()}</span>
                    </div>
                    <h4 className="font-bold text-xs text-white pt-1">{res.name}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{res.description}</p>
                    
                    {/* Real Mobile Contact Integration */}
                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl flex justify-between items-center text-[10px] gap-2">
                      <div className="text-left shrink-0">
                        <span className="text-slate-500 font-mono block uppercase text-[7.5px] tracking-wider">Crew Leader</span>
                        <span className="text-slate-200 font-semibold">{contact.leader}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-slate-500 font-mono block uppercase text-[7.5px] tracking-wider">Device Phone</span>
                        <span className="text-indigo-400 font-mono font-bold">{contact.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    {/* Visual Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8.5px] font-mono">
                        <span className="text-slate-400">Deployed: {res.active} / {res.total}</span>
                        <span className={res.color}>{percentActive}% Active</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#030408] rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${percentActive}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick deploy/recall controls */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeployResource(res.id)}
                        disabled={res.standby === 0}
                        className="flex-1 py-1.5 bg-[#0a0c16] hover:bg-[#101323] border border-white/5 hover:border-indigo-500/30 text-[9px] font-bold text-white rounded-lg transition-all cursor-pointer disabled:opacity-30"
                      >
                        Deploy Crew
                      </button>
                      <button
                        onClick={() => handleRecallResource(res.id)}
                        disabled={res.active === 0}
                        className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-medium text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30"
                      >
                        Recall Crew
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Dispatch Console & Active Squad Tracker (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dispatch Squad Control */}
          <div className="p-5 bg-[#060813] border border-white/5 rounded-3xl space-y-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">Interactive Squad Dispatcher</span>
            
            <div className="space-y-3 bg-[#030408] border border-white/5 p-4 rounded-2xl">
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 block mb-1.5 uppercase">Select Target Incident</label>
                <select
                  value={selectedIncidentId}
                  onChange={(e) => setSelectedIncidentId(e.target.value)}
                  className="w-full bg-[#060813] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none focus:border-indigo-500"
                >
                  {activeIncidents.map(inc => (
                    <option key={inc.id} value={inc.id}>{inc.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[8.5px] font-mono text-slate-500 leading-relaxed block">
                  Authorizing dispatch will route nearest available task forces to coordinates, sending a high-priority alert directly to the team leader's device.
                </span>
              </div>
            </div>

            {/* Squad List */}
            <div className="space-y-2.5">
              {squads.map(sq => {
                const contact = crewContacts[sq.id] || { leader: "Field Liaison", phone: "N/A" };
                return (
                  <div key={sq.id} className="bg-[#030408] border border-white/5 p-3 rounded-2xl flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">{sq.name}</span>
                          <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                            sq.status === 'On Site' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : sq.status === 'In Transit' 
                                ? 'bg-orange-500/10 text-orange-400 animate-pulse' 
                                : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {sq.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{sq.type} • {sq.manpower} personnel</p>
                        <p className="text-[9px] text-slate-500 truncate max-w-[180px]">Dst: {sq.incident}</p>
                      </div>

                      <button
                        onClick={() => handleDeploySquadToIncident(sq.id)}
                        className="p-1.5 bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/20 text-indigo-400 rounded-lg cursor-pointer text-[10px] font-mono font-bold shrink-0 transition"
                      >
                        Reroute
                      </button>
                    </div>

                    <div className="border-t border-white/5 pt-1.5 flex justify-between items-center text-[9px]">
                      <div className="text-left">
                        <span className="text-slate-500 text-[7px] uppercase font-mono block">Squad Leader</span>
                        <span className="text-slate-300 font-semibold">{contact.leader}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 text-[7px] uppercase font-mono block">Mobile Link</span>
                        <span className="text-indigo-400 font-mono font-bold">{contact.phone}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real Device Alerts Feed Section */}
          <div className="p-5 bg-[#060813] border border-white/5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">📡 Dispatched Device Alerts Feed</span>
              <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-mono text-[8.5px] uppercase tracking-wide font-black">
                {deviceAlerts.length} Sent
              </span>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {deviceAlerts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-white/5 rounded-2xl">
                  <ShieldAlert className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-[10px] font-mono leading-relaxed">No device dispatches recorded in this shift. Click "Deploy Crew" or "Reroute" to alert a team leader's phone.</p>
                </div>
              ) : (
                deviceAlerts.map(alert => (
                  <div key={alert.id} className="p-3 bg-gradient-to-r from-indigo-950/25 to-transparent border border-indigo-500/10 rounded-2xl space-y-1.5 text-left">
                    <div className="flex justify-between items-center text-[8px] font-mono">
                      <span className="text-indigo-400 font-bold">{alert.crewName.toUpperCase()}</span>
                      <span className="text-slate-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[10.5px] text-slate-300 leading-normal font-sans">{alert.message}</p>
                    <div className="flex justify-between items-center text-[9px] border-t border-white/5 pt-1.5 mt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold">{alert.leaderName}</span>
                        <span className="text-slate-500 font-mono">({alert.leaderPhone})</span>
                      </div>
                      <span className="text-emerald-400 font-bold flex items-center gap-1 text-[8.5px] font-mono">
                        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
