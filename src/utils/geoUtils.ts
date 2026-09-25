// Utilitários de Cálculo Geodésico e Alertas Sensoriais de Geofencing (AquaSane Pro)

export interface PontoGeo {
  lat: number;
  lng: number;
}

/**
 * Calcula a distância geodésica em metros entre dois pares de coordenadas
 * utilizando a fórmula de Haversine (raio terrestre médio = 6.371.000m).
 */
export function calcularDistanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return Infinity;
  }

  const R = 6371e3; // Metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function calcularDistanciaEntrePontos(p1: PontoGeo, p2: PontoGeo): number {
  return calcularDistanciaMetros(p1.lat, p1.lng, p2.lat, p2.lng);
}

/**
 * Calcula a área (m²) e perímetro (m) de um polígono no plano geográfico local
 */
export function calcularAreaEPerimetro(vertices: PontoGeo[]): { area: number; perimetro: number } {
  if (!vertices || vertices.length < 3) return { area: 0, perimetro: 0 };

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
}

/**
 * Calcula o centroide de um polígono
 */
export function calcularCentroide(vertices: PontoGeo[]): PontoGeo {
  if (!vertices || vertices.length === 0) return { lat: -12.956, lng: -38.469 };
  let sumLat = 0;
  let sumLng = 0;
  vertices.forEach((v) => {
    sumLat += v.lat;
    sumLng += v.lng;
  });
  return {
    lat: sumLat / vertices.length,
    lng: sumLng / vertices.length,
  };
}

/**
 * Calcula o ponto médio entre dois vértices
 */
export function calcularPontoMedio(p1: PontoGeo, p2: PontoGeo): PontoGeo {
  return {
    lat: (p1.lat + p2.lat) / 2,
    lng: (p1.lng + p2.lng) / 2,
  };
}

/**
 * Translada um polígono por um deslocamento de latitude e longitude
 */
export function transladarPoligono(vertices: PontoGeo[], dLat: number, dLng: number): PontoGeo[] {
  return vertices.map((v) => ({
    lat: v.lat + dLat,
    lng: v.lng + dLng,
  }));
}

/**
 * Rotaciona um polígono por um ângulo em graus em torno de um centro (ou seu próprio centroide)
 */
export function rotacionarPoligono(
  vertices: PontoGeo[],
  anguloGraus: number,
  centro?: PontoGeo
): PontoGeo[] {
  if (vertices.length === 0) return [];
  const c = centro || calcularCentroide(vertices);
  const rad = (anguloGraus * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const latToMeters = 111320;
  const lngToMeters = 111320 * Math.cos((c.lat * Math.PI) / 180);

  return vertices.map((v) => {
    const x = (v.lng - c.lng) * lngToMeters;
    const y = (v.lat - c.lat) * latToMeters;

    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;

    return {
      lat: c.lat + ry / latToMeters,
      lng: c.lng + rx / lngToMeters,
    };
  });
}

/**
 * Gera um lote retangular com largura (testada/frente) e comprimento (profundidade/fundo) em metros
 */
export function gerarLoteRetangular(
  centro: PontoGeo,
  larguraM: number,
  comprimentoM: number,
  anguloGraus: number = 0
): PontoGeo[] {
  const hw = larguraM / 2;
  const hh = comprimentoM / 2;

  // 4 cantos relativos em metros
  const cornersLocal = [
    { x: -hw, y: hh },   // V1: Frente Noroeste
    { x: hw, y: hh },    // V2: Frente Nordeste
    { x: hw, y: -hh },   // V3: Fundo Sudeste
    { x: -hw, y: -hh },  // V4: Fundo Sudoeste
  ];

  const rad = (anguloGraus * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const latToMeters = 111320;
  const lngToMeters = 111320 * Math.cos((centro.lat * Math.PI) / 180);

  return cornersLocal.map((pt) => {
    const rx = pt.x * cos - pt.y * sin;
    const ry = pt.x * sin + pt.y * cos;
    return {
      lat: centro.lat + ry / latToMeters,
      lng: centro.lng + rx / lngToMeters,
    };
  });
}

/**
 * Gera um lote retangular a partir de dois pontos diagonais opostos
 */
export function gerarRetangulo2Pontos(p1: PontoGeo, p2: PontoGeo): PontoGeo[] {
  return [
    { lat: p1.lat, lng: p1.lng },
    { lat: p1.lat, lng: p2.lng },
    { lat: p2.lat, lng: p2.lng },
    { lat: p2.lat, lng: p1.lng },
  ];
}

/**
 * Simplificação de caminho/polígono por Ramer-Douglas-Peucker (em metros)
 * Ideal para transformar traço à mão livre do cadastrista em um polígono de lote limpo e nítido.
 */
export function simplificarPoligonoRDP(pontos: PontoGeo[], toleranciaMetros: number = 1.2): PontoGeo[] {
  if (pontos.length <= 4) return pontos;

  const refLat = pontos[0].lat;
  const refLng = pontos[0].lng;
  const latToMeters = 111320;
  const lngToMeters = 111320 * Math.cos((refLat * Math.PI) / 180);

  // Converte para coordenadas métricas (x, y)
  const xy = pontos.map((p) => ({
    x: (p.lng - refLng) * lngToMeters,
    y: (p.lat - refLat) * latToMeters,
  }));

  // Distância de ponto até segmento de reta
  const distPontoSegmento = (
    p: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);

    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    return Math.hypot(p.x - projX, p.y - projY);
  };

  const rdp = (arr: { x: number; y: number }[], start: number, end: number): { x: number; y: number }[] => {
    let maxDist = 0;
    let index = 0;

    for (let i = start + 1; i < end; i++) {
      const dist = distPontoSegmento(arr[i], arr[start], arr[end]);
      if (dist > maxDist) {
        maxDist = dist;
        index = i;
      }
    }

    if (maxDist > toleranciaMetros) {
      const left = rdp(arr, start, index);
      const right = rdp(arr, index, end);
      return left.slice(0, -1).concat(right);
    }
    return [arr[start], arr[end]];
  };

  const simplifiedXY = rdp(xy, 0, xy.length - 1);

  // Se resultou em menos de 3 pontos, faz uma amostragem regular dos pontos originais
  if (simplifiedXY.length < 3) {
    const step = Math.max(1, Math.floor(pontos.length / 4));
    const sampled: PontoGeo[] = [];
    for (let i = 0; i < pontos.length; i += step) {
      sampled.push(pontos[i]);
    }
    return sampled;
  }

  // Converte de volta para lat/lng
  return simplifiedXY.map((pt) => ({
    lat: refLat + pt.y / latToMeters,
    lng: refLng + pt.x / lngToMeters,
  }));
}

/**
 * Emite sinal sonoro suave e profissional (duplo tom ascendente 880Hz -> 1320Hz)
 * utilizando a Web Audio API nativa para alertar o técnico em campo sem dependência de MP3.
 */
export function playGeofenceChime(): void {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // 1º Tom (880Hz - A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.16);

    // 2º Tom mais agudo de confirmação (1320Hz - E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.36);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.36);
  } catch {
    // Autoplay bloqueado até primeira interação do usuário ou ambiente sem áudio
  }
}

/**
 * Aciona o motor háptico de vibração do dispositivo móvel do técnico (se suportado).
 * Padrão tático: pulso duplo (200ms vibra, 100ms pausa, 200ms vibra).
 */
export function triggerGeofenceVibration(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch {
      // Ignora em browsers com restrição de vibração
    }
  }
}
