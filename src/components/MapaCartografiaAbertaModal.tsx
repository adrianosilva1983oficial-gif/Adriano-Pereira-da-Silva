import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layers,
  MapPin,
  X,
  CheckCircle2,
  Trash2,
  RotateCcw,
  RotateCw,
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
  Sparkles,
  Search,
  PenTool,
  Square,
  Undo2,
  Redo2,
  ArrowRight,
  ZoomIn,
  Check,
  Flame,
  HelpCircle,
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
import {
  PontoGeo,
  calcularAreaEPerimetro,
  calcularCentroide,
  calcularDistanciaEntrePontos,
  calcularPontoMedio,
  gerarLoteRetangular,
  gerarRetangulo2Pontos,
  rotacionarPoligono,
  simplificarPoligonoRDP,
  transladarPoligono,
  triggerGeofenceVibration,
  playGeofenceChime,
} from '../utils/geoUtils';

interface MapaCartografiaAbertaModalProps {
  os: OrdemServicoSCIWeb;
  onClose: () => void;
  onSave?: (cartografia: LoteCartografia) => void;
}

// Modos de desenho suportados para o cadastrista
type ModoDesenhoLote =
  | 'NAVEGACAO'            // Apenas navegação e arrastar vértices
  | 'TRAPO_LIVRE'          // Desenho contínuo à mão livre com dedo/touch (mais rápido e fluido)
  | 'RETANGULO_2_CLIQUES'  // 2 toques diagonais para formar o lote
  | 'PONTO_A_PONTO'        // Clique vértice por vértice com linha elástica
  | 'MOVER_LOTE'           // Mover todo o polígono sem deformar
  | 'GPS_CAMINHAMENTO';    // Caminhamento físico em campo

// Gabaritos comuns de lotes urbanos Embasa / Salvador
const GABARITOS_LOTES = [
  { label: '5 × 20m (100m²)', largura: 5, comprimento: 20 },
  { label: '6 × 25m (150m²)', largura: 6, comprimento: 25 },
  { label: '8 × 20m (160m²)', largura: 8, comprimento: 20 },
  { label: '8 × 25m (200m²)', largura: 8, comprimento: 25 },
  { label: '10 × 25m (250m²)', largura: 10, comprimento: 25 },
  { label: '10 × 30m (300m²)', largura: 10, comprimento: 30 },
  { label: '12 × 30m (360m²)', largura: 12, comprimento: 30 },
];

