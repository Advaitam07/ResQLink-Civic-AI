import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { 
  Map as MapIcon, 
  Layers, 
  Sun, 
  ShieldCheck, 
  Info, 
  Sparkles, 
  Navigation, 
  Search, 
  AlertTriangle, 
  Activity, 
  MapPin, 
  Crosshair, 
  PlusCircle, 
  TrendingUp, 
  Zap, 
  X, 
  Check, 
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { CivicIssue, CivicCategory, SeverityLevel } from '../types';
import ReportIssueModal from './ReportIssueModal';
import { encodeGeohash } from '../utils/backendHelper';

// Custom MapCircle sub-component for drawing impact zones and heatmap layers
function MapCircle({ center, radius, options }: {
  center: google.maps.LatLngLiteral;
  radius: number;
  options?: google.maps.CircleOptions;
  key?: string;
}) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;
    circleRef.current = new google.maps.Circle({
      map,
      center,
      radius,
      ...options
    });

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
    };
  }, [map, center, radius, JSON.stringify(options)]);

  return null;
}

// Custom MapPolyline sub-component for infrastructure layers
function MapPolyline({ path, options }: {
  path: google.maps.LatLngLiteral[];
  options?: google.maps.PolylineOptions;
  key?: string;
}) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;
    polylineRef.current = new google.maps.Polyline({
      map,
      path,
      ...options
    });

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, path, JSON.stringify(options)]);

  return null;
}

