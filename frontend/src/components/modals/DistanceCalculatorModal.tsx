import { useState, useEffect, useRef } from 'react';
import { Map, Marker, ZoomControl, GeoJson } from 'pigeon-maps';
import { DraggableModal } from '../common/DraggableModal';

interface DistanceCalculatorModalProps {
    show: boolean;
    onClose: () => void;
    onDistanceCalculated: (distanceKm: number, origin: string, destination: string) => void;
}

interface GeoPoint {
    lat: number;
    lng: number;
    label: string;
}

interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
}

type SelectionMode = 'none' | 'origin' | 'waypoint' | 'destination';
type MapStyle = 'default' | 'satellite';
type CoordInputMode = 'search' | 'latlong' | 'utm';

// UTM to LatLong conversion (simplified for Brazil - zones 21-25)
function utmToLatLong(easting: number, northing: number, zone: number, hemisphere: 'N' | 'S'): { lat: number; lng: number } {
    const k0 = 0.9996;
    const a = 6378137; // WGS84 semi-major axis
    const e = 0.081819191; // WGS84 eccentricity
    const e1sq = 0.006739497;

    const arc = northing / k0;
    const mu = arc / (a * (1 - Math.pow(e, 2) / 4 - 3 * Math.pow(e, 4) / 64 - 5 * Math.pow(e, 6) / 256));

    const e1 = (1 - Math.pow(1 - e * e, 0.5)) / (1 + Math.pow(1 - e * e, 0.5));
    const phi1 = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu)
        + (21 * Math.pow(e1, 2) / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu)
        + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu);

    const n0 = a / Math.pow(1 - Math.pow(e * Math.sin(phi1), 2), 0.5);
    const r0 = a * (1 - e * e) / Math.pow(1 - Math.pow(e * Math.sin(phi1), 2), 1.5);
    const fact1 = n0 * Math.tan(phi1) / r0;

    const _a1 = 500000 - easting;
    const dd0 = _a1 / (n0 * k0);
    const fact2 = dd0 * dd0 / 2;
    const t0 = Math.pow(Math.tan(phi1), 2);
    const Q0 = e1sq * Math.pow(Math.cos(phi1), 2);
    const fact3 = (5 + 3 * t0 + 10 * Q0 - 4 * Q0 * Q0 - 9 * e1sq) * Math.pow(dd0, 4) / 24;
    const fact4 = (61 + 90 * t0 + 298 * Q0 + 45 * t0 * t0 - 252 * e1sq - 3 * Q0 * Q0) * Math.pow(dd0, 6) / 720;

    const lof1 = _a1 / (n0 * k0);
    const lof2 = (1 + 2 * t0 + Q0) * Math.pow(dd0, 3) / 6;
    const lof3 = (5 - 2 * Q0 + 28 * t0 - 3 * Math.pow(Q0, 2) + 8 * e1sq + 24 * Math.pow(t0, 2)) * Math.pow(dd0, 5) / 120;

    const _a2 = (lof1 - lof2 + lof3) / Math.cos(phi1);
    const _a3 = _a2 * 180 / Math.PI;

    let lat = 180 * (phi1 - fact1 * (fact2 + fact3 + fact4)) / Math.PI;
    let lng = ((zone > 0) ? (6 * zone - 183) : 3) - _a3;

    if (hemisphere === 'S') {
        lat = -lat;
    }

    return { lat, lng };
}

// Satellite tile provider (using ESRI)
function satelliteProvider(x: number, y: number, z: number): string {
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
}

