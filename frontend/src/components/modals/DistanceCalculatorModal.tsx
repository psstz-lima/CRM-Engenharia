
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

    return (
        <DraggableModal
            isOpen={show}
            onClose={onClose}
            title="📍 Calcular Distância de Transporte"
            width="95%"
            maxWidth="1000px"
            height="90vh"
        >
            <div className="flex flex-col h-full overflow-hidden">
                {/* Toolbar */}
                <div className="p-3 bg-dark-950 flex gap-3 flex-wrap items-center border-b border-dark-800">
                    {/* Route Mode Toggle */}
                    <div className="flex gap-1">
                        <button
                            className={`btn btn-sm ${routeMode === 'auto' ? 'bg-green-600 hover:bg-green-500' : 'btn-secondary'}`}
                            onClick={() => {
                                setRouteMode('auto');
                                setIsAddingCustomPoints(false);
                                clearCustomPath();
                            }}
                        >🛣️ Rota Automática</button>
                        <button
                            className={`btn btn-sm ${routeMode === 'custom' ? 'bg-amber-600 hover:bg-amber-500' : 'btn-secondary'}`}
                            onClick={() => {
                                setRouteMode('custom');
                                setSelectionMode('none');
                                setWaypoints([]);
                                setRoute([]);
                                setDistance(null);
                            }}
                        >✏️ Caminho Personalizado</button>
                    </div>

                    <div className="h-6 w-px bg-dark-700 mx-1" />

                    {/* Show based on route mode */}
                    {routeMode === 'auto' ? (
                        <>
                            {/* Input Mode Toggle */}
                            <div className="flex gap-1">
                                <button className={`btn btn-sm ${coordInputMode === 'search' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCoordInputMode('search')}>🔍 Busca</button>
                                <button className={`btn btn-sm ${coordInputMode === 'latlong' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCoordInputMode('latlong')}>🌐 Lat/Long</button>
                                <button className={`btn btn-sm ${coordInputMode === 'utm' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCoordInputMode('utm')}>📐 UTM</button>
                            </div>

                            <div className="h-6 w-px bg-dark-700 mx-1" />

                            {/* Selection Mode */}
                            <div className="flex gap-1">
                                <button
                                    className={`btn btn-sm ${selectionMode === 'origin' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setSelectionMode(selectionMode === 'origin' ? 'none' : 'origin')}
                                >🟢 Clicar Origem</button>
                                <button
                                    className={`btn btn-sm ${selectionMode === 'waypoint' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setSelectionMode(selectionMode === 'waypoint' ? 'none' : 'waypoint')}
                                    disabled={waypoints.length < 2}
                                >🔵 + Parada</button>
                                <button
                                    className={`btn btn-sm ${selectionMode === 'destination' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setSelectionMode(selectionMode === 'destination' ? 'none' : 'destination')}
                                >🔴 Clicar Destino</button>
                            </div>
                        </>
                    ) : (
                        /* Custom Path Controls */
                        <div className="flex gap-2 items-center">
                            <button
                                className={`btn btn-sm ${isAddingCustomPoints ? 'bg-green-600 hover:bg-green-500 animate-pulse' : 'btn-secondary'}`}
                                onClick={() => setIsAddingCustomPoints(!isAddingCustomPoints)}
                            >
                                {isAddingCustomPoints ? '✅ Adicionando Pontos...' : '➕ Adicionar Pontos'}
                            </button>
                            <button
                                className="btn btn-sm bg-red-600 hover:bg-red-500 text-white border-none"
                                onClick={clearCustomPath}
                                disabled={customPathPoints.length === 0}
                            >🗑️ Limpar</button>
                            <span className="text-gray-400 text-xs ml-2">
                                {customPathPoints.length} pontos
                            </span>
                        </div>
                    )}

                    <div className="h-6 w-px bg-dark-700 mx-1" />

                    {/* Map Style Toggle */}
                    <div className="flex gap-1">
                        <button className={`btn btn-sm ${mapStyle === 'default' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMapStyle('default')}>🗺️ Mapa</button>
                        <button className={`btn btn-sm ${mapStyle === 'satellite' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMapStyle('satellite')}>🛰️ Satélite</button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Inputs */}
                    <div className="w-[300px] bg-dark-900 p-4 border-r border-dark-700 overflow-y-auto">
                        {/* Coordinate Input (Lat/Long or UTM) */}
                        {coordInputMode !== 'search' && (
                            <div className="mb-4 p-3 bg-dark-950 rounded-lg border border-dark-800">
                                {coordInputMode === 'latlong' ? (
                                    <>
                                        <div className="mb-2">
                                            <label className="label">Latitude</label>
                                            <input
                                                type="text"
                                                value={coordLat}
                                                onChange={(e) => setCoordLat(e.target.value)}
                                                placeholder="-23.5505"
                                                className="input text-sm py-1.5"
                                            />
                                        </div>
                                        <div className="mb-2">
                                            <label className="label">Longitude</label>
                                            <input
                                                type="text"
                                                value={coordLng}
                                                onChange={(e) => setCoordLng(e.target.value)}
                                                placeholder="-46.6333"
                                                className="input text-sm py-1.5"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex gap-2 mb-2">
                                            <div className="flex-1">
                                                <label className="label">Zona</label>
                                                <input
                                                    type="text"
                                                    value={utmZone}
                                                    onChange={(e) => setUtmZone(e.target.value)}
                                                    placeholder="23"
                                                    className="input text-sm py-1.5"
                                                />
                                            </div>
                                            <div>
                                                <label className="label">Hem.</label>
                                                <select
                                                    value={utmHemisphere}
                                                    onChange={(e) => setUtmHemisphere(e.target.value as 'N' | 'S')}
                                                    className="input text-sm py-1.5 w-[60px]"
                                                >
                                                    <option value="S">S</option>
                                                    <option value="N">N</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mb-2">
                                            <label className="label">Easting (E)</label>
                                            <input
                                                type="text"
                                                value={utmEasting}
                                                onChange={(e) => setUtmEasting(e.target.value)}
                                                placeholder="323000"
                                                className="input text-sm py-1.5"
                                            />
                                        </div>
                                        <div className="mb-2">
                                            <label className="label">Northing (N)</label>
                                            <input
                                                type="text"
                                                value={utmNorthing}
                                                onChange={(e) => setUtmNorthing(e.target.value)}
                                                placeholder="7394000"
                                                className="input text-sm py-1.5"
                                            />
                                        </div>
                                    </>
                                )}
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => addFromCoords(true)} className="btn bg-green-600 hover:bg-green-500 text-white flex-1 text-xs py-1.5">🟢 Origem</button>
                                    <button onClick={() => addFromCoords(false)} className="btn bg-red-600 hover:bg-red-500 text-white flex-1 text-xs py-1.5">🔴 Destino</button>
                                </div>
                            </div>
                        )}

                        {/* Search Origin */}
                        {coordInputMode === 'search' && (
                            <>
                                <div className="mb-4 relative">
                                    <label className="label mb-1 block">🟢 Origem</label>
                                    <input
                                        type="text"
                                        value={originSearch}
                                        onChange={(e) => handleSearchChange(e.target.value, true)}
                                        placeholder="Digite o endereço..."
                                        className="input"
                                    />
                                    {originResults.length > 0 && (
                                        <div className="absolute top-[100%] left-0 right-0 z-10 bg-dark-800 border border-dark-600 rounded-lg shadow-xl mt-1 max-h-[150px] overflow-y-auto">
                                            {originResults.map((result, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => selectLocation(result, true)}
                                                    className="p-2 cursor-pointer text-gray-200 text-sm hover:bg-dark-700 border-b border-dark-700 last:border-0"
                                                >
                                                    {result.display_name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Search Destination */}
                                <div className="mb-4 relative">
                                    <label className="label mb-1 block">🔴 Destino</label>
                                    <input
                                        type="text"
                                        value={destinationSearch}
                                        onChange={(e) => handleSearchChange(e.target.value, false)}
                                        placeholder="Digite o endereço..."
                                        className="input"
                                    />
                                    {destinationResults.length > 0 && (
                                        <div className="absolute top-[100%] left-0 right-0 z-10 bg-dark-800 border border-dark-600 rounded-lg shadow-xl mt-1 max-h-[150px] overflow-y-auto">
                                            {destinationResults.map((result, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => selectLocation(result, false)}
                                                    className="p-2 cursor-pointer text-gray-200 text-sm hover:bg-dark-700 border-b border-dark-700 last:border-0"
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
                            <div className="mt-2">
                                <label className="label text-xs mb-2 block">📍 Pontos do Trajeto ({waypoints.length})</label>
                                {waypoints.map((wp, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 p-2 bg-dark-950 rounded mb-1 border border-dark-800"
                                    >
                                        <span className={`text-base ${i === 0 ? 'text-green-500' : i === waypoints.length - 1 ? 'text-red-500' : 'text-blue-500'}`}>
                                            {i === 0 ? '🟢' : i === waypoints.length - 1 ? '🔴' : '🔵'}
                                        </span>
                                        <span className="flex-1 text-xs text-gray-300 truncate">
                                            {i === 0 ? 'Origem: ' : i === waypoints.length - 1 ? 'Destino: ' : `Parada ${i}: `}
                                            {wp.label.split(',')[0]}
                                        </span>
                                        <button
                                            onClick={() => removeWaypoint(i)}
                                            className="text-red-500 hover:text-red-400 text-base leading-none"
                                        >×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Custom Path Points List */}
                        {routeMode === 'custom' && customPathPoints.length > 0 && (
                            <div className="mt-2">
                                <label className="label text-xs mb-2 block text-amber-500">📍 Pontos Personalizados ({customPathPoints.length})</label>
                                <div className="max-h-[200px] overflow-y-auto pr-1">
                                    {customPathPoints.map((wp, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 p-2 bg-dark-950 rounded mb-1 border border-dark-800"
                                        >
                                            <span className="text-amber-500 text-xs font-bold">{i + 1}</span>
                                            <span className="text-gray-400 text-xs">Lat: {wp.lat.toFixed(5)}</span>
                                            <span className="text-gray-400 text-xs">Lng: {wp.lng.toFixed(5)}</span>
                                            <button
                                                onClick={() => removeCustomPathPoint(i)}
                                                className="ml-auto text-red-500 hover:text-red-400 text-base leading-none"
                                            >×</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3">
                                    <label className="label">Nome do Trajeto (Opcional)</label>
                                    <input
                                        type="text"
                                        value={routeName}
                                        onChange={(e) => setRouteName(e.target.value)}
                                        placeholder="Ex: Transporte Fazenda X"
                                        className="input"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Map */}
                    <div className="flex-1 relative bg-gray-900 border-l border-dark-700">
                        <Map
                            height={0} // let container handle height with 100% style
                            defaultCenter={[-15.7801, -47.9292]}
                            center={center}
                            zoom={zoom}
                            onBoundsChanged={({ center, zoom }) => {
                                setCenter(center);
                                setZoom(zoom);
                            }}
                            onClick={handleMapClick}
                            provider={mapStyle === 'satellite' ? satelliteProvider : undefined}
                        >
                            <ZoomControl />

                            {/* Waypoints Markers */}
                            {waypoints.map((wp, i) => (
                                <Marker
                                    key={i}
                                    anchor={[wp.lat, wp.lng]}
                                    payload={i}
                                    color={i === 0 ? '#22c55e' : i === waypoints.length - 1 ? '#ef4444' : '#3b82f6'}
                                    width={40}
                                />
                            ))}

                            {/* Custom Path Markers */}
                            {customPathPoints.map((wp, i) => (
                                <Marker
                                    key={`custom-${i}`}
                                    anchor={[wp.lat, wp.lng]}
                                    payload={i}
                                    color="#f59e0b"
                                    width={30}
                                />
                            ))}

                            {/* Route Line */}
                            {route.length > 0 && (
                                <GeoJson
                                    data={{
                                        type: 'Feature',
                                        geometry: {
                                            type: 'LineString',
                                            coordinates: route.map(p => [p[1], p[0]]),
                                        },
                                        properties: {},
                                    }}
                                    styleCallback={() => ({
                                        strokeWidth: 4,
                                        stroke: routeMode === 'custom' ? '#f59e0b' : '#3b82f6',
                                    })}
                                />
                            )}
                        </Map>

                        {/* Floating Distance Info */}
                        {distance !== null && (
                            <div className="absolute top-4 right-4 bg-dark-900/90 backdrop-blur border border-dark-600 p-4 rounded-xl shadow-2xl z-[1000] min-w-[200px]">
                                <h4 className="text-gray-400 text-xs uppercase font-bold mb-1">Distância Total</h4>
                                <div className="text-3xl font-bold text-white mb-1">
                                    {distance.toFixed(2)} <span className="text-lg font-normal text-gray-500">km</span>
                                </div>
                                {duration !== null && (
                                    <div className="text-gray-400 text-sm">
                                        ⏱️ ~{Math.round(duration)} min
                                    </div>
                                )}
                                <button
                                    onClick={handleConfirm}
                                    className="btn btn-primary w-full mt-3 justify-center text-sm py-2"
                                >
                                    ✅ Usar esta distância
                                </button>
                            </div>
                        )}

                        {loading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1100]">
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-3"></div>
                                    <span className="text-white font-medium">Calculando rota...</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/90 text-red-200 px-4 py-2 rounded shadow-lg border border-red-800 z-[1100]">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DraggableModal>
    );
}
