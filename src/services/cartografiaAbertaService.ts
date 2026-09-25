export interface CamadaCartograficaAberta {
  id: string;
  nome: string;
  tipo: 'SATELITE' | 'VIAS_OSM' | 'HUMANITARIO' | 'VETORIAL_CLARO';
  tileUrl: string;
  attribution: string;
  maxZoom: number;
  descricao: string;
}

export const CAMADAS_CARTOGRAFICAS_ABERTAS: CamadaCartograficaAberta[] = [
  {
    id: 'esri_satelite',
    nome: '🛰️ Satélite Aéreo HD (Esri World Imagery)',
    tipo: 'SATELITE',
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Maxar, Earthstar Geographics, CNES/Airbus DS',
    maxZoom: 19,
    descricao: 'Imagens aéreas reais de alta resolução para identificação de muros, telhados e limites de lotes.',
  },
  {
    id: 'osm_padrao',
    nome: '🗺️ Vias e Ruas (OpenStreetMap Brasil)',
    tipo: 'VIAS_OSM',
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    descricao: 'Base cartográfica aberta e colaborativa mais atualizada com nomes de ruas e avenidas.',
  },
  {
    id: 'osm_humanitarian',
    nome: '🏘️ Quadras & Vielas (OSM Humanitarian HOT)',
    tipo: 'HUMANITARIO',
    tileUrl: 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, Humanitarian OSM Team',
    maxZoom: 19,
    descricao: 'Especialmente detalhado para vielas, becos, escadarias e comunidades de Salvador.',
  },
  {
    id: 'carto_positron',
    nome: '📐 Mapa Limpo de Alta Precisão (CartoDB Positron)',
    tipo: 'VETORIAL_CLARO',
    tileUrl: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, © CARTO',
    maxZoom: 19,
    descricao: 'Fundo neutro claro para destacar polígonos de lotes, quadras e pontos de hidrômetro.',
  },
];

export interface EdificacaoAbertaOSM {
  id: string;
  tipo: string;
  coordenadas: { lat: number; lng: number }[];
  nome?: string;
  numeroPorta?: string;
  rua?: string;
  centroide?: { lat: number; lng: number };
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  precisao: 'EXATA_PORTA' | 'RUA_APROXIMADA' | 'BAIRRO';
  poligono?: { lat: number; lng: number }[];
}

class CartografiaAbertaService {
  private geocodeCache = new Map<string, GeocodingResult>();

  /**
   * Geocodifica endereço completo usando Photon (OSM ultra-rápido) + Nominatim OpenStreetMap
   * Retorna a coordenada real exata da rua/porta/quadra em Salvador ou qualquer município.
   */
  public async geocodificarEndereco(
    logradouro: string,
    numeroPorta: string,
    bairro: string,
    cidade: string = 'Salvador',
    uf: string = 'Bahia'
  ): Promise<GeocodingResult | null> {
    const limpoLogradouro = logradouro.trim();
    const limpoBairro = bairro.trim();
    const limpoNumero = numeroPorta.replace(/\D/g, '');

    const cacheKey = `${limpoLogradouro}_${limpoNumero}_${limpoBairro}_${cidade}`.toLowerCase();
    if (this.geocodeCache.has(cacheKey)) {
      return this.geocodeCache.get(cacheKey)!;
    }

    // 1. Tenta Photon Komoot API (Ultra-rápido ~200ms, especializado em OSM e tolerante a pequenas variações)
    try {
      const termoPhoton = `${limpoLogradouro} ${limpoNumero ? limpoNumero : ''} ${limpoBairro} ${cidade}`;
      const urlPhoton = `https://photon.komoot.io/api/?q=${encodeURIComponent(termoPhoton)}&lat=-12.95&lon=-38.46&limit=2`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2800);

      const resp = await fetch(urlPhoton, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (data.features && Array.isArray(data.features) && data.features.length > 0) {
          const feat = data.features[0];
          const [lon, lat] = feat.geometry.coordinates;

          // Valida se está na região da Grande Salvador / Bahia (-13.3 a -12.6 lat, -38.8 a -38.2 lon)
          if (lat >= -14 && lat <= -11 && lon >= -40 && lon <= -37) {
            const props = feat.properties || {};
            const res: GeocodingResult = {
              latitude: lat,
              longitude: lon,
              displayName: `${props.name || limpoLogradouro}${props.housenumber ? `, Nº ${props.housenumber}` : ''} - ${props.district || limpoBairro}, ${props.city || cidade}`,
              precisao: props.housenumber ? 'EXATA_PORTA' : 'RUA_APROXIMADA',
            };
            this.geocodeCache.set(cacheKey, res);
            return res;
          }
        }
      }
    } catch {
      // Fallback para Nominatim
    }

