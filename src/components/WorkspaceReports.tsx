import React, { useState, useRef, useEffect } from 'react';
import { FileText, ShieldCheck, Download, Trash2, Printer, CheckCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CivicIssue } from '../types';

interface WorkspaceReportsProps {
  selectedIssue: CivicIssue;
  onTriggerExecution: (taskType: string, payload?: any) => void;
}

export default function WorkspaceReports({ selectedIssue, onTriggerExecution }: WorkspaceReportsProps) {
  const [authorized, setAuthorized] = useState(false);
  const [authorizerName, setAuthorizerName] = useState('Aditya Sharma');
  const [authDate, setAuthDate] = useState('');
  
  // HTML5 Canvas signature pad references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    // Reset authorization state if selected issue changes
    setAuthorized(false);
    clearSignature();
  }, [selectedIssue]);

  // Set up Canvas context
  const getCanvasContext = () => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#4f46e5'; // Indigo stroke
    }
    return ctx;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCanvasContext();
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCanvasContext();
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleAuthorizeAndDispatch = () => {
    setAuthorized(true);
    const dateStr = new Date().toLocaleString([], { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    setAuthDate(dateStr);
    onTriggerExecution('WORK_ORDER_DISPATCHED', { issueId: selectedIssue.id, authorizer: authorizerName, timestamp: dateStr });
  };

  const printDocument = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-slate-300 text-left">
      
      {/* Action Header */}
      <div className="flex justify-between items-center bg-[#0a0c12] p-4 border border-white/5 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <FileText className="h-4.5 w-4.5 text-indigo-400" />
          <div>
            <h3 className="font-display font-semibold text-xs text-white">Official Municipal Briefing</h3>
            <span className="text-[9px] text-slate-500 font-mono">Export Engine & Dispatch Authorizer</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={printDocument}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-400 hover:text-white cursor-pointer transition text-[10px] font-semibold flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Document Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Printable Official Brief Sheet (2 columns wide) */}
        <div className="lg:col-span-2 bg-[#05060a] border border-white/10 shadow-2xl p-8 rounded-3xl relative overflow-hidden font-sans min-h-[580px] text-slate-200 print:m-0 print:p-0">
          
          {/* Official Letterhead */}
          <div className="border-b-2 border-white/25 pb-5 flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight uppercase font-sans text-white">City & County of San Francisco</h1>
              <p className="text-[9px] font-semibold font-sans tracking-wide uppercase text-orange-500">Autonomous Department of Physical Infrastructure</p>
              <p className="text-[8px] font-sans text-slate-400">1155 Market Street, Suite 400 • San Francisco, CA 94103</p>
            </div>
            
            <div className="h-14 w-14 bg-orange-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/15 font-sans">
              <span className="text-xs font-black tracking-tighter uppercase leading-none text-center text-white">SF<br />ADPI</span>
            </div>
          </div>

          {/* Incident Overview Table */}
          <div className="mt-6 space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
              <div>
                <span className="text-[8px] font-bold text-slate-400 uppercase block">Ticket ID</span>
                <span className="font-bold text-white">{selectedIssue.id}</span>
              </div>
              <div>
                <span className="text-[8px] font-bold text-slate-400 uppercase block">Priority Rating</span>
                <span className="font-bold text-orange-500">{selectedIssue.severity}</span>
              </div>
              <div>
                <span className="text-[8px] font-bold text-slate-400 uppercase block">Category Index</span>
                <span className="font-bold text-blue-500">{selectedIssue.category}</span>
              </div>
            </div>

            {/* Structured narrative */}
            <div className="space-y-3 font-sans leading-relaxed text-slate-300 text-sm">
              <h2 className="text-base font-bold font-sans text-orange-500 border-b border-white/10 pb-1 mt-6">I. INFRASTRUCTURE PROBLEM ANALYSIS</h2>
              <p>
                Pursuant to Section IV of the Autonomous Municipal Code, the City Field Telemetry Engine has recorded a significant structural defect described as: <strong className="text-white">&ldquo;{selectedIssue.title}&rdquo;</strong>.
              </p>
              <p>
                Visual records extracted directly from citizen mobile relays and nearby IoT grid nodes corroborate severe physical material decay at coordinates <strong className="text-blue-400">{selectedIssue.location.lat.toFixed(6)}° N, {selectedIssue.location.lng.toFixed(6)}° W</strong>, corresponding directly to the physical municipal address: <em className="text-white">{selectedIssue.location.address}</em>.
              </p>

              <h2 className="text-base font-bold font-sans text-orange-500 border-b border-white/10 pb-1 mt-6">II. COMMUNITY THREAT LEVEL & SOCIAL IMPACT</h2>
              <p>
                The underlying neural evaluation engine predicts localized neighborhood welfare degradation with high confidence. <span className="text-slate-200">{selectedIssue.communityImpact}</span>
              </p>

              <h2 className="text-base font-bold font-sans text-orange-500 border-b border-white/10 pb-1 mt-6">III. MANDATED DISPATCH PLAN</h2>
              <p>First responding units and dispatch centers are hereby directed to implement the following physical remediations within the standard Q3 protocol window:</p>
              <ol className="list-decimal pl-5 space-y-1.5 font-sans text-xs text-slate-300">
                {selectedIssue.recommendedActions.map((act, index) => (
                  <li key={index} className="pl-1">
                    <strong className="text-blue-400">Phase {index + 1}:</strong> {act}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Approval Signatures / Stamp overlay */}
          <div className="border-t border-white/10 pt-6 mt-8 flex justify-between items-end font-sans">
            <div>
              <span className="text-[8px] font-bold text-slate-400 uppercase block">Authorized Sign-off</span>
              <div className="h-10 mt-1 relative flex items-center">
                {authorized ? (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    className="text-orange-500 font-serif italic text-lg select-none"
                  >
                    {authorizerName}
                  </motion.div>
                ) : (
                  <span className="text-[10px] text-slate-500 italic font-medium">Awaiting Signature Authorization...</span>
                )}
              </div>
              <div className="border-t border-white/10 w-44 pt-1 mt-1">
                <span className="text-[9px] text-slate-400 font-medium block">Operations Director</span>
                {authorized && <span className="text-[8px] text-slate-500 block font-mono mt-0.5">{authDate}</span>}
              </div>
            </div>

            {/* Official approval circular stamp of the system */}
            <AnimatePresence>
              {authorized && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1, opacity: 1, rotate: -15 }}
                  className="h-16 w-16 border-2 border-dashed border-orange-500 rounded-full flex flex-col items-center justify-center text-orange-500 select-none font-bold uppercase font-sans shrink-0 rotate-[-15deg] pointer-events-none"
                >
                  <span className="text-[6px] tracking-widest font-black leading-none">APPROVED</span>
                  <span className="text-[7px] tracking-tighter leading-tight font-extrabold mt-0.5">RESQLINK</span>
                  <span className="text-[5px] tracking-wider leading-none font-mono mt-0.5">SF-ADPI</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Tactical Authorization Board (1 column wide) */}
        <div className="space-y-4">
          
          {/* Canvas Draw Sign-off block */}
          <div className="p-4 bg-[#0a0c12] border border-white/5 rounded-2xl space-y-3">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              <span>Authorization Core</span>
            </h4>

            {/* Input Name */}
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-mono block">AUTHORIZER NAME</label>
              <input
                type="text"
                value={authorizerName}
                onChange={(e) => setAuthorizerName(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Interactive Draw Signature Canvas */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-slate-500 font-mono">DRAW SIGNATURE MOUSE/TOUCH</label>
                <button 
                  onClick={clearSignature}
                  className="text-[9px] text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Draw canvas container */}
              <canvas
                ref={canvasRef}
                width={200}
                height={100}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full bg-black/40 border border-white/5 rounded-xl block h-24 touch-none"
              />
            </div>

            {/* Dispatch Button */}
            <button
              onClick={handleAuthorizeAndDispatch}
              disabled={authorized}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
            >
              {authorized ? (
                <>
                  <CheckCircle className="h-4 w-4 stroke-[2.5px]" />
                  <span>Briefing Dispatched!</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Authorize & Dispatch</span>
                </>
              )}
            </button>
          </div>

          {/* Safe-guard guidelines */}
          <div className="p-3 bg-indigo-950/20 border border-indigo-500/15 rounded-2xl text-left space-y-1.5">
            <h4 className="text-[10px] font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Civil Dispatch Regulations</span>
            </h4>
            <p className="text-[9px] text-slate-400 leading-normal">
              Signing this briefing triggers immediate autonomous routing to SF Public Works dispatch API. Crews will receive localized blueprints, safety guidelines, and coordinate logs.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