// Default OSM tile provider
function osmProvider(x: number, y: number, z: number): string {
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

export function DistanceCalculatorModal({ show, onClose, onDistanceCalculated }: DistanceCalculatorModalProps) {
    // State
    const [waypoints, setWaypoints] = useState<GeoPoint[]>([]); // [origin, ...intermediates, destination]
    const [originSearch, setOriginSearch] = useState('');
    const [destinationSearch, setDestinationSearch] = useState('');
    const [originResults, setOriginResults] = useState<SearchResult[]>([]);
    const [destinationResults, setDestinationResults] = useState<SearchResult[]>([]);
    const [route, setRoute] = useState<[number, number][]>([]);
    const [distance, setDistance] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [center, setCenter] = useState<[number, number]>([-15.7801, -47.9292]);
    const [zoom, setZoom] = useState(4);

    // New features state
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('none');
    const [mapStyle, setMapStyle] = useState<MapStyle>('default');
    const [coordInputMode, setCoordInputMode] = useState<CoordInputMode>('search');
    const [coordLat, setCoordLat] = useState('');
    const [coordLng, setCoordLng] = useState('');
    const [utmEasting, setUtmEasting] = useState('');
    const [utmNorthing, setUtmNorthing] = useState('');
    const [utmZone, setUtmZone] = useState('23');
    const [utmHemisphere, setUtmHemisphere] = useState<'N' | 'S'>('S');

    // Custom path mode (manual polyline)
    const [routeMode, setRouteMode] = useState<'auto' | 'custom'>('auto');
    const [customPathPoints, setCustomPathPoints] = useState<GeoPoint[]>([]);
    const [isAddingCustomPoints, setIsAddingCustomPoints] = useState(false);

    // Route naming
    const [routeName, setRouteName] = useState('');

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Helper to get origin and destination from waypoints
    const origin = waypoints.length > 0 ? waypoints[0] : null;
    const destination = waypoints.length > 1 ? waypoints[waypoints.length - 1] : null;
    const intermediates = waypoints.length > 2 ? waypoints.slice(1, -1) : [];

    // Reverse geocode to get address from coordinates
    const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
                { headers: { 'Accept-Language': 'pt-BR' } }
            );
            const data = await response.json();
            return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        } catch {
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    };

    // Haversine formula for straight-line distance
    const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Calculate total custom path distance
    const calculateCustomPathDistance = (points: GeoPoint[]): number => {
        let total = 0;
        for (let i = 1; i < points.length; i++) {
            total += haversineDistance(
                points[i - 1].lat, points[i - 1].lng,
                points[i].lat, points[i].lng
            );
        }
        return total;
    };

    // Handle map click
    const handleMapClick = async ({ latLng }: { latLng: [number, number] }) => {
        const [lat, lng] = latLng;

        // Custom path mode - add points continuously
        if (routeMode === 'custom' && isAddingCustomPoints) {
            const label = `Ponto ${customPathPoints.length + 1}`;
            const point: GeoPoint = { lat, lng, label };
            const newPoints = [...customPathPoints, point];
            setCustomPathPoints(newPoints);

            // Build route polyline from custom points
            const routeCoords: [number, number][] = newPoints.map(p => [p.lat, p.lng]);
            setRoute(routeCoords);

            // Calculate distance
            const totalDistance = calculateCustomPathDistance(newPoints);
            setDistance(totalDistance);
            setDuration(null); // No duration for custom path

            return;
        }

        if (selectionMode === 'none') return;

        const label = await reverseGeocode(lat, lng);
        const point: GeoPoint = { lat, lng, label };

        if (selectionMode === 'origin') {
            if (waypoints.length === 0) {
                setWaypoints([point]);
            } else {
                setWaypoints([point, ...waypoints.slice(1)]);
            }
            setOriginSearch(label.split(',')[0]);
            setSelectionMode('none');
        } else if (selectionMode === 'destination') {
            if (waypoints.length === 0) {
                setWaypoints([point]);
            } else if (waypoints.length === 1) {
                setWaypoints([...waypoints, point]);
            } else {
                setWaypoints([...waypoints.slice(0, -1), point]);
            }
            setDestinationSearch(label.split(',')[0]);
            setSelectionMode('none');
        } else if (selectionMode === 'waypoint') {
            // Insert before destination
            if (waypoints.length < 2) {
                // Need at least origin and destination first
                alert('Defina origem e destino primeiro');
                return;
            }
            const newWaypoints = [...waypoints];
            newWaypoints.splice(waypoints.length - 1, 0, point);
            setWaypoints(newWaypoints);
            setSelectionMode('none');
        }
    };

    // Add point from coordinates
    const addFromCoords = async (isOrigin: boolean) => {
        let lat: number, lng: number;

        if (coordInputMode === 'latlong') {
            lat = parseFloat(coordLat.replace(',', '.'));
            lng = parseFloat(coordLng.replace(',', '.'));
            if (isNaN(lat) || isNaN(lng)) {
                alert('Coordenadas inválidas');
                return;
            }
        } else if (coordInputMode === 'utm') {
            const easting = parseFloat(utmEasting.replace(',', '.'));
            const northing = parseFloat(utmNorthing.replace(',', '.'));
            const zone = parseInt(utmZone);
            if (isNaN(easting) || isNaN(northing) || isNaN(zone)) {
                alert('Coordenadas UTM inválidas');
                return;
            }
            const converted = utmToLatLong(easting, northing, zone, utmHemisphere);
            lat = converted.lat;
            lng = converted.lng;
        } else {
            return;
        }

        const label = await reverseGeocode(lat, lng);
        const point: GeoPoint = { lat, lng, label };

        if (isOrigin) {
            if (waypoints.length === 0) {
                setWaypoints([point]);
            } else {
                setWaypoints([point, ...waypoints.slice(1)]);
            }
            setOriginSearch(label.split(',')[0]);
        } else {
            if (waypoints.length === 0) {
                setWaypoints([point]);
            } else if (waypoints.length === 1) {
                setWaypoints([...waypoints, point]);
            } else {
                setWaypoints([...waypoints.slice(0, -1), point]);
            }
            setDestinationSearch(label.split(',')[0]);
        }

        // Center map on point
        setCenter([lat, lng]);
        setZoom(12);

        // Clear inputs
        setCoordLat('');
        setCoordLng('');
        setUtmEasting('');
        setUtmNorthing('');
    };

    // Search for addresses using Nominatim (OpenStreetMap)
    const searchAddress = async (query: string, isOrigin: boolean) => {
        if (query.length < 3) {
            if (isOrigin) setOriginResults([]);
            else setDestinationResults([]);
            return;
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=5`,
                { headers: { 'Accept-Language': 'pt-BR' } }
            );
            const data: SearchResult[] = await response.json();

            if (isOrigin) setOriginResults(data);
            else setDestinationResults(data);
        } catch (err) {
            console.error('Search error:', err);
        }
    };

    // Debounced search
    const handleSearchChange = (value: string, isOrigin: boolean) => {
        if (isOrigin) setOriginSearch(value);
        else setDestinationSearch(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            searchAddress(value, isOrigin);
        }, 500);
    };

    // Select a location from search results
    const selectLocation = (result: SearchResult, isOrigin: boolean) => {
        const point: GeoPoint = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            label: result.display_name
        };

        if (isOrigin) {
            if (waypoints.length === 0) {
                setWaypoints([point]);
            } else {
                setWaypoints([point, ...waypoints.slice(1)]);
            }
            setOriginSearch(result.display_name.split(',')[0]);
            setOriginResults([]);
        } else {
            if (waypoints.length === 0) {
                setWaypoints([point]);
            } else if (waypoints.length === 1) {
                setWaypoints([...waypoints, point]);
            } else {
                setWaypoints([...waypoints.slice(0, -1), point]);
            }
            setDestinationSearch(result.display_name.split(',')[0]);
            setDestinationResults([]);
        }
    };

    // Calculate route when waypoints change
    useEffect(() => {
        if (waypoints.length >= 2) {
            calculateRoute();
            // Center map between all points
            const lats = waypoints.map(w => w.lat);
            const lngs = waypoints.map(w => w.lng);
            const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
            const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
            setCenter([midLat, midLng]);
            setZoom(6);
        }
    }, [waypoints]);

    // Calculate route using OSRM with waypoints
    const calculateRoute = async () => {
        if (waypoints.length < 2) return;

        setLoading(true);
        setError('');

        try {
            // Build coordinates string for OSRM
            const coordsStr = waypoints.map(w => `${w.lng},${w.lat}`).join(';');

            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`
            );

            if (!response.ok) throw new Error('Erro ao calcular rota');

            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                const routeData = data.routes[0];
                const coords = routeData.geometry.coordinates.map(
                    (c: [number, number]) => [c[1], c[0]] as [number, number]
                );

                setRoute(coords);
                setDistance(routeData.distance / 1000); // Convert to km
                setDuration(routeData.duration / 60); // Convert to minutes
            } else {
                throw new Error('Nenhuma rota encontrada');
            }
        } catch (err: any) {
            console.error('Route error:', err);
            setError(err.message || 'Erro ao calcular rota');
            setRoute([]);
            setDistance(null);
        } finally {
            setLoading(false);
        }
    };

    // Remove a waypoint
    const removeWaypoint = (index: number) => {
        const newWaypoints = waypoints.filter((_, i) => i !== index);
        setWaypoints(newWaypoints);
        if (index === 0) setOriginSearch('');
        if (index === waypoints.length - 1) setDestinationSearch('');
    };

    // Remove a custom path point
    const removeCustomPathPoint = (index: number) => {
        const newPoints = customPathPoints.filter((_, i) => i !== index);
        setCustomPathPoints(newPoints);
        if (newPoints.length > 1) {
            setRoute(newPoints.map(p => [p.lat, p.lng]));
            setDistance(calculateCustomPathDistance(newPoints));
        } else {
            setRoute([]);
            setDistance(null);
        }
    };

    // Clear custom path
    const clearCustomPath = () => {
        setCustomPathPoints([]);
        setRoute([]);
        setDistance(null);
        setDuration(null);
    };

    // Confirm and close
    const handleConfirm = () => {
        if (distance !== null) {
            let originLabel: string;
            let destinationLabel: string;

            if (routeMode === 'custom' && customPathPoints.length >= 2) {
                // Custom path mode
                originLabel = routeName || `Trajeto Personalizado (${customPathPoints.length} pontos)`;
                destinationLabel = `${customPathPoints.length} pontos - ${distance.toFixed(2)} km`;
            } else if (origin && destination) {
                // Auto route mode
                originLabel = routeName || origin.label;
                destinationLabel = destination.label;
            } else {
                return;
            }

            onDistanceCalculated(
                Math.round(distance * 100) / 100,
                originLabel,
                destinationLabel
            );
            onClose();
        }
    };

    // Reset state when modal closes
    useEffect(() => {
        if (!show) {
            setWaypoints([]);
            setOriginSearch('');
            setDestinationSearch('');
            setOriginResults([]);
            setDestinationResults([]);
            setRoute([]);
            setDistance(null);
            setDuration(null);
            setError('');
            setCenter([-15.7801, -47.9292]);
            setZoom(4);
            setSelectionMode('none');
            setCoordInputMode('search');
            setRouteMode('auto');
            setCustomPathPoints([]);
            setIsAddingCustomPoints(false);
            setRouteName('');
        }
    }, [show]);

    if (!show) return null;

    const inputStyle = {
        width: '100%', padding: '8px 10px', borderRadius: '4px',
        border: '1px solid #374151', background: '#1f2937', color: 'white',
        fontSize: '0.9em'
    };

    const buttonStyle = (active: boolean) => ({
        padding: '6px 12px',
        background: active ? '#3b82f6' : '#374151',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '0.85em'
    });

    return (
        <DraggableModal
            isOpen={show}
            onClose={onClose}
            title="📍 Calcular Distância de Transporte"
            width="95%"
            maxWidth="1000px"
            height="90vh"
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* Toolbar */}
                <div style={{ padding: '10px 15px', background: '#111827', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid #374151' }}>
                    {/* Route Mode Toggle */}
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                            style={{
                                ...buttonStyle(routeMode === 'auto'),
                                background: routeMode === 'auto' ? '#10b981' : '#374151'
                            }}
                            onClick={() => {
                                setRouteMode('auto');
                                setIsAddingCustomPoints(false);
                                clearCustomPath();
                            }}
                        >🛣️ Rota Automática</button>
                        <button
                            style={{
                                ...buttonStyle(routeMode === 'custom'),
                                background: routeMode === 'custom' ? '#f59e0b' : '#374151'
                            }}
                            onClick={() => {
                                setRouteMode('custom');
                                setSelectionMode('none');
                                setWaypoints([]);
                                setRoute([]);
                                setDistance(null);
                            }}
                        >✏️ Caminho Personalizado</button>
                    </div>

                    <div style={{ borderLeft: '1px solid #374151', height: '24px' }} />

                    {/* Show based on route mode */}
                    {routeMode === 'auto' ? (
                        <>
                            {/* Input Mode Toggle */}
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button style={buttonStyle(coordInputMode === 'search')} onClick={() => setCoordInputMode('search')}>🔍 Busca</button>
                                <button style={buttonStyle(coordInputMode === 'latlong')} onClick={() => setCoordInputMode('latlong')}>🌐 Lat/Long</button>
                                <button style={buttonStyle(coordInputMode === 'utm')} onClick={() => setCoordInputMode('utm')}>📐 UTM</button>
                            </div>

                            <div style={{ borderLeft: '1px solid #374151', height: '24px' }} />

                            {/* Selection Mode */}
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                    style={buttonStyle(selectionMode === 'origin')}
                                    onClick={() => setSelectionMode(selectionMode === 'origin' ? 'none' : 'origin')}
                                >🟢 Clicar Origem</button>
                                <button
                                    style={buttonStyle(selectionMode === 'waypoint')}
                                    onClick={() => setSelectionMode(selectionMode === 'waypoint' ? 'none' : 'waypoint')}
                                    disabled={waypoints.length < 2}
                                >🔵 + Parada</button>
                                <button
                                    style={buttonStyle(selectionMode === 'destination')}
                                    onClick={() => setSelectionMode(selectionMode === 'destination' ? 'none' : 'destination')}
                                >🔴 Clicar Destino</button>
                            </div>
                        </>
                    ) : (
                        /* Custom Path Controls */
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <button
                                style={{
                                    ...buttonStyle(isAddingCustomPoints),
                                    background: isAddingCustomPoints ? '#22c55e' : '#374151',
                                    animation: isAddingCustomPoints ? 'pulse 1.5s infinite' : 'none'
                                }}
                                onClick={() => setIsAddingCustomPoints(!isAddingCustomPoints)}
                            >
                                {isAddingCustomPoints ? '✅ Adicionando Pontos...' : '➕ Adicionar Pontos'}
                            </button>
                            <button
                                style={{ ...buttonStyle(false), background: '#ef4444' }}
                                onClick={clearCustomPath}
                                disabled={customPathPoints.length === 0}
                            >🗑️ Limpar</button>
                            <span style={{ color: '#9ca3af', fontSize: '0.85em', marginLeft: '10px' }}>
                                {customPathPoints.length} pontos
                            </span>
                        </div>
                    )}

                    <div style={{ borderLeft: '1px solid #374151', height: '24px' }} />

                    {/* Map Style Toggle */}
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button style={buttonStyle(mapStyle === 'default')} onClick={() => setMapStyle('default')}>🗺️ Mapa</button>
                        <button style={buttonStyle(mapStyle === 'satellite')} onClick={() => setMapStyle('satellite')}>🛰️ Satélite</button>
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Left Panel - Inputs */}
                    <div style={{ width: '300px', background: '#1f2937', padding: '15px', overflowY: 'auto', borderRight: '1px solid #374151' }}>
                        {/* Coordinate Input (Lat/Long or UTM) */}
                        {coordInputMode !== 'search' && (
                            <div style={{ marginBottom: '15px', padding: '10px', background: '#111827', borderRadius: '6px' }}>
                                {coordInputMode === 'latlong' ? (
                                    <>
                                        <div style={{ marginBottom: '8px' }}>
                                            <label style={{ color: '#9ca3af', fontSize: '0.8em' }}>Latitude</label>
                                            <input
                                                type="text"
                                                value={coordLat}
                                                onChange={(e) => setCoordLat(e.target.value)}
                                                placeholder="-23.5505"
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <label style={{ color: '#9ca3af', fontSize: '0.8em' }}>Longitude</label>
                                            <input
                                                type="text"
                                                value={coordLng}
                                                onChange={(e) => setCoordLng(e.target.value)}
                                                placeholder="-46.6333"
                                                style={inputStyle}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ color: '#9ca3af', fontSize: '0.8em' }}>Zona</label>
                                                <input
                                                    type="text"
                                                    value={utmZone}
                                                    onChange={(e) => setUtmZone(e.target.value)}
                                                    placeholder="23"
                                                    style={inputStyle}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ color: '#9ca3af', fontSize: '0.8em' }}>Hem.</label>
                                                <select
                                                    value={utmHemisphere}
                                                    onChange={(e) => setUtmHemisphere(e.target.value as 'N' | 'S')}
                                                    style={{ ...inputStyle, padding: '8px 5px' }}
                                                >
                                                    <option value="S">S</option>
                                                    <option value="N">N</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <label style={{ color: '#9ca3af', fontSize: '0.8em' }}>Easting (E)</label>
                                            <input
                                                type="text"
                                                value={utmEasting}
                                                onChange={(e) => setUtmEasting(e.target.value)}
                                                placeholder="323000"
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <label style={{ color: '#9ca3af', fontSize: '0.8em' }}>Northing (N)</label>
                                            <input
                                                type="text"
                                                value={utmNorthing}
                                                onChange={(e) => setUtmNorthing(e.target.value)}
                                                placeholder="7394000"
                                                style={inputStyle}
                                            />
                                        </div>
                                    </>
                                )}
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button onClick={() => addFromCoords(true)} style={{ ...buttonStyle(false), flex: 1, background: '#22c55e' }}>🟢 Origem</button>
                                    <button onClick={() => addFromCoords(false)} style={{ ...buttonStyle(false), flex: 1, background: '#ef4444' }}>🔴 Destino</button>
                                </div>
                            </div>
                        )}

                        {/* Search Origin */}
                        {coordInputMode === 'search' && (
                            <>
                                <div style={{ marginBottom: '15px', position: 'relative' }}>
                                    <label style={{ color: '#9ca3af', fontSize: '0.85em', marginBottom: '5px', display: 'block' }}>
                                        🟢 Origem
                                    </label>
                                    <input
                                        type="text"
                                        value={originSearch}
                                        onChange={(e) => handleSearchChange(e.target.value, true)}
                                        placeholder="Digite o endereço..."
                                        style={inputStyle}
                                    />
                                    {originResults.length > 0 && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                            background: '#1f2937', border: '1px solid #374151', borderRadius: '6px',
                                            maxHeight: '150px', overflowY: 'auto', marginTop: '3px'
                                        }}>
                                            {originResults.map((result, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => selectLocation(result, true)}
                                                    style={{
                                                        padding: '8px 10px', cursor: 'pointer', color: '#e5e7eb',
                                                        borderBottom: '1px solid #374151', fontSize: '0.85em'
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#374151')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    {result.display_name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Search Destination */}
                                <div style={{ marginBottom: '15px', position: 'relative' }}>
                                    <label style={{ color: '#9ca3af', fontSize: '0.85em', marginBottom: '5px', display: 'block' }}>
                                        🔴 Destino
                                    </label>
                                    <input
                                        type="text"
                                        value={destinationSearch}
                                        onChange={(e) => handleSearchChange(e.target.value, false)}
                                        placeholder="Digite o endereço..."
                                        style={inputStyle}
                                    />
                                    {destinationResults.length > 0 && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                            background: '#1f2937', border: '1px solid #374151', borderRadius: '6px',
                                            maxHeight: '150px', overflowY: 'auto', marginTop: '3px'
                                        }}>
                                            {destinationResults.map((result, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => selectLocation(result, false)}
                                                    style={{
                                                        padding: '8px 10px', cursor: 'pointer', color: '#e5e7eb',
                                                        borderBottom: '1px solid #374151', fontSize: '0.85em'
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#374151')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    {result.display_name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Waypoints List */}
                        {waypoints.length > 0 && (
                            <div style={{ marginTop: '10px' }}>
                                <label style={{ color: '#9ca3af', fontSize: '0.85em', marginBottom: '8px', display: 'block' }}>
                                    📍 Pontos do Trajeto ({waypoints.length})
                                </label>
                                {waypoints.map((wp, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            padding: '8px 10px',
                                            background: '#111827',
                                            borderRadius: '4px',
                                            marginBottom: '5px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <span style={{
                                            color: i === 0 ? '#22c55e' : i === waypoints.length - 1 ? '#ef4444' : '#3b82f6',
                                            fontSize: '1.1em'
                                        }}>
                                            {i === 0 ? '🟢' : i === waypoints.length - 1 ? '🔴' : '🔵'}
                                        </span>
                                        <span style={{ flex: 1, color: '#e5e7eb', fontSize: '0.85em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {i === 0 ? 'Origem: ' : i === waypoints.length - 1 ? 'Destino: ' : `Parada ${i}: `}
                                            {wp.label.split(',')[0]}
                                        </span>
                                        <button
                                            onClick={() => removeWaypoint(i)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1em' }}
                                        >×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Custom Path Points List */}
                        {routeMode === 'custom' && customPathPoints.length > 0 && (
                            <div style={{ marginTop: '10px' }}>
                                <label style={{ color: '#f59e0b', fontSize: '0.85em', marginBottom: '8px', display: 'block' }}>
                                    ✏️ Pontos do Caminho ({customPathPoints.length})
                                </label>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {customPathPoints.map((pt, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                padding: '6px 10px',
                                                background: '#111827',
                                                borderRadius: '4px',
                                                marginBottom: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <span style={{ color: '#f59e0b', fontSize: '0.9em', fontWeight: 'bold' }}>
                                                {i + 1}
                                            </span>
                                            <span style={{ flex: 1, color: '#e5e7eb', fontSize: '0.8em' }}>
                                                {pt.lat.toFixed(4)}, {pt.lng.toFixed(4)}
                                            </span>
                                            <button
                                                onClick={() => removeCustomPathPoint(i)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9em' }}
                                            >×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Route Name Input */}
                        {distance !== null && (
                            <div style={{ marginTop: '15px' }}>
                                <label style={{ color: '#9ca3af', fontSize: '0.85em', marginBottom: '5px', display: 'block' }}>
                                    🏷️ Nome do Trajeto (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={routeName}
                                    onChange={(e) => setRouteName(e.target.value)}
                                    placeholder="Ex: Trajeto São Paulo - Rio"
                                    style={inputStyle}
                                />
                            </div>
                        )}

                        {/* Result */}
                        {distance !== null && (
                            <div style={{ marginTop: '15px', padding: '12px', background: '#064e3b', borderRadius: '6px' }}>
                                <div style={{ color: '#a7f3d0', fontSize: '1.2em', fontWeight: 'bold', marginBottom: '5px' }}>
                                    📏 {distance.toFixed(2)} km
                                    {routeMode === 'custom' && <span style={{ fontSize: '0.7em', fontWeight: 'normal' }}> (linha reta)</span>}
                                </div>
                                {duration !== null && (
                                    <div style={{ color: '#a7f3d0', fontSize: '0.95em' }}>
                                        ⏱️ {Math.floor(duration / 60)}h {Math.round(duration % 60)}min
                                    </div>
                                )}
                            </div>
                        )}

                        {error && (
                            <div style={{ marginTop: '15px', padding: '12px', background: '#7f1d1d', borderRadius: '6px', color: '#fca5a5' }}>
                                ❌ {error}
                            </div>
                        )}
                    </div>

                    {/* Map */}
                    <div style={{ flex: 1, position: 'relative' }}>
                        {selectionMode !== 'none' && (
                            <div style={{
                                position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
                                background: 'rgba(0,0,0,0.8)', padding: '8px 16px', borderRadius: '6px',
                                color: 'white', zIndex: 10, fontSize: '0.9em'
                            }}>
                                Clique no mapa para selecionar {selectionMode === 'origin' ? 'ORIGEM' : selectionMode === 'destination' ? 'DESTINO' : 'PARADA'}
                            </div>
                        )}

                        {/* Custom path instruction */}
                        {routeMode === 'custom' && isAddingCustomPoints && (
                            <div style={{
                                position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
                                background: 'rgba(245, 158, 11, 0.9)', padding: '8px 16px', borderRadius: '6px',
                                color: 'white', zIndex: 10, fontSize: '0.9em', fontWeight: 'bold'
                            }}>
                                ✏️ Clique no mapa para adicionar pontos ao caminho
                            </div>
                        )}

                        <Map
                            center={center}
                            zoom={zoom}
                            provider={mapStyle === 'satellite' ? satelliteProvider : osmProvider}
                            onBoundsChanged={({ center, zoom }) => {
                                setCenter(center);
                                setZoom(zoom);
                            }}
                            onClick={handleMapClick}
                            attribution={mapStyle === 'satellite' ? false : undefined}
                        >
                            <ZoomControl />

                            {/* Auto route mode markers */}
                            {routeMode === 'auto' && waypoints.map((wp, i) => (
                                <Marker
                                    key={`auto-${i}`}
                                    anchor={[wp.lat, wp.lng]}
                                    color={i === 0 ? '#22c55e' : i === waypoints.length - 1 ? '#ef4444' : '#3b82f6'}
                                />
                            ))}

                            {/* Custom path markers */}
                            {routeMode === 'custom' && customPathPoints.map((pt, i) => (
                                <Marker
                                    key={`custom-${i}`}
                                    anchor={[pt.lat, pt.lng]}
                                    color="#f59e0b"
                                />
                            ))}

                            {/* Route Polyline */}
                            {route.length > 1 && (
                                <GeoJson
                                    data={{
                                        type: 'FeatureCollection',
                                        features: [{
                                            type: 'Feature',
                                            geometry: {
                                                type: 'LineString',
                                                coordinates: route.map(([lat, lng]) => [lng, lat]) // GeoJSON uses [lng, lat]
                                            },
                                            properties: {}
                                        }]
                                    }}
                                    styleCallback={() => ({
                                        stroke: '#3b82f6',
                                        strokeWidth: 4,
                                        fill: 'none',
                                        strokeLinecap: 'round',
                                        strokeLinejoin: 'round',
                                        opacity: 0.8
                                    })}
                                />
                            )}
                        </Map>

                        {loading && (
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                background: 'rgba(0,0,0,0.8)', padding: '20px 30px', borderRadius: '8px', color: 'white'
                            }}>
                                Calculando rota...
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 15px', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#1f2937' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px', background: '#4b5563', color: 'white',
                            border: 'none', borderRadius: '6px', cursor: 'pointer'
                        }}
                    >Cancelar</button>
                    <button
                        onClick={handleConfirm}
                        disabled={distance === null}
                        style={{
                            padding: '10px 20px', background: distance === null ? '#374151' : '#16a34a', color: 'white',
                            border: 'none', borderRadius: '6px', cursor: distance === null ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold'
                        }}
                    >✓ Usar esta distância ({distance?.toFixed(2) || '0'} km)</button>
                </div>
            </div>
        </DraggableModal>
    );
}
