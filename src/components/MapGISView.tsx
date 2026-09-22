import React, { useState } from 'react';
import {
  MapPin,
  Layers,
  Filter,
  Navigation,
  Info,
  Maximize2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search
} from 'lucide-react';
import { CensoRecord, BairroR7, ZonaAbastecimento } from '../types/censo';
import { BAIRROS_DATA, LISTA_BAIRROS, ZONAS_ABASTECIMENTO } from '../data/bairrosData';

interface MapGISViewProps {
  records: CensoRecord[];
  onSelectRecord: (record: CensoRecord) => void;
  onAddNewAtCoord?: (lat: number, lng: number, bairro: BairroR7) => void;
}

export const MapGISView: React.FC<MapGISViewProps> = ({ records, onSelectRecord, onAddNewAtCoord }) => {
  const [selectedBairro, setSelectedBairro] = useState<string>('TODOS');
  const [selectedZA, setSelectedZA] = useState<string>('TODAS');
  const [activeRecord, setActiveRecord] = useState<CensoRecord | null>(records[0] || null);
  const [mapZoom, setMapZoom] = useState<number>(1);

  // Bounding box aproximada da área do R7 Salvador (-12.92 a -12.98 latitude, -38.42 a -38.50 longitude)
  const minLat = -12.975;
  const maxLat = -12.925;
  const minLng = -38.505;
  const maxLng = -38.420;

  const latToY = (lat: number) => {
    return ((maxLat - lat) / (maxLat - minLat)) * 520 + 40;
  };

  const lngToX = (lng: number) => {
    return ((lng - minLng) / (maxLng - minLng)) * 740 + 40;
  };

  const filteredRecords = records.filter((r) => {
    const matchesBairro = selectedBairro === 'TODOS' || r.bairro === selectedBairro;
    const matchesZA = selectedZA === 'TODAS' || r.zonaAbastecimento === selectedZA;
    return matchesBairro && matchesZA;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="rounded-2xl bg-white p-3.5 sm:p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Visualizador Cartográfico GIS — Setor R7 (Cabula)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Georreferenciamento de matrículas e shape cartográfico de lotes em campo (Item 11.2 PGCSA)
          </p>
        </div>

        {/* Filtros rápidos do mapa */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedBairro}
            onChange={(e) => setSelectedBairro(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="TODOS">Todos os Bairros</option>
            {LISTA_BAIRROS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={selectedZA}
            onChange={(e) => setSelectedZA(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="TODAS">Todas as ZAs</option>
            {ZONAS_ABASTECIMENTO.map((z) => (
              <option key={z.zona} value={z.zona}>{z.zona}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setMapZoom(Math.max(0.8, mapZoom - 0.2))}
              className="px-2 py-0.5 rounded bg-white font-mono text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              -
            </button>
            <span className="text-[11px] font-mono px-1 text-slate-600">{Math.round(mapZoom * 100)}%</span>
            <button
              onClick={() => setMapZoom(Math.min(2.0, mapZoom + 0.2))}
              className="px-2 py-0.5 rounded bg-white font-mono text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Canvas do Mapa e Detalhes da Matrícula Selecionada */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mapa Cartográfico Interativo */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner overflow-hidden relative min-h-[480px]">
          {/* Legenda Flutuante */}
          <div className="absolute top-3 left-3 z-10 rounded-xl bg-slate-900/90 p-2.5 backdrop-blur-xs border border-slate-700/80 text-[11px] text-slate-300 shadow-lg space-y-1">
            <span className="font-bold text-white block text-[11px] mb-1">Status da Ligação GIS</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Regular / Ativa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Inativa / Cortada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>Clandestina (Fraude / Gato)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
              <span>Vazamento Rastreado</span>
            </div>
          </div>

          {/* Canvas SVG */}
          <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
            <svg
              viewBox="0 0 820 600"
              className="w-full h-auto max-h-[560px] select-none transition-transform duration-200"
              style={{ transform: `scale(${mapZoom})` }}
            >
              <defs>
                <pattern id="gisGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                </pattern>
              </defs>

              {/* Grid de fundo */}
              <rect width="820" height="600" fill="#0f172a" />
              <rect width="820" height="600" fill="url(#gisGrid)" />

              {/* Polígonos aproximados dos bairros do R7 */}
              {LISTA_BAIRROS.map((nomeBairro) => {
                const info = BAIRROS_DATA[nomeBairro];
                const cx = lngToX(info.coordenadasCentro.lng);
                const cy = latToY(info.coordenadasCentro.lat);

                return (
                  <g key={nomeBairro} className="cursor-pointer group">
                    <circle
                      cx={cx}
                      cy={cy}
                      r="28"
                      fill="#0284c7"
                      fillOpacity="0.08"
                      stroke="#38bdf8"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={cx}
                      y={cy - 12}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontWeight="bold"
                      className="group-hover:fill-sky-300 transition"
                    >
                      {nomeBairro}
                    </text>
                  </g>
                );
              })}

              {/* Traçados das principais artérias (BR-324, Av Paralela, Silveira Martins) */}
              <path
                d="M 50 150 Q 250 250 450 480"
                fill="none"
                stroke="#334155"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
              <path
                d="M 200 450 Q 400 320 750 220"
                fill="none"
                stroke="#334155"
                strokeWidth="3"
                strokeDasharray="6 4"
              />

              {/* Pontos de Coleta Georreferenciados em Campo */}
              {filteredRecords.map((rec) => {
                const px = lngToX(rec.coordenadas.longitude);
                const py = latToY(rec.coordenadas.latitude);
                const isSelected = activeRecord?.id === rec.id;
                const isClandestina = rec.situacaoLigacao === 'CLANDESTINA_GATO';
                const hasLeak = rec.tipoVazamento !== 'NENHUM';

                let pinColor = '#10b981'; // normal
                if (isClandestina) pinColor = '#ef4444';
                else if (rec.situacaoLigacao === 'INATIVA' || rec.situacaoLigacao === 'CORTADA') pinColor = '#f59e0b';
                else if (hasLeak) pinColor = '#38bdf8';

                return (
                  <g
                    key={rec.id}
                    onClick={() => setActiveRecord(rec)}
                    className="cursor-pointer transition transform hover:scale-125"
                  >
                    {/* Ring se selecionado */}
                    {isSelected && (
                      <circle
                        cx={px}
                        cy={py}
                        r="14"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    )}

                    {/* Ping se clandestina */}
                    {isClandestina && (
                      <circle
                        cx={px}
                        cy={py}
                        r="18"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        opacity="0.6"
                      />
                    )}

                    {/* Marcador */}
                    <circle
                      cx={px}
                      cy={py}
                      r={isSelected ? 7 : 5}
                      fill={pinColor}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                    <text
                      x={px + 8}
                      y={py + 3}
                      fill="#e2e8f0"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {rec.matriculaEmbasa}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
            Setor Hidráulico R7 (Cabula) • Coordenadas WGS84
          </div>
        </div>

        {/* Painel Lateral: Detalhes do Ponto Cartográfico Selecionado */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
          {activeRecord ? (
            <div className="space-y-3">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                    Matrícula {activeRecord.matriculaEmbasa}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      activeRecord.syncStatus === 'synced'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {activeRecord.syncStatus === 'synced' ? '✓ Sincronizado' : '💾 Offline no Aparelho'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">
                  {activeRecord.logradouro}, Nº {activeRecord.numeroPorta}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeRecord.bairro} • {activeRecord.zonaAbastecimento}
                </p>
              </div>

              {/* Informações técnicas e cadastrais */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase block font-bold">Situação</span>
                  <span className="font-bold text-slate-800">{activeRecord.situacaoLigacao}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase block font-bold">Hidrômetro</span>
                  <span className="font-mono font-semibold text-slate-800">{activeRecord.numeroHidrometro}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase block font-bold">Leitura</span>
                  <span className="font-mono font-bold text-sky-800">{activeRecord.leituraAtualM3} m³</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase block font-bold">Vazamento</span>
                  <span className="font-semibold text-slate-800">{activeRecord.tipoVazamento}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Morador:</span>
                  <span className="font-semibold text-slate-800">{activeRecord.nomeCliente}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contato:</span>
                  <span className="text-slate-700">{activeRecord.telefoneContato}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Coordenadas:</span>
                  <span className="font-mono text-slate-600 text-[11px]">
                    {activeRecord.coordenadas.latitude.toFixed(5)}, {activeRecord.coordenadas.longitude.toFixed(5)}
                  </span>
                </div>
              </div>

              {/* Miniaturas das fotos */}
              <div>
                <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Evidências Fotográficas da OS
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {activeRecord.fotoFachada ? (
                    <img
                      src={activeRecord.fotoFachada}
                      alt="Fachada"
                      className="w-full h-20 object-cover rounded-lg border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="h-20 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                      Sem foto fachada
                    </div>
                  )}

                  {activeRecord.fotoHidrometro ? (
                    <img
                      src={activeRecord.fotoHidrometro}
                      alt="Hidrômetro"
                      className="w-full h-20 object-cover rounded-lg border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="h-20 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                      Sem foto medidor
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">
              Clique em um ponto no mapa para inspecionar os detalhes cadastrais da ligação.
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 mt-2">
            {activeRecord && (
              <button
                onClick={() => onSelectRecord(activeRecord)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white py-2 text-xs font-bold transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Abrir Prontuário Completo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
