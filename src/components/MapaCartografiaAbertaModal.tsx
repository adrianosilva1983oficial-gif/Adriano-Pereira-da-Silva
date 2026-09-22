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
  Ruler,
  Satellite,
  Compass,
  Plus,
  Crosshair,
  Target,
  Building2,
  Navigation,
  Move,
  Maximize2,
  Sparkles
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OrdemServicoSCIWeb, LoteCartografia } from '../types/os';
import { osService } from '../services/osService';
import {
  CAMADAS_CARTOGRAFICAS_ABERTAS,
  CamadaCartograficaAberta,
  cartografiaAbertaService,
  EdificacaoAbertaOSM,
  GeocodingResult,
} from '../services/cartografiaAbertaService';
import { salvarCartografiaLoteDB, saveOrdemServicoDB } from '../services/db';

interface MapaCartografiaAbertaModalProps {
  os: OrdemServicoSCIWeb;
  onClose: () => void;
  onSave?: (cartografia: LoteCartografia) => void;
}

export const MapaCartografiaAbertaModal: React.FC<MapaCartografiaAbertaModalProps> = ({
  os,
  onClose,
  onSave,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const hidrometroMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const osmPolygonsGroupRef = useRef<L.LayerGroup | null>(null);

  const [camadaAtiva, setCamadaAtiva] = useState<CamadaCartograficaAberta>(CAMADAS_CARTOGRAFICAS_ABERTAS[0]); // Satélite HD por padrão
  const [modoCaptura, setModoCaptura] = useState<'DESENHO_MANUAL' | 'GPS_CAMINHAMENTO'>('DESENHO_MANUAL');
  
  // Coordenada atual do hidrômetro/ponto da OS (pode ser ajustada para a localização real)
  const [pontoHidrometro, setPontoHidrometro] = useState<{ lat: number; lng: number }>({
    lat: os.coordenadas.latitude,
    lng: os.coordenadas.longitude,
  });

  const [vertices, setVertices] = useState<{ lat: number; lng: number }[]>(
    os.cartografiaLote?.vertices && os.cartografiaLote.vertices.length >= 3
      ? os.cartografiaLote.vertices
      : []
  );
  
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [lotesAbertosOSM, setLotesAbertosOSM] = useState<EdificacaoAbertaOSM[]>([]);
  const [geocodingResult, setGeocodingResult] = useState<GeocodingResult | null>(null);
  const [isBuscandoGeocoding, setIsBuscandoGeocoding] = useState(false);
  const [notificacao, setNotificacao] = useState<{ texto: string; tipo: 'sucesso' | 'info' | 'aviso' } | null>(null);

  const exibirNotificacao = (texto: string, tipo: 'sucesso' | 'info' | 'aviso' = 'info') => {
    setNotificacao({ texto, tipo });
    setTimeout(() => setNotificacao(null), 4000);
  };

  // Busca inicial da localização exata do endereço via geocodificação aberta (Nominatim / OSM)
  useEffect(() => {
    let active = true;
    setIsBuscandoGeocoding(true);

    cartografiaAbertaService
      .geocodificarEndereco(os.logradouro, os.numeroPorta, os.bairro, 'Salvador', 'Bahia')
      .then((resultado) => {
        if (active && resultado) {
          setGeocodingResult(resultado);
          // Calcula a distância entre a coordenada atual e a coordenada real da rua
          const dLat = (resultado.latitude - os.coordenadas.latitude) * 111320;
          const dLng = (resultado.longitude - os.coordenadas.longitude) * (111320 * Math.cos((os.coordenadas.latitude * Math.PI) / 180));
          const distanciaMetros = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));

          if (distanciaMetros > 40) {
            exibirNotificacao(
              `🎯 Endereço real localizado a ${distanciaMetros}m! Clique em "Ajustar para Endereço Real" para centralizar no lote exato.`,
              'aviso'
            );
          }
        }
      })
      .finally(() => {
        if (active) setIsBuscandoGeocoding(false);
      });

    return () => {
      active = false;
    };
  }, [os]);

  // Se não houver vértices, inicializa um lote retangular proporcional ao redor do hidrômetro
  useEffect(() => {
    if (vertices.length === 0) {
      const baseLat = pontoHidrometro.lat;
      const baseLng = pontoHidrometro.lng;
      const offsetLat = 0.00007; // ~8m largura
      const offsetLng = 0.00012; // ~13m comprimento (~100 a 200 m²)
      setVertices([
        { lat: baseLat + offsetLat, lng: baseLng - offsetLng },
        { lat: baseLat + offsetLat, lng: baseLng + offsetLng },
        { lat: baseLat - offsetLat, lng: baseLng + offsetLng },
        { lat: baseLat - offsetLat, lng: baseLng - offsetLng },
      ]);
    }
  }, [pontoHidrometro]);

  // Monitora GPS de alta precisão do dispositivo
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
      (err) => console.warn('Erro GPS:', err),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Busca edificações e lotes reais em bases abertas ao redor da coordenada
  useEffect(() => {
    cartografiaAbertaService
      .buscarQuadrasELotesAbertos(pontoHidrometro.lat, pontoHidrometro.lng, 250)
      .then((lotes) => {
        setLotesAbertosOSM(lotes);
      });
  }, [pontoHidrometro]);

  // Cálculo da área e perímetro (Fórmula de Shoelace / Gauss)
  const calculateGeometry = () => {
    if (vertices.length < 3) return { area: 0, perimetro: 0 };

    const refLat = vertices[0].lat;
    const refLng = vertices[0].lng;
    const latToMeters = 111320;
    const lngToMeters = 111320 * Math.cos((refLat * Math.PI) / 180);

    const xyPoints = vertices.map((v) => ({
      x: (v.lng - refLng) * lngToMeters,
      y: (v.lat - refLat) * latToMeters,
    }));

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

  // Inicializa o Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [pontoHidrometro.lat, pontoHidrometro.lng],
        zoom: 19,
        maxZoom: 20,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Camada Tile Base
      const tileLayer = L.tileLayer(camadaAtiva.tileUrl, {
        attribution: camadaAtiva.attribution,
        maxZoom: camadaAtiva.maxZoom,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      // Marcador do Hidrômetro / OS (Arrastável para reposicionar na entrada do lote!)
      const pinIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `<div style="background: linear-gradient(135deg, #0284c7, #0369a1); width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px; cursor: move;" title="Arraste para a entrada ou cavalete real do imóvel">💧</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([pontoHidrometro.lat, pontoHidrometro.lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #0369a1;">Ponto do Hidrômetro • Matrícula ${os.matriculaEmbasa}</strong><br/>
          <span>${os.logradouro}, Nº ${os.numeroPorta}</span><br/>
          <small style="color: #64748b;">Quadra: ${os.quadra} • Lote: ${os.lote}</small><br/>
          <em style="color: #059669; font-size: 10px;">💡 Arraste este pino para o cavalete real no mapa!</em>
        </div>
      `);

      marker.on('dragend', (e: L.LeafletEvent) => {
        const target = e.target as L.Marker;
        const pos = target.getLatLng();
        setPontoHidrometro({ lat: pos.lat, lng: pos.lng });
        exibirNotificacao(`📍 Ponto do hidrômetro reposicionado em [${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}]`, 'sucesso');
      });

      hidrometroMarkerRef.current = marker;

      // Grupo para polígonos da cartografia aberta (Overpass OSM)
      osmPolygonsGroupRef.current = L.layerGroup().addTo(map);

      // Grupo para polígono do lote ativo e vértices arrastáveis
      markersGroupRef.current = L.layerGroup().addTo(map);

      // Clique no mapa para adicionar vértices no modo desenho
      map.on('click', (e: L.LeafletMouseEvent) => {
        setVertices((prev) => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }]);
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sincroniza posição do pino do hidrômetro se pontoHidrometro mudar
  useEffect(() => {
    if (hidrometroMarkerRef.current) {
      hidrometroMarkerRef.current.setLatLng([pontoHidrometro.lat, pontoHidrometro.lng]);
    }
  }, [pontoHidrometro]);

  // Atualiza a camada Tile se o usuário alternar de satélite para vias ou carto
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      tileLayerRef.current.setUrl(camadaAtiva.tileUrl);
    }
  }, [camadaAtiva]);

  // Redesenha o polígono do lote e os marcadores de vértice
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (vertices.length >= 3) {
      const latlngs = vertices.map((v) => [v.lat, v.lng] as [number, number]);

      const polygon = L.polygon(latlngs, {
        color: '#059669', // Verde esmeralda sólido de alta visibilidade
        weight: 3.5,
        fillColor: '#10b981',
        fillOpacity: 0.35,
      }).addTo(group);

      polygonLayerRef.current = polygon;
    }

    // Adiciona pinos arrastáveis numerados em cada vértice do lote
    vertices.forEach((v, index) => {
      const vertexIcon = L.divIcon({
        className: 'vertex-pin',
        html: `<div style="background-color: #0f172a; color: #10b981; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid #10b981; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; cursor: move; box-shadow: 0 2px 5px rgba(0,0,0,0.4);">${index + 1}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([v.lat, v.lng], { icon: vertexIcon, draggable: true }).addTo(group);

      marker.on('drag', (e: L.LeafletEvent) => {
        const target = e.target as L.Marker;
        const newPos = target.getLatLng();
        setVertices((prev) => {
          const updated = [...prev];
          updated[index] = { lat: newPos.lat, lng: newPos.lng };
          return updated;
        });
      });
    });
  }, [vertices]);

  // Desenha as edificações e quadras abertas do OpenStreetMap
  useEffect(() => {
    const group = osmPolygonsGroupRef.current;
    if (!group || lotesAbertosOSM.length === 0) return;

    group.clearLayers();

    lotesAbertosOSM.forEach((lote) => {
      const latlngs = lote.coordenadas.map((c) => [c.lat, c.lng] as [number, number]);
      const poly = L.polygon(latlngs, {
        color: '#38bdf8',
        weight: 2,
        dashArray: '5, 5',
        fillColor: '#0284c7',
        fillOpacity: 0.15,
      }).addTo(group);

      poly.bindTooltip(
        `Lote Real OSM: ${lote.rua || ''} ${lote.numeroPorta ? `Nº ${lote.numeroPorta}` : ''} (Clique para encaixar)`,
        { sticky: true }
      );

      poly.on('click', () => {
        // Ao clicar no lote aberto, copia seus vértices para a OS com 1 toque!
        setVertices(lote.coordenadas);
        if (lote.centroide) {
          setPontoHidrometro(lote.centroide);
        }
        exibirNotificacao('✨ Lote encaixado com precisão no contorno real da edificação!', 'sucesso');
      });
    });
  }, [lotesAbertosOSM]);

  // Ação 1: Ajustar para o Endereço Real Cadastrado (Nominatim HD)
  const handleAjustarParaEnderecoReal = () => {
    if (!geocodingResult) {
      exibirNotificacao('Buscando coordenadas reais do logradouro...', 'info');
      return;
    }

    const novaLat = geocodingResult.latitude;
    const novaLng = geocodingResult.longitude;

    setPontoHidrometro({ lat: novaLat, lng: novaLng });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([novaLat, novaLng], 19);
    }

    // Se o resultado de geocodificação já tiver o polígono do lote/edificação, usa direto!
    if (geocodingResult.poligono && geocodingResult.poligono.length >= 3) {
      setVertices(geocodingResult.poligono);
    } else {
      // Recalcula vértices do lote no local real da rua
      const offsetLat = 0.00007;
      const offsetLng = 0.00012;
      setVertices([
        { lat: novaLat + offsetLat, lng: novaLng - offsetLng },
        { lat: novaLat + offsetLat, lng: novaLng + offsetLng },
        { lat: novaLat - offsetLat, lng: novaLng + offsetLng },
        { lat: novaLat - offsetLat, lng: novaLng - offsetLng },
      ]);
    }

    exibirNotificacao(
      `🎯 Mapa centralizado no endereço real: ${geocodingResult.displayName.slice(0, 50)}...`,
      'sucesso'
    );
  };

  // Ação 2: Encaixar no Lote Mais Próximo com 1 Toque (Snap Inteligente)
  const handleEncaixarLoteMaisProximo = () => {
    const maisProximo = cartografiaAbertaService.encontrarLoteMaisProximo(
      pontoHidrometro.lat,
      pontoHidrometro.lng,
      lotesAbertosOSM
    );

    if (maisProximo && maisProximo.coordenadas.length >= 3) {
      setVertices(maisProximo.coordenadas);
      if (maisProximo.centroide) {
        setPontoHidrometro(maisProximo.centroide);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([maisProximo.centroide.lat, maisProximo.centroide.lng]);
        }
      }
      exibirNotificacao('🏢 Lote ajustado automaticamente ao contorno predial mais próximo!', 'sucesso');
    } else {
      exibirNotificacao('Nenhum contorno cadastral aberto encontrado nas proximidades imediatas.', 'aviso');
    }
  };

  // Ação 3: Usar GPS Atual do Cadastrista no Local
  const handleUsarMeuGPS = () => {
    if (!currentGps) {
      exibirNotificacao('Aguardando sinal de GPS de alta precisão do dispositivo...', 'aviso');
      return;
    }

    const { lat, lng, accuracy } = currentGps;
    setPontoHidrometro({ lat, lng });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 19);

      // Remove círculo anterior se houver
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
      }

      // Desenha círculo de precisão
      accuracyCircleRef.current = L.circle([lat, lng], {
        radius: accuracy,
        color: '#3b82f6',
        fillColor: '#93c5fd',
        fillOpacity: 0.25,
      }).addTo(mapInstanceRef.current);
    }

    // Reposiciona vértices ao redor do GPS
    const offset = 0.00008;
    setVertices([
      { lat: lat + offset, lng: lng - offset },
      { lat: lat + offset, lng: lng + offset },
      { lat: lat - offset, lng: lng + offset },
      { lat: lat - offset, lng: lng - offset },
    ]);

    exibirNotificacao(`📍 Localização definida pelo seu GPS de campo (Precisão: ±${accuracy.toFixed(1)}m)`, 'sucesso');
  };

  // Ação 4: Adicionar Ponto de Caminhamento
  const handleAdicionarPontoGPS = () => {
    if (!currentGps) {
      exibirNotificacao('Aguardando sinal de GPS...', 'aviso');
      return;
    }
    setVertices((prev) => [...prev, { lat: currentGps.lat, lng: currentGps.lng }]);
    exibirNotificacao(`Vértice adicionado via GPS (precisão: ±${currentGps.accuracy.toFixed(1)}m)`, 'sucesso');
  };

  // Salvar no osService e no IndexedDB de Alta Capacidade
  const handleSalvar = async () => {
    if (vertices.length < 3) {
      exibirNotificacao('Desenhe pelo menos 3 vértices para fechar o polígono do lote.', 'aviso');
      return;
    }

    const cartografiaFinal: LoteCartografia = {
      vertices,
      areaM2: area,
      perimetroM: perimetro,
      tipoDesenho: modoCaptura === 'GPS_CAMINHAMENTO' ? 'GPS_CAMINHAMENTO' : 'DESENHO_MANUAL',
      capturadoEm: Date.now(),
      quadra: os.quadra,
      lote: os.lote,
    };

    // Atualiza a OS com a localização precisa corrigida e com a cartografia do lote
    const osAtualizada: OrdemServicoSCIWeb = {
      ...os,
      coordenadas: {
        latitude: pontoHidrometro.lat,
        longitude: pontoHidrometro.lng,
        precisaoMetros: currentGps ? currentGps.accuracy : 2.5,
        timestamp: Date.now(),
      },
      cartografiaLote: cartografiaFinal,
      atualizadoEm: Date.now(),
    };

    // 1. Salva no osService em memória
    osService.atualizarOS(osAtualizada);
    osService.salvarCartografiaOS(os.id, cartografiaFinal);

    // 2. Persiste no IndexedDB de Alta Capacidade (armazenamento permanente de +200.000 matrículas)
    try {
      await saveOrdemServicoDB(osAtualizada);
      await salvarCartografiaLoteDB({
        id: `carto_${os.id}`,
        matriculaEmbasa: os.matriculaEmbasa,
        osId: os.id,
        quadra: os.quadra,
        lote: os.lote,
        cartografia: cartografiaFinal,
        salvoEm: Date.now(),
      });
    } catch (e) {
      console.warn('Persistência IndexedDB:', e);
    }

    if (onSave) onSave(cartografiaFinal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-5xl w-full h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden font-sans">
        {/* Header com Informações da Matrícula e Endereço */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-950 via-sky-950 to-slate-900 text-white flex items-center justify-between border-b border-sky-500/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-600/30 border border-sky-400/30 flex items-center justify-center">
              <Satellite className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white">Cartografia Cadastral Georreferenciada</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono">
                  {area} m² • {perimetro}m
                </span>
                <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-semibold">
                  Satélite HD + Vias OSM
                </span>
              </div>
              <p className="text-[11px] text-sky-200">
                Matrícula: <strong className="font-mono text-white">{os.matriculaEmbasa}</strong> • QD: <strong>{os.quadra}</strong> / LT: <strong>{os.lote}</strong> • {os.logradouro}, Nº {os.numeroPorta} - {os.bairro}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Ferramentas de Alinhamento e Correção de Localização */}
        <div className="p-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 text-white">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Botão de Correção para Endereço Real Cadastrado */}
            <button
              type="button"
              onClick={handleAjustarParaEnderecoReal}
              disabled={isBuscandoGeocoding}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-md cursor-pointer transition disabled:opacity-50"
              title="Centraliza diretamente no endereço cadastrado no OpenStreetMap / Nominatim"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Ajustar para Endereço Real</span>
            </button>

            {/* Botão de Encaixe no Lote Mais Próximo */}
            <button
              type="button"
              onClick={handleEncaixarLoteMaisProximo}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs cursor-pointer transition"
              title="Alinha os vértices automaticamente à casa/lote mais próximo"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Encaixar no Lote Próximo</span>
            </button>

            {/* Botão Usar Meu GPS */}
            <button
              type="button"
              onClick={handleUsarMeuGPS}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs cursor-pointer transition"
              title="Centraliza na sua posição física de campo com precisão submétrica"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Meu GPS de Campo</span>
            </button>
          </div>

          {/* Seletor de Camadas */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Base:
            </span>
            {CAMADAS_CARTOGRAFICAS_ABERTAS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCamadaAtiva(c)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer whitespace-nowrap ${
                  camadaAtiva.id === c.id
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={c.descricao}
              >
                {c.nome.split(' ')[0]} {c.nome.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Notificação Flutuante de Alerta / Informação */}
        {notificacao && (
          <div
            className={`px-3 py-2 text-xs font-bold text-center animate-in fade-in shrink-0 flex items-center justify-center gap-2 ${
              notificacao.tipo === 'sucesso'
                ? 'bg-emerald-600 text-white'
                : notificacao.tipo === 'aviso'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-sky-700 text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{notificacao.texto}</span>
          </div>
        )}

        {/* Mapa Leaflet Real com Visão Satélite e Vias */}
        <div className="flex-1 relative w-full h-full bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Dica de Utilização Flutuante */}
          <div className="absolute top-3 left-3 z-40 bg-slate-900/95 text-white p-3 rounded-2xl backdrop-blur-md text-[11px] max-w-xs shadow-2xl border border-slate-700/80 pointer-events-none">
            <p className="font-bold flex items-center gap-1.5 text-amber-300 mb-1">
              <Crosshair className="w-3.5 h-3.5" />
              <span>Ajuste Fino de Localização:</span>
            </p>
            <ul className="space-y-1 text-slate-300 text-[10px] leading-tight">
              <li>• <strong>💧 Ponto Azul:</strong> Arraste o hidrômetro para o cavalete real.</li>
              <li>• <strong>🟢 Vértices 1, 2, 3:</strong> Arraste os pontos para alinhar com os muros.</li>
              <li>• <strong>🟦 Linhas Pontilhadas:</strong> Clique em qualquer lote OSM para importar o contorno.</li>
            </ul>
          </div>

          {/* Painel Flutuante Inferior com Métricas de Área e Coordenadas */}
          <div className="absolute bottom-4 left-4 z-40 bg-slate-950/95 text-white p-3 rounded-2xl backdrop-blur-md shadow-2xl border border-emerald-500/40 flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[9px] text-slate-400 block uppercase">Área do Lote</span>
              <span className="text-base font-black text-emerald-400">{area} m²</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <span className="text-[9px] text-slate-400 block uppercase">Perímetro</span>
              <span className="text-base font-black text-sky-400">{perimetro} m</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <span className="text-[9px] text-slate-400 block uppercase">Ponto Hidrômetro</span>
              <span className="text-[10px] font-bold text-slate-300 block">
                {pontoHidrometro.lat.toFixed(5)}, {pontoHidrometro.lng.toFixed(5)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer com Cancelar e Salvar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            Cartografia vinculada à Matrícula <strong>{os.matriculaEmbasa}</strong> ({os.quadra}/{os.lote})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVertices([])}
              className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Redefinir Lote</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSalvar}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Cartografia</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
