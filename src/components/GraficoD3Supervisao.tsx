import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  BarChart3,
  Layers,
  Users,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  Eye,
  TrendingUp,
  Download,
  Flame,
  Grid3X3,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  Calendar,
  Activity
} from 'lucide-react';
import { CensoRecord } from '../types/censo';
import { BAIRROS_DATA, LISTA_BAIRROS } from '../data/bairrosData';
import { osService } from '../services/osService';

export type ModoVisualizacao = 'empilhado' | 'agrupado' | 'equipe' | 'matriz';
export type CriterioOrdenacao = 'volume' | 'alfabetica' | 'meta';

interface GraficoD3SupervisaoProps {
  records: CensoRecord[];
  onSelectBairro?: (bairro: string) => void;
}

// Paleta institucional e contrastante para as equipes de campo
const CORES_EQUIPES: Record<string, string> = {
  'Equipe 01 - Frente Cabula': '#0284c7', // Sky 600
  'Equipe 01 - Cabula': '#0284c7',
  'Equipe 01 - Frente Beiru': '#0284c7',
  'Equipe 02 - Frente Arenoso': '#059669', // Emerald 600
  'Equipe 02 - Cabula': '#059669',
  'Equipe 02 - Frente Cabula': '#059669',
  'Equipe 03 - Frente Cabula': '#d97706', // Amber 600
  'Equipe 03 - Pernambués': '#d97706',
  'Equipe 04 - Lote A': '#7c3aed', // Purple 600
  'Equipe 05 - Frente Pernambués': '#e11d48', // Rose 600
  'Equipe 06 - Setor Norte': '#0891b2', // Cyan 600
};

// Fallback ordenado para equipes dinâmicas
const PALETA_FALLBACK = [
  '#0284c7', // Azul
  '#059669', // Esmeralda
  '#d97706', // Âmbar
  '#7c3aed', // Roxo
  '#e11d48', // Rosa
  '#0891b2', // Ciano
  '#4f46e5', // Índigo
  '#ca8a04', // Amarelo escuro
  '#0d9488', // Teal
  '#db2777', // Magenta
];

