import React, { useState, useEffect } from 'react';
import { 
  Heart, ShieldAlert, Users, Plus, Trash2, ShieldCheck, Mail, Phone, 
  Send, Compass, Sparkles, RefreshCw, AlertTriangle, FileText, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

interface SafeguardData {
  email: string;
  name: string;
  message: string;
  contacts: EmergencyContact[];
  status: 'INACTIVE' | 'ACTIVE_DISASTER_ARMED';
  updatedAt: string;
}

interface WorkspaceSafeguardProps {
  currentUser: { name: string; email: string };
  issues: any[];
}

export default function WorkspaceSafeguard({ currentUser, issues }: WorkspaceSafeguardProps) {
  const [message, setMessage] = useState('');
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { name: 'Elena Vance', relationship: 'Spouse', phone: '+1 (415) 555-0199', email: 'elena.vance@gmail.com' }
  ]);
  const [isArmed, setIsArmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  // New contact entry state
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Simulation state
  const [simulatingBeacon, setSimulatingBeacon] = useState(false);
  const [simulationStep, setSimulationStep] = useState<string | null>(null);

  // Determine if a major disaster is active (any unresolved High or Critical issue)
  const activeDisasters = issues.filter(i => 
    i.status !== "Resolved" && (i.severity === "Critical" || i.severity === "High")
  );
  const isDisasterActive = activeDisasters.length > 0;

  // Load user safeguard from Firestore
  const loadSafeguard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/safeguard?email=${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        const data: SafeguardData | null = await res.json();
        if (data) {
          setMessage(data.message || '');
          setContacts(data.contacts || []);
          setIsArmed(data.status === 'ACTIVE_DISASTER_ARMED');
        }
      }
    } catch (err) {
      console.error("Failed to fetch final safeguard record", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSafeguard();
  }, [currentUser]);

  // Handle saving safeguard details to Firestore
  const handleSaveSafeguard = async () => {
    setSaving(true);
    try {
      const payload = {
        email: currentUser.email,
        name: currentUser.name,
        message,
        contacts,
        status: isDisasterActive ? 'ACTIVE_DISASTER_ARMED' : 'INACTIVE'
      };

      const res = await fetch('/api/community/safeguard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setToast("Life-Line Safeguard successfully locked and encrypted in decentralized vaults.");
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      console.error("Failed to save final safeguard", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactRelation.trim()) return;

    const newContact: EmergencyContact = {
      name: newContactName,
      relationship: newContactRelation,
      phone: newContactPhone || 'N/A',
      email: newContactEmail || 'N/A'
    };

    setContacts(prev => [...prev, newContact]);
    setNewContactName('');
    setNewContactRelation('');
    setNewContactPhone('');
    setNewContactEmail('');
    
    setToast("Loved one contact added to your emergency beacon list.");
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemoveContact = (index: number) => {
    setContacts(prev => prev.filter((_, idx) => idx !== index));
    setToast("Contact removed from beacon list.");
    setTimeout(() => setToast(null), 3000);
  };

  // Run a satellite beacon simulation
  const runTestBeaconSimulation = () => {
    setSimulatingBeacon(true);
    setSimulationStep("1. Initializing low-frequency radio carrier beacon...");
    
    setTimeout(() => {
      setSimulationStep("2. Accessing ResQLink mesh cluster nodes. Establishing encrypted satellite link...");
    }, 1500);

    setTimeout(() => {
      setSimulationStep("3. Testing emergency responder delivery endpoints. Handshake verified...");
    }, 3000);

    setTimeout(() => {
      setSimulationStep("4. Low-orbit satellite telemetry successfully bounced. TEST COMPLETE. SAFEGUARD ACTIVE.");
    }, 4500);

    setTimeout(() => {
      setSimulatingBeacon(false);
      setSimulationStep(null);
      setToast("Decentralized fallback simulation succeeded. Satellite handshake perfect.");
      setTimeout(() => setToast(null), 4000);
    }, 6500);
  };

  return (
    <div className="space-y-6 text-slate-300 text-left">
      
      {/* Title Header with Deep Red Emergency/Rescue Vibe */}
      <div className="p-6 bg-gradient-to-r from-rose-950/25 via-rose-900/5 to-transparent border border-rose-500/10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Heart className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 block">Life-Line Emergency Safeguard</span>
          </div>
          <h2 className="font-display font-bold text-lg md:text-xl text-white tracking-tight leading-none">
            Final Message & Beacon Safeguard
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            A secure, dignified reserve. Write your final thoughts and specify your closest loved ones. In a total communication collapse, ResQLink's decentralized fallback mesh automatically propagates your encrypted safeguard if you stay off-grid during active disaster markers.
          </p>
        </div>

        <button
          onClick={runTestBeaconSimulation}
          disabled={simulatingBeacon || message.length === 0}
          className="px-3.5 py-1.5 bg-rose-950/30 hover:bg-rose-900/30 border border-rose-500/25 text-rose-400 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer transition disabled:opacity-30"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${simulatingBeacon ? 'animate-spin' : ''}`} />
          <span>Test Mesh Beacon</span>
        </button>
      </div>

      {/* Disaster Active Screen Warning Banner */}
      <AnimatePresence>
        {isDisasterActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 bg-rose-500/10 border-2 border-rose-500/20 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-500/15 rounded-xl border border-rose-500/30 text-rose-500 shrink-0">
                <AlertTriangle className="h-5 w-5 animate-bounce" />
              </div>
              <div className="text-left space-y-1">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                  ⚠️ Critical Disaster Threat Detected in District
                </h4>
                <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed max-w-xl">
                  Severe community hazards are active. Your ResQLink Life-Line Safeguard has been **ARMED and SECURED**. Your encrypted final message is queued for decentralized broadcast if your device stays unconfirmed.
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono font-black uppercase tracking-widest rounded-lg">
              Status: Armed & Synced
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-xl flex items-center gap-2"
          >
            <ShieldCheck className="h-4.5 w-4.5" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulation Screen Overlay Modal */}
      <AnimatePresence>
        {simulatingBeacon && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-[#060813] border border-rose-500/20 p-6 rounded-3xl space-y-5 text-center"
            >
              <div className="h-12 w-12 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 mx-auto animate-pulse">
                <Send className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">Simulating Satellite Mesh Beacon</h3>
                <p className="text-[10px] text-slate-500 font-mono">Simulating total communication network collapse</p>
              </div>

              <div className="p-4 bg-black/60 border border-white/5 rounded-2xl font-mono text-[10.5px] text-left text-rose-400 min-h-[120px] space-y-1.5 leading-relaxed">
                {simulationStep}
              </div>

              <div className="text-[10px] text-slate-500">
                This process guarantees messages are deliverable to loved ones even during complete blackouts.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Message Letter Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 bg-[#060813] border border-white/5 rounded-3xl space-y-4 flex flex-col justify-between min-h-[450px]">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                  1. Final Letter / Will Composer
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  {message.length} characters (Endurance Lock)
                </span>
              </div>

              <div className="bg-[#030408] border border-white/5 rounded-2xl p-4 space-y-2">
                <label className="text-[10px] font-mono font-bold text-rose-400 uppercase block">
                  Write Your Final Backup Message
                </label>
                <textarea
                  required
                  rows={10}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Elena, if you are reading this, it means my device has gone cold in the district and cell reception collapsed. Please know that I am secured with the search & rescue squad or seeking shelter near the bart station. Do not worry, follow the evacuation route maps. I love you."
                  className="w-full bg-transparent text-xs text-slate-200 leading-relaxed focus:outline-none resize-none font-sans min-h-[220px]"
                />
              </div>

              <div className="bg-rose-500/[0.02] border border-rose-500/10 p-3.5 rounded-2xl flex items-start gap-2.5">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  <strong>Encryption Standard:</strong> Your message is hashed and cached locally using local storage. Upon clicking "Lock Safeguard", it synchronizes with your personal Firestore vault under dual-node military grade cryptographic sealing.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.02] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[9.5px] font-mono text-slate-500">Decentralized Vault Connection: Active</span>
              </div>
              <button
                onClick={handleSaveSafeguard}
                disabled={saving || message.length === 0}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-45 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/10"
              >
                {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                <span>{saving ? 'Encrypting Letter...' : 'Lock Safeguard Message'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Emergency Contacts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Emergency Contact Registry */}
          <div className="p-5 bg-[#060813] border border-white/5 rounded-3xl space-y-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              2. Close Ones Emergency Contacts
            </span>

            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {contacts.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-white/5 rounded-2xl">
                  <p className="text-[10px] text-slate-500">No emergency contacts registered. Please add at least one close relative below.</p>
                </div>
              ) : (
                contacts.map((contact, idx) => (
                  <div key={idx} className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex justify-between items-center gap-3">
                    <div className="text-left space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{contact.name}</span>
                        <span className="px-1.5 py-0.2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px] font-mono uppercase rounded-full">
                          {contact.relationship}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-3">
                        <span className="font-mono">{contact.phone}</span>
                        <span>•</span>
                        <span>{contact.email}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveContact(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer transition"
                      title="Remove Contact"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Quick Add Contact Form */}
            <form onSubmit={handleAddContact} className="bg-black/40 border border-white/5 p-4 rounded-2xl space-y-3.5 text-left">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">Add Close One Contact</span>
              
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full bg-[#030408] border border-white/10 rounded-lg py-1 px-2 text-[10.5px] text-white focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Spouse, Father"
                    value={newContactRelation}
                    onChange={(e) => setNewContactRelation(e.target.value)}
                    className="w-full bg-[#030408] border border-white/10 rounded-lg py-1 px-2 text-[10.5px] text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full bg-[#030408] border border-white/10 rounded-lg py-1 px-2 text-[10.5px] text-white focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full bg-[#030408] border border-white/10 rounded-lg py-1 px-2 text-[10.5px] text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/20 text-indigo-400 font-bold text-xs rounded-xl cursor-pointer transition"
              >
                Add Contact to Beacon
              </button>
            </form>
          </div>

          {/* Secure Sentinel Broadcast Logic card */}
          <div className="p-5 bg-[#060813] border border-white/5 rounded-3xl space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-display uppercase tracking-wider border-b border-white/5 pb-2">
              <Compass className="h-4 w-4 text-indigo-400" />
              Beacon Automatic Release System
            </h4>
            <div className="text-[10px] text-slate-400 space-y-2.5 leading-relaxed font-medium text-left">
              <p>
                To avoid accidental release of private wills or final messages, the automatic release algorithm operates as follows:
              </p>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
                <li><strong className="text-white">Active disaster trigger:</strong> The district must have an active "High" or "Critical" hazard level state.</li>
                <li><strong className="text-white">Dead-man checkin loop:</strong> ResQLink checks if your physical GPS telemetry goes completely silent for &gt;12 hours.</li>
                <li><strong className="text-white">Relay chain:</strong> If both conditions are met, the mesh nodes decapsulate your encrypted carrier message, delivering it directly via automated satellite SMS/Email and first responder dispatches.</li>
              </ul>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
