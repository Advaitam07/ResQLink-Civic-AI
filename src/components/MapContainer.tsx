import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { CivicIssue, CivicCategory } from '../types';
import { AlertTriangle, MapPin, Navigation, Map as MapIcon, Layers, ZoomIn, ZoomOut, Info, CheckCircle2 } from 'lucide-react';

interface MapContainerProps {
  issues: CivicIssue[];
  selectedIssueId: string | null;
  onSelectIssue: (issue: CivicIssue) => void;
  onSelectCoordsForNewReport?: (coords: { lat: number; lng: number; address: string }) => void;
}

// Check for Google Maps Platform Key
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY !== 'MY_GOOGLE_MAPS_PLATFORM_KEY';

export default function MapContainer({ issues, selectedIssueId, onSelectIssue, onSelectCoordsForNewReport }: MapContainerProps) {
  const [center, setCenter] = useState({ lat: 37.7610, lng: -122.4218 }); // Mission District, SF
  const [zoom, setZoom] = useState(14);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [activePinId, setActivePinId] = useState<string | null>(null);

  // For placing custom pins on click
  const [placedPin, setPlacedPin] = useState<{ lat: number; lng: number } | null>(null);

  const getCategoryColor = (category: CivicCategory) => {
    switch (category) {
      case 'Roads': return '#ef4444'; // Red
      case 'Sanitation': return '#f59e0b'; // Amber
      case 'Utilities': return '#3b82f6'; // Blue
      case 'Safety': return '#a855f7'; // Purple
      case 'Environment': return '#10b981'; // Emerald
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical': return '💀';
      case 'High': return '⚠️';
      case 'Medium': return '⚡';
      default: return '📍';
    }
  };

  // --- RENDERING ACTUAL GOOGLE MAP ---
  if (hasValidKey) {
    return (
      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm min-h-[350px]">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={center}
            defaultZoom={zoom}
            mapId="DEMO_MAP_ID"
            onClick={(e) => {
              if (e.detail.latLng && onSelectCoordsForNewReport) {
                const lat = e.detail.latLng.lat;
                const lng = e.detail.latLng.lng;
                setPlacedPin({ lat, lng });
                onSelectCoordsForNewReport({
                  lat,
                  lng,
                  address: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° W (Map Pinpoint)`
                });
              }
            }}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {issues.map(issue => (
              <AdvancedMarker
                key={issue.id}
                position={{ lat: issue.location.lat, lng: issue.location.lng }}
                onClick={() => {
                  onSelectIssue(issue);
                  setActivePinId(issue.id);
                }}
              >
                <Pin
                  background={getCategoryColor(issue.category)}
                  glyphColor="#fff"
                  glyphText={getSeverityIcon(issue.severity)}
                  borderColor={selectedIssueId === issue.id ? '#ffffff' : getCategoryColor(issue.category)}
                  scale={selectedIssueId === issue.id ? 1.25 : 1}
                />
              </AdvancedMarker>
            ))}

            {placedPin && (
              <AdvancedMarker position={placedPin}>
                <Pin background="#4f46e5" glyphText="➕" scale={1.1} />
              </AdvancedMarker>
            )}

            {/* Render a custom Info Window if selected pin has active window */}
            {activePinId && issues.find(i => i.id === activePinId) && (
              (() => {
                const iss = issues.find(i => i.id === activePinId)!;
                return (
                  <InfoWindow
                    position={{ lat: iss.location.lat, lng: iss.location.lng }}
                    onCloseClick={() => setActivePinId(null)}
                  >
                    <div className="p-1 font-sans text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-gray-800">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(iss.category) }}></span>
                        {iss.title}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-[180px] line-clamp-2">{iss.description}</p>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100">
                        <span className="px-1.5 py-0.2 bg-rose-50 text-[9px] text-rose-700 font-bold rounded">
                          {iss.severity} Severity
                        </span>
                        <button
                          onClick={() => onSelectIssue(iss)}
                          className="text-[9px] text-emerald-600 font-bold hover:underline cursor-pointer"
                        >
                          Details &rarr;
                        </button>
                      </div>
                    </div>
                  </InfoWindow>
                );
              })()
            )}
          </Map>
        </APIProvider>
      </div>
    );
  }

  // --- RENDERING HIGH-FIDELITY MAP SIMULATOR ---
  // Calculates relative pixel coordinates to plot beautiful mock interactive pins
  return (
    <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col min-h-[380px] select-none">
      {/* Simulation Controls Header */}
      <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-center pointer-events-none">
        <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 shadow-lg text-[10px] text-slate-300 font-medium flex items-center gap-1.5 pointer-events-auto">
          <MapIcon className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          SF Mission District Grid Map
          <span className="px-1 py-0.2 bg-emerald-900/50 text-[8px] text-emerald-400 font-mono rounded">
            SIMULATED
          </span>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          {/* Map Layer Toggle */}
          <button
            onClick={() => setMapType(p => p === 'standard' ? 'satellite' : 'standard')}
            className="p-1.5 bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-800 rounded-full hover:bg-slate-900 shadow-lg transition cursor-pointer"
            title="Toggle Map Style"
          >
            <Layers className="h-3.5 w-3.5" />
          </button>
          
          {/* Zoom controls */}
          <div className="flex bg-slate-950/80 backdrop-blur-md rounded-full border border-slate-800 shadow-lg overflow-hidden">
            <button onClick={() => setZoom(z => Math.min(16, z + 1))} className="p-1.5 text-slate-300 hover:bg-slate-900 transition cursor-pointer">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setZoom(z => Math.max(12, z - 1))} className="p-1.5 text-slate-300 hover:bg-slate-900 transition border-l border-slate-800 cursor-pointer">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Simulator API Key Notice Banner */}
      <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2 shadow-xl">
        <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-200 font-semibold block leading-tight">Google Maps API Key Missing</span>
          Running in offline-fallback sandbox. Paste your API key in **Settings (⚙️) &rarr; Secrets &rarr; GOOGLE_MAPS_PLATFORM_KEY** to toggle live GPS maps!
        </div>
      </div>

      {/* Grid Canvas Canvas */}
      <div
        className="flex-1 relative overflow-hidden cursor-crosshair"
        style={{
          backgroundImage: mapType === 'satellite'
            ? "radial-gradient(circle, rgba(16,185,129,0.06) 1.5px, transparent 1.5px), linear-gradient(135deg, #0f172a 0%, #020617 100%)"
            : "radial-gradient(circle, #334155 1px, transparent 1px), #1e293b",
          backgroundSize: "24px 24px"
        }}
        onClick={(e) => {
          if (!onSelectCoordsForNewReport) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Map relative coordinates to approximate SF lat/lng boundaries
          // lat range approx 37.7550 to 37.7750
          // lng range approx -122.4350 to -122.4100
          const relativeY = y / rect.height;
          const relativeX = x / rect.width;
          
          const clickedLat = 37.7750 - (relativeY * 0.0200);
          const clickedLng = -122.4350 + (relativeX * 0.0250);

          setPlacedPin({ lat: clickedLat, lng: clickedLng });
          
          onSelectCoordsForNewReport({
            lat: clickedLat,
            lng: clickedLng,
            address: `${Math.floor(100 + Math.random()*900)} Mission St, San Francisco, CA 94103`
          });
        }}
      >
        {/* Render Grid Road Lines */}
        <div className="absolute inset-0 opacity-15 pointer-events-none font-mono text-[9px] text-slate-400">
          {/* Mission Street */}
          <div className="absolute h-0.5 bg-slate-400 w-full top-1/4"></div>
          <span className="absolute top-1/4 left-10 -translate-y-3.5 text-[8px] tracking-widest uppercase">Valencia Street</span>

          {/* Market Street */}
          <div className="absolute h-0.5 bg-slate-400 w-full top-3/5 rotate-[-12deg]"></div>
          <span className="absolute top-3/5 left-1/3 rotate-[-12deg] -translate-y-3.5 text-[8px] tracking-widest uppercase">Market Blvd</span>

          {/* 16th Street */}
          <div className="absolute w-0.5 bg-slate-400 h-full left-1/3"></div>
          <span className="absolute top-1/2 left-1/3 translate-x-1 text-[8px] tracking-widest uppercase origin-top-left rotate-90">16th Street</span>

          {/* Dolores Street */}
          <div className="absolute w-0.5 bg-slate-400 h-full left-3/4"></div>
          <span className="absolute top-10 left-3/4 translate-x-1 text-[8px] tracking-widest uppercase origin-top-left rotate-90 font-bold text-teal-400">Dolores Parkway</span>
        </div>

        {/* Map Center Coordinate Anchor */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center opacity-30">
          <Navigation className="h-6 w-6 text-slate-400 rotate-45" />
          <span className="text-[9px] font-mono mt-1 text-slate-400">37.7610° N, 122.4218° W</span>
        </div>

        {/* Plotting Issue Pins */}
        {issues.map(issue => {
          // Normalize lat/lng to pixel offsets
          // Lat 37.7750 is top (0%), 37.7550 is bottom (100%)
          // Lng -122.4350 is left (0%), -122.4100 is right (100%)
          const top = ((37.7750 - issue.location.lat) / 0.0200) * 100;
          const left = ((issue.location.lng - (-122.4350)) / 0.0250) * 100;

          // Clamping
          const clampedTop = Math.max(5, Math.min(92, top));
          const clampedLeft = Math.max(5, Math.min(92, left));

          const isSelected = selectedIssueId === issue.id;

          return (
            <div
              key={issue.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-20 cursor-pointer"
              style={{ top: `${clampedTop}%`, left: `${clampedLeft}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectIssue(issue);
                setActivePinId(issue.id);
              }}
            >
              {/* Outer Pulse */}
              {isSelected && (
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-30 h-10 w-10 -mt-1 -ml-1"
                  style={{ backgroundColor: getCategoryColor(issue.category) }}
                ></div>
              )}

              {/* Pin */}
              <div
                className={`relative flex flex-col items-center transition-transform hover:scale-115 ${
                  isSelected ? 'scale-110 z-30' : ''
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] text-white shadow-xl border-2 transition-all ${
                    isSelected ? 'border-white scale-110 shadow-emerald-500/20' : 'border-slate-800'
                  }`}
                  style={{ backgroundColor: getCategoryColor(issue.category) }}
                >
                  {getSeverityIcon(issue.severity)}
                </div>
                
                {/* Visual Connector Needle */}
                <div className="w-1.5 h-1.5 bg-slate-800 border-l border-r border-slate-700 -mt-0.5 rounded-full"></div>

                {/* Micro Label */}
                <div className="bg-slate-950/85 text-[8px] text-slate-200 px-1 py-0.2 rounded mt-0.5 border border-slate-800 whitespace-nowrap shadow-md max-w-[80px] truncate leading-tight">
                  {issue.title}
                </div>
              </div>
            </div>
          );
        })}

        {/* Plotting Manual New Pin placement visually */}
        {placedPin && (
          (() => {
            const top = ((37.7750 - placedPin.lat) / 0.0200) * 100;
            const left = ((placedPin.lng - (-122.4350)) / 0.0250) * 100;
            return (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 animate-bounce"
                style={{ top: `${top}%`, left: `${left}%` }}
              >
                <div className="relative flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white border-2 border-white shadow-xl">
                    ➕
                  </div>
                  <div className="w-1 h-2 bg-indigo-600"></div>
                  <span className="bg-indigo-900 text-[8px] font-bold text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                    Report Location
                  </span>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
