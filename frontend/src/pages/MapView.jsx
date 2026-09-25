import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Truck,
  Building2,
  HeartHandshake,
  Compass,
  Navigation,
  Info,
  RotateCw,
  Search,
  Filter,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Users,
  Package,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Phone,
  User,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';

/**
 * Custom SVG DivIcon generator for Leaflet markers:
 * - RED: Critical demand (Urgency 5) with pulsing alert animation
 * - YELLOW: High demand (Urgency 4) with warning indicator
 * - GREEN: Normal facility (Urgency 1-3 or standard shelter/hub)
 * - BLUE: Active logistics vehicle
 */
function createMarkerIcon(markerType, label, isSelected = false) {
  const selectedRing = isSelected ? 'ring-4 ring-cyan-400 ring-offset-2 scale-110 z-30' : '';

  if (markerType === 'RED') {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="relative flex flex-col items-center group cursor-pointer transition-transform ${selectedRing}">
          <span class="absolute -top-1 w-9 h-9 rounded-full bg-rose-500/35 animate-ping"></span>
          <div class="relative w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 border-2 border-white shadow-lg shadow-rose-600/50 flex items-center justify-center text-white">
            <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <span class="mt-1 px-1.5 py-0.5 rounded-md bg-slate-900/90 text-white text-[9px] font-extrabold tracking-tight whitespace-nowrap shadow-sm pointer-events-none">
            ${label || 'CRITICAL'}
          </span>
        </div>
      `,
      iconSize: [36, 48],
      iconAnchor: [18, 20],
      popupAnchor: [0, -22],
    });
  }

  if (markerType === 'YELLOW') {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="relative flex flex-col items-center group cursor-pointer transition-transform ${selectedRing}">
          <span class="absolute -top-1 w-8 h-8 rounded-full bg-amber-400/30 animate-pulse"></span>
          <div class="relative w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 border-2 border-white shadow-lg shadow-amber-500/50 flex items-center justify-center text-slate-950">
            <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <span class="mt-1 px-1.5 py-0.5 rounded-md bg-slate-900/90 text-white text-[9px] font-bold tracking-tight whitespace-nowrap shadow-sm pointer-events-none">
            ${label || 'HIGH'}
          </span>
        </div>
      `,
      iconSize: [36, 48],
      iconAnchor: [18, 20],
      popupAnchor: [0, -22],
    });
  }

  if (markerType === 'BLUE') {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="relative flex flex-col items-center group cursor-pointer transition-transform ${selectedRing}">
          <span class="absolute -top-1 w-8 h-8 rounded-full bg-sky-400/35 animate-ping"></span>
          <div class="relative w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 border-2 border-white shadow-lg shadow-sky-500/50 flex items-center justify-center text-white">
            <svg class="w-4 h-4 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1"/>
            </svg>
          </div>
          <span class="mt-1 px-1.5 py-0.5 rounded-md bg-slate-900/90 text-cyan-300 font-mono text-[9px] font-bold tracking-tight whitespace-nowrap shadow-sm pointer-events-none">
            ${label || 'VEHICLE'}
          </span>
        </div>
      `,
      iconSize: [36, 48],
      iconAnchor: [18, 20],
      popupAnchor: [0, -22],
    });
  }

  // GREEN = Normal
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="relative flex flex-col items-center group cursor-pointer transition-transform ${selectedRing}">
        <div class="relative w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-500 border-2 border-white shadow-md shadow-emerald-600/40 flex items-center justify-center text-white">
          <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <span class="mt-1 px-1.5 py-0.5 rounded-md bg-slate-900/90 text-emerald-300 text-[9px] font-bold tracking-tight whitespace-nowrap shadow-sm pointer-events-none">
          ${label || 'NORMAL'}
        </span>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 20],
    popupAnchor: [0, -22],
  });
}

/**
 * Builds HTML for Leaflet Popups
 * Meets requirement:
 * Location name, Population, Required food, Urgency, Recommended allocation
 */
function buildLocationPopupHtml(loc) {
  const urgencyColor =
    loc.urgency >= 5
      ? 'bg-rose-100 text-rose-800 border-rose-300'
      : loc.urgency >= 4
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : 'bg-emerald-100 text-emerald-800 border-emerald-300';

  const markerBadge =
    loc.marker_type === 'RED'
      ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-600 text-white">CRITICAL</span>'
      : loc.marker_type === 'YELLOW'
      ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-slate-950">HIGH DEMAND</span>'
      : '<span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-600 text-white">NORMAL</span>';

  return `
    <div style="min-width: 240px; padding: 14px; font-family: system-ui, -apple-system, sans-serif;">
      <!-- Title & Type Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px;">
        <div>
          <div style="font-weight: 800; font-size: 14px; color: #0F172A; line-height: 1.2;">${loc.name}</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">${loc.type?.replace(/_/g, ' ') || 'Facility Hub'}</div>
        </div>
        <div>${markerBadge}</div>
      </div>

      <!-- Required Prompt Fields -->
      <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 7px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #64748B; font-weight: 500;">Population:</span>
          <span style="font-weight: 700; color: #0F172A;">${Number(loc.population || 0).toLocaleString()} people</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #64748B; font-weight: 500;">Required food:</span>
          <span style="font-weight: 800; color: #E11D48;">${Number(loc.required_food || 0).toLocaleString()} units</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #64748B; font-weight: 500;">Urgency:</span>
          <span style="font-weight: 800; padding: 1px 6px; border-radius: 6px; font-size: 11px; border: 1px solid; ${urgencyColor}">
            ${loc.urgency}/5 &bull; ${loc.urgency_label || 'NORMAL'}
          </span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; padding-top: 6px; margin-top: 2px;">
          <span style="color: #64748B; font-weight: 600;">Recommended allocation:</span>
          <span style="font-weight: 800; color: #059669; font-size: 13px;">${Number(loc.recommended_allocation || 0).toLocaleString()} units</span>
        </div>
      </div>

      <div style="margin-top: 10px; padding: 6px 8px; border-radius: 8px; background: #F8FAFC; border: 1px solid #E2E8F0; font-size: 10px; color: #475569;">
        ${loc.allocation_reason || 'Algorithmic route priority verified.'}
      </div>
    </div>
  `;
}

function buildVehiclePopupHtml(veh) {
  return `
    <div style="min-width: 230px; padding: 14px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px;">
        <div style="font-weight: 800; font-size: 14px; color: #0F172A; font-family: monospace;">${veh.vehicle_number}</div>
        <span style="padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: 800; background: #E0F2FE; color: #0369A1; border: 1px solid #BAE6FD;">
          ${veh.status}
        </span>
      </div>

      <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 7px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748B; font-weight: 500;">Unit Type:</span>
          <span style="font-weight: 700; color: #0F172A;">Refrigerated Fleet</span>
        </div>

        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748B; font-weight: 500;">Payload Capacity:</span>
          <span style="font-weight: 800; color: #0284C7;">${veh.capacity} kg</span>
        </div>

        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748B; font-weight: 500;">Current GPS:</span>
          <span style="font-mono; font-size: 11px; color: #64748B;">${veh.latitude.toFixed(4)}, ${veh.longitude.toFixed(4)}</span>
        </div>
      </div>
    </div>
  `;
}

export const MapView = () => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [summary, setSummary] = useState({
    total_locations: 0,
    critical_demand: 0,
    high_demand: 0,
    normal: 0,
    vehicles: 0,
  });

  const [filterType, setFilterType] = useState('ALL'); // ALL, RED, YELLOW, GREEN, BLUE
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);

  // Fetch map data from backend API
  const fetchMapData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all map data from backend API (PostgreSQL live)
      const res = await api.get('/map');
      if (res.data?.success) {
        const locs = res.data.data.locations || [];
        const vehs = res.data.data.vehicles || [];
        setLocations(locs);
        setVehicles(vehs);
        setSummary(res.data.summary || {});

        if (!selectedNode && locs.length > 0) {
          // Default selection to critical or first location
          const criticalLoc = locs.find((l) => l.marker_type === 'RED') || locs[0];
          setSelectedNode(criticalLoc);
        }
      } else {
        setError('Failed to load map data from backend API.');
      }
    } catch (err) {
      console.error('Error fetching map data:', err);
      setError(err.response?.data?.message || err.message || 'Unable to connect to backend map service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  // Initialize Leaflet Map with OpenStreetMap
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center around San Francisco / Bay Area region
      const map = L.map(mapContainerRef.current, {
        center: [37.7749, -122.4194],
        zoom: 12,
        zoomControl: false,
      });

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Marker group layer
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      // Clean up on component unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Render markers whenever locations, vehicles, filter, or selectedNode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    const bounds = L.latLngBounds();

    // 1. Render Location Markers (RED, YELLOW, GREEN)
    locations.forEach((loc) => {
      if (
        filterType !== 'ALL' &&
        filterType !== 'LOCATIONS' &&
        filterType !== loc.marker_type
      ) {
        return;
      }

      // Filter by search query if present
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          loc.name.toLowerCase().includes(q) ||
          loc.type?.toLowerCase().includes(q) ||
          loc.contact_person?.toLowerCase().includes(q);
        if (!matches) return;
      }

      if (loc.latitude && loc.longitude) {
        const isSelected = selectedNode && selectedNode.id === loc.id && !selectedNode.vehicle_number;
        const icon = createMarkerIcon(
          loc.marker_type,
          loc.marker_type === 'RED' ? 'CRITICAL' : loc.marker_type === 'YELLOW' ? 'HIGH' : 'NORMAL',
          isSelected
        );

        const marker = L.marker([loc.latitude, loc.longitude], { icon });

        // When a marker is clicked show: Location name, Population, Required food, Urgency, Recommended allocation
        marker.bindPopup(buildLocationPopupHtml(loc), {
          closeButton: true,
          autoPan: true,
          offset: [0, -10],
        });

        marker.on('click', () => {
          setSelectedNode(loc);
        });

        markersLayer.addLayer(marker);
        bounds.extend([loc.latitude, loc.longitude]);

        // If this marker is selected, open popup
        if (isSelected) {
          marker.openPopup();
        }
      }
    });

    // 2. Render Vehicle Markers (BLUE)
    if (filterType === 'ALL' || filterType === 'BLUE' || filterType === 'VEHICLES') {
      vehicles.forEach((veh) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            veh.vehicle_number.toLowerCase().includes(q) ||
            veh.status.toLowerCase().includes(q);
          if (!matches) return;
        }

        if (veh.latitude && veh.longitude) {
          const isSelected = selectedNode && selectedNode.id === veh.id && selectedNode.vehicle_number;
          const icon = createMarkerIcon('BLUE', veh.vehicle_number.split('-').pop() || 'VAN', isSelected);

          const marker = L.marker([veh.latitude, veh.longitude], { icon });
          marker.bindPopup(buildVehiclePopupHtml(veh), {
            closeButton: true,
            autoPan: true,
            offset: [0, -10],
          });

          marker.on('click', () => {
            setSelectedNode(veh);
          });

          markersLayer.addLayer(marker);
          bounds.extend([veh.latitude, veh.longitude]);

          if (isSelected) {
            marker.openPopup();
          }
        }
      });
    }

    // Fit bounds if we have points and not currently focusing a specific single node
    if (bounds.isValid() && !selectedNode) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [locations, vehicles, filterType, searchQuery, selectedNode]);

  // Handle center / zoom to selected node
  const handleSelectNode = (node) => {
    setSelectedNode(node);
    const map = mapInstanceRef.current;
    if (map && node.latitude && node.longitude) {
      map.flyTo([node.latitude, node.longitude], 14, {
        duration: 1.2,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-cyan-600" />
            Geospatial Demand Radar & Live Map
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Live OpenStreetMap coordinates displaying critical demand, high urgency hubs, normal facilities, and transit fleet.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            icon={RotateCw}
            isLoading={loading}
            onClick={fetchMapData}
            title="Reload live coordinates from PostgreSQL API"
          >
            Refresh
          </Button>

          <Link to="/allocation">
            <Button variant="primary" size="sm" icon={Sparkles} className="shadow-sm shadow-cyan-500/20">
              Run Matcher
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Filter Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setFilterType('ALL')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterType === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">All Pins</span>
            <Layers className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-xl font-black mt-1">
            {summary.total_locations + summary.vehicles}
          </div>
          <span className="text-[10px] opacity-70 mt-0.5 block">Total active nodes</span>
        </button>

        {/* RED = Critical demand */}
        <button
          onClick={() => setFilterType('RED')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterType === 'RED'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
              : 'bg-rose-50/50 border-rose-200 hover:bg-rose-50 text-rose-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Critical (RED)
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black mt-1">{summary.critical_demand}</div>
          <span className="text-[10px] opacity-80 mt-0.5 block">Urgency Level 5</span>
        </button>

        {/* YELLOW = High demand */}
        <button
          onClick={() => setFilterType('YELLOW')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterType === 'YELLOW'
              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
              : 'bg-amber-50/50 border-amber-200 hover:bg-amber-50 text-amber-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              High (YELLOW)
            </span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black mt-1">{summary.high_demand}</div>
          <span className="text-[10px] opacity-80 mt-0.5 block">Urgency Level 4</span>
        </button>

        {/* GREEN = Normal */}
        <button
          onClick={() => setFilterType('GREEN')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterType === 'GREEN'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
              : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50 text-emerald-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Normal (GREEN)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black mt-1">{summary.normal}</div>
          <span className="text-[10px] opacity-80 mt-0.5 block">Level 1-3 & Hubs</span>
        </button>

        {/* BLUE = Vehicle */}
        <button
          onClick={() => setFilterType('BLUE')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterType === 'BLUE'
              ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20'
              : 'bg-sky-50/50 border-sky-200 hover:bg-sky-50 text-sky-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Fleet (BLUE)
            </span>
            <Truck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-black mt-1">{summary.vehicles}</div>
          <span className="text-[10px] opacity-80 mt-0.5 block">Transit Vehicles</span>
        </button>
      </div>

      {/* Main Map Visualizer & Node Intel Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3 rounded-3xl bg-white border border-slate-200 relative overflow-hidden shadow-xs flex flex-col h-[600px]">
          {/* Top Floating Map Controls */}
          <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
            {/* Search Input on Map */}
            <div className="relative w-full sm:w-72 pointer-events-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search location by name..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 text-xs shadow-md focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Visual Legend Overlay */}
            <div className="hidden md:flex items-center gap-2 p-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-[11px] font-bold shadow-md pointer-events-auto">
              <span className="inline-flex items-center gap-1 text-rose-700 px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                RED: Critical
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                YELLOW: High
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                GREEN: Normal
              </span>
              <span className="inline-flex items-center gap-1 text-sky-700 px-2 py-0.5 rounded bg-sky-50 border border-sky-200">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                BLUE: Vehicle
              </span>
            </div>
          </div>

          {/* Map Target Div */}
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Bottom GPS Coordinates Banner */}
          <div className="absolute bottom-3 left-3 z-[1000] px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 text-[11px] font-mono text-slate-600 shadow-xs pointer-events-none">
            Leaflet &bull; OpenStreetMap Live Engine
          </div>
        </div>

        {/* Selected Marker Intel Panel */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-600" />
                Selected Marker Intel
              </h2>
              {selectedNode && (
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  ID #{selectedNode.id}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                {/* Node Header */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {selectedNode.marker_type === 'RED' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        CRITICAL DEMAND
                      </span>
                    )}
                    {selectedNode.marker_type === 'YELLOW' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                        HIGH DEMAND
                      </span>
                    )}
                    {selectedNode.marker_type === 'GREEN' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        NORMAL DEMAND
                      </span>
                    )}
                    {selectedNode.marker_type === 'BLUE' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-100 text-sky-800 border border-sky-200">
                        TRANSIT VEHICLE
                      </span>
                    )}

                    <span className="text-[10px] font-bold text-slate-500">
                      {selectedNode.type?.replace(/_/g, ' ') || 'Fleet Vehicle'}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {selectedNode.name || selectedNode.vehicle_number}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {selectedNode.latitude?.toFixed(4)}, {selectedNode.longitude?.toFixed(4)}
                  </p>
                </div>

                {/* Core Required Metrics Cards */}
                {!selectedNode.vehicle_number ? (
                  <div className="space-y-2 text-xs">
                    {/* Location Name */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Location name:</span>
                      <span className="font-bold text-slate-900 text-right">{selectedNode.name}</span>
                    </div>

                    {/* Population */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Population:
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {Number(selectedNode.population || 0).toLocaleString()} people
                      </span>
                    </div>

                    {/* Required Food */}
                    <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
                      <span className="text-rose-700 font-medium flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-rose-500" />
                        Required food:
                      </span>
                      <span className="font-black text-rose-700 text-sm">
                        {Number(selectedNode.required_food || 0).toLocaleString()} units
                      </span>
                    </div>

                    {/* Urgency */}
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                      <span className="text-amber-800 font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Urgency:
                      </span>
                      <span className="font-extrabold text-amber-900">
                        {selectedNode.urgency}/5 &bull; {selectedNode.urgency_label || 'NORMAL'}
                      </span>
                    </div>

                    {/* Recommended Allocation */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                      <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Recommended allocation:
                      </span>
                      <span className="font-black text-emerald-700 text-sm">
                        {Number(selectedNode.recommended_allocation || 0).toLocaleString()} units
                      </span>
                    </div>

                    {/* Contact details */}
                    {selectedNode.contact_person && (
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Contact: <strong>{selectedNode.contact_person}</strong></span>
                        </div>
                        {selectedNode.contact_phone && (
                          <div className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{selectedNode.contact_phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Vehicle Detail Cards */
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Vehicle Unit:</span>
                      <span className="font-bold text-slate-900 font-mono">{selectedNode.vehicle_number}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200 flex items-center justify-between">
                      <span className="text-sky-800 font-medium">Payload Capacity:</span>
                      <span className="font-black text-sky-900">{selectedNode.capacity} kg</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Operating Status:</span>
                      <span className="font-extrabold text-cyan-800">{selectedNode.status}</span>
                    </div>
                  </div>
                )}

                {/* Action Link */}
                <Link to="/allocation" className="block pt-1">
                  <Button variant="primary" size="sm" icon={Sparkles} className="w-full text-xs">
                    Proceed to Allocation Engine
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                Click any marker on the map to inspect its real-time demand and recommended allocation.
              </div>
            )}
          </div>

          {/* Quick Hub Navigation List */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-[11px] font-bold uppercase text-slate-400 px-1">
              Active Network Hubs ({locations.length})
            </h4>
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {locations.map((loc) => {
                const isSelected = selectedNode?.id === loc.id && !selectedNode?.vehicle_number;
                return (
                  <button
                    key={loc.id}
                    onClick={() => handleSelectNode(loc)}
                    className={`w-full p-2 rounded-xl text-left text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-50 border border-cyan-300 font-bold text-cyan-900'
                        : 'bg-slate-50/70 hover:bg-slate-100 border border-slate-200/70 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-semibold">{loc.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Req: {loc.required_food} u &bull; Urg: {loc.urgency}/5
                      </div>
                    </div>
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        loc.marker_type === 'RED'
                          ? 'bg-rose-500'
                          : loc.marker_type === 'YELLOW'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
