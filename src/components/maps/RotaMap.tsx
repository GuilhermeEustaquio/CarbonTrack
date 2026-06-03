import { useCallback, useEffect, useRef, useState } from 'react';
import L, { type Map as LeafletMap, type Polyline, type Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Rota } from '../../types/rota';

const ROTA_CORES = ['#3FB8C4', '#5B8DD9', '#A98BD0', '#6FB36B', '#C97A4A', '#D96A6A', '#C4A24A', '#6BA8A9'];

const tileSets = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
} as const;

function useDocumentTheme(): keyof typeof tileSets {
  const [theme, setTheme] = useState<keyof typeof tileSets>(() =>
    document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

function pinIcon(color: string, label: string) {
  return L.divIcon({
    className: 'ct-map-marker-shell',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
    html: `<span class="ct-map-marker" style="--marker-color:${color};opacity:0.92"><span style="font-size:9px;font-weight:700;color:#fff;line-height:1">${label}</span></span>`,
  });
}

function pickerPinIcon(color: string) {
  return L.divIcon({
    className: 'ct-map-marker-shell',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
    html: `<span class="ct-map-marker active picker" style="--marker-color:${color}"><span></span></span>`,
  });
}

// ─── RotaMap ────────────────────────────────────────────────────────────────

interface RotaMapProps {
  rotas: Rota[];
  onSelect?: (rota: Rota) => void;
}

export function RotaMap({ rotas, onSelect }: RotaMapProps) {
  const theme = useDocumentTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<L.TileLayer | null>(null);
  const drawingsRef = useRef<(Polyline | Marker)[]>([]);

  const rotasComCoordenadas = rotas.filter(
    r => r.ativo !== false &&
    Number.isFinite(r.origemLat) && Number.isFinite(r.origemLon) &&
    Number.isFinite(r.destinoLat) && Number.isFinite(r.destinoLon)
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([-15.7, -47.9], 4);

    window.setTimeout(() => mapRef.current?.invalidateSize(), 120);
    return () => {
      drawingsRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layerRef.current?.remove();
    const tiles = tileSets[theme];
    layerRef.current = L.tileLayer(tiles.url, {
      attribution: tiles.attribution,
      maxZoom: 18,
      minZoom: 3,
    }).addTo(map);
  }, [theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    drawingsRef.current.forEach(d => d.remove());
    drawingsRef.current = [];

    const allPoints: [number, number][] = [];

    rotasComCoordenadas.forEach((rota, idx) => {
      const cor = ROTA_CORES[idx % ROTA_CORES.length];
      const oLat = rota.origemLat!;
      const oLon = rota.origemLon!;
      const dLat = rota.destinoLat!;
      const dLon = rota.destinoLon!;

      const line = L.polyline([[oLat, oLon], [dLat, dLon]], {
        color: cor,
        weight: 3,
        opacity: 0.85,
        dashArray: '8, 4',
      }).addTo(map);
      if (onSelect) line.on('click', () => onSelect(rota));
      drawingsRef.current.push(line);

      const mO = L.marker([oLat, oLon], { icon: pinIcon('#6FB36B', 'O'), title: `Origem: ${rota.origem}` })
        .addTo(map)
        .bindPopup(
          `<div class="ct-map-popup"><strong>${rota.nome || `${rota.origem} → ${rota.destino}`}</strong><span style="color:${cor}">■ Rota ${idx + 1}</span><small>${rota.distanciaKm} km · ${rota.regiao || '—'}</small><small>Origem: ${oLat.toFixed(4)}, ${oLon.toFixed(4)}</small></div>`,
          { closeButton: false, className: 'ct-leaflet-popup' }
        );
      if (onSelect) mO.on('click', () => onSelect(rota));
      drawingsRef.current.push(mO);

      const mD = L.marker([dLat, dLon], { icon: pinIcon('#D96A6A', 'D'), title: `Destino: ${rota.destino}` })
        .addTo(map)
        .bindPopup(
          `<div class="ct-map-popup"><strong>${rota.nome || `${rota.origem} → ${rota.destino}`}</strong><span style="color:${cor}">■ Rota ${idx + 1}</span><small>${rota.distanciaKm} km · ${rota.regiao || '—'}</small><small>Destino: ${dLat.toFixed(4)}, ${dLon.toFixed(4)}</small></div>`,
          { closeButton: false, className: 'ct-leaflet-popup' }
        );
      if (onSelect) mD.on('click', () => onSelect(rota));
      drawingsRef.current.push(mD);

      allPoints.push([oLat, oLon], [dLat, dLon]);
    });

    if (allPoints.length > 0) {
      map.fitBounds(allPoints as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 8 });
    }
  }, [rotasComCoordenadas, onSelect]);

  return (
    <div className="ct-map-card">
      <div className="ct-map-toolbar">
        <div>
          <div className="eyebrow">Mapa de rotas · OpenStreetMap/CARTO</div>
          <strong>{rotasComCoordenadas.length} rotas georreferenciadas</strong>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {rotasComCoordenadas.slice(0, 6).map((r, i) => (
            <span key={r.id} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: ROTA_CORES[i % ROTA_CORES.length], display: 'inline-block' }} />
              {(r.nome || r.origem).length > 12 ? (r.nome || r.origem).slice(0, 12) + '…' : (r.nome || r.origem)}
            </span>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="ct-leaflet-map" />
      <div className="ct-map-foot">
        <span><span style={{ color: '#6FB36B', fontWeight: 700 }}>● O</span> = Origem · <span style={{ color: '#D96A6A', fontWeight: 700 }}>● D</span> = Destino · Linhas tracejadas por rota</span>
        <span>Tiles públicos CARTO · sem chave obrigatória</span>
      </div>
      {rotasComCoordenadas.length === 0 && (
        <div className="empty" style={{ padding: '24px 0' }}>
          <strong>Nenhuma rota com coordenadas</strong>
          <div style={{ fontSize: 12, marginTop: 4 }}>Cadastre rotas clicando no mapa do formulário para visualizá-las aqui.</div>
        </div>
      )}
    </div>
  );
}

// ─── RoutePickerMap ──────────────────────────────────────────────────────────

interface RouteCoords {
  origemLat?: number;
  origemLon?: number;
  destinoLat?: number;
  destinoLon?: number;
}

interface RoutePickerMapProps {
  value: RouteCoords;
  onChange: (coords: RouteCoords) => void;
}

export function RoutePickerMap({ value, onChange }: RoutePickerMapProps) {
  const theme = useDocumentTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<L.TileLayer | null>(null);
  const origemMarkerRef = useRef<Marker | null>(null);
  const destinoMarkerRef = useRef<Marker | null>(null);
  const lineRef = useRef<Polyline | null>(null);
  const [picking, setPicking] = useState<'origem' | 'destino'>('origem');

  const handleChange = useCallback((coords: RouteCoords) => onChange(coords), [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([-15.7, -47.9], 4);

    window.setTimeout(() => mapRef.current?.invalidateSize(), 120);

    return () => {
      origemMarkerRef.current?.remove();
      destinoMarkerRef.current?.remove();
      lineRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layerRef.current?.remove();
    const tiles = tileSets[theme];
    layerRef.current = L.tileLayer(tiles.url, {
      attribution: tiles.attribution,
      maxZoom: 18,
      minZoom: 3,
    }).addTo(map);
  }, [theme]);

  // map click handler — depends on picking state
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const lat = Number(e.latlng.lat.toFixed(6));
      const lon = Number(e.latlng.lng.toFixed(6));

      if (picking === 'origem') {
        handleChange({ ...value, origemLat: lat, origemLon: lon });
        setPicking('destino');
      } else {
        handleChange({ ...value, destinoLat: lat, destinoLon: lon });
        setPicking('origem');
      }
    };

    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [picking, value, handleChange]);

  // sync markers and line to value
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const hasOrigem = Number.isFinite(value.origemLat) && Number.isFinite(value.origemLon);
    const hasDestino = Number.isFinite(value.destinoLat) && Number.isFinite(value.destinoLon);

    if (hasOrigem) {
      const ll: [number, number] = [value.origemLat!, value.origemLon!];
      if (!origemMarkerRef.current) {
        origemMarkerRef.current = L.marker(ll, { icon: pickerPinIcon('#6FB36B'), draggable: true })
          .addTo(map)
          .bindPopup('<div class="ct-map-popup"><strong>Origem</strong></div>', { closeButton: false, className: 'ct-leaflet-popup' })
          .on('dragend', ev => {
            const m = ev.target as Marker;
            const next = m.getLatLng();
            handleChange({ ...value, origemLat: Number(next.lat.toFixed(6)), origemLon: Number(next.lng.toFixed(6)) });
          });
      } else {
        origemMarkerRef.current.setLatLng(ll);
      }
    } else {
      origemMarkerRef.current?.remove();
      origemMarkerRef.current = null;
    }

    if (hasDestino) {
      const ll: [number, number] = [value.destinoLat!, value.destinoLon!];
      if (!destinoMarkerRef.current) {
        destinoMarkerRef.current = L.marker(ll, { icon: pickerPinIcon('#D96A6A'), draggable: true })
          .addTo(map)
          .bindPopup('<div class="ct-map-popup"><strong>Destino</strong></div>', { closeButton: false, className: 'ct-leaflet-popup' })
          .on('dragend', ev => {
            const m = ev.target as Marker;
            const next = m.getLatLng();
            handleChange({ ...value, destinoLat: Number(next.lat.toFixed(6)), destinoLon: Number(next.lng.toFixed(6)) });
          });
      } else {
        destinoMarkerRef.current.setLatLng(ll);
      }
    } else {
      destinoMarkerRef.current?.remove();
      destinoMarkerRef.current = null;
    }

    if (hasOrigem && hasDestino) {
      const pts: [number, number][] = [[value.origemLat!, value.origemLon!], [value.destinoLat!, value.destinoLon!]];
      if (!lineRef.current) {
        lineRef.current = L.polyline(pts, { color: '#3FB8C4', weight: 3, dashArray: '8, 4', opacity: 0.9 }).addTo(map);
      } else {
        lineRef.current.setLatLngs(pts);
      }
      map.fitBounds(pts as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 8 });
    } else {
      lineRef.current?.remove();
      lineRef.current = null;
    }

    window.setTimeout(() => map.invalidateSize(), 80);
  }, [value.origemLat, value.origemLon, value.destinoLat, value.destinoLon, handleChange]);

  return (
    <div className="location-picker">
      <div className="location-picker-copy">
        <strong>Selecione Origem e Destino no mapa</strong>
        <span>Clique para definir os pontos, ou arraste os marcadores para ajustar.</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          className={`btn sm ${picking === 'origem' ? 'primary' : 'ghost'}`}
          onClick={() => setPicking('origem')}
          style={{ flex: 1 }}
        >
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#6FB36B', display: 'inline-block', marginRight: 4 }} />
          {Number.isFinite(value.origemLat) ? `Origem: ${value.origemLat!.toFixed(4)}, ${value.origemLon!.toFixed(4)}` : 'Definir Origem'}
        </button>
        <button
          type="button"
          className={`btn sm ${picking === 'destino' ? 'primary' : 'ghost'}`}
          onClick={() => setPicking('destino')}
          style={{ flex: 1 }}
        >
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#D96A6A', display: 'inline-block', marginRight: 4 }} />
          {Number.isFinite(value.destinoLat) ? `Destino: ${value.destinoLat!.toFixed(4)}, ${value.destinoLon!.toFixed(4)}` : 'Definir Destino'}
        </button>
        {(Number.isFinite(value.origemLat) || Number.isFinite(value.destinoLat)) && (
          <button
            type="button"
            className="btn sm ghost"
            onClick={() => { onChange({}); setPicking('origem'); }}
            title="Limpar coordenadas"
          >✕</button>
        )}
      </div>
      <div
        ref={containerRef}
        className="ct-leaflet-map picker-map"
        role="application"
        aria-label="Mapa para selecionar origem e destino da rota"
        style={{ cursor: picking === 'origem' ? 'crosshair' : 'cell' }}
      />
      <div className="ct-map-foot">
        <span>Próximo clique: <strong>{picking === 'origem' ? '🟢 Origem' : '🔴 Destino'}</strong></span>
        <span>Marcadores são arrastáveis para ajuste fino</span>
      </div>
    </div>
  );
}