// Search & Autocomplete sub-component
function PlaceSearchBox({ onPlaceSelect }: { onPlaceSelect: (place: { lat: number; lng: number; address: string; placeId?: string }) => void }) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!placesLib || !query || query.length < 3) {
      setPredictions([]);
      return;
    }

    const service = new placesLib.AutocompleteService();
    const timeout = setTimeout(() => {
      service.getPlacePredictions({
        input: query,
        locationBias: map?.getCenter(),
        componentRestrictions: { country: 'us' }
      }, (results, status) => {
        if (status === 'OK' && results) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [placesLib, query, map]);

  const handleSelect = (pred: google.maps.places.AutocompletePrediction) => {
    setQuery(pred.description);
    setPredictions([]);
    setIsFocused(false);

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId: pred.place_id }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location;
        const placeDetails = {
          lat: loc.lat(),
          lng: loc.lng(),
          address: results[0].formatted_address,
          placeId: pred.place_id
        };
        onPlaceSelect(placeDetails);
        if (map) {
          map.setCenter({ lat: placeDetails.lat, lng: placeDetails.lng });
          map.setZoom(16);
        }
      }
    });
  };

  return (
    <div className="relative w-full max-w-sm shrink-0">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search San Francisco addresses..."
          className="w-full pl-9 pr-8 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium font-sans"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setPredictions([]); }}
            className="absolute right-2.5 top-2.5 p-0.5 hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-300"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {isFocused && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-slate-900">
          {predictions.map(p => (
            <div
              key={p.place_id}
              onClick={() => handleSelect(p)}
              className="p-2.5 hover:bg-slate-900/80 cursor-pointer text-left text-[11px] text-slate-300 font-sans font-medium transition flex items-start gap-2"
            >
              <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>{p.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface WorkspaceMapProps {
  issues: CivicIssue[];
  selectedIssueId: string | null;
  onSelectIssue: (issue: CivicIssue) => void;
  onTriggerExecution: (taskType: string, payload?: any) => void;
  onSubmitReport?: (reportData: any) => Promise<void>;
}

// Check for Google Maps Platform Key
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY !== 'MY_GOOGLE_MAPS_PLATFORM_KEY';

export default function WorkspaceMap({ issues, selectedIssueId, onSelectIssue, onTriggerExecution, onSubmitReport }: WorkspaceMapProps) {
  const [activeLayer, setActiveLayer] = useState<'standard' | 'heatmap' | 'utilities' | 'drainage'>('standard');
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);
  
  // Real Map States
  const [placedPin, setPlacedPin] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>(undefined);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [mapNotification, setMapNotification] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(null);
  const [center, setCenter] = useState({ lat: 37.7610, lng: -122.4218 }); // Mission District SF
  const [zoom, setZoom] = useState(14);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Fallback simulator maps relative visual coordinate mapping
  const mapCoordinates: Record<string, { x: number; y: number }> = {
    iss_001: { x: 280, y: 160 },
    iss_002: { x: 120, y: 320 },
    iss_003: { x: 420, y: 80 },
    iss_004: { x: 220, y: 220 },
    iss_005: { x: 480, y: 260 }
  };

  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  // Focus effect: When selectedIssue shifts, center map on it
  useEffect(() => {
    if (selectedIssue && hasValidKey) {
      setCenter({ lat: selectedIssue.location.lat, lng: selectedIssue.location.lng });
    }
  }, [selectedIssueId]);

  // Compute Live dynamic health and grade for sectors based on real active issues
  const getSectorStats = (sectorId: string) => {
    let bounds = { minLat: 37.7550, maxLat: 37.7650, minLng: -122.4350, maxLng: -122.4220 }; // default Dolores
    let name = "Dolores Park Heights";
    if (sectorId === 'sec_valencia') {
      bounds = { minLat: 37.7600, maxLat: 37.7700, minLng: -122.4220, maxLng: -122.4150 };
      name = "Valencia Retail Corridor";
    } else if (sectorId === 'sec_market') {
      bounds = { minLat: 37.7680, maxLat: 37.7780, minLng: -122.4150, maxLng: -122.4050 };
      name = "Market North Transit Hub";
    }

    // Filter issues in sector boundaries
    const sectorIssues = issues.filter(iss => {
      const lat = iss.location.lat;
      const lng = iss.location.lng;
      return lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng;
    });

    let health = 100;
    sectorIssues.forEach(iss => {
      if (iss.status === 'Resolved') return;
      if (iss.severity === 'Critical') health -= 20;
      else if (iss.severity === 'High') health -= 15;
      else if (iss.severity === 'Medium') health -= 10;
      else health -= 5;
    });

    health = Math.max(25, health);

    let grade = 'A';
    if (health < 60) grade = 'D';
    else if (health < 72) grade = 'C';
    else if (health < 85) grade = 'B-';
    else if (health < 92) grade = 'B+';

    return { name, health: `${health}%`, grade, issueCount: sectorIssues.length };
  };

  const SECTORS_LIST = [
    { id: 'sec_dolores', path: 'M 30,180 L 190,180 L 190,420 L 30,420 Z' },
    { id: 'sec_valencia', path: 'M 190,120 L 340,120 L 340,360 L 190,360 Z' },
    { id: 'sec_market', path: 'M 340,30 L 520,30 L 520,240 L 340,240 Z' }
  ].map(s => {
    const stats = getSectorStats(s.id);
    return { ...s, ...stats };
  });

  const getCategoryColor = (category: CivicCategory) => {
    switch (category) {
      case 'Roads': return '#ef4444';
      case 'Sanitation': return '#f59e0b';
      case 'Utilities': return '#3b82f6';
      case 'Safety': return '#a855f7';
      case 'Environment': return '#10b981';
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

  const handlePinClicked = (iss: CivicIssue) => {
    onSelectIssue(iss);
    onTriggerExecution('MAP_PIN_CLICKED', { issueId: iss.id, title: iss.title });
  };

  // GPS User Location handler
  const handleDetectLocation = () => {
    setGpsLoading(true);
    setMapNotification(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLoading(false);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCenter({ lat, lng });
          setPlacedPin({ lat, lng });

          // Call reverse geocoder
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              setSelectedAddress(results[0].formatted_address);
              setSelectedPlaceId(results[0].place_id);
              setMapNotification({
                type: 'success',
                text: `Live coordinate locked at: ${results[0].formatted_address}`
              });
            } else {
              setSelectedAddress(`${lat.toFixed(5)}° N, ${lng.toFixed(5)}° W`);
              setMapNotification({
                type: 'info',
                text: `Live location locked. Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
              });
            }
          });
        },
        (error) => {
          setGpsLoading(false);
          console.error("GPS denial:", error);
          setMapNotification({
            type: 'error',
            text: "Browser GPS permission was denied or is unavailable. Fallback default coordinates active."
          });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsLoading(false);
      setMapNotification({
        type: 'error',
        text: "Your browser does not support Geolocation APIs."
      });
    }
  };

  const renderContent = () => (
    <div className="space-y-4 text-slate-300 font-sans">
      
      {/* 1. Map Control Board */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-[#0a0c12] p-4 border border-white/5 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <MapIcon className="h-4.5 w-4.5 text-indigo-400" />
          <div className="text-left">
            <h3 className="font-display font-semibold text-xs text-white">Intelligent GIS Space Workstation</h3>
            <span className="text-[9px] text-slate-500 font-mono">
              {hasValidKey ? "Connected to Google Maps Platform API" : "Simulated Offline telemetry grid map"}
            </span>
          </div>
        </div>

        {/* Places autocomplete search bar (Only loaded if real Google Map is active) */}
        {hasValidKey && (
          <PlaceSearchBox 
            onPlaceSelect={(details) => {
              setCenter({ lat: details.lat, lng: details.lng });
              setPlacedPin({ lat: details.lat, lng: details.lng });
              setSelectedAddress(details.address);
              setSelectedPlaceId(details.placeId);
              setMapNotification({
                type: 'success',
                text: `Place selected: ${details.address}`
              });
            }}
          />
        )}

        {/* Custom Layer Selectors */}
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 text-[9px] font-mono">
          {(['standard', 'heatmap', 'utilities', 'drainage'] as const).map(layer => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition cursor-pointer ${
                activeLayer === layer
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time floating Notification Toast banner */}
      {mapNotification && (
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition duration-200 ${
          mapNotification.type === 'error' ? 'bg-red-950/40 border-red-900/30 text-red-300' :
          mapNotification.type === 'success' ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-300' :
          'bg-indigo-950/40 border-indigo-900/30 text-indigo-300'
        }`}>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            <span className="font-medium text-left">{mapNotification.text}</span>
          </div>
          <button onClick={() => setMapNotification(null)} className="p-1 hover:bg-white/5 rounded">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* 2. Main Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Interactive map pane (3-cols) */}
        <div className="lg:col-span-3 bg-slate-950 border border-white/5 rounded-3xl relative overflow-hidden h-[480px] w-full">
          
          {hasValidKey ? (
            // --- LIVE GOOGLE MAPS IMPLEMENTATION ---
            <Map
                center={center}
                zoom={zoom}
                onCenterChanged={(e) => setCenter(e.detail.center)}
                onZoomChanged={(e) => setZoom(e.detail.zoom)}
                mapId="DEMO_MAP_ID"
                onClick={(e) => {
                  if (e.detail.latLng) {
                    const lat = e.detail.latLng.lat;
                    const lng = e.detail.latLng.lng;
                    setPlacedPin({ lat, lng });
                    
                    // Call Geocoder
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                      if (status === 'OK' && results?.[0]) {
                        setSelectedAddress(results[0].formatted_address);
                        setSelectedPlaceId(results[0].place_id);
                        setMapNotification({
                          type: 'info',
                          text: `Pin dropped at: ${results[0].formatted_address}`
                        });
                      } else {
                        setSelectedAddress(`${lat.toFixed(5)}° N, ${lng.toFixed(5)}° W`);
                        setSelectedPlaceId(undefined);
                      }
                    });
                  }
                }}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
                gestureHandling="greedy"
              >
                
                {/* 1. Live issues Markers */}
                {activeLayer === 'standard' && issues.map(iss => (
                  <AdvancedMarker
                    key={iss.id}
                    position={{ lat: iss.location.lat, lng: iss.location.lng }}
                    onClick={() => handlePinClicked(iss)}
                  >
                    <Pin
                      background={getCategoryColor(iss.category)}
                      glyphColor="#fff"
                      glyphText={getSeverityIcon(iss.severity)}
                      borderColor={selectedIssueId === iss.id ? '#ffffff' : getCategoryColor(iss.category)}
                      scale={selectedIssueId === iss.id ? 1.25 : 1}
                    />
                  </AdvancedMarker>
                ))}

                {/* 2. Placed / Clicked Coordinate PIN */}
                {placedPin && (
                  <AdvancedMarker 
                    position={placedPin}
                    draggable={true}
                    onDragEnd={(e) => {
                      if (e.latLng) {
                        const lat = e.latLng.lat();
                        const lng = e.latLng.lng();
                        setPlacedPin({ lat, lng });
                        const geocoder = new google.maps.Geocoder();
                        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                          if (status === 'OK' && results?.[0]) {
                            setSelectedAddress(results[0].formatted_address);
                            setSelectedPlaceId(results[0].place_id);
                            setMapNotification({
                              type: 'info',
                              text: `Dragged pin locked: ${results[0].formatted_address}`
                            });
                          } else {
                            setSelectedAddress(`${lat.toFixed(5)}° N, ${lng.toFixed(5)}° W`);
                          }
                        });
                      }
                    }}
                  >
                    <Pin background="#4f46e5" glyphText="➕" scale={1.2} />
                  </AdvancedMarker>
                )}

                {/* 3. Heatmap Layer overlay - Glowing Concentric severity index fields */}
                {activeLayer === 'heatmap' && issues.map(iss => {
                  const size = iss.severity === 'Critical' ? 180 : iss.severity === 'High' ? 120 : iss.severity === 'Medium' ? 85 : 50;
                  const color = iss.severity === 'Critical' ? '#ef4444' : iss.severity === 'High' ? '#f43f5e' : '#f59e0b';
                  const isResolved = iss.status === 'Resolved';

                  return (
                    <MapCircle
                      key={`heat-${iss.id}`}
                      center={{ lat: iss.location.lat, lng: iss.location.lng }}
                      radius={isResolved ? 20 : size}
                      options={{
                        fillColor: isResolved ? '#10b981' : color,
                        fillOpacity: isResolved ? 0.05 : 0.18,
                        strokeColor: isResolved ? '#10b981' : color,
                        strokeOpacity: 0.3,
                        strokeWeight: 1,
                        clickable: false
                      }}
                    />
                  );
                })}

                {/* 4. Utilities Infrastructure Layer overlay */}
                {activeLayer === 'utilities' && (
                  <>
                    {/* Draw simulated infrastructure vectors linking our SF coordinate centroids */}
                    <MapPolyline
                      path={[
                        { lat: 37.7610, lng: -122.4218 },
                        { lat: 37.7645, lng: -122.4110 },
                        { lat: 37.7712, lng: -122.4125 },
                        { lat: 37.7610, lng: -122.4218 }
                      ]}
                      options={{
                        strokeColor: '#0ea5e9',
                        strokeOpacity: 0.7,
                        strokeWeight: 2
                      }}
                    />
                    {issues.map(iss => (
                      <MapCircle
                        key={`utility-${iss.id}`}
                        center={{ lat: iss.location.lat, lng: iss.location.lng }}
                        radius={90}
                        options={{
                          fillColor: '#0ea5e9',
                          fillOpacity: 0.04,
                          strokeColor: '#0ea5e9',
                          strokeOpacity: 0.4,
                          strokeWeight: 1
                        }}
                      />
                    ))}
                  </>
                )}

                {/* 5. Hydrological / Drainage basin risk boundary map */}
                {activeLayer === 'drainage' && (
                  <>
                    <MapPolyline
                      path={[
                        { lat: 37.7550, lng: -122.4350 },
                        { lat: 37.7620, lng: -122.4290 },
                        { lat: 37.7690, lng: -122.4280 },
                        { lat: 37.7780, lng: -122.4150 }
                      ]}
                      options={{
                        strokeColor: '#10b981',
                        strokeOpacity: 0.6,
                        strokeWeight: 2
                      }}
                    />
                    <MapCircle
                      center={{ lat: 37.7598, lng: -122.4270 }}
                      radius={350}
                      options={{
                        fillColor: '#10b981',
                        fillOpacity: 0.05,
                        strokeColor: '#10b981',
                        strokeOpacity: 0.25,
                        strokeWeight: 1
                      }}
                    />
                  </>
                )}

                {/* 6. Concentric Impact Radii (100m, 250m, 500m, 1km) overlay for selected issue */}
                {selectedIssue && (
                  <>
                    {/* 100m Inner Impact Zone */}
                    <MapCircle
                      center={{ lat: selectedIssue.location.lat, lng: selectedIssue.location.lng }}
                      radius={100}
                      options={{
                        fillColor: '#ef4444',
                        fillOpacity: 0.12,
                        strokeColor: '#ef4444',
                        strokeOpacity: 0.6,
                        strokeWeight: 1.5,
                        clickable: false
                      }}
                    />
                    {/* 250m Secondary Proximity corridor */}
                    <MapCircle
                      center={{ lat: selectedIssue.location.lat, lng: selectedIssue.location.lng }}
                      radius={250}
                      options={{
                        fillColor: '#f97316',
                        fillOpacity: 0.06,
                        strokeColor: '#f97316',
                        strokeOpacity: 0.4,
                        strokeWeight: 1.2,
                        clickable: false
                      }}
                    />
                    {/* 500m Sector Warning Boundary */}
                    <MapCircle
                      center={{ lat: selectedIssue.location.lat, lng: selectedIssue.location.lng }}
                      radius={500}
                      options={{
                        fillColor: '#eab308',
                        fillOpacity: 0.03,
                        strokeColor: '#eab308',
                        strokeOpacity: 0.3,
                        strokeWeight: 1,
                        clickable: false
                      }}
                    />
                    {/* 1km Regional Buffer Zone */}
                    <MapCircle
                      center={{ lat: selectedIssue.location.lat, lng: selectedIssue.location.lng }}
                      radius={1000}
                      options={{
                        fillColor: '#3b82f6',
                        fillOpacity: 0.015,
                        strokeColor: '#3b82f6',
                        strokeOpacity: 0.2,
                        strokeWeight: 1,
                        clickable: false
                      }}
                    />
                  </>
                )}

                {/* 7. Clicked pin details / Info window */}
                {selectedIssue && (
                  <InfoWindow
                    position={{ lat: selectedIssue.location.lat, lng: selectedIssue.location.lng }}
                    onCloseClick={() => onSelectIssue(null as any)}
                  >
                    <div className="p-2 font-sans text-xs text-slate-800 max-w-[240px]">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[12px] truncate block pr-2">{selectedIssue.title}</span>
                        <span className={`px-1.5 py-0.2 text-[8px] font-bold rounded uppercase shrink-0 ${
                          selectedIssue.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                          selectedIssue.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {selectedIssue.severity}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedIssue.location.address}</p>
                      <p className="text-[10px] text-slate-600 mt-1.5 leading-normal line-clamp-2">{selectedIssue.description}</p>
                      
                      {selectedIssue.recommendedActions && selectedIssue.recommendedActions.length > 0 && (
                        <div className="mt-2 p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                          <span className="text-[8px] uppercase font-bold text-indigo-800 block">AI Next Step</span>
                          <span className="text-[10px] text-indigo-900 leading-snug">{selectedIssue.recommendedActions[0]}</span>
                        </div>
                      )}

                      <div className="flex gap-2 items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        {/* Route Navigation Link */}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selectedIssue.location.lat},${selectedIssue.location.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5"
                        >
                          Navigate <ArrowUpRight className="h-3 w-3" />
                        </a>
                        <span className="text-[10px] font-mono">Status: <strong>{selectedIssue.status}</strong></span>
                      </div>
                    </div>
                  </InfoWindow>
                )}

              </Map>
          ) : (
            // --- OFFLINE STANDARD VECTOR SIMULATOR BASE ---
            <div 
              className="w-full h-full relative cursor-crosshair"
              style={{
                backgroundImage: "radial-gradient(circle, #27272a 1px, transparent 1px), #09090b",
                backgroundSize: "24px 24px"
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const relativeY = y / rect.height;
                const relativeX = x / rect.width;
                
                const clickedLat = 37.7750 - (relativeY * 0.0200);
                const clickedLng = -122.4350 + (relativeX * 0.0250);

                setPlacedPin({ lat: clickedLat, lng: clickedLng });
                setSelectedAddress(`${Math.floor(100 + Math.random()*900)} Valencia St, San Francisco, CA 94103`);
                setMapNotification({
                  type: 'info',
                  text: `Offline pinpoint dropped near Valencia corridor.`
                });
              }}
            >
              {/* Radar scanner sweep effect */}
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-35">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-indigo-500/10 scale-0 animate-ping duration-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-indigo-500/5 animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] origin-top-left border-l border-indigo-500/15 animate-[spin_8s_linear_infinite]"></div>
              </div>

              {/* Grid Roads drawing */}
              <svg className="w-full h-full text-slate-800 opacity-20 pointer-events-none absolute inset-0" viewBox="0 0 560 420" xmlns="http://www.w3.org/2000/svg">
                <path d="M 30,120 L 520,120" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
                <path d="M 30,240 L 520,240" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
                <path d="M 190,30 L 190,400" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
                <path d="M 340,30 L 340,400" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
                <text x="80" y="110" fill="#fff" fontSize="8" fontFamily="monospace">19TH STREET</text>
                <text x="80" y="230" fill="#fff" fontSize="8" fontFamily="monospace">VALENCIA STREET</text>
              </svg>

              {/* Map Center Coordinate Anchor */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center opacity-30">
                <Compass className="h-6 w-6 text-slate-400 rotate-45 animate-spin duration-[10s]" />
                <span className="text-[9px] font-mono mt-1 text-slate-400">37.7610° N, 122.4218° W</span>
              </div>

              {/* Plot simulator issues pins */}
              {issues.map(issue => {
                const coord = mapCoordinates[issue.id] || { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 };
                const isSelected = selectedIssueId === issue.id;

                return (
                  <div
                    key={issue.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                    style={{ top: `${(coord.y / 420) * 100}%`, left: `${(coord.x / 560) * 100}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePinClicked(issue);
                    }}
                  >
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border text-[9px] text-white shadow-xl transition ${
                      isSelected ? 'scale-125 border-white bg-indigo-600' : 'border-slate-800'
                    }`} style={{ backgroundColor: isSelected ? undefined : getCategoryColor(issue.category) }}>
                      {getSeverityIcon(issue.severity)}
                    </div>
                  </div>
                );
              })}

              {/* Plot simulated placed pin */}
              {placedPin && (
                <div className="absolute -translate-x-1/2 -translate-y-1/2 z-30 animate-bounce" style={{ top: '50%', left: '50%' }}>
                  <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] border-2 border-white shadow-xl">
                    ➕
                  </div>
                </div>
              )}

              {/* Google Maps Required Splash Overlay panel */}
              <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-950/90 border border-slate-800 p-4 rounded-2xl shadow-2xl text-left flex items-start gap-3">
                <Info className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <span className="text-slate-100 text-xs font-bold block leading-tight">Google Maps Workspace Inactive</span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    This module is pre-integrated with real Google Maps API. Add your key in the top-right Settings cog gear menu &rarr; **Secrets** with name **GOOGLE_MAPS_PLATFORM_KEY** to toggle coordinates geocoding and live heatmaps.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* Floating Action GPS Center and Report Hazard buttons */}
          <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-2">
            <button
              onClick={handleDetectLocation}
              disabled={gpsLoading}
              className="p-2.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 rounded-full text-slate-300 hover:text-white shadow-lg transition flex items-center justify-center disabled:opacity-50 cursor-pointer"
              title="Detect Current GPS Location"
            >
              <Navigation className={`h-4 w-4 ${gpsLoading ? 'animate-spin text-indigo-400' : 'rotate-45'}`} />
            </button>

            {placedPin && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg shadow-lg flex items-center gap-1 transition cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Report Here</span>
              </button>
            )}
          </div>

        </div>

        {/* Dynamic Sector summaries sidebar pane (1-col) */}
        <div className="space-y-3 flex flex-col justify-between">
          <div className="p-4 bg-[#0a0c12] border border-white/5 rounded-2xl text-left space-y-3">
            <div className="flex items-center gap-1.5 border-b border-white/[0.04] pb-2">
              <Activity className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400">Sector Health Index</span>
            </div>
            
            <div className="space-y-2.5">
              {SECTORS_LIST.map(sec => {
                const isHovered = hoveredSector === sec.id;
                return (
                  <div 
                    key={sec.id}
                    className={`p-3 rounded-xl border transition duration-150 ${
                      isHovered
                        ? 'bg-indigo-500/10 border-indigo-500/30'
                        : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                    }`}
                    onMouseEnter={() => setHoveredSector(sec.id)}
                    onMouseLeave={() => setHoveredSector(null)}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <h5 className="text-[10px] font-bold text-white truncate leading-tight">{sec.name}</h5>
                      <span className={`text-[9px] font-bold px-1 py-0.2 rounded font-mono leading-none ${
                        sec.grade === 'A' ? 'text-emerald-400 bg-emerald-950/20' :
                        sec.grade.startsWith('B') ? 'text-indigo-400 bg-indigo-950/20' :
                        'text-rose-400 bg-rose-950/20'
                      }`}>{sec.grade}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2 pt-1 border-t border-white/[0.02] text-[8.5px] text-slate-500 font-medium">
                      <span>Heuristic health:</span>
                      <span className="font-bold text-slate-300 font-mono">{sec.health}</span>
                    </div>
                    <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono">
                      <span>Active tickets:</span>
                      <span>{sec.issueCount} anomalous pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive instruction box */}
          <div className="p-3 bg-indigo-950/10 border border-indigo-500/15 rounded-2xl text-left space-y-1">
            <h4 className="text-[10px] font-bold text-white flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              <span>GIS Workspace Guidance</span>
            </h4>
            <p className="text-[9px] text-slate-400 leading-relaxed">
              Double click on any road grid coordinate to lock onto a physical failure point. Slide/drag the pin or type in search bars to georeference municipal dispatch repairs immediately.
            </p>
          </div>
        </div>

      </div>

      {/* Built-in Report pinpointing modal handler */}
      <ReportIssueModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        selectedCoords={placedPin ? { lat: placedPin.lat, lng: placedPin.lng, address: selectedAddress } : null}
        onSubmitReport={async (reportData) => {
          if (onSubmitReport) {
            await onSubmitReport({
              ...reportData,
              location: {
                ...reportData.location,
                placeId: selectedPlaceId,
                geohash: encodeGeohash(reportData.location.lat, reportData.location.lng)
              }
            });
          }
          setIsReportModalOpen(false);
          setPlacedPin(null);
        }}
      />

    </div>
  );

  return hasValidKey ? (
    <APIProvider apiKey={API_KEY} version="weekly">
      {renderContent()}
    </APIProvider>
  ) : (
    renderContent()
  );
}
