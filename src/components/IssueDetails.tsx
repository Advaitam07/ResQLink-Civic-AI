import React, { useState } from 'react';
import { CivicIssue, IssueStatus, CivicCategory } from '../types';
import { Calendar, User, MessageSquare, AlertTriangle, Play, CheckCircle2, UserCheck, MessageCircle, ArrowUp, ArrowRight, ShieldAlert, Sparkles, Send, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface IssueDetailsProps {
  issue: CivicIssue;
  onUpdateStatus: (id: string, status: IssueStatus) => void;
  onAddComment: (id: string, text: string) => void;
  currentUser: { name: string; email: string };
  onUpvote: (id: string) => void;
}

export default function IssueDetails({ issue, onUpdateStatus, onAddComment, currentUser, onUpvote }: IssueDetailsProps) {
  const [commentText, setCommentText] = useState("");
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(issue.id, commentText);
    setCommentText("");
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/15';
      case 'In Progress': return 'bg-sky-500/10 text-sky-500 border-sky-500/15';
      case 'Assigned': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/15';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/15';
    }
  };

  const getCategoryColor = (category: CivicCategory) => {
    switch (category) {
      case 'Roads': return 'bg-rose-500';
      case 'Sanitation': return 'bg-amber-500';
      case 'Utilities': return 'bg-sky-500';
      case 'Safety': return 'bg-indigo-500';
      case 'Environment': return 'bg-emerald-500';
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-rose-600 text-white';
      case 'High': return 'bg-rose-500/10 text-rose-500 border border-rose-500/15';
      case 'Medium': return 'bg-amber-500/10 text-amber-500 border border-amber-500/15';
      default: return 'bg-slate-500/10 text-slate-500 border border-slate-500/15';
    }
  };

  const toggleActionCheck = (idx: number) => {
    setCompletedActions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const hasUpvoted = issue.upvotedBy.includes(currentUser.email);

  return (
    <div className="bg-[#0e111a] rounded-2xl border border-white/5 shadow-sm overflow-hidden flex flex-col h-full font-sans">
      
      {/* Top Graphic Header */}
      <div className="relative h-44 bg-slate-900 shrink-0">
        <img
          src={issue.imageUrl || "https://images.unsplash.com/photo-1542397284385-601017642477?auto=format&fit=crop&w=800&q=80"}
          alt={issue.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-2.5 py-0.5 text-[9.5px] font-bold text-white rounded-md uppercase tracking-wide ${getCategoryColor(issue.category)}`}>
            {issue.category}
          </span>
          <span className={`px-2.5 py-0.5 text-[9.5px] font-bold rounded-md uppercase tracking-wide border ${getSeverityStyle(issue.severity)}`}>
            {issue.severity} Severity
          </span>
        </div>
        
        <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[9px] font-mono font-bold text-slate-300 border border-slate-800">
          ID: {issue.id}
        </div>
      </div>

      {/* Scrollable Body area */}
      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        
        {/* Title and upvotes */}
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-4">
            <h3 className="font-semibold text-sm text-white leading-snug">{issue.title}</h3>
            
            <button
              onClick={() => onUpvote(issue.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition duration-150 cursor-pointer ${
                hasUpvoted
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
                  : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300'
              }`}
            >
              <ArrowUp className={`h-3.5 w-3.5 transition-transform ${hasUpvoted ? 'scale-110 text-emerald-500 fill-emerald-500/10' : ''}`} />
              <span className="font-mono">{issue.upvotes}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-medium">
            <span className={`px-2 py-0.5 rounded-md border ${getStatusStyle(issue.status)} text-[9px] font-bold uppercase`}>
              {issue.status}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(issue.createdAt).toLocaleDateString()}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <User className="h-3 w-3" />
              {issue.reporter?.name}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed bg-[#0a0c12] p-3.5 rounded-xl border border-white/5 font-medium">
            {issue.description}
          </p>
        </div>

        {/* Duplicate detection badge alert */}
        {issue.duplicateGroupId && (
          <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl text-[10.5px] text-amber-400 flex gap-2.5">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-300">Duplicate Clustering Active</span>
              Grouped with neighboring reports under ID <strong>{issue.duplicateGroupId}</strong>. Unified field work-order authorized.
            </div>
          </div>
        )}

        {/* Community prediction block */}
        <div className="bg-indigo-500/5 border border-indigo-500/20 p-3.5 rounded-xl text-[10.5px] text-indigo-300 leading-relaxed font-medium">
          <div className="flex items-center gap-1.5 font-bold text-indigo-400 mb-1.5 text-xs">
            <Sparkles className="h-4 w-4 animate-pulse" />
            Predictive Neighborhood Impact
          </div>
          &ldquo;{issue.communityImpact}&rdquo;
        </div>

        {/* AI recommended blueprint checklist */}
        <div className="space-y-3">
          <div>
            <h4 className="font-display font-semibold text-xs text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-indigo-400" />
              Operational Dispatch Blueprint
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Track completed field safety and structural isolation parameters:</p>
          </div>
          
          <div className="space-y-2">
            {issue.recommendedActions.map((action, idx) => {
              const checked = !!completedActions[idx];
              return (
                <label
                  key={idx}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl text-[11px] leading-relaxed border transition-all cursor-pointer select-none ${
                    checked
                      ? 'bg-white/[0.01] border-white/5 text-slate-500 line-through'
                      : 'bg-[#0a0c12] border-white/5 hover:border-orange-500/30 text-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleActionCheck(idx)}
                    className="mt-0.5 rounded border-white/10 text-orange-500 focus:ring-orange-500 h-3.5 w-3.5 cursor-pointer shrink-0 bg-[#030408]"
                  />
                  <span className="font-medium">{action}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Operational timeline logs */}
        <div className="space-y-3 pt-1.5">
          <h4 className="font-display font-semibold text-xs text-white">Dispatch Telemetry Timeline</h4>
          <div className="relative pl-4 border-l border-white/10 space-y-4">
            {issue.timeline.map((event, idx) => (
              <div key={idx} className="relative text-[10.5px]">
                {/* Node indicator */}
                <div className={`absolute -left-[20.5px] top-1 h-2 w-2 rounded-full border border-[#0e111a] ${
                  event.status === 'Resolved' ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-indigo-500'
                }`} />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span className="text-white font-bold">{event.status}</span>
                  <span>{event && event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-slate-400 mt-0.5 leading-snug font-medium">{event.description}</p>
                <span className="inline-block text-[9px] bg-white/5 px-2 py-0.5 rounded font-mono font-bold text-slate-400 mt-1">
                  actor: {event.actor}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Citizen discussions boards */}
        <div className="space-y-3.5 pt-4.5 border-t border-white/5">
          <h4 className="font-display font-semibold text-xs text-white flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-indigo-500" />
            Citizen Discussion Board ({issue.comments.length})
          </h4>
          
          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {issue.comments.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic py-2 text-center font-medium">
                No active coordinator discussions yet. Post a query below.
              </p>
            ) : (
              issue.comments.map((comment) => (
                <div key={comment.id} className="bg-[#0a0c12] p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono font-semibold">
                    <span className="text-white">{comment.user}</span>
                    <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed font-medium">{comment.text}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask questions or offer dispatch feedback..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white transition-all"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition cursor-pointer shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* Municipal Worker Action Deck */}
      {issue.status !== "Resolved" && (
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-white space-y-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">
            <UserCheck className="h-3.5 w-3.5" />
            Operations Control Deck
          </div>
          <div className="grid grid-cols-2 gap-2">
            {issue.status === 'Reported' && (
              <button
                onClick={() => onUpdateStatus(issue.id, 'Assigned')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-[10.5px] font-bold text-white rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              >
                Assign Crew
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
            {(issue.status === 'Reported' || issue.status === 'Assigned') && (
              <button
                onClick={() => onUpdateStatus(issue.id, 'In Progress')}
                className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-[10.5px] font-bold text-white rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              >
                <Play className="h-3 w-3 fill-white" />
                Dispatch Field Unit
              </button>
            )}
            {issue.status === 'In Progress' && (
              <button
                onClick={() => onUpdateStatus(issue.id, 'Resolved')}
                className="col-span-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-[10.5px] font-bold text-white rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete & Resolve Ticket (+100 PTS)
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
