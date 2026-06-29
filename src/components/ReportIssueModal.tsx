import React, { useState, useEffect } from 'react';
import { SIMULATION_ISSUES, convertUrlToBase64 } from './SimulationCatalog';
import { Sparkles, Camera, MapPin, AlertCircle, FileUp, X, Check, ArrowRight, Loader2, Info } from 'lucide-react';
import { CivicCategory, SeverityLevel } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ReportIssueModalProps {
  onClose: () => void;
  isOpen: boolean;
  onSubmitReport: (reportData: {
    title: string;
    description: string;
    category: CivicCategory;
    severity: SeverityLevel;
    communityImpact: string;
    location: { lat: number; lng: number; address: string };
    imageUrl?: string;
    recommendedActions: string[];
  }) => void;
  selectedCoords: { lat: number; lng: number; address: string } | null;
}

export default function ReportIssueModal({ onClose, isOpen, onSubmitReport, selectedCoords }: ReportIssueModalProps) {
  // Wizard Stages: 'upload' | 'analyzing' | 'review'
  const [stage, setStage] = useState<'upload' | 'analyzing' | 'review'>('upload');
  
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");

  // Extracted AI details state
  const [aiTitle, setAiTitle] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [aiCategory, setAiCategory] = useState<CivicCategory>("Roads");
  const [aiSeverity, setAiSeverity] = useState<SeverityLevel>("Medium");
  const [aiImpact, setAiImpact] = useState("");
  const [aiActions, setAiActions] = useState<string[]>([]);
  
  const [manualAddress, setManualAddress] = useState("");
  const [lat, setLat] = useState(37.7610);
  const [lng, setLng] = useState(-122.4218);

  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const LOADING_MESSAGES = [
    "Establishing cloud connection with Gemini AI...",
    "Analyzing image pixels & lighting levels...",
    "Extracting hazard indicators and category tags...",
    "Predicting social disruption & safety consequences...",
    "Generating 3 targeted remediation action points..."
  ];

  useEffect(() => {
    if (selectedCoords) {
      setLat(selectedCoords.lat);
      setLng(selectedCoords.lng);
      setManualAddress(selectedCoords.address);
    }
  }, [selectedCoords]);

  // Loading ticker effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stage === 'analyzing') {
      interval = setInterval(() => {
        setLoadingStep(step => (step + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [stage]);

  // File picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setSelectedPresetId(null);
      setImagePreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  // Preset Selection Click Handler
  const handlePresetSelect = (presetId: string) => {
    const preset = SIMULATION_ISSUES.find(p => p.id === presetId);
    if (preset) {
      setSelectedPresetId(presetId);
      setUploadedFile(null);
      setImagePreviewUrl(preset.imageUrl);
      setError(null);
    }
  };

  // Run Real-Time Gemini AI Analyzer
  const runAIAnalysis = async () => {
    setStage('analyzing');
    setLoadingStep(0);
    setError(null);

    let base64 = "";
    let mimeType = "image/jpeg";

    try {
      if (selectedPresetId) {
        // Convert Preset Unsplash URL to base64
        const preset = SIMULATION_ISSUES.find(p => p.id === selectedPresetId)!;
        const res = await convertUrlToBase64(preset.imageUrl);
        base64 = res.base64;
        mimeType = res.mimeType;
      } else if (uploadedFile) {
        // Convert Local File to Base64
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const resultStr = reader.result as string;
            resolve(resultStr.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
        mimeType = uploadedFile.type || "image/jpeg";
      } else {
        throw new Error("Please select a simulation scenario or upload your own photo to analyze.");
      }

      // POST to server side endpoint
      const response = await fetch("/api/gemini/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType })
      });

      if (!response.ok) {
        throw new Error("Express server returned an error during analysis. Make sure GEMINI_API_KEY is defined in AI Studio Secrets.");
      }

      const aiResult = await response.json();
      
      // Seed fields
      setAiTitle(aiResult.title || "Reported Civic Hazard");
      setAiDescription(aiResult.description || "Identified public space failure needing attention.");
      setAiCategory((aiResult.category as CivicCategory) || "Roads");
      setAiSeverity((aiResult.severity as SeverityLevel) || "Medium");
      setAiImpact(aiResult.communityImpact || "Immediate risk to pedestrians and public property if unresolved.");
      setAiActions(aiResult.recommendedActions || ["Isolate area", "Dispatch crew", "Repair assembly"]);
      
      // If address is not populated yet, randomize nearby coordinate center
      if (!manualAddress) {
        const randomOffsetLat = (Math.random() - 0.5) * 0.015;
        const randomOffsetLng = (Math.random() - 0.5) * 0.015;
        const targetLat = 37.7610 + randomOffsetLat;
        const targetLng = -122.4218 + randomOffsetLng;
        setLat(targetLat);
        setLng(targetLng);
        setManualAddress(`${Math.floor(100 + Math.random() * 800)} Valencia St, San Francisco, CA 94103`);
      }

      setStage('review');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to execute Gemini AI Vision task.");
      setStage('upload');
    }
  };

  const getCategoryImage = (category: CivicCategory): string => {
    switch (category) {
      case 'Roads':
        return "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80";
      case 'Sanitation':
        return "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80";
      case 'Utilities':
        return "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80";
      case 'Safety':
        return "https://images.unsplash.com/photo-1542397284385-601017642477?auto=format&fit=crop&w=800&q=80";
      case 'Environment':
        return "https://images.unsplash.com/photo-1488330890490-c291ecf62711?auto=format&fit=crop&w=800&q=80";
      default:
        return "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80";
    }
  };

  const handleManualEntry = () => {
    setError(null);
    setAiTitle("");
    setAiDescription("");
    setAiCategory("Roads");
    setAiSeverity("Medium");
    setAiImpact("");
    setAiActions([
      "Isolate immediate hazard area with physical barricades",
      "Dispatch regional municipal response crew",
      "Perform physical restoration and verify area safety"
    ]);
    setImagePreviewUrl(getCategoryImage("Roads"));
    
    if (!manualAddress) {
      const randomOffsetLat = (Math.random() - 0.5) * 0.015;
      const randomOffsetLng = (Math.random() - 0.5) * 0.015;
      const targetLat = 37.7610 + randomOffsetLat;
      const targetLng = -122.4218 + randomOffsetLng;
      setLat(targetLat);
      setLng(targetLng);
      setManualAddress(`${Math.floor(100 + Math.random() * 800)} Valencia St, San Francisco, CA 94103`);
    }
    setStage('review');
  };

  const handleFinalSubmit = () => {
    if (!aiTitle.trim()) {
      setError("Please specify a custom title for this emergency mission.");
      return;
    }
    if (!aiDescription.trim()) {
      setError("Please provide a custom description of the hazard/mission.");
      return;
    }
    setError(null);

    onSubmitReport({
      title: aiTitle.trim(),
      description: aiDescription.trim(),
      category: aiCategory,
      severity: aiSeverity,
      communityImpact: aiImpact.trim() || "Immediate risk to public property and pedestrian safety.",
      location: {
        lat,
        lng,
        address: manualAddress || "Valencia St, San Francisco, CA"
      },
      imageUrl: imagePreviewUrl || getCategoryImage(aiCategory),
      recommendedActions: aiActions.filter(action => action.trim() !== "")
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gradient-to-r from-emerald-600 to-teal-500 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-yellow-200 fill-yellow-200" />
            <h3 className="font-bold text-sm">ResQLink AI Report Portal</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* STAGE 1: UPLOAD OR CHOOSE SIMULATION */}
          {stage === 'upload' && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-semibold text-xs text-gray-700">Submit Photo & Trigger AI Diagnostic</h4>
                <p className="text-[10px] text-gray-400 mt-1">
                  Upload a photo of a local issue or select one of our preloaded high-fidelity simulation cards below to view the AI Vision analysis.
                </p>
              </div>

              {/* Simulation Gallery Cards */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block font-mono">
                  🚀 Interactive Simulation Scenarios (Click to Choose)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {SIMULATION_ISSUES.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handlePresetSelect(preset.id)}
                        className={`p-2 rounded-xl border flex items-center gap-2.5 transition cursor-pointer select-none ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                            : 'bg-white border-gray-100 hover:bg-gray-50/50 hover:border-gray-200'
                        }`}
                      >
                        <img
                          src={preset.thumbnailUrl}
                          alt={preset.name}
                          className="h-10 w-10 rounded-lg object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-[10px] text-gray-800 truncate leading-snug">{preset.name}</h5>
                          <span className="text-[9px] text-gray-400 block font-medium">{preset.category}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drag and Drop selector */}
              <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-gray-50 transition cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  <Camera className="h-8 w-8 text-gray-400 group-hover:text-emerald-500 transition mb-2" />
                  <span className="text-[11px] font-semibold text-gray-600 block">
                    {uploadedFile ? uploadedFile.name : "Or Upload Custom Photo"}
                  </span>
                  <span className="text-[9px] text-gray-400 mt-0.5">Drag & drop or browse from machine</span>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-[10px] text-rose-700 font-medium flex items-center gap-1.5 animate-shake">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Pinpoint coordinates helper block */}
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-2 text-[10px] text-indigo-800 leading-normal">
                <MapPin className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-semibold block leading-tight">GPS Coordinate Mapping</span>
                  {selectedCoords ? (
                    <span>Coordinates pre-locked to: **{lat.toFixed(4)}° N, {lng.toFixed(4)}° W** (from map selection)</span>
                  ) : (
                    <span>Tip: You can double-click or pinpoint any road on the map background to pre-bind the exact repair coordinate coordinates!</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={runAIAnalysis}
                  disabled={!selectedPresetId && !uploadedFile}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-xs font-semibold text-white rounded-xl shadow-lg shadow-emerald-600/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Launch AI Diagnostic
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleManualEntry}
                  className="px-4 py-2 border border-indigo-200 hover:bg-indigo-50/40 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  Write Manually
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500 fill-indigo-200" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: ANALYZING LOADING STEP */}
          {stage === 'analyzing' && (
            <div className="py-10 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
              <div className="text-center space-y-1">
                <h4 className="font-bold text-xs text-slate-800">Processing ResQLink Vision Core...</h4>
                <p className="text-[11px] text-slate-500 italic max-w-[280px]">
                  &ldquo;{LOADING_MESSAGES[loadingStep]}&rdquo;
                </p>
              </div>
              <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-1000"
                  style={{ width: `${((loadingStep + 1) / LOADING_MESSAGES.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* STAGE 3: AI DIAGNOSED REVIEW */}
          {stage === 'review' && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-semibold text-xs text-gray-700 flex items-center justify-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Mission Profile: Customize & Review
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Complete the target incident parameters below. Define custom actions, category alignment, and coordinates before deploying the live mission.
                </p>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-[10px] text-rose-700 font-medium flex items-center gap-1.5 animate-shake">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Side-by-side photo + Title */}
              <div className="flex gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="h-20 w-20 rounded-xl object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-2 flex-1 min-w-0">
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 block uppercase">Mission Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Broken Water Main on Church St"
                      value={aiTitle}
                      onChange={(e) => {
                        setAiTitle(e.target.value);
                        setError(null);
                      }}
                      className="w-full bg-transparent border-b border-gray-200 pb-0.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  
                  {/* Category & Severity Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] font-bold text-gray-400 block uppercase">Category</label>
                      <select
                        value={aiCategory}
                        onChange={(e) => {
                          const newCat = e.target.value as CivicCategory;
                          setAiCategory(newCat);
                          setImagePreviewUrl(getCategoryImage(newCat));
                        }}
                        className="text-[10px] text-gray-700 font-semibold bg-transparent focus:outline-none focus:ring-0 p-0"
                      >
                        <option value="Roads">Roads</option>
                        <option value="Sanitation">Sanitation</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Safety">Safety</option>
                        <option value="Environment">Environment</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-gray-400 block uppercase">Severity</label>
                      <select
                        value={aiSeverity}
                        onChange={(e) => setAiSeverity(e.target.value as SeverityLevel)}
                        className="text-[10px] text-gray-700 font-semibold bg-transparent focus:outline-none focus:ring-0 p-0"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description and community impact */}
              <div className="space-y-2.5">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block uppercase">Mission Description</label>
                  <textarea
                    rows={2}
                    placeholder="Provide detailed description of the reported hazard or emergency event..."
                    value={aiDescription}
                    onChange={(e) => {
                      setAiDescription(e.target.value);
                      setError(null);
                    }}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-emerald-800 block uppercase flex items-center gap-1 font-mono">
                    <Sparkles className="h-3 w-3 text-emerald-600 animate-pulse" />
                    Community Impact Assessment
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter estimated social disruption or local safety consequences..."
                    value={aiImpact}
                    onChange={(e) => setAiImpact(e.target.value)}
                    className="w-full p-2 bg-emerald-50/20 border border-emerald-100 rounded-xl text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>

                {/* Dispatch Coordinates */}
                <div>
                  <label className="text-[9px] font-bold text-indigo-800 block uppercase">Bound Address & Coordinates</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
                    />
                    <MapPin className="h-3.5 w-3.5 text-indigo-500 absolute left-2.5 top-2" />
                  </div>
                </div>
              </div>

              {/* Actions list display */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 block uppercase">Recommended Next Steps (AI Action Block)</label>
                <div className="space-y-1">
                  {aiActions.map((action, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={action}
                      onChange={(e) => {
                        const copy = [...aiActions];
                        copy[idx] = e.target.value;
                        setAiActions(copy);
                      }}
                      className="w-full px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-gray-600 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStage('upload')}
                  className="w-1/3 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-600 rounded-xl transition cursor-pointer"
                >
                  Analyze Other
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-lg shadow-emerald-600/10 transition cursor-pointer"
                >
                  File & Register Report (+50 PTS)
                </button>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
