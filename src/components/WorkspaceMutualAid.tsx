import React, { useState, useEffect } from 'react';
import { 
  Users, HandHelping, AlertCircle, Heart, MapPin, Phone, Mail, 
  Plus, Check, Sparkles, Filter, ShieldCheck, HelpCircle, ArrowRight, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AidRequest {
  id: string;
  title: string;
  description: string;
  type: 'request' | 'offer';
  category: string;
  authorName: string;
  authorEmail: string;
  contactInfo: string;
  location: string;
  status: 'Active' | 'Fulfilled' | 'Cancelled';
  timestamp: string;
}

interface WorkspaceMutualAidProps {
  currentUser: { name: string; email: string };
}

export default function WorkspaceMutualAid({ currentUser }: WorkspaceMutualAidProps) {
  const [aidList, setAidList] = useState<AidRequest[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'request' | 'offer'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'request' | 'offer'>('request');
  const [newCategory, setNewCategory] = useState('Water');
  const [newContact, setNewContact] = useState('');
  const [newLocation, setNewLocation] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = [
    "Water", 
    "Food & Rations", 
    "Medical & First Aid", 
    "Power & Charging", 
    "Shelter & Blankets", 
    "Tools & Extraction", 
    "Other"
  ];

  const fetchAidBoard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/community/aid');
      if (res.ok) {
        const data = await res.json();
        setAidList(data);
      } else {
        throw new Error();
      }
    } catch {
      // High-quality local fallback for initial seed
      setAidList([
        {
          id: "aid_1",
          title: "Need bottled water for elderly neighbors",
          description: "Water pressure has completely dropped near 24th St. Need at least 2 cases of bottled water for elderly couple on 3rd floor. Can pick up.",
          type: "request",
          category: "Water",
          authorName: "Sarah Jenkins",
          authorEmail: "sarah.j@gmail.com",
          contactInfo: "+1 (415) 555-0182",
          location: "24th St & Harrison",
          status: "Active",
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: "aid_2",
          title: "Offering backup generator charging slots",
          description: "Our shop has a diesel generator running. Anyone near Valencia can come plug in phones, medical batteries, or flashlights. 4 open strip plugs available.",
          type: "offer",
          category: "Power & Charging",
          authorName: "Carlos Ramirez",
          authorEmail: "carlos.r@valenciabikes.com",
          contactInfo: "Come direct to Bike Shop on Valencia",
          location: "782 Valencia St",
          status: "Active",
          timestamp: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: "aid_3",
          title: "Extra blankets and wool coats to distribute",
          description: "Clearing out community shelter excess. Have 12 heavy duty emergency wool blankets and several warm coats. Happy to drop off to families.",
          type: "offer",
          category: "Shelter & Blankets",
          authorName: "Aisha Diallo",
          authorEmail: "aisha.d@redcross.org",
          contactInfo: "Radio Channel 4 / Email preferred",
          location: "Dolores Park Pavilion",
          status: "Active",
          timestamp: new Date(Date.now() - 10800000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAidBoard();
  }, []);

  const handleCreateAid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    setSubmitting(true);
    try {
      const bodyPayload = {
        title: newTitle,
        description: newDesc,
        type: newType,
        category: newCategory,
        authorName: currentUser.name,
        authorEmail: currentUser.email,
        contactInfo: newContact || "N/A",
        location: newLocation || "Mission District"
      };

      const res = await fetch('/api/community/aid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        const created = await res.json();
        setAidList(prev => [created, ...prev]);
        setShowAddForm(false);
        setNewTitle('');
        setNewDesc('');
        setNewContact('');
        setNewLocation('');
        setToastMessage(`Successfully posted your ${newType} to the board.`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error("Failed to post aid request", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFulfillAid = async (id: string) => {
    try {
      const res = await fetch(`/api/community/aid/${id}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Fulfilled' })
      });

      if (res.ok) {
        setAidList(prev => prev.map(item => 
          item.id === id ? { ...item, status: 'Fulfilled' } : item
        ));
        setToastMessage("Crisis aid request marked as fulfilled. Thank you for your service!");
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error("Failed to fulfill aid request", err);
    }
  };

  const filteredList = aidList.filter(item => {
    const typeMatch = filterType === 'all' || item.type === filterType;
    const catMatch = filterCategory === 'all' || item.category === filterCategory;
    return typeMatch && catMatch;
  });

  return (
    <div className="space-y-6 text-slate-300 text-left">
      
      {/* Header Panel */}
      <div className="p-6 bg-gradient-to-r from-emerald-950/20 via-emerald-900/5 to-transparent border border-emerald-500/10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HandHelping className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">ResQLink Civic Cooperative</span>
          </div>
          <h2 className="font-display font-bold text-lg md:text-xl text-white tracking-tight leading-none">
            Mutual Aid & Survival Share
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            A meaningful, peer-to-peer dashboard for physical crisis backup. Post what you need, offer what you can, and coordinate neighborhood survival.
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 cursor-pointer transition shadow-lg shadow-emerald-600/10"
        >
          <Plus className="h-4 w-4" />
          <span>Post Aid / Offer</span>
        </button>
      </div>

      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2"
          >
            <ShieldCheck className="h-4.5 w-4.5" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Feed Section (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a0c12] p-3 border border-white/5 rounded-2xl">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5">
                {(['all', 'request', 'offer'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition cursor-pointer ${
                      filterType === t 
                        ? 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/10 font-bold' 
                        : 'text-slate-500 hover:text-slate-300 border border-transparent'
                    }`}
                  >
                    {t === 'all' ? 'All Mutual' : t === 'request' ? 'Needs Help' : 'Offers Support'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-black/40 border border-white/5 text-[10px] font-mono font-bold text-slate-300 rounded-lg py-1 px-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">ALL CATEGORIES</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                ))}
              </select>

              <button
                onClick={fetchAidBoard}
                className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white"
                title="Refresh Board"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Add Request Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateAid}
                className="p-5 bg-[#060813] border border-emerald-500/20 rounded-3xl space-y-4 overflow-hidden"
              >
                <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  Post Neighborhood Support / Crisis Need
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">Post Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewType('request')}
                        className={`flex-1 py-1.5 border rounded-xl text-xs font-bold transition cursor-pointer ${
                          newType === 'request' 
                            ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' 
                            : 'bg-[#030408] border-white/5 text-slate-500'
                        }`}
                      >
                        Request Support (Need)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewType('offer')}
                        className={`flex-1 py-1.5 border rounded-xl text-xs font-bold transition cursor-pointer ${
                          newType === 'offer' 
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                            : 'bg-[#030408] border-white/5 text-slate-500'
                        }`}
                      >
                        Offer Support (Supply)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-[#030408] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">Title / Brief Action</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Needs clean baby formula or Offering charging cables..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#030408] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">Detailed Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide specific details. What quantities? Who is affected? When are you available?"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-[#030408] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">Contact Details</label>
                    <input
                      type="text"
                      placeholder="e.g., Phone number, Radio Channel, or Room #"
                      value={newContact}
                      onChange={(e) => setNewContact(e.target.value)}
                      className="w-full bg-[#030408] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">Physical Location</label>
                    <input
                      type="text"
                      placeholder="e.g., 22nd St between Mission & Valencia"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full bg-[#030408] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs cursor-pointer transition flex items-center gap-1"
                  >
                    {submitting ? 'Posting...' : 'Commit to Board'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Aid List Deck */}
          <div className="space-y-3.5">
            {filteredList.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-white/5 rounded-3xl bg-black/10">
                <Users className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-medium">No mutual aid posts found matching filters.</p>
                <p className="text-[10px] text-slate-600 mt-1">Be the first to offer blankets, food, water, or request urgent resources.</p>
              </div>
            ) : (
              filteredList.map((item) => {
                const isRequest = item.type === 'request';
                const isFulfilled = item.status === 'Fulfilled';

                return (
                  <div 
                    key={item.id} 
                    className={`p-5 bg-[#060813] border rounded-3xl flex flex-col justify-between transition relative overflow-hidden ${
                      isFulfilled 
                        ? 'border-white/5 opacity-50' 
                        : isRequest 
                          ? 'border-rose-500/10 hover:border-rose-500/25' 
                          : 'border-emerald-500/10 hover:border-emerald-500/25'
                    }`}
                  >
                    {/* Status corner badge */}
                    <div className="absolute top-0 right-0 p-3 flex gap-1.5 items-center">
                      <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        isFulfilled 
                          ? 'bg-slate-500/10 text-slate-400' 
                          : isRequest 
                            ? 'bg-rose-500/10 text-rose-400 animate-pulse' 
                            : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {isFulfilled ? 'FULFILLED' : isRequest ? 'NEEDS HELP' : 'OFFERING SUPPORT'}
                      </span>
                      <span className="text-[8.5px] font-mono text-slate-600">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Title & Category */}
                      <div className="text-left space-y-1">
                        <span className="text-[8.5px] font-mono font-extrabold uppercase tracking-widest text-indigo-400 block">
                          Category: {item.category}
                        </span>
                        <h4 className="font-display font-bold text-sm text-white pr-20">{item.title}</h4>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 leading-relaxed font-medium text-left">
                        {item.description}
                      </p>

                      {/* Metadata Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#030408] border border-white/5 p-3 rounded-2xl text-[10.5px]">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Users className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">Contact: <strong>{item.authorName}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">Location: <strong className="text-slate-200">{item.location}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-indigo-400">
                          <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="truncate font-mono font-semibold">{item.contactInfo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {!isFulfilled && (
                      <div className="mt-4 pt-4 border-t border-white/[0.03] flex justify-between items-center">
                        <span className="text-[9.5px] text-slate-500">Posted by {item.authorEmail}</span>
                        <button
                          onClick={() => handleFulfillAid(item.id)}
                          className="px-3.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Mark Fulfilled</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Info Section (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Real-time Community Support Principles */}
          <div className="p-5 bg-[#060813] border border-white/5 rounded-3xl space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-display uppercase tracking-wider border-b border-white/5 pb-2">
              <Heart className="h-4 w-4 text-emerald-400" />
              Cooperative Crisis Principles
            </h4>
            <p className="text-[10.5px] text-slate-400 leading-relaxed font-medium">
              ResQLink's Mutual Aid board routes resources directly to citizens in high-stress disaster grids. Unlike centralized supply lines:
            </p>
            <div className="space-y-3 pt-1 text-[10px] text-slate-300">
              <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl">
                <strong className="text-white block font-bold mb-0.5">1. Direct Peer Exchange</strong>
                Neighbors directly coordinate food dropoffs, blanket sharing, and safety protocols.
              </div>
              <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl">
                <strong className="text-white block font-bold mb-0.5">2. Network Independence</strong>
                Offline sync features propagate this aid registry via Bluetooth mesh if cell towers collapse.
              </div>
              <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl">
                <strong className="text-white block font-bold mb-0.5">3. Verification & Fulfillment</strong>
                Once a package or support is delivered, mark it as fulfilled to clear response resources.
              </div>
            </div>
          </div>

          {/* Live Cooperative Feed Activity */}
          <div className="p-5 bg-[#060813] border border-white/5 rounded-3xl space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-display uppercase tracking-wider border-b border-white/5 pb-2">
              <AlertCircle className="h-4 w-4 text-indigo-400" />
              Active Neighborhood Care
            </h4>
            <div className="space-y-3.5">
              <div className="flex gap-2.5 text-[10px] items-start">
                <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1 shrink-0 animate-ping" />
                <div>
                  <span className="font-semibold text-white block">Mission District Water Hub Active</span>
                  <p className="text-slate-400 text-[9px] mt-0.5">Potable drinking station deployed near Dolores Park. Bring container.</p>
                </div>
              </div>
              <div className="flex gap-2.5 text-[10px] items-start">
                <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                <div>
                  <span className="font-semibold text-white block">Volunteer Medical Team Stationed</span>
                  <p className="text-slate-400 text-[9px] mt-0.5">3 EMTs with bandages & splints positioned near 16th St BART.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