    // 2. Tenta Nominatim OpenStreetMap oficial
    try {
      const queryExata = `${limpoLogradouro}, ${limpoNumero || ''}, ${limpoBairro}, ${cidade}, ${uf}, Brasil`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryExata)}&addressdetails=1&polygon_geojson=1&limit=1`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9', 'User-Agent': 'AquaSanePro-Geocoding/3.0' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);

          let poligono: { lat: number; lng: number }[] | undefined;
          if (item.geojson && item.geojson.type === 'Polygon' && Array.isArray(item.geojson.coordinates[0])) {
            poligono = item.geojson.coordinates[0].map((pt: [number, number]) => ({ lat: pt[1], lng: pt[0] }));
          }

          const res: GeocodingResult = {
            latitude: lat,
            longitude: lng,
            displayName: item.display_name,
            precisao: item.address?.house_number ? 'EXATA_PORTA' : 'RUA_APROXIMADA',
            poligono,
          };

          this.geocodeCache.set(cacheKey, res);
          return res;
        }
      }
    } catch {
      // Fallback
    }

    // 3. Se a busca com número não encontrou, busca pela Rua + Bairro
    try {
      const queryRua = `${limpoLogradouro}, ${limpoBairro}, ${cidade}, Brasil`;
      const urlRua = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryRua)}&addressdetails=1&limit=1`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const resp = await fetch(urlRua, {
        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9', 'User-Agent': 'AquaSanePro-Geocoding/3.0' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);

          const res: GeocodingResult = {
            latitude: lat,
            longitude: lng,
            displayName: item.display_name,
            precisao: 'RUA_APROXIMADA',
          };

          this.geocodeCache.set(cacheKey, res);
          return res;
        }
      }
    } catch {
      // Fallback
    }

    return null;
  }

  /**
   * Busca endereço por termo livre digitado pelo técnico
   */
  public async buscarEnderecoLivre(
    termo: string,
    latRef: number = -12.95,
    lngRef: number = -38.46
  ): Promise<GeocodingResult[]> {
    if (!termo || termo.trim().length < 3) return [];
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(termo + ' Salvador')}&lat=${latRef}&lon=${lngRef}&limit=5`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        if (data.features && Array.isArray(data.features)) {
          return data.features.map((f: { geometry: { coordinates: [number, number] }; properties?: { name?: string; street?: string; housenumber?: string; district?: string; city?: string } }) => {
            const [lon, lat] = f.geometry.coordinates;
            const p = f.properties || {};
            return {
              latitude: lat,
              longitude: lon,
              displayName: `${p.name || p.street || termo}${p.housenumber ? `, Nº ${p.housenumber}` : ''} - ${p.district || ''} ${p.city || 'Salvador'}`,
              precisao: p.housenumber ? 'EXATA_PORTA' : 'RUA_APROXIMADA',
            };
          });
        }
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * Busca feições de edificações, lotes e quadras reais em bases abertas (Overpass API / OpenStreetMap)
   * em um raio de até 250 metros ao redor da coordenada.
   */
  public async buscarQuadrasELotesAbertos(
    lat: number,
    lng: number,
    raioMetros: number = 250
  ): Promise<EdificacaoAbertaOSM[]> {
    const cacheKey = `osm_buildings_v2_${lat.toFixed(4)}_${lng.toFixed(4)}`;
    const cacheLocal = localStorage.getItem(cacheKey);
    if (cacheLocal) {
      try {
        return JSON.parse(cacheLocal);
      } catch {
        // fallback
      }
    }

    try {
      // Overpass API pública aberta: busca edificações e quadras no raio
      const query = `[out:json][timeout:8];(way["building"](around:${raioMetros},${lat},${lng});relation["building"](around:${raioMetros},${lat},${lng});way["landuse"="residential"](around:${raioMetros},${lat},${lng}););out geom;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        const resultados: EdificacaoAbertaOSM[] = [];

        if (Array.isArray(data.elements)) {
          for (const el of data.elements) {
            if (el.geometry && Array.isArray(el.geometry) && el.geometry.length >= 3) {
              const coords = el.geometry.map((g: { lat: number; lon: number }) => ({
                lat: g.lat,
                lng: g.lon,
              }));

              // Calcula centroide
              let sumLat = 0;
              let sumLng = 0;
              coords.forEach((c: { lat: number; lng: number }) => {
                sumLat += c.lat;
                sumLng += c.lng;
              });

              resultados.push({
                id: `osm_way_${el.id}`,
                tipo: el.tags?.building || el.tags?.landuse || 'LOTE_EDIFICADO',
                nome: el.tags?.name,
                numeroPorta: el.tags?.['addr:housenumber'],
                rua: el.tags?.['addr:street'],
                coordenadas: coords,
                centroide: { lat: sumLat / coords.length, lng: sumLng / coords.length },
              });
            }
          }
        }

        if (resultados.length > 0) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(resultados));
          } catch {
            // cache quota safe
          }
          return resultados;
        }
      }
    } catch {
      // Fallback offline amigável
    }

    // Fallback offline: gera malha estimada baseada no grid local
    return this.gerarMalhaLotesEstimada(lat, lng);
  }

  /**
   * Encontra o lote ou edificação real mais próximo de uma dada coordenada
   */
  public encontrarLoteMaisProximo(
    lat: number,
    lng: number,
    lotes: EdificacaoAbertaOSM[]
  ): EdificacaoAbertaOSM | null {
    if (lotes.length === 0) return null;

    let maisProximo: EdificacaoAbertaOSM | null = null;
    let menorDist = Infinity;

    for (const lote of lotes) {
      const centro = lote.centroide || lote.coordenadas[0];
      const dLat = centro.lat - lat;
      const dLng = centro.lng - lng;
      const dist = dLat * dLat + dLng * dLng;

      if (dist < menorDist) {
        menorDist = dist;
        maisProximo = lote;
      }
    }

    return maisProximo;
  }

  private gerarMalhaLotesEstimada(centerLat: number, centerLng: number): EdificacaoAbertaOSM[] {
    const lotes: EdificacaoAbertaOSM[] = [];
    const step = 0.00015; // ~16 metros

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const baseLat = centerLat + dx * step;
        const baseLng = centerLng + dy * step;
        const size = 0.00007; // ~8 metros

        const coords = [
          { lat: baseLat - size, lng: baseLng - size },
          { lat: baseLat + size, lng: baseLng - size },
          { lat: baseLat + size, lng: baseLng + size },
          { lat: baseLat - size, lng: baseLng + size },
        ];

        lotes.push({
          id: `lote_local_${dx}_${dy}`,
          tipo: 'LOTE_PADRAO',
          coordenadas: coords,
          centroide: { lat: baseLat, lng: baseLng },
        });
      }
    }

    return lotes;
  }
}

export const cartografiaAbertaService = new CartografiaAbertaService();