export const GraficoD3Supervisao: React.FC<GraficoD3SupervisaoProps> = ({
  records,
  onSelectBairro,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Estados de controle e interatividade
  const [modo, setModo] = useState<ModoVisualizacao>('empilhado');
  const [buscaBairro, setBuscaBairro] = useState('');
  const [equipeFiltro, setEquipeFiltro] = useState<string>('TODAS');
  const [ordenacao, setOrdenacao] = useState<CriterioOrdenacao>('volume');
  const [mostrarApenasAtivos, setMostrarApenasAtivos] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<{
    bairro?: string;
    equipe?: string;
    volume?: number;
    detalhes?: { matricula: string; cadastrista: string; data: string }[];
  } | null>(null);

  // Carimbo de última atualização em tempo real
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());
  const [isLivePulsing, setIsLivePulsing] = useState(true);

  // Consolidação de registros: cruza records do censo com OSs executadas em tempo real
  const dadosConsolidados = useMemo(() => {
    const mapaRegistros = new Map<string, {
      id: string;
      matricula: string;
      bairro: string;
      equipe: string;
      cadastrista: string;
      timestamp: number;
    }>();

    // 1. Inclui records diretos
    records.forEach((r) => {
      const equipe = r.equipeCadastrista || 'Equipe Geral';
      const bairro = r.bairro || 'Não Informado';
      mapaRegistros.set(r.id || r.matriculaEmbasa, {
        id: r.id,
        matricula: r.matriculaEmbasa,
        bairro,
        equipe,
        cadastrista: r.nomeCadastrista || 'Cadastrista',
        timestamp: r.atualizadoEm || r.criadoEm || Date.now(),
      });
    });

    // 2. Inclui OS executadas que têm censo rápido ou status executado
    try {
      const allOS = osService.getAllOS();
      allOS.forEach((os) => {
        if (os.status === 'EXECUTADA' || os.censoDados) {
          const key = `os_${os.id}`;
          if (!mapaRegistros.has(os.matriculaEmbasa)) {
            mapaRegistros.set(key, {
              id: os.id,
              matricula: os.matriculaEmbasa,
              bairro: os.bairro,
              equipe: os.equipeDesignada || 'Equipe 01 - Frente Cabula',
              cadastrista: os.cadastristaDesignado || 'Colaborador',
              timestamp: os.atualizadoEm || Date.now(),
            });
          }
        }
      });
    } catch {
      // osService fallback
    }

    return Array.from(mapaRegistros.values());
  }, [records, ultimaAtualizacao]);

  // Lista única de equipes ativas encontradas
  const equipesDisponiveis = useMemo(() => {
    const setEq = new Set<string>();
    dadosConsolidados.forEach((d) => {
      if (d.equipe) setEq.add(d.equipe);
    });
    // Se ainda vazio, garante as equipes padrão do contrato R7
    if (setEq.size === 0) {
      setEq.add('Equipe 01 - Frente Cabula');
      setEq.add('Equipe 02 - Frente Arenoso');
      setEq.add('Equipe 03 - Frente Cabula');
      setEq.add('Equipe 04 - Lote A');
    }
    return Array.from(setEq).sort();
  }, [dadosConsolidados]);

  // Função para obter cor estável de equipe
  const getCorEquipe = (equipe: string, index: number) => {
    if (CORES_EQUIPES[equipe]) return CORES_EQUIPES[equipe];
    return PALETA_FALLBACK[index % PALETA_FALLBACK.length];
  };

  // Agrupamento por Bairro x Equipe
  const matrizBairroEquipe = useMemo(() => {
    // Inicializa todos os bairros do R7
    const mapaBairros: Record<string, {
      bairro: string;
      total: number;
      equipes: Record<string, number>;
      meta: number;
      registros: { matricula: string; cadastrista: string; equipe: string; timestamp: number }[];
    }> = {};

    LISTA_BAIRROS.forEach((b) => {
      const meta = BAIRROS_DATA[b]?.metaLigacoes || 1000;
      mapaBairros[b] = {
        bairro: b,
        total: 0,
        equipes: {},
        meta,
        registros: [],
      };
      equipesDisponiveis.forEach((eq) => {
        mapaBairros[b].equipes[eq] = 0;
      });
    });

    // Popula com dados reais
    dadosConsolidados.forEach((item) => {
      const b = item.bairro;
      if (!mapaBairros[b]) {
        mapaBairros[b] = {
          bairro: b,
          total: 0,
          equipes: {},
          meta: 1000,
          registros: [],
        };
        equipesDisponiveis.forEach((eq) => {
          mapaBairros[b].equipes[eq] = 0;
        });
      }

      const eq = item.equipe;
      mapaBairros[b].equipes[eq] = (mapaBairros[b].equipes[eq] || 0) + 1;
      mapaBairros[b].total += 1;
      mapaBairros[b].registros.push({
        matricula: item.matricula,
        cadastrista: item.cadastrista,
        equipe: eq,
        timestamp: item.timestamp,
      });
    });

    let lista = Object.values(mapaBairros);

    // Filtros de busca e ativos
    if (buscaBairro.trim()) {
      const termo = buscaBairro.toLowerCase();
      lista = lista.filter((item) => item.bairro.toLowerCase().includes(termo));
    }

    if (mostrarApenasAtivos) {
      lista = lista.filter((item) => item.total > 0);
    }

    // Se filtro de equipe específico estiver ativado (diferente de TODAS)
    if (equipeFiltro !== 'TODAS') {
      lista = lista.filter((item) => (item.equipes[equipeFiltro] || 0) > 0);
    }

    // Ordenação
    if (ordenacao === 'volume') {
      lista.sort((a, b) => b.total - a.total);
    } else if (ordenacao === 'alfabetica') {
      lista.sort((a, b) => a.bairro.localeCompare(b.bairro));
    } else if (ordenacao === 'meta') {
      lista.sort((a, b) => (b.total / Math.max(1, b.meta)) - (a.total / Math.max(1, a.meta)));
    }

    return lista;
  }, [dadosConsolidados, buscaBairro, mostrarApenasAtivos, equipeFiltro, ordenacao, equipesDisponiveis]);

  // Agrupamento exclusivo por Equipe (para o modo 'equipe')
  const dadosPorEquipe = useMemo(() => {
    const mapa: Record<string, {
      equipe: string;
      total: number;
      bairros: Record<string, number>;
      cadastristas: Set<string>;
      registros: { matricula: string; bairro: string; cadastrista: string; timestamp: number }[];
    }> = {};

    equipesDisponiveis.forEach((eq) => {
      mapa[eq] = {
        equipe: eq,
        total: 0,
        bairros: {},
        cadastristas: new Set(),
        registros: [],
      };
    });

    dadosConsolidados.forEach((item) => {
      const eq = item.equipe || 'Equipe Geral';
      if (!mapa[eq]) {
        mapa[eq] = {
          equipe: eq,
          total: 0,
          bairros: {},
          cadastristas: new Set(),
          registros: [],
        };
      }
      mapa[eq].total += 1;
      mapa[eq].bairros[item.bairro] = (mapa[eq].bairros[item.bairro] || 0) + 1;
      mapa[eq].cadastristas.add(item.cadastrista);
      mapa[eq].registros.push({
        matricula: item.matricula,
        bairro: item.bairro,
        cadastrista: item.cadastrista,
        timestamp: item.timestamp,
      });
    });

    let lista = Object.values(mapa);
    if (equipeFiltro !== 'TODAS') {
      lista = lista.filter((e) => e.equipe === equipeFiltro);
    }
    return lista.sort((a, b) => b.total - a.total);
  }, [dadosConsolidados, equipesDisponiveis, equipeFiltro]);

  // Métricas rápidas de topo
  const metricasRapidas = useMemo(() => {
    const totalVolume = dadosConsolidados.length;
    const bairrosComColeta = new Set(dadosConsolidados.map((d) => d.bairro)).size;
    const equipesAtivas = new Set(dadosConsolidados.map((d) => d.equipe)).size;

    // Bairro campeão
    let bairroTop = { nome: '-', total: 0 };
    matrizBairroEquipe.forEach((b) => {
      if (b.total > bairroTop.total) {
        bairroTop = { nome: b.bairro, total: b.total };
      }
    });

    // Equipe campeã
    let equipeTop = { nome: '-', total: 0 };
    dadosPorEquipe.forEach((e) => {
      if (e.total > equipeTop.total) {
        equipeTop = { nome: e.equipe, total: e.total };
      }
    });

    return { totalVolume, bairrosComColeta, equipesAtivas, bairroTop, equipeTop };
  }, [dadosConsolidados, matrizBairroEquipe, dadosPorEquipe]);

  // Atualização em tempo real (escuta e pulso)
  useEffect(() => {
    const timer = setInterval(() => {
      setUltimaAtualizacao(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // RENDERIZAÇÃO D3.JS
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth || 900;
    const height = modo === 'matriz' ? Math.max(480, matrizBairroEquipe.length * 28 + 120) : 480;

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    const tooltip = d3.select(tooltipRef.current);

    // Definições de gradientes e filtros SVG
    const defs = svg.append('defs');

    // Gradiente sutil de fundo
    const bgGradient = defs.append('linearGradient')
      .attr('id', 'd3-bg-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    bgGradient.append('stop').attr('offset', '0%').attr('stop-color', '#0f172a').attr('stop-opacity', 0.02);
    bgGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0284c7').attr('stop-opacity', 0.05);

    // Margens da visualização
    const margin = {
      top: 35,
      right: 25,
      bottom: modo === 'matriz' ? 90 : (width < 640 ? 120 : 95),
      left: modo === 'matriz' ? 140 : 55,
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // ==========================================
    // MODO 1 & 2: BARRAS EMPILHADAS OU AGRUPADAS
    // ==========================================
    if (modo === 'empilhado' || modo === 'agrupado') {
      const data = matrizBairroEquipe.slice(0, width < 640 ? 12 : 25);
      const keys = equipeFiltro === 'TODAS'
        ? equipesDisponiveis
        : [equipeFiltro];

      const x = d3.scaleBand()
        .domain(data.map((d) => d.bairro))
        .range([0, innerWidth])
        .padding(modo === 'agrupado' ? 0.25 : 0.35);

      const colorScale = d3.scaleOrdinal<string>()
        .domain(equipesDisponiveis)
        .range(equipesDisponiveis.map((eq, i) => getCorEquipe(eq, i)));

      // Eixo X
      const xAxis = d3.axisBottom(x);
      const xAxisGroup = g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis);

      xAxisGroup.select('.domain').attr('stroke', '#cbd5e1').attr('stroke-width', 1.5);
      xAxisGroup.selectAll('line').attr('stroke', '#e2e8f0');
      xAxisGroup.selectAll('text')
        .attr('transform', 'rotate(-40)')
        .attr('text-anchor', 'end')
        .attr('dx', '-.6em')
        .attr('dy', '.3em')
        .attr('fill', '#334155')
        .style('font-size', width < 640 ? '9px' : '11px')
        .style('font-weight', '600')
        .style('cursor', 'pointer')
        .on('click', (_, d) => {
          if (onSelectBairro && typeof d === 'string') onSelectBairro(d);
        });

      if (modo === 'empilhado') {
        // Empilhamento D3
        const stackGenerator = d3.stack<any>()
          .keys(keys)
          .value((d, key) => d.equipes[key] || 0);

        const series = stackGenerator(data);
        const maxStackY = d3.max(series, (s) => d3.max(s, (d) => d[1])) || 10;
        const y = d3.scaleLinear()
          .domain([0, Math.max(10, Math.ceil(maxStackY * 1.15))])
          .nice()
          .range([innerHeight, 0]);

        // Linhas de Grade Horizontais
        g.append('g')
          .attr('class', 'grid')
          .call(
            d3.axisLeft(y)
              .tickSize(-innerWidth)
              .tickFormat(() => '')
          )
          .selectAll('line')
          .attr('stroke', '#f1f5f9')
          .attr('stroke-dasharray', '3 3');

        // Eixo Y
        const yAxis = d3.axisLeft(y).ticks(6);
        const yAxisGroup = g.append('g').call(yAxis);
        yAxisGroup.select('.domain').remove();
        yAxisGroup.selectAll('text')
          .attr('fill', '#64748b')
          .style('font-size', '10px')
          .style('font-weight', '600');

        // Renderiza camadas empilhadas
        const layerGroups = g.selectAll('.layer')
          .data(series)
          .enter()
          .append('g')
          .attr('class', 'layer')
          .attr('fill', (d) => colorScale(d.key));

        layerGroups.selectAll('rect')
          .data((d) => d.map((item) => ({ ...item, key: d.key })))
          .enter()
          .append('rect')
          .attr('x', (d: any) => x(d.data.bairro) || 0)
          .attr('y', innerHeight)
          .attr('width', x.bandwidth())
          .attr('height', 0)
          .attr('rx', 3)
          .attr('ry', 3)
          .style('cursor', 'pointer')
          .style('transition', 'fill-opacity 0.2s')
          .on('mouseover', function (event, d: any) {
            d3.select(this).style('fill-opacity', 0.85);
            const val = (d[1] - d[0]) || 0;
            const totalBairro = d.data.total;
            const perc = totalBairro > 0 ? Math.round((val / totalBairro) * 100) : 0;

            tooltip.style('opacity', 1)
              .html(`
                <div class="p-3 bg-slate-900 text-white rounded-xl shadow-2xl text-xs space-y-1.5 border border-slate-700 min-w-[210px]">
                  <div class="flex items-center justify-between border-b border-slate-700 pb-1.5">
                    <span class="font-extrabold text-sky-400 text-sm">${d.data.bairro}</span>
                    <span class="text-[10px] bg-sky-950 px-2 py-0.5 rounded text-sky-300 font-bold">R7 Cabula</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-300">${d.key}:</span>
                    <span class="font-bold text-white text-sm">${val} censo(s)</span>
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Participação no Bairro:</span>
                    <span class="font-semibold text-emerald-400">${perc}%</span>
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Total Bairro (Todas Equipes):</span>
                    <span class="font-bold text-slate-200">${totalBairro}</span>
                  </div>
                  <div class="pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Meta Contratual: ${d.data.meta}</span>
                    <span class="text-sky-300 font-medium">Clique p/ Detalhes</span>
                  </div>
                </div>
              `)
              .style('left', `${event.pageX + 15}px`)
              .style('top', `${event.pageY - 35}px`);
          })
          .on('mousemove', function (event) {
            tooltip.style('left', `${event.pageX + 15}px`).style('top', `${event.pageY - 35}px`);
          })
          .on('mouseout', function () {
            d3.select(this).style('fill-opacity', 1);
            tooltip.style('opacity', 0);
          })
          .on('click', (_, d: any) => {
            const val = (d[1] - d[0]) || 0;
            const regFiltrados = d.data.registros.filter((r: any) => r.equipe === d.key);
            setItemSelecionado({
              bairro: d.data.bairro,
              equipe: d.key,
              volume: val,
              detalhes: regFiltrados.slice(0, 15),
            });
          })
          .transition()
          .duration(650)
          .ease(d3.easeCubicOut)
          .attr('y', (d: any) => y(d[1]))
          .attr('height', (d: any) => Math.max(0, y(d[0]) - y(d[1])));

        // Rótulos do Total no Topo de Cada Barra
        g.selectAll('.total-label')
          .data(data)
          .enter()
          .append('text')
          .attr('class', 'total-label')
          .attr('x', (d: any) => (x(d.bairro) || 0) + x.bandwidth() / 2)
          .attr('y', (d: any) => y(d.total) - 6)
          .attr('text-anchor', 'middle')
          .attr('fill', '#0f172a')
          .style('font-size', '10px')
          .style('font-weight', '700')
          .text((d: any) => (d.total > 0 ? d.total : ''));

      } else {
        // MODO AGRUPADO (Lado a Lado)
        const xSub = d3.scaleBand()
          .domain(keys)
          .range([0, x.bandwidth()])
          .padding(0.1);

        let maxVal = 0;
        data.forEach((d) => {
          keys.forEach((k) => {
            const v = d.equipes[k] || 0;
            if (v > maxVal) maxVal = v;
          });
        });

        const y = d3.scaleLinear()
          .domain([0, Math.max(6, Math.ceil(maxVal * 1.2))])
          .nice()
          .range([innerHeight, 0]);

        // Linhas de Grade
        g.append('g')
          .attr('class', 'grid')
          .call(
            d3.axisLeft(y)
              .tickSize(-innerWidth)
              .tickFormat(() => '')
          )
          .selectAll('line')
          .attr('stroke', '#f1f5f9')
          .attr('stroke-dasharray', '3 3');

        // Eixo Y
        const yAxis = d3.axisLeft(y).ticks(6);
        const yAxisGroup = g.append('g').call(yAxis);
        yAxisGroup.select('.domain').remove();
        yAxisGroup.selectAll('text')
          .attr('fill', '#64748b')
          .style('font-size', '10px')
          .style('font-weight', '600');

        // Grupos de Bairro
        const bairroGroups = g.selectAll('.bairro-group')
          .data(data)
          .enter()
          .append('g')
          .attr('class', 'bairro-group')
          .attr('transform', (d: any) => `translate(${x(d.bairro)},0)`);

        bairroGroups.selectAll('rect')
          .data((d: any) => keys.map((key) => ({ key, value: d.equipes[key] || 0, bairro: d.bairro, data: d })))
          .enter()
          .append('rect')
          .attr('x', (d: any) => xSub(d.key) || 0)
          .attr('y', innerHeight)
          .attr('width', xSub.bandwidth())
          .attr('height', 0)
          .attr('fill', (d: any) => colorScale(d.key))
          .attr('rx', 2.5)
          .attr('ry', 2.5)
          .style('cursor', 'pointer')
          .on('mouseover', function (event, d: any) {
            d3.select(this).style('opacity', 0.8);
            tooltip.style('opacity', 1)
              .html(`
                <div class="p-3 bg-slate-900 text-white rounded-xl shadow-2xl text-xs space-y-1.5 border border-slate-700 min-w-[200px]">
                  <div class="flex items-center justify-between border-b border-slate-700 pb-1.5">
                    <span class="font-extrabold text-sky-400 text-sm">${d.bairro}</span>
                    <span class="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Agrupado</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-300">${d.key}:</span>
                    <span class="font-bold text-white text-sm">${d.value} censo(s)</span>
                  </div>
                  <div class="text-[10px] text-sky-300 pt-1 border-t border-slate-800">
                    Clique para detalhar equipe neste bairro
                  </div>
                </div>
              `)
              .style('left', `${event.pageX + 15}px`)
              .style('top', `${event.pageY - 35}px`);
          })
          .on('mousemove', function (event) {
            tooltip.style('left', `${event.pageX + 15}px`).style('top', `${event.pageY - 35}px`);
          })
          .on('mouseout', function () {
            d3.select(this).style('opacity', 1);
            tooltip.style('opacity', 0);
          })
          .on('click', (_, d: any) => {
            const regFiltrados = d.data.registros.filter((r: any) => r.equipe === d.key);
            setItemSelecionado({
              bairro: d.bairro,
              equipe: d.key,
              volume: d.value,
              detalhes: regFiltrados.slice(0, 15),
            });
          })
          .transition()
          .duration(650)
          .ease(d3.easeCubicOut)
          .attr('y', (d: any) => y(d.value))
          .attr('height', (d: any) => Math.max(0, innerHeight - (y(d.value) as number)));
      }
    }

    // ==========================================
    // MODO 3: VISÃO POR EQUIPE DE CAMPO
    // ==========================================
    else if (modo === 'equipe') {
      const data = dadosPorEquipe;
      const y = d3.scaleBand()
        .domain(data.map((d) => d.equipe))
        .range([0, innerHeight])
        .padding(0.35);

      const maxVal = d3.max(data, (d: any) => d.total as number) || 10;
      const x = d3.scaleLinear()
        .domain([0, Math.max(10, Math.ceil(maxVal * 1.2))])
        .nice()
        .range([0, innerWidth]);

      // Grade Vertical
      g.append('g')
        .attr('class', 'grid')
        .call(
          d3.axisBottom(x)
            .tickSize(innerHeight)
            .tickFormat(() => '')
        )
        .selectAll('line')
        .attr('stroke', '#f1f5f9')
        .attr('stroke-dasharray', '3 3');

      // Eixo Y (Equipes)
      const yAxis = d3.axisLeft(y);
      const yAxisGroup = g.append('g').call(yAxis);
      yAxisGroup.select('.domain').attr('stroke', '#cbd5e1');
      yAxisGroup.selectAll('text')
        .attr('fill', '#0f172a')
        .style('font-size', '11px')
        .style('font-weight', '700');

      // Eixo X (Volume)
      const xAxis = d3.axisBottom(x).ticks(6);
      const xAxisGroup = g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis);
      xAxisGroup.select('.domain').remove();
      xAxisGroup.selectAll('text')
        .attr('fill', '#64748b')
        .style('font-size', '10px');

      // Barras Horizontais
      g.selectAll('.bar-equipe')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar-equipe')
        .attr('y', (d: any) => y(d.equipe) || 0)
        .attr('x', 0)
        .attr('height', y.bandwidth())
        .attr('width', 0)
        .attr('fill', (d: any, i: number) => getCorEquipe(d.equipe, i))
        .attr('rx', 4)
        .attr('ry', 4)
        .style('cursor', 'pointer')
        .on('mouseover', function (event, d: any) {
          d3.select(this).style('opacity', 0.85);
          const bairrosAtivos = Object.keys(d.bairros).length;
          const cadastristasCount = d.cadastristas.size;
          tooltip.style('opacity', 1)
            .html(`
              <div class="p-3 bg-slate-900 text-white rounded-xl shadow-2xl text-xs space-y-1.5 border border-slate-700 min-w-[210px]">
                <div class="flex items-center justify-between border-b border-slate-700 pb-1.5">
                  <span class="font-extrabold text-amber-400 text-sm">${d.equipe}</span>
                  <span class="text-[10px] bg-amber-950 px-2 py-0.5 rounded text-amber-300 font-bold">Produção</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-300">Total Registros:</span>
                  <span class="font-bold text-white text-sm">${d.total} OSs</span>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Bairros Cobertos:</span>
                  <span class="font-semibold text-sky-400">${bairrosAtivos} bairro(s)</span>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Cadastristas Ativos:</span>
                  <span class="font-semibold text-emerald-400">${cadastristasCount} pessoas</span>
                </div>
                <div class="pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                  Clique para inspecionar coletas da equipe
                </div>
              </div>
            `)
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 35}px`);
        })
        .on('mousemove', function (event) {
          tooltip.style('left', `${event.pageX + 15}px`).style('top', `${event.pageY - 35}px`);
        })
        .on('mouseout', function () {
          d3.select(this).style('opacity', 1);
          tooltip.style('opacity', 0);
        })
        .on('click', (_, d: any) => {
          setItemSelecionado({
            equipe: d.equipe,
            volume: d.total,
            detalhes: d.registros.slice(0, 15),
          });
        })
        .transition()
        .duration(650)
        .ease(d3.easeCubicOut)
        .attr('width', (d: any) => x(d.total));

      // Rótulos de Valor na ponta da barra
      g.selectAll('.label-equipe')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'label-equipe')
        .attr('y', (d: any) => (y(d.equipe) || 0) + y.bandwidth() / 2 + 4)
        .attr('x', (d: any) => x(d.total) + 8)
        .attr('fill', '#0f172a')
        .style('font-size', '11px')
        .style('font-weight', '700')
        .text((d: any) => (d.total > 0 ? `${d.total} coletas` : '0'));
    }

    // ==========================================
    // MODO 4: MATRIZ DE CALOR D3 (HEATMAP)
    // ==========================================
    else if (modo === 'matriz') {
      const bairros = matrizBairroEquipe.slice(0, 18);
      const equipes = equipesDisponiveis;

      const x = d3.scaleBand()
        .domain(equipes)
        .range([0, innerWidth])
        .padding(0.08);

      const y = d3.scaleBand()
        .domain(bairros.map((b) => b.bairro))
        .range([0, innerHeight])
        .padding(0.08);

      // Encontra valor máximo para escala contínua de cor
      let maxVal = 1;
      bairros.forEach((b) => {
        equipes.forEach((eq) => {
          const v = b.equipes[eq] || 0;
          if (v > maxVal) maxVal = v;
        });
      });

      const colorScale = d3.scaleSequential()
        .domain([0, maxVal])
        .interpolator(d3.interpolateYlGnBu);

      // Eixo X (Equipes no Topo)
      const xAxis = d3.axisTop(x);
      const xAxisGroup = g.append('g').call(xAxis);
      xAxisGroup.select('.domain').remove();
      xAxisGroup.selectAll('text')
        .attr('transform', 'rotate(-25)')
        .attr('text-anchor', 'start')
        .attr('dx', '.3em')
        .attr('dy', '-.4em')
        .attr('fill', '#0f172a')
        .style('font-size', '10px')
        .style('font-weight', '700');

      // Eixo Y (Bairros na Esquerda)
      const yAxis = d3.axisLeft(y);
      const yAxisGroup = g.append('g').call(yAxis);
      yAxisGroup.select('.domain').remove();
      yAxisGroup.selectAll('text')
        .attr('fill', '#1e293b')
        .style('font-size', '10px')
        .style('font-weight', '600');

      // Células da Matriz
      const cells: { bairro: string; equipe: string; value: number; totalBairro: number }[] = [];
      bairros.forEach((b) => {
        equipes.forEach((eq) => {
          cells.push({
            bairro: b.bairro,
            equipe: eq,
            value: b.equipes[eq] || 0,
            totalBairro: b.total,
          });
        });
      });

      g.selectAll('.heatmap-cell')
        .data(cells)
        .enter()
        .append('rect')
        .attr('class', 'heatmap-cell')
        .attr('x', (d) => x(d.equipe) || 0)
        .attr('y', (d) => y(d.bairro) || 0)
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', (d) => (d.value === 0 ? '#f8fafc' : colorScale(d.value)))
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function (event, d) {
          d3.select(this).attr('stroke', '#0284c7').attr('stroke-width', 2);
          tooltip.style('opacity', 1)
            .html(`
              <div class="p-3 bg-slate-900 text-white rounded-xl shadow-2xl text-xs space-y-1.5 border border-slate-700 min-w-[210px]">
                <div class="flex items-center justify-between border-b border-slate-700 pb-1.5">
                  <span class="font-extrabold text-cyan-400 text-sm">${d.bairro}</span>
                  <span class="text-[10px] bg-cyan-950 px-2 py-0.5 rounded text-cyan-300 font-bold">Matriz</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-300">${d.equipe}:</span>
                  <span class="font-bold text-white text-sm">${d.value} coleta(s)</span>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Densidade Coletada:</span>
                  <span class="font-semibold text-emerald-400">${d.value > 0 ? `${Math.round((d.value / Math.max(1, d.totalBairro)) * 100)}% do bairro` : 'Sem visitas'}</span>
                </div>
              </div>
            `)
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 35}px`);
        })
        .on('mousemove', function (event) {
          tooltip.style('left', `${event.pageX + 15}px`).style('top', `${event.pageY - 35}px`);
        })
        .on('mouseout', function () {
          d3.select(this).attr('stroke', '#e2e8f0').attr('stroke-width', 1);
          tooltip.style('opacity', 0);
        })
        .on('click', (_, d) => {
          setItemSelecionado({
            bairro: d.bairro,
            equipe: d.equipe,
            volume: d.value,
          });
        });

      // Texto de valor dentro da célula se couber
      if (x.bandwidth() > 35 && y.bandwidth() > 18) {
        g.selectAll('.cell-text')
          .data(cells)
          .enter()
          .append('text')
          .attr('class', 'cell-text')
          .attr('x', (d) => (x(d.equipe) || 0) + x.bandwidth() / 2)
          .attr('y', (d) => (y(d.bairro) || 0) + y.bandwidth() / 2 + 3)
          .attr('text-anchor', 'middle')
          .attr('fill', (d) => (d.value > maxVal * 0.6 ? '#ffffff' : '#334155'))
          .style('font-size', '9px')
          .style('font-weight', '700')
          .style('pointer-events', 'none')
          .text((d) => (d.value > 0 ? d.value : ''));
      }
    }
  }, [matrizBairroEquipe, dadosPorEquipe, modo, equipeFiltro, equipesDisponiveis]);

  // Exportação rápida de dados
  const exportarResumoCSV = () => {
    let csv = 'Bairro,Equipe,Volume_Coletado,Meta_Ligacoes\n';
    matrizBairroEquipe.forEach((b) => {
      equipesDisponiveis.forEach((eq) => {
        const vol = b.equipes[eq] || 0;
        if (vol > 0) {
          csv += `"${b.bairro}","${eq}",${vol},${b.meta}\n`;
        }
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_d3_censo_bairro_equipe_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
      {/* CABEÇALHO DO GRÁFICO D3 COM TELEMETRIA AO VIVO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-500/20">
              <Activity className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
              <span>D3.js Interactive Engine</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Tempo Real Ativo
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <span>Volume de Coletas por Bairro & Equipe de Campo</span>
          </h3>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Cruzamento dinâmico das ordens de serviço executadas pelas turmas do Contrato R7 EMBASA nº 460024679.
          </p>
        </div>

        {/* CONTROLES DE MODO DE VISUALIZAÇÃO D3 */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start lg:self-auto border border-slate-200">
          <button
            type="button"
            onClick={() => setModo('empilhado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              modo === 'empilhado'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Barras Empilhadas por Bairro com divisão por Equipe"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Empilhado</span>
          </button>

          <button
            type="button"
            onClick={() => setModo('agrupado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              modo === 'agrupado'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Comparação Lado a Lado das Equipes"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Agrupado</span>
          </button>

          <button
            type="button"
            onClick={() => setModo('equipe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              modo === 'equipe'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Ranking e Distribuição por Equipe"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Por Equipe</span>
          </button>

          <button
            type="button"
            onClick={() => setModo('matriz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              modo === 'matriz'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Matriz de Densidade e Cobertura Geográfica"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Matriz Heatmap</span>
          </button>
        </div>
      </div>

      {/* METRICAS KPI DE RESUMO RÁPIDO DO GRÁFICO */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Coletado</span>
          <span className="text-lg font-black text-slate-900">{metricasRapidas.totalVolume}</span>
          <span className="text-[10px] text-slate-400 block">registros validados</span>
        </div>

        <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200">
          <span className="text-[10px] font-bold uppercase text-sky-700 block">Bairros Ativos</span>
          <span className="text-lg font-black text-sky-900">{metricasRapidas.bairrosComColeta}</span>
          <span className="text-[10px] text-sky-600 block">de 25 no contrato R7</span>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
          <span className="text-[10px] font-bold uppercase text-emerald-700 block">Equipes em Campo</span>
          <span className="text-lg font-black text-emerald-900">{metricasRapidas.equipesAtivas}</span>
          <span className="text-[10px] text-emerald-600 block">frentes operacionais</span>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
          <span className="text-[10px] font-bold uppercase text-amber-700 block">Bairro Líder</span>
          <span className="text-xs font-black text-amber-900 truncate block" title={metricasRapidas.bairroTop.nome}>
            {metricasRapidas.bairroTop.nome}
          </span>
          <span className="text-[10px] text-amber-700 font-bold block">{metricasRapidas.bairroTop.total} censos</span>
        </div>

        <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
          <span className="text-[10px] font-bold uppercase text-purple-700 block">Equipe Destaque</span>
          <span className="text-xs font-black text-purple-900 truncate block" title={metricasRapidas.equipeTop.nome}>
            {metricasRapidas.equipeTop.nome}
          </span>
          <span className="text-[10px] text-purple-700 font-bold block">{metricasRapidas.equipeTop.total} coletas</span>
        </div>
      </div>

      {/* BARRA DE FILTROS E PESQUISA INTERATIVA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Busca por Bairro */}
          <div className="relative min-w-[180px] flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar por bairro..."
              value={buscaBairro}
              onChange={(e) => setBuscaBairro(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-sky-500"
            />
          </div>

          {/* Filtro de Equipe */}
          <select
            value={equipeFiltro}
            onChange={(e) => setEquipeFiltro(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-sky-500"
          >
            <option value="TODAS">Todas as Equipes</option>
            {equipesDisponiveis.map((eq) => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>

          {/* Ordenação */}
          {modo !== 'matriz' && (
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as CriterioOrdenacao)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-sky-500"
            >
              <option value="volume">Ordenar: Maior Volume</option>
              <option value="alfabetica">Ordenar: Alfabética (A-Z)</option>
              <option value="meta">Ordenar: % Atingimento da Meta</option>
            </select>
          )}

          {/* Checkbox Apenas com Coleta */}
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold select-none pl-1">
            <input
              type="checkbox"
              checked={mostrarApenasAtivos}
              onChange={(e) => setMostrarApenasAtivos(e.target.checked)}
              className="w-3.5 h-3.5 text-sky-600 rounded border-slate-300"
            />
            <span>Apenas com visitas</span>
          </label>
        </div>

        {/* Ações: Atualizar ao vivo & Exportar CSV */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setUltimaAtualizacao(new Date())}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 flex items-center gap-1 cursor-pointer transition shadow-2xs"
            title="Atualizar dados do gráfico agora"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            type="button"
            onClick={exportarResumoCSV}
            className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
            title="Exportar dados consolidados em planilha CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* LEGENDA DINÂMICA INTERATIVA DAS EQUIPES */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-400" />
          <span>Equipes:</span>
        </span>
        {equipesDisponiveis.map((eq, i) => {
          const cor = getCorEquipe(eq, i);
          const isAtiva = equipeFiltro === 'TODAS' || equipeFiltro === eq;
          return (
            <button
              key={eq}
              type="button"
              onClick={() => setEquipeFiltro(equipeFiltro === eq ? 'TODAS' : eq)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                isAtiva
                  ? 'bg-slate-50 border-slate-300 text-slate-800 shadow-2xs'
                  : 'bg-slate-100/50 border-transparent text-slate-400 opacity-60'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cor }}
              />
              <span>{eq}</span>
              {equipeFiltro === eq && (
                <span className="text-[10px] text-sky-600 font-extrabold ml-0.5">✕</span>
              )}
            </button>
          );
        })}
      </div>

      {/* CONTAINER DO CANVAS SVG DO D3 */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto relative rounded-xl bg-slate-50/50 border border-slate-200/80 p-1"
      >
        <svg ref={svgRef} className="w-full block select-none" />

        {/* Tooltip flutuante do D3 */}
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed z-50 transition-opacity duration-150 opacity-0"
          style={{ transform: 'translate(0, 0)' }}
        />
      </div>

      {/* DRAWER / DETALHES DE REGISTROS DO ITEM CLICADO NO GRÁFICO */}
      {itemSelecionado && (
        <div className="rounded-xl bg-slate-900 text-white p-4 text-xs space-y-3 shadow-lg border border-slate-800 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-extrabold text-[11px]">
                Auditoria de Campo
              </span>
              <h4 className="font-bold text-white text-sm">
                {itemSelecionado.bairro ? `${itemSelecionado.bairro} — ` : ''}
                {itemSelecionado.equipe} ({itemSelecionado.volume} censos)
              </h4>
            </div>
            <button
              onClick={() => setItemSelecionado(null)}
              className="text-slate-400 hover:text-white font-bold px-2 py-0.5 rounded bg-slate-800"
            >
              ✕ Fechar
            </button>
          </div>

          {itemSelecionado.detalhes && itemSelecionado.detalhes.length > 0 ? (
            <div className="overflow-x-auto max-h-48">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-1 px-2">Matrícula EMBASA</th>
                    <th className="py-1 px-2">Cadastrista</th>
                    <th className="py-1 px-2">Data/Hora</th>
                    <th className="py-1 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {itemSelecionado.detalhes.map((reg, idx) => (
                    <tr key={`${reg.matricula}_${idx}`} className="hover:bg-slate-800/50">
                      <td className="py-1 px-2 font-mono font-bold text-sky-300">{reg.matricula}</td>
                      <td className="py-1 px-2">{reg.cadastrista}</td>
                      <td className="py-1 px-2 text-slate-400">
                        {reg.data || (reg as any).timestamp ? new Date((reg as any).timestamp).toLocaleDateString('pt-BR') : 'Hoje'}
                      </td>
                      <td className="py-1 px-2 text-right text-emerald-400 font-semibold">Executada</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 text-xs">
              Nenhuma ordem individual detalhada disponível para exibição nesta seleção.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