export const MapaCartografiaAbertaModal: React.FC<MapaCartografiaAbertaModalProps> = ({
  os,
  onClose,
  onSave,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const midpointGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const hidrometroMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const osmPolygonsGroupRef = useRef<L.LayerGroup | null>(null);
  const freehandPolylineRef = useRef<L.Polyline | null>(null);
  const rubberbandLineRef = useRef<L.Polyline | null>(null);
  const rubberbandTooltipRef = useRef<L.Tooltip | null>(null);
  const centroidMarkerRef = useRef<L.Marker | null>(null);

  // Estado de Camadas
  const [camadaAtiva, setCamadaAtiva] = useState<CamadaCartograficaAberta>(CAMADAS_CARTOGRAFICAS_ABERTAS[0]); // Satélite HD

  // Estado da Ferramenta de Desenho
  const [modoDesenho, setModoDesenho] = useState<ModoDesenhoLote>('NAVEGACAO');
  const [anguloRotacao, setAnguloRotacao] = useState<number>(0);
  const [mostrarGabaritos, setMostrarGabaritos] = useState<boolean>(false);

  // Coordenada do hidrômetro/ponto focal da OS
  const [pontoHidrometro, setPontoHidrometro] = useState<PontoGeo>({
    lat: os.coordenadas.latitude,
    lng: os.coordenadas.longitude,
  });

  // Vértices do Lote
  const [vertices, setVertices] = useState<PontoGeo[]>(
    os.cartografiaLote?.vertices && os.cartografiaLote.vertices.length >= 3
      ? os.cartografiaLote.vertices
      : []
  );

  // Histórico para Desfazer/Refazer
  const [historicoVertices, setHistoricoVertices] = useState<PontoGeo[][]>([]);
  const [historicoIndice, setHistoricoIndice] = useState<number>(-1);

  // GPS e Geocodificação
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [lotesAbertosOSM, setLotesAbertosOSM] = useState<EdificacaoAbertaOSM[]>([]);
  const [geocodingResult, setGeocodingResult] = useState<GeocodingResult | null>(null);
  const [isBuscandoGeocoding, setIsBuscandoGeocoding] = useState<boolean>(false);
  const [localizacaoConfirmadaOficial, setLocalizacaoConfirmadaOficial] = useState<boolean>(false);

  // Busca livre de endereço no mapa
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [resultadosBusca, setResultadosBusca] = useState<GeocodingResult[]>([]);
  const [mostrarResultadosBusca, setMostrarResultadosBusca] = useState<boolean>(false);

  // Estados temporários de desenho
  const [pontoInicialRetangulo, setPontoInicialRetangulo] = useState<PontoGeo | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<PontoGeo[]>([]);
  const isDrawingFreehandRef = useRef<boolean>(false);

  // Notificações visuais
  const [notificacao, setNotificacao] = useState<{ texto: string; tipo: 'sucesso' | 'info' | 'aviso' } | null>(null);

  const exibirNotificacao = useCallback((texto: string, tipo: 'sucesso' | 'info' | 'aviso' = 'info') => {
    setNotificacao({ texto, tipo });
    setTimeout(() => setNotificacao(null), 4500);
  }, []);

  // Salvar no histórico
  const atualizarVerticesComHistorico = useCallback((novosVertices: PontoGeo[]) => {
    setHistoricoVertices((prev) => {
      const corte = prev.slice(0, historicoIndice + 1);
      return [...corte, novosVertices];
    });
    setHistoricoIndice((prev) => prev + 1);
    setVertices(novosVertices);
  }, [historicoIndice]);

  const handleDesfazer = () => {
    if (historicoIndice > 0) {
      const novoIndice = historicoIndice - 1;
      setHistoricoIndice(novoIndice);
      setVertices(historicoVertices[novoIndice]);
      exibirNotificacao('Ação desfeita', 'info');
    } else if (historicoIndice === 0) {
      setHistoricoIndice(-1);
      setVertices([]);
      exibirNotificacao('Lote limpo', 'info');
    }
  };

  // Cálculo em tempo real de geometria
  const { area, perimetro } = calcularAreaEPerimetro(vertices);

  // --- LOCALIZAÇÃO DE ALTA PRECISÃO AO ABRIR ---
  useEffect(() => {
    let active = true;
    setIsBuscandoGeocoding(true);

    // Se a matrícula já tiver vértices definidos, centraliza direto no centroide do lote salvo
    if (os.cartografiaLote?.vertices && os.cartografiaLote.vertices.length >= 3) {
      const centroide = calcularCentroide(os.cartografiaLote.vertices);
      setPontoHidrometro(centroide);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([centroide.lat, centroide.lng], 19);
      }
      setIsBuscandoGeocoding(false);
      setLocalizacaoConfirmadaOficial(true);
      return;
    }

    // Geocodificação de alta velocidade (Photon + Nominatim) com localização da rua e número
    cartografiaAbertaService
      .geocodificarEndereco(os.logradouro, os.numeroPorta, os.bairro, 'Salvador', 'Bahia')
      .then((resultado) => {
        if (!active || !resultado) return;

        setGeocodingResult(resultado);
        const distMetros = calcularDistanciaEntrePontos(
          { lat: os.coordenadas.latitude, lng: os.coordenadas.longitude },
          { lat: resultado.latitude, lng: resultado.longitude }
        );

        // Se o ponto original da OS estava distante (> 25m) ou em coordenada genérica do bairro:
        // AUTO-CENTRALIZA COM PRECISÃO diretamente no endereço real!
        if (distMetros > 25 || os.coordenadas.precisaoMetros > 5) {
          setPontoHidrometro({ lat: resultado.latitude, lng: resultado.longitude });
          setLocalizacaoConfirmadaOficial(true);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([resultado.latitude, resultado.longitude], 19, {
              animate: true,
              duration: 1.0,
            });
          }

          // Se já encontramos o polígono do lote na base cadastral aberta, adota imediatamente!
          if (resultado.poligono && resultado.poligono.length >= 3) {
            atualizarVerticesComHistorico(resultado.poligono);
            exibirNotificacao(
              `🎯 Localização auto-ajustada com precisão no lote oficial: ${resultado.displayName.slice(0, 55)}...`,
              'sucesso'
            );
          } else {
            // Gera um lote retangular proporcional de 8x20m exatamente no local do imóvel
            const loteInicial = gerarLoteRetangular(
              { lat: resultado.latitude, lng: resultado.longitude },
              8,
              20,
              0
            );
            atualizarVerticesComHistorico(loteInicial);
            exibirNotificacao(
              `🎯 Localização auto-ajustada na ${os.logradouro}, Nº ${os.numeroPorta} (${distMetros}m corrigidos)`,
              'sucesso'
            );
          }
        } else {
          setLocalizacaoConfirmadaOficial(true);
        }
      })
      .catch((err) => console.warn('Erro ao geocodificar:', err))
      .finally(() => {
        if (active) setIsBuscandoGeocoding(false);
      });

    return () => {
      active = false;
    };
  }, [os, atualizarVerticesComHistorico]);

  // Se após carregar ainda não houver vértices, inicializa retângulo de 8x20m centralizado
  useEffect(() => {
    if (vertices.length === 0 && !isBuscandoGeocoding) {
      const ret = gerarLoteRetangular(pontoHidrometro, 8, 20, 0);
      setVertices(ret);
      setHistoricoVertices([ret]);
      setHistoricoIndice(0);
    }
  }, [pontoHidrometro, isBuscandoGeocoding]);

  // GPS do dispositivo móvel do cadastrista em campo
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
      (err) => console.warn('Aviso GPS:', err),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Busca edificações e lotes abertos do OpenStreetMap na área
  useEffect(() => {
    cartografiaAbertaService
      .buscarQuadrasELotesAbertos(pontoHidrometro.lat, pontoHidrometro.lng, 250)
      .then((lotes) => {
        setLotesAbertosOSM(lotes);
      });
  }, [pontoHidrometro]);

  // Inicializa mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

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

    // Marcador do Hidrômetro (Arrastável)
    const pinIcon = L.divIcon({
      className: 'custom-pin-icon',
      html: `<div style="background: linear-gradient(135deg, #0284c7, #0369a1); width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 15px; cursor: move;" title="💧 Ponto do Hidrômetro / Cavalete (Arraste para reposicionar)">💧</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const marker = L.marker([pontoHidrometro.lat, pontoHidrometro.lng], {
      icon: pinIcon,
      draggable: true,
      zIndexOffset: 1000,
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
      exibirNotificacao(`📍 Hidrômetro reposicionado em [${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}]`, 'sucesso');
    });

    hidrometroMarkerRef.current = marker;

    // Grupos de camadas
    osmPolygonsGroupRef.current = L.layerGroup().addTo(map);
    markersGroupRef.current = L.layerGroup().addTo(map);
    midpointGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sincroniza camada tile quando alternada
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      tileLayerRef.current.setUrl(camadaAtiva.tileUrl);
    }
  }, [camadaAtiva]);

  // Sincroniza posição do hidrômetro
  useEffect(() => {
    if (hidrometroMarkerRef.current) {
      hidrometroMarkerRef.current.setLatLng([pontoHidrometro.lat, pontoHidrometro.lng]);
    }
  }, [pontoHidrometro]);

  // Renderiza polígonos de edificações abertas OSM
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
        `Lote OSM: ${lote.rua || ''} ${lote.numeroPorta ? `Nº ${lote.numeroPorta}` : ''} (Clique para encaixar)`,
        { sticky: true }
      );

      poly.on('click', () => {
        atualizarVerticesComHistorico(lote.coordenadas);
        if (lote.centroide) {
          setPontoHidrometro(lote.centroide);
        }
        triggerGeofenceVibration();
        playGeofenceChime();
        exibirNotificacao('✨ Lote encaixado perfeitamente no contorno predial OSM!', 'sucesso');
      });
    });
  }, [lotesAbertosOSM, atualizarVerticesComHistorico, exibirNotificacao]);

  // --- REDESENHO COMPLETO DO LOTE COM VÉRTICES, ALÇAS DE MEIO E LABELS DE MEDIDA ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    const midGroup = midpointGroupRef.current;
    if (!map || !group || !midGroup) return;

    group.clearLayers();
    midGroup.clearLayers();

    if (vertices.length >= 3) {
      const latlngs = vertices.map((v) => [v.lat, v.lng] as [number, number]);

      const polygon = L.polygon(latlngs, {
        color: '#10b981', // Verde esmeralda brilhante
        weight: 3.5,
        fillColor: '#10b981',
        fillOpacity: 0.35,
      }).addTo(group);

      polygonLayerRef.current = polygon;

      // Marcador central para Mover Lote Completo
      const centroide = calcularCentroide(vertices);
      const centerIcon = L.divIcon({
        className: 'center-move-pin',
        html: `<div style="background-color: #047857; color: #ffffff; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 13px; cursor: move; box-shadow: 0 4px 10px rgba(0,0,0,0.5);" title="✥ Arraste para mover todo o lote">✥</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const centerMarker = L.marker([centroide.lat, centroide.lng], {
        icon: centerIcon,
        draggable: true,
        zIndexOffset: 800,
      }).addTo(group);

      let prevCenterPos = centroide;
      centerMarker.on('drag', (e: L.LeafletEvent) => {
        const target = e.target as L.Marker;
        const cur = target.getLatLng();
        const dLat = cur.lat - prevCenterPos.lat;
        const dLng = cur.lng - prevCenterPos.lng;
        prevCenterPos = { lat: cur.lat, lng: cur.lng };

        setVertices((prev) => transladarPoligono(prev, dLat, dLng));
      });

      centerMarker.on('dragend', () => {
        atualizarVerticesComHistorico(vertices);
        exibirNotificacao('Lote transladado', 'info');
      });

      centroidMarkerRef.current = centerMarker;

      // Adiciona Alças de Ponto Médio (+) para inserir novos vértices em 1 clique
      vertices.forEach((v, index) => {
        const nextVertex = vertices[(index + 1) % vertices.length];
        const midPoint = calcularPontoMedio(v, nextVertex);
        const dist = calcularDistanciaEntrePontos(v, nextVertex);

        // Alça do Ponto Médio
        const midIcon = L.divIcon({
          className: 'mid-split-pin',
          html: `<div style="background-color: #3b82f6; color: white; width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.4);" title="Clique para adicionar vértice nesta aresta (+)">+</div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const midMarker = L.marker([midPoint.lat, midPoint.lng], { icon: midIcon }).addTo(midGroup);
        midMarker.bindTooltip(`${dist.toFixed(1)}m`, { permanent: true, direction: 'center', className: 'edge-distance-label' });

        midMarker.on('click', () => {
          // Insere novo vértice na posição intermediária
          const updated = [...vertices];
          updated.splice(index + 1, 0, midPoint);
          atualizarVerticesComHistorico(updated);
          triggerGeofenceVibration();
          exibirNotificacao(`Vértice adicionado na aresta (${dist.toFixed(1)}m)`, 'sucesso');
        });
      });
    }

    // Pinos de Vértice Arrastáveis Ergonômicos (Grandes para Touch)
    vertices.forEach((v, index) => {
      const vertexIcon = L.divIcon({
        className: 'vertex-pin-touch',
        html: `<div style="background-color: #0f172a; color: #10b981; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid #10b981; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; cursor: move; box-shadow: 0 3px 8px rgba(0,0,0,0.5); user-select: none;">${index + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([v.lat, v.lng], { icon: vertexIcon, draggable: true, zIndexOffset: 900 }).addTo(group);

      marker.on('drag', (e: L.LeafletEvent) => {
        const target = e.target as L.Marker;
        const newPos = target.getLatLng();
        setVertices((prev) => {
          const updated = [...prev];
          updated[index] = { lat: newPos.lat, lng: newPos.lng };
          return updated;
        });
      });

      marker.on('dragend', () => {
        atualizarVerticesComHistorico(vertices);
      });

      // Clique duplo ou longo para remover vértice se houver mais de 3
      marker.on('dblclick', () => {
        if (vertices.length > 3) {
          const updated = vertices.filter((_, i) => i !== index);
          atualizarVerticesComHistorico(updated);
          exibirNotificacao(`Vértice ${index + 1} removido`, 'info');
        } else {
          exibirNotificacao('O polígono precisa de pelo menos 3 vértices.', 'aviso');
        }
      });
    });
  }, [vertices, atualizarVerticesComHistorico, exibirNotificacao]);

  // --- CONTROLE DE MODOS DE DESENHO NO MAPA ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Limpa ouvintes anteriores
    map.off('click');
    map.off('mousemove');

    if (modoDesenho === 'PONTO_A_PONTO') {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const novoPonto = { lat: e.latlng.lat, lng: e.latlng.lng };
        atualizarVerticesComHistorico([...vertices, novoPonto]);
        triggerGeofenceVibration();
      });

      // Linha elástica guia com medição dinâmica em metros
      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        if (vertices.length > 0) {
          const ultimo = vertices[vertices.length - 1];
          const dist = calcularDistanciaEntrePontos(ultimo, { lat: e.latlng.lat, lng: e.latlng.lng });

          if (!rubberbandLineRef.current) {
            rubberbandLineRef.current = L.polyline([[ultimo.lat, ultimo.lng], [e.latlng.lat, e.latlng.lng]], {
              color: '#38bdf8',
              weight: 2,
              dashArray: '4, 4',
            }).addTo(map);
          } else {
            rubberbandLineRef.current.setLatLngs([[ultimo.lat, ultimo.lng], [e.latlng.lat, e.latlng.lng]]);
          }

          if (!rubberbandTooltipRef.current) {
            rubberbandTooltipRef.current = L.tooltip({ permanent: true, direction: 'top' })
              .setContent(`${dist.toFixed(1)}m`)
              .setLatLng([e.latlng.lat, e.latlng.lng])
              .addTo(map);
          } else {
            rubberbandTooltipRef.current.setContent(`${dist.toFixed(1)}m`);
            rubberbandTooltipRef.current.setLatLng([e.latlng.lat, e.latlng.lng]);
          }
        }
      });
    } else if (modoDesenho === 'RETANGULO_2_CLIQUES') {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const pontoAtual = { lat: e.latlng.lat, lng: e.latlng.lng };
        if (!pontoInicialRetangulo) {
          setPontoInicialRetangulo(pontoAtual);
          exibirNotificacao('1º Canto marcado! Clique no canto diagonal oposto para fechar o lote.', 'info');
        } else {
          const novoRet = gerarRetangulo2Pontos(pontoInicialRetangulo, pontoAtual);
          atualizarVerticesComHistorico(novoRet);
          setPontoInicialRetangulo(null);
          setModoDesenho('NAVEGACAO');
          triggerGeofenceVibration();
          playGeofenceChime();
          exibirNotificacao('✓ Lote retangular desenhado com sucesso!', 'sucesso');
        }
      });

      // Preview dinâmico do retângulo
      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        if (pontoInicialRetangulo) {
          const prev = gerarRetangulo2Pontos(pontoInicialRetangulo, { lat: e.latlng.lat, lng: e.latlng.lng });
          const latlngs = prev.map((p) => [p.lat, p.lng] as [number, number]);

          if (!rubberbandLineRef.current) {
            rubberbandLineRef.current = L.polyline([...latlngs, latlngs[0]], {
              color: '#10b981',
              weight: 2,
              dashArray: '4, 4',
            }).addTo(map);
          } else {
            rubberbandLineRef.current.setLatLngs([...latlngs, latlngs[0]]);
          }
        }
      });
    }

    return () => {
      if (rubberbandLineRef.current) {
        rubberbandLineRef.current.remove();
        rubberbandLineRef.current = null;
      }
      if (rubberbandTooltipRef.current) {
        rubberbandTooltipRef.current.remove();
        rubberbandTooltipRef.current = null;
      }
    };
  }, [modoDesenho, vertices, pontoInicialRetangulo, atualizarVerticesComHistorico, exibirNotificacao]);

  // --- MOTOR DE DESENHO FLUIDO / MÃO LIVRE (TOUCH & MOUSE DRAG) ---
  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    const map = mapInstanceRef.current;
    if (!mapContainer || !map || modoDesenho !== 'TRAPO_LIVRE') return;

    // Desativa arrasto do mapa para permitir traço contínuo na tela
    map.dragging.disable();

    let rawPoints: PontoGeo[] = [];

    const handlePointerDown = (e: PointerEvent) => {
      isDrawingFreehandRef.current = true;
      rawPoints = [];
      const latlng = map.mouseEventToLatLng(e);
      rawPoints.push({ lat: latlng.lat, lng: latlng.lng });

      if (freehandPolylineRef.current) {
        freehandPolylineRef.current.remove();
      }

      freehandPolylineRef.current = L.polyline([[latlng.lat, latlng.lng]], {
        color: '#10b981',
        weight: 4,
      }).addTo(map);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDrawingFreehandRef.current) return;
      const latlng = map.mouseEventToLatLng(e);
      rawPoints.push({ lat: latlng.lat, lng: latlng.lng });

      if (freehandPolylineRef.current) {
        freehandPolylineRef.current.setLatLngs(rawPoints.map((p) => [p.lat, p.lng] as [number, number]));
      }
    };

    const handlePointerUp = () => {
      if (!isDrawingFreehandRef.current) return;
      isDrawingFreehandRef.current = false;

      if (rawPoints.length >= 4) {
        // Simplifica traço com algoritmo Ramer-Douglas-Peucker (1.2m de tolerância)
        const simplificado = simplificarPoligonoRDP(rawPoints, 1.2);

        if (simplificado.length >= 3) {
          atualizarVerticesComHistorico(simplificado);
          triggerGeofenceVibration();
          playGeofenceChime();
          exibirNotificacao(`✨ Lote gerado via traço fluido! (${simplificado.length} vértices)`, 'sucesso');
        } else {
          exibirNotificacao('Traço muito curto. Faça o contorno completo ao redor dos muros do lote.', 'aviso');
        }
      }

      if (freehandPolylineRef.current) {
        freehandPolylineRef.current.remove();
        freehandPolylineRef.current = null;
      }

      // Retorna para modo de navegação após concluir o traço
      setModoDesenho('NAVEGACAO');
      map.dragging.enable();
    };

    mapContainer.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      map.dragging.enable();
      mapContainer.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (freehandPolylineRef.current) {
        freehandPolylineRef.current.remove();
        freehandPolylineRef.current = null;
      }
    };
  }, [modoDesenho, atualizarVerticesComHistorico, exibirNotificacao]);

  // Aplica Gabarito Urbano Rápido
  const handleAplicarGabarito = (largura: number, comprimento: number) => {
    const centro = vertices.length >= 3 ? calcularCentroide(vertices) : pontoHidrometro;
    const novoLote = gerarLoteRetangular(centro, largura, comprimento, anguloRotacao);
    atualizarVerticesComHistorico(novoLote);
    setMostrarGabaritos(false);
    triggerGeofenceVibration();
    exibirNotificacao(`Gabarito ${largura}x${comprimento}m (${largura * comprimento}m²) aplicado com sucesso!`, 'sucesso');
  };

  // Girar Lote em Torno do Centroide
  const handleGirarLote = (deltaGraus: number) => {
    if (vertices.length < 3) return;
    const novoAngulo = (anguloRotacao + deltaGraus + 360) % 360;
    setAnguloRotacao(novoAngulo);
    const rotacionado = rotacionarPoligono(vertices, deltaGraus);
    atualizarVerticesComHistorico(rotacionado);
    exibirNotificacao(`Lote girado ${deltaGraus > 0 ? `+${deltaGraus}°` : `${deltaGraus}°`} (Orientação: ${novoAngulo}°)`, 'info');
  };

  // Centralizar no Endereço Real Cadastrado
  const handleCentralizarEnderecoReal = () => {
    if (!geocodingResult) {
      exibirNotificacao('Localizando endereço no banco cartográfico...', 'info');
      return;
    }
    const { latitude, longitude } = geocodingResult;
    setPontoHidrometro({ lat: latitude, lng: longitude });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([latitude, longitude], 19, { animate: true, duration: 0.8 });
    }
    exibirNotificacao(`🎯 Centralizado em: ${geocodingResult.displayName.slice(0, 50)}...`, 'sucesso');
  };

  // Centralizar no Meu GPS de Campo
  const handleCentralizarMeuGPS = () => {
    if (!currentGps) {
      exibirNotificacao('Aguardando sinal do GPS de alta precisão...', 'aviso');
      return;
    }
    const { lat, lng, accuracy } = currentGps;
    setPontoHidrometro({ lat, lng });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 19, { animate: true, duration: 0.8 });

      if (accuracyCircleRef.current) accuracyCircleRef.current.remove();
      accuracyCircleRef.current = L.circle([lat, lng], {
        radius: accuracy,
        color: '#3b82f6',
        fillColor: '#93c5fd',
        fillOpacity: 0.25,
      }).addTo(mapInstanceRef.current);
    }
    exibirNotificacao(`📍 Centralizado no seu GPS de campo (Precisão: ±${accuracy.toFixed(1)}m)`, 'sucesso');
  };

  // Enquadrar todo o lote na visualização
  const handleEnquadrarLote = () => {
    if (vertices.length < 3 || !mapInstanceRef.current) return;
    const bounds = L.latLngBounds(vertices.map((v) => [v.lat, v.lng] as [number, number]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 19 });
    exibirNotificacao('Lote enquadrado no centro da tela', 'info');
  };

  // Busca livre de logradouro
  const handleBuscaLivre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termoBusca || termoBusca.trim().length < 3) return;
    setIsBuscandoGeocoding(true);
    const res = await cartografiaAbertaService.buscarEnderecoLivre(termoBusca, pontoHidrometro.lat, pontoHidrometro.lng);
    setResultadosBusca(res);
    setMostrarResultadosBusca(true);
    setIsBuscandoGeocoding(false);
  };

  const handleSelecionarResultadoBusca = (res: GeocodingResult) => {
    setPontoHidrometro({ lat: res.latitude, lng: res.longitude });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([res.latitude, res.longitude], 19, { animate: true, duration: 0.8 });
    }
    const novoLote = gerarLoteRetangular({ lat: res.latitude, lng: res.longitude }, 8, 20, anguloRotacao);
    atualizarVerticesComHistorico(novoLote);
    setMostrarResultadosBusca(false);
    setTermoBusca(res.displayName);
    exibirNotificacao(`📍 Localizado: ${res.displayName.slice(0, 50)}...`, 'sucesso');
  };

  // Salvar no osService e no IndexedDB permanente
  const handleSalvar = async () => {
    if (vertices.length < 3) {
      exibirNotificacao('Desenhe pelo menos 3 vértices para fechar o polígono do lote.', 'aviso');
      return;
    }

    const cartografiaFinal: LoteCartografia = {
      vertices,
      areaM2: area,
      perimetroM: perimetro,
      tipoDesenho: modoDesenho === 'GPS_CAMINHAMENTO' ? 'GPS_CAMINHAMENTO' : 'DESENHO_MANUAL',
      capturadoEm: Date.now(),
      quadra: os.quadra,
      lote: os.lote,
    };

    const osAtualizada: OrdemServicoSCIWeb = {
      ...os,
      coordenadas: {
        latitude: pontoHidrometro.lat,
        longitude: pontoHidrometro.lng,
        precisaoMetros: currentGps ? currentGps.accuracy : 2.0,
        timestamp: Date.now(),
      },
      cartografiaLote: cartografiaFinal,
      atualizadoEm: Date.now(),
    };

    osService.atualizarOS(osAtualizada);
    osService.salvarCartografiaOS(os.id, cartografiaFinal);

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

    triggerGeofenceVibration();
    playGeofenceChime();
    if (onSave) onSave(cartografiaFinal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-6xl w-full h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden font-sans">
        {/* HEADER MODERNO COM DADOS DA MATRÍCULA E BUSCA PRECISA */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-950 via-sky-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-sky-500/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-600/30 border border-sky-400/30 flex items-center justify-center">
              <Satellite className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm text-white">Cartografia Cadastral de Alta Precisão</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black font-mono">
                  {area} m² • {perimetro}m
                </span>
                {localizacaoConfirmadaOficial && (
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-sky-400" /> Localização Exata
                  </span>
                )}
              </div>
              <p className="text-[11px] text-sky-200">
                Matrícula: <strong className="font-mono text-white">{os.matriculaEmbasa}</strong> • QD: <strong>{os.quadra}</strong> / LT: <strong>{os.lote}</strong> • {os.logradouro}, Nº {os.numeroPorta} - {os.bairro}
              </p>
            </div>
          </div>

          {/* Barra de Busca de Endereço Rápida */}
          <div className="relative flex items-center gap-2 flex-1 max-w-sm">
            <form onSubmit={handleBuscaLivre} className="w-full flex items-center gap-1">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  placeholder="Localizar rua, praça, nº..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-8 pr-3 py-1.5 text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-sky-400"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer transition"
              >
                Buscar
              </button>
            </form>

            {/* Dropdown de Resultados da Busca */}
            {mostrarResultadosBusca && resultadosBusca.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 max-h-48 overflow-y-auto">
                {resultadosBusca.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelecionarResultadoBusca(r)}
                    className="w-full text-left p-2 hover:bg-slate-800 rounded-lg text-xs text-slate-200 border-b border-slate-800 last:border-none flex items-start gap-2 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{r.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BARRA DE FERRAMENTAS PRINCIPAL: DESENHO FLUIDO & LOCALIZAÇÃO */}
        <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 text-white">
          {/* GRUPO 1: FERRAMENTAS DE DESENHO RÁPIDO */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 1. Traço Fluido (Mão Livre) */}
            <button
              type="button"
              onClick={() => {
                setModoDesenho(modoDesenho === 'TRAPO_LIVRE' ? 'NAVEGACAO' : 'TRAPO_LIVRE');
                if (modoDesenho !== 'TRAPO_LIVRE') {
                  exibirNotificacao('✏️ Modo Traço Fluido ativado: Deslize o dedo contornando os muros do imóvel!', 'sucesso');
                }
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1.5 shadow-md cursor-pointer transition ${
                modoDesenho === 'TRAPO_LIVRE'
                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                  : 'bg-slate-800 text-emerald-300 hover:bg-slate-700 border border-emerald-500/30'
              }`}
              title="Desenhe o lote com 1 único traço contínuo com o dedo no touchscreen"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Traço Fluido (Mão Livre)</span>
            </button>

            {/* 2. Retângulo 2 Toques */}
            <button
              type="button"
              onClick={() => {
                setModoDesenho(modoDesenho === 'RETANGULO_2_CLIQUES' ? 'NAVEGACAO' : 'RETANGULO_2_CLIQUES');
                setPontoInicialRetangulo(null);
                if (modoDesenho !== 'RETANGULO_2_CLIQUES') {
                  exibirNotificacao('⬚ Retângulo 2 Toques: Toque na frente do lote e depois no canto oposto de fundos.', 'info');
                }
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 shadow-xs cursor-pointer transition ${
                modoDesenho === 'RETANGULO_2_CLIQUES'
                  ? 'bg-sky-500 text-white ring-2 ring-sky-300'
                  : 'bg-slate-800 text-sky-300 hover:bg-slate-700 border border-sky-500/30'
              }`}
              title="Crie um retângulo de lote perfeito com apenas 2 toques diagonais"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Retângulo 2 Toques</span>
            </button>

            {/* 3. Gabaritos Prontos */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMostrarGabaritos(!mostrarGabaritos)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                title="Insira dimensões de lotes padronizados da Embasa (ex: 8x20m, 10x25m)"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Gabaritos de Lote</span>
              </button>

              {mostrarGabaritos && (
                <div className="absolute top-full left-0 mt-1 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 w-56 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 px-2 uppercase block">Tamanhos Padrão:</span>
                  {GABARITOS_LOTES.map((g, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAplicarGabarito(g.largura, g.comprimento)}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-white font-medium flex items-center justify-between cursor-pointer"
                    >
                      <span>{g.label}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Aplicar</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Rotação Fluida */}
            <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => handleGirarLote(-15)}
                className="p-1 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white cursor-pointer"
                title="Girar lote 15° anti-horário"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-sky-400 px-1">{anguloRotacao}°</span>
              <button
                type="button"
                onClick={() => handleGirarLote(15)}
                className="p-1 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white cursor-pointer"
                title="Girar lote 15° horário"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 5. Desfazer (Undo) */}
            <button
              type="button"
              onClick={handleDesfazer}
              disabled={historicoIndice < 0}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer transition"
              title="Desfazer última alteração de lote"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          </div>

          {/* GRUPO 2: PRECISÃO & CENTRALIZAÇÃO */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Centralizar Endereço Oficial */}
            <button
              type="button"
              onClick={handleCentralizarEnderecoReal}
              disabled={isBuscandoGeocoding}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-md cursor-pointer transition disabled:opacity-50"
              title="Centralizar no número e logradouro oficial da matrícula"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Endereço Real</span>
            </button>

            {/* Meu GPS de Campo */}
            <button
              type="button"
              onClick={handleCentralizarMeuGPS}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition"
              title="Centralizar no seu GPS de campo de alta precisão"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Meu GPS {currentGps ? `(±${currentGps.accuracy.toFixed(0)}m)` : ''}</span>
            </button>

            {/* Enquadrar Lote */}
            <button
              type="button"
              onClick={handleEnquadrarLote}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition"
              title="Enquadrar lote inteiro no zoom ideal"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Seletor de Camadas */}
            <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
              {CAMADAS_CARTOGRAFICAS_ABERTAS.slice(0, 2).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCamadaAtiva(c)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    camadaAtiva.id === c.id ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {c.tipo === 'SATELITE' ? '🛰️ Satélite HD' : '🗺️ Vias OSM'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* NOTIFICAÇÃO FLUTUANTE DE STATUS */}
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

        {/* MAPA LEAFLET INTERATIVO */}
        <div className="flex-1 relative w-full h-full bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* DICA FLUTUANTE DE OPERAÇÃO RÁPIDA */}
          <div className="absolute top-3 left-3 z-40 bg-slate-900/95 text-white p-3 rounded-2xl backdrop-blur-md text-[11px] max-w-xs shadow-2xl border border-slate-700/80 pointer-events-none">
            <p className="font-bold flex items-center gap-1.5 text-amber-300 mb-1">
              <Crosshair className="w-3.5 h-3.5" />
              <span>Desenho de Campo Ultrarrápido:</span>
            </p>
            <ul className="space-y-1 text-slate-300 text-[10px] leading-tight">
              <li>• <strong>✏️ Traço Fluido:</strong> Deslize o dedo no satélite contornando os muros.</li>
              <li>• <strong>⬚ Retângulo 2 Toques:</strong> 1 toque na frente, 1 toque nos fundos.</li>
              <li>• <strong>➕ Pontos Médios:</strong> Toque no (+) azul da aresta para criar recortes/chanfros.</li>
              <li>• <strong>✥ Ponto Central:</strong> Arraste o botão verde central para mover o lote todo.</li>
              <li>• <strong>💧 Pino Azul:</strong> Cavalete/hidrômetro da O.S. arrastável.</li>
            </ul>
          </div>

          {/* PAINEL INFERIOR DE MÉTRICAS EM TEMPO REAL */}
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
              <span className="text-[9px] text-slate-400 block uppercase">Vértices</span>
              <span className="text-base font-black text-amber-400">{vertices.length}</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="hidden sm:block">
              <span className="text-[9px] text-slate-400 block uppercase">GPS Hidrômetro</span>
              <span className="text-[10px] font-bold text-slate-300 block">
                {pontoHidrometro.lat.toFixed(6)}, {pontoHidrometro.lng.toFixed(6)}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER COM AÇÕES DE LIMPAR, CANCELAR E SALVAR */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            Cartografia vinculada à Matrícula <strong>{os.matriculaEmbasa}</strong> ({os.quadra}/{os.lote})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setVertices([]);
                setHistoricoVertices([]);
                setHistoricoIndice(-1);
                exibirNotificacao('Lote limpo. Use Traço Fluido, Retângulo ou Gabaritos para desenhar.', 'info');
              }}
              className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Lote</span>
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
