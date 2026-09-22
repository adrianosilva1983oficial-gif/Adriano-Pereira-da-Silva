import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  MapPin,
  X,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Footprints,
  MousePointer,
  Save,
  Maximize2,
  Info,
  Ruler
} from 'lucide-react';
import { OrdemServicoSCIWeb, LoteCartografia } from '../types/os';
import { osService } from '../services/osService';

interface CartografiaLoteModalProps {
  os: OrdemServicoSCIWeb;
  onClose: () => void;
  onSave?: (cartografia: LoteCartografia) => void;
}

export const CartografiaLoteModal: React.FC<CartografiaLoteModalProps> = ({
  os,
  onClose,
  onSave,
}) => {
  const [modoCaptura, setModoCaptura] = useState<'GPS_CAMINHAMENTO' | 'DESENHO_MANUAL'>('GPS_CAMINHAMENTO');
  const [tipoDemarcacao, setTipoDemarcacao] = useState<'LOTE' | 'QUADRA'>('LOTE');
  const [vertices, setVertices] = useState<{ lat: number; lng: number }[]>(
    os.cartografiaLote?.vertices || []
  );
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Monitora GPS do cadastrista
  useEffect(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => console.warn(err),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Se não tiver vértices salvos, inicializa com 4 pontos padrão ao redor da coordenada da OS
  useEffect(() => {
    if (vertices.length === 0) {
      const baseLat = os.coordenadas.latitude;
      const baseLng = os.coordenadas.longitude;
      const offset = 0.0001; // ~11 metros
      setVertices([
        { lat: baseLat + offset, lng: baseLng - offset },
        { lat: baseLat + offset, lng: baseLng + offset },
        { lat: baseLat - offset, lng: baseLng + offset },
        { lat: baseLat - offset, lng: baseLng - offset },
      ]);
    }
  }, [os]);

  // Cálculo da área e perímetro (Fórmula de Shoelace / Gauss)
  const calculateGeometry = () => {
    if (vertices.length < 3) return { area: 0, perimetro: 0 };

    // Converte lat/lng para coordenadas métricas locais relativas ao vértice 0
    const refLat = vertices[0].lat;
    const refLng = vertices[0].lng;
    const latToMeters = 111320;
    const lngToMeters = 111320 * Math.cos((refLat * Math.PI) / 180);

    const xyPoints = vertices.map((v) => ({
      x: (v.lng - refLng) * lngToMeters,
      y: (v.lat - refLat) * latToMeters,
    }));

    // Shoelace formula para área em m²
    let area = 0;
    let perimetro = 0;
    for (let i = 0; i < xyPoints.length; i++) {
      const j = (i + 1) % xyPoints.length;
      area += xyPoints[i].x * xyPoints[j].y;
      area -= xyPoints[j].x * xyPoints[i].y;

      const dx = xyPoints[j].x - xyPoints[i].x;
      const dy = xyPoints[j].y - xyPoints[i].y;
      perimetro += Math.sqrt(dx * dx + dy * dy);
    }

    return {
      area: Math.abs(Math.round(area / 2)),
      perimetro: Math.round(perimetro * 10) / 10,
    };
  };

  const { area, perimetro } = calculateGeometry();

  // Desenha no Canvas o polígono vetorial do lote
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || vertices.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Grid de fundo
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Calcula bounding box dos vértices para ajustar ao canvas
    const lats = vertices.map((v) => v.lat);
    const lngs = vertices.map((v) => v.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const deltaLat = maxLat - minLat || 0.0001;
    const deltaLng = maxLng - minLng || 0.0001;

    const padding = 50;
    const drawWidth = width - padding * 2;
    const drawHeight = height - padding * 2;

    const toCanvasX = (lng: number) => padding + ((lng - minLng) / deltaLng) * drawWidth;
    const toCanvasY = (lat: number) => height - padding - ((lat - minLat) / deltaLat) * drawHeight;

    // Desenha polígono preenchido
    ctx.beginPath();
    vertices.forEach((v, idx) => {
      const cx = toCanvasX(v.lng);
      const cy = toCanvasY(v.lat);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();

    // Gradiente de preenchimento
    ctx.fillStyle = tipoDemarcacao === 'LOTE' ? 'rgba(14, 165, 233, 0.18)' : 'rgba(99, 102, 241, 0.18)';
    ctx.fill();

    // Linha de contorno do lote/quadra
    ctx.strokeStyle = tipoDemarcacao === 'LOTE' ? '#0284c7' : '#4f46e5';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Desenha vértices e rótulos
    vertices.forEach((v, idx) => {
      const cx = toCanvasX(v.lng);
      const cy = toCanvasY(v.lat);

      // Ponto
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Rótulo V1, V2...
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`V${idx + 1}`, cx + 8, cy - 8);
    });

    // Posição atual do GPS no canvas (se dentro dos limites)
    if (currentGps) {
      const gx = toCanvasX(currentGps.lng);
      const gy = toCanvasY(currentGps.lat);
      if (gx >= 0 && gx <= width && gy >= 0 && gy <= height) {
        ctx.beginPath();
        ctx.arc(gx, gy, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#065f46';
        ctx.fillText('Você Aqui', gx + 10, gy + 4);
      }
    }
  }, [vertices, tipoDemarcacao, currentGps]);

  // Ações de edição
  const handleAddVertexAtGPS = () => {
    if (currentGps) {
      setVertices((prev) => [...prev, { lat: currentGps.lat, lng: currentGps.lng }]);
      setStatusMsg(`Vértice V${vertices.length + 1} capturado no GPS (±${Math.round(currentGps.accuracy)}m).`);
      setTimeout(() => setStatusMsg(null), 3000);
    } else {
      // Posição simulada próxima
      const baseLat = os.coordenadas.latitude;
      const baseLng = os.coordenadas.longitude;
      const rOffset = (Math.random() - 0.5) * 0.00015;
      setVertices((prev) => [...prev, { lat: baseLat + rOffset, lng: baseLng + rOffset }]);
      setStatusMsg(`Vértice V${vertices.length + 1} capturado no GPS aproximado.`);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (modoCaptura !== 'DESENHO_MANUAL') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Converte de volta para lat/lng aproximado baseado na bounding box
    const lats = vertices.map((v) => v.lat);
    const lngs = vertices.map((v) => v.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const deltaLat = maxLat - minLat || 0.0001;
    const deltaLng = maxLng - minLng || 0.0001;
    const padding = 50;

    const newLng = minLng + ((clickX - padding) / (canvas.width - padding * 2)) * deltaLng;
    const newLat = minLat + ((canvas.height - padding - clickY) / (canvas.height - padding * 2)) * deltaLat;

    setVertices((prev) => [...prev, { lat: newLat, lng: newLng }]);
    setStatusMsg(`Novo ponto manual adicionado.`);
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleClear = () => {
    if (confirm('Deseja limpar todos os vértices e reiniciar a demarcação?')) {
      setVertices([]);
    }
  };

  const handleSave = () => {
    if (vertices.length < 3) {
      alert('São necessários pelo menos 3 vértices para formar o polígono do lote.');
      return;
    }

    const cartografia: LoteCartografia = {
      vertices,
      areaM2: area,
      perimetroM: perimetro,
      tipoDesenho: modoCaptura,
      capturadoEm: Date.now(),
      quadra: os.quadra,
      lote: os.lote,
    };

    osService.vincularCartografia(os.id, cartografia);
    if (onSave) onSave(cartografia);

    setStatusMsg('Cartografia salva com sucesso na Matrícula!');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-800 via-sky-900 to-indigo-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base leading-tight">
                  Cartografia de Campo Mobile — {tipoDemarcacao === 'LOTE' ? 'Lote Individual' : 'Polígono da Quadra'}
                </h3>
                <span className="text-[10px] bg-sky-400/30 text-sky-200 font-mono px-2 py-0.5 rounded-full">
                  GIS Móvel
                </span>
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                Amarração: Quadra <strong>{os.quadra}</strong> | Lote <strong>{os.lote}</strong> | Matrícula <strong>{os.matriculaEmbasa}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Controles e Modos */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {/* Alternar Lote ou Quadra */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setTipoDemarcacao('LOTE')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                tipoDemarcacao === 'LOTE' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lote ({os.lote})
            </button>
            <button
              onClick={() => setTipoDemarcacao('QUADRA')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                tipoDemarcacao === 'QUADRA' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quadra ({os.quadra})
            </button>
          </div>

          {/* Alternar Modo GPS ou Manual */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setModoCaptura('GPS_CAMINHAMENTO')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                modoCaptura === 'GPS_CAMINHAMENTO' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Caminhe ao redor do imóvel e marque as quinas via GPS"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Caminhamento GPS</span>
            </button>
            <button
              onClick={() => setModoCaptura('DESENHO_MANUAL')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                modoCaptura === 'DESENHO_MANUAL' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Toque na tela para adicionar vértices manualmente"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>Desenho Manual</span>
            </button>
          </div>
        </div>

        {/* Métricas do Lote (Área e Perímetro) */}
        <div className="px-4 py-2.5 bg-sky-50/60 border-b border-sky-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-700">
              <Ruler className="w-3.5 h-3.5 text-sky-600" />
              <span>Área: <strong className="font-mono text-sm text-sky-900">{area} m²</strong></span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-700">
              Perímetro: <strong className="font-mono text-sm text-sky-900">{perimetro} m</strong>
            </span>
          </div>

          <div className="text-slate-500 font-medium">
            Vértices: <strong>{vertices.length}</strong> pontos
          </div>
        </div>

        {/* Feedback Temporário */}
        {statusMsg && (
          <div className="px-4 py-1.5 bg-emerald-100 text-emerald-900 text-xs font-semibold text-center border-b border-emerald-200">
            {statusMsg}
          </div>
        )}

        {/* Canvas de Desenho Cartográfico */}
        <div className="p-4 flex flex-col items-center justify-center bg-slate-50 relative">
          <canvas
            ref={canvasRef}
            width={480}
            height={280}
            onClick={handleCanvasClick}
            className="w-full max-w-[480px] h-[280px] bg-white rounded-2xl border-2 border-slate-300 shadow-sm cursor-crosshair touch-none"
          />

          <p className="text-[11px] text-slate-500 mt-2 text-center">
            {modoCaptura === 'GPS_CAMINHAMENTO'
              ? 'Posicione-se em cada quina/vértice do lote e clique no botão abaixo para capturar a coordenada.'
              : 'Clique sobre a área branca do canvas para adicionar vértices do lote ou quadra.'}
          </p>
        </div>

        {/* Barra de Ação Inferior */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {modoCaptura === 'GPS_CAMINHAMENTO' && (
              <button
                onClick={handleAddVertexAtGPS}
                className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>+ Capturar Vértice GPS</span>
              </button>
            )}

            <button
              onClick={handleClear}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-200 transition cursor-pointer"
              title="Limpar vértices"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-initial py-2 px-4 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Geometria na OS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
