import React, { useState, useEffect, useRef } from 'react';
import {
  Route,
  Navigation,
  CheckCircle2,
  UserX,
  ShieldAlert,
  Clock,
  MapPin,
  Camera,
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  Building,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
  UploadCloud,
  FileUp,
  PlusCircle,
  Check,
  AlertCircle,
  Radio,
  Volume2,
  VolumeX,
  LocateFixed,
  Compass,
  Sparkles,
  RefreshCw,
  BellRing,
  Smartphone
} from 'lucide-react';
import { OrdemServicoSCIWeb, StatusOS, MotivoImpedimento } from '../types/os';
import { osService } from '../services/osService';
import { authService } from '../services/authService';
import {
  processarArquivoExcelEmbasa,
  programarRotasPelaOrdemPlanilha,
} from '../services/excelProgramacaoService';
import { GPSNavigatorModal } from './GPSNavigatorModal';
import { MapaCartografiaAbertaModal } from './MapaCartografiaAbertaModal';
import { GeofenceProximityModal } from './GeofenceProximityModal';
import {
  calcularDistanciaMetros,
  playGeofenceChime,
  triggerGeofenceVibration,
} from '../utils/geoUtils';
import { BairroR7 } from '../types/censo';
import { LISTA_BAIRROS } from '../data/bairrosData';

interface RotasOSViewProps {
  onIniciarCensoMatricula: (matricula: string, os: OrdemServicoSCIWeb) => void;
  onAbrirUploadPlanilha?: () => void;
}

export const RotasOSView: React.FC<RotasOSViewProps> = ({
  onIniciarCensoMatricula,
  onAbrirUploadPlanilha,
}) => {
  const [osList, setOsList] = useState<OrdemServicoSCIWeb[]>(osService.getAllOS());
  const [selectedBairro, setSelectedBairro] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modais
  const [navigatingOS, setNavigatingOS] = useState<OrdemServicoSCIWeb | null>(null);
  const [cartografiaOS, setCartografiaOS] = useState<OrdemServicoSCIWeb | null>(null);
  const [impedimentoModalOS, setImpedimentoModalOS] = useState<OrdemServicoSCIWeb | null>(null);
  const [motivoImpedimento, setMotivoImpedimento] = useState<MotivoImpedimento>('CASA_FECHADA');
  const [obsImpedimento, setObsImpedimento] = useState<string>('');

  // =========================================================================
  // ESTADOS DE GEOFENCING (< 50 METROS DE UMA OS PENDENTE)
  // =========================================================================
  const [geofenceAtivo, setGeofenceAtivo] = useState<boolean>(true);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'aguardando' | 'ativo' | 'erro' | 'simulado'>('aguardando');
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const [somGeofenceAtivo, setSomGeofenceAtivo] = useState<boolean>(true);
  const [vibracaoGeofenceAtiva, setVibracaoGeofenceAtiva] = useState<boolean>(true);
  const [geofenceAlertaOS, setGeofenceAlertaOS] = useState<{ os: OrdemServicoSCIWeb; distance: number } | null>(null);
  const [silenciadosGeofence, setSilenciadosGeofence] = useState<Set<string>>(new Set());
  const [isSimulando, setIsSimulando] = useState<boolean>(false);
  const [distanciasOS, setDistanciasOS] = useState<Record<string, number>>({});

  const currentUser = authService.getCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Upload Manual de Planilha Direto na Rota
  const [isProcessandoPlanilha, setIsProcessandoPlanilha] = useState(false);
  const [feedbackPlanilha, setFeedbackPlanilha] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Modal para Adicionar Matrícula Manual Avulsa
  const [showAdicionarManualModal, setShowAdicionarManualModal] = useState(false);
  const [manualMatricula, setManualMatricula] = useState('');
  const [manualNome, setManualNome] = useState('');
  const [manualLogradouro, setManualLogradouro] = useState('');
  const [manualNumero, setManualNumero] = useState('');
  const [manualQuadra, setManualQuadra] = useState('QD-01');
  const [manualLote, setManualLote] = useState('LT-01');
  const [manualBairro, setManualBairro] = useState<BairroR7>('Arenoso');
  const [manualHidrometro, setManualHidrometro] = useState('SEM_HIDROMETRO');
  const [manualCadastrista, setManualCadastrista] = useState('Adelmo Ribeiro');

  useEffect(() => {
    const unsub = osService.subscribe((list) => {
      setOsList(list);
    });
    return () => unsub();
  }, []);

  // Monitoramento de GPS Real para Geofencing
  useEffect(() => {
    if (!geofenceAtivo || isSimulando) return;

    if (!('geolocation' in navigator)) {
      setGpsStatus('erro');
      setGpsErrorMsg('Geolocalização não suportada no navegador');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 5),
        });
        setGpsStatus('ativo');
        setGpsErrorMsg(null);
      },
      (err) => {
        console.warn('GPS Geofencing aviso/erro:', err.message);
        setGpsStatus('erro');
        setGpsErrorMsg(err.message || 'Sinal GPS aguardando autorização');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [geofenceAtivo, isSimulando]);

  // Monitoramento contínuo da proximidade (< 50 metros) em relação às OSs pendentes (status === 'ABERTA')
  useEffect(() => {
    if (!geofenceAtivo || !userPos) return;

    const novasDistancias: Record<string, number> = {};
    let osPendenteMaisProxima: { os: OrdemServicoSCIWeb; distance: number } | null = null;

    osList.forEach((os) => {
      if (os.coordenadas && typeof os.coordenadas.latitude === 'number') {
        const d = calcularDistanciaMetros(
          userPos.lat,
          userPos.lng,
          os.coordenadas.latitude,
          os.coordenadas.longitude
        );
        novasDistancias[os.id] = d;

        // Geofencing foca exclusivamente em OS pendentes ('ABERTA')
        if (os.status === 'ABERTA') {
          if (!osPendenteMaisProxima || d < osPendenteMaisProxima.distance) {
            osPendenteMaisProxima = { os, distance: d };
          }
        }
      }
    });

    setDistanciasOS(novasDistancias);

    // Se estiver a menos de 50 metros da OS pendente mais próxima
    if (osPendenteMaisProxima && (osPendenteMaisProxima as { os: OrdemServicoSCIWeb; distance: number }).distance <= 50) {
      const { os: osAlvo, distance: dist } = osPendenteMaisProxima as { os: OrdemServicoSCIWeb; distance: number };

      // Verifica se esta OS não foi dispensada/silenciada manualmente pelo técnico
      if (!silenciadosGeofence.has(osAlvo.id)) {
        if (!geofenceAlertaOS || geofenceAlertaOS.os.id !== osAlvo.id) {
          setGeofenceAlertaOS({ os: osAlvo, distance: dist });
          if (somGeofenceAtivo) playGeofenceChime();
          if (vibracaoGeofenceAtiva) triggerGeofenceVibration();
        }
      }
    }
  }, [userPos, osList, geofenceAtivo, silenciadosGeofence, somGeofenceAtivo, vibracaoGeofenceAtiva, geofenceAlertaOS]);

  // Função para simular aproximação (< 50m) para teste instantâneo
  const handleSimularProximidade = (targetOS?: OrdemServicoSCIWeb) => {
    const osAlvo = targetOS || osList.find((os) => os.status === 'ABERTA') || osList[0];
    if (!osAlvo) return;

    setIsSimulando(true);
    setGpsStatus('simulado');
    setGpsErrorMsg(null);

    // Cria coordenada a ~18 metros do imóvel da OS
    const simulatedLat = osAlvo.coordenadas.latitude + 0.00012;
    const simulatedLng = osAlvo.coordenadas.longitude + 0.00008;

    setUserPos({
      lat: simulatedLat,
      lng: simulatedLng,
      accuracy: 3,
    });

    // Se a OS estiver silenciada, remove para permitir o disparo do alerta
    if (silenciadosGeofence.has(osAlvo.id)) {
      setSilenciadosGeofence((prev) => {
        const next = new Set(prev);
        next.delete(osAlvo.id);
        return next;
      });
    }

    // Calcula distância direta
    const dist = calcularDistanciaMetros(
      simulatedLat,
      simulatedLng,
      osAlvo.coordenadas.latitude,
      osAlvo.coordenadas.longitude
    );

    setGeofenceAlertaOS({ os: osAlvo, distance: dist });
    if (somGeofenceAtivo) playGeofenceChime();
    if (vibracaoGeofenceAtiva) triggerGeofenceVibration();
  };

  const handleDesativarSimulacao = () => {
    setIsSimulando(false);
    setUserPos(null);
    setGpsStatus('aguardando');
  };

  const handleDispensarAlerta = () => {
    if (geofenceAlertaOS) {
      setSilenciadosGeofence((prev) => new Set(prev).add(geofenceAlertaOS.os.id));
    }
    setGeofenceAlertaOS(null);
  };

  const handleIniciarCensoPeloAlerta = (matricula: string, os: OrdemServicoSCIWeb) => {
    setGeofenceAlertaOS(null);
    onIniciarCensoMatricula(matricula, os);
  };

  // Processa o upload manual de arquivo Excel (.xlsx, .xls, .csv)
  const handleUploadPlanilhaDireto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsProcessandoPlanilha(true);
    setFeedbackPlanilha(null);

    try {
      const leitura = await processarArquivoExcelEmbasa(file);
      if (leitura.linhas.length === 0) {
        throw new Error('Nenhuma linha com matrícula válida foi encontrada no arquivo.');
      }

      const cadAtivos = authService.getCadastristasAtivos();
      const cadastristaPadrao = cadAtivos.length > 0 ? cadAtivos[0].nome : 'Adelmo Ribeiro';
      const equipePadrao = cadAtivos.length > 0 && cadAtivos[0].equipe ? cadAtivos[0].equipe : 'Equipe 01 - Frente Cabula';

      const res = programarRotasPelaOrdemPlanilha(leitura.linhas, {
        nomeArquivoOrigem: file.name,
        dataProgramacao: new Date().toISOString().split('T')[0],
        equipeDesignada: equipePadrao,
        cadastristaDesignado: cadastristaPadrao,
        bairroPadraoSeVazio: 'Cabula',
        sobrescreverExistentes: false, // Adiciona/acrescenta à lista existente
        reiniciarStatusParaAberta: false,
      });

      setFeedbackPlanilha({
        tipo: 'sucesso',
        texto: `Planilha "${file.name}" carregada com sucesso! ${res.inseridas} novas OS adicionadas à rota (${res.atualizadas} atualizadas).`,
      });

      setTimeout(() => setFeedbackPlanilha(null), 6000);
    } catch (err: any) {
      setFeedbackPlanilha({
        tipo: 'erro',
        texto: err.message || 'Erro ao processar o arquivo Excel manual.',
      });
      setTimeout(() => setFeedbackPlanilha(null), 6000);
    } finally {
      setIsProcessandoPlanilha(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Criação manual avulsa de uma matrícula
  const handleSalvarMatriculaManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMatricula.trim()) return;

    const novaOS = osService.criarOSAvulsa({
      matriculaEmbasa: manualMatricula.trim(),
      nomeConsumidorSCIWeb: manualNome.trim() || 'Consumidor Não Informado',
      logradouro: manualLogradouro.trim() || 'Rua Principal',
      numeroPorta: manualNumero.trim() || 'S/N',
      quadra: manualQuadra.trim() || 'QD-01',
      lote: manualLote.trim() || 'LT-01',
      bairro: manualBairro,
      hidrometroCadastradoSCIWeb: manualHidrometro.trim() || 'SEM_HIDROMETRO',
      cadastristaDesignado: manualCadastrista,
      equipeDesignada: 'Equipe 01 - Frente Cabula',
      status: 'ABERTA',
    });

    setShowAdicionarManualModal(false);
    setManualMatricula('');
    setManualNome('');
    setManualLogradouro('');
    setManualNumero('');
    setFeedbackPlanilha({
      tipo: 'sucesso',
      texto: `Matrícula ${novaOS.matriculaEmbasa} cadastrada com sucesso na rota!`,
    });
    setTimeout(() => setFeedbackPlanilha(null), 4000);
  };

  // Filtros mantendo a ordenação por Quadra e Lote Crescente
  const filteredOS = osList.filter((os) => {
    const matchesBairro = selectedBairro === 'TODOS' || os.bairro === selectedBairro;
    const matchesStatus = selectedStatus === 'TODOS' || os.status === selectedStatus;
    const matchesSearch =
      searchQuery === '' ||
      os.matriculaEmbasa.includes(searchQuery) ||
      os.numeroOSSCIWeb.toLowerCase().includes(searchQuery.toLowerCase()) ||
      os.nomeConsumidorSCIWeb.toLowerCase().includes(searchQuery.toLowerCase()) ||
      os.quadra.toLowerCase().includes(searchQuery.toLowerCase()) ||
      os.lote.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBairro && matchesStatus && matchesSearch;
  });

  const handleRegistrarAusente = (os: OrdemServicoSCIWeb) => {
    osService.updateOSStatus(os.id, 'AUSENTE');
    setNavigatingOS(null);
  };

  const handleOpenImpedimento = (os: OrdemServicoSCIWeb) => {
    setImpedimentoModalOS(os);
    setNavigatingOS(null);
  };

  const handleConfirmarImpedimento = () => {
    if (!impedimentoModalOS) return;
    osService.updateOSStatus(impedimentoModalOS.id, 'IMPEDIDA', {
      motivoImpedimento,
      observacaoImpedimento: obsImpedimento || undefined,
    });
    setImpedimentoModalOS(null);
    setObsImpedimento('');
  };

  // Agrupa por Bairro e Quadra para visualização clara de lotes crescentes
  const quadrasAgrupadas: Record<string, OrdemServicoSCIWeb[]> = {};
  filteredOS.forEach((os) => {
    const groupKey = `${os.bairro} — ${os.quadra}`;
    if (!quadrasAgrupadas[groupKey]) quadrasAgrupadas[groupKey] = [];
    quadrasAgrupadas[groupKey].push(os);
  });

  return (
    <div className="space-y-5">
      {/* Top Banner de Ordens de Serviço */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-800 via-sky-900 to-indigo-950 text-white p-4 sm:p-5 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white border border-white/30">
              <Route className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold">
              Ordens de Serviço Programadas (OS)
            </h2>
          </div>
          <p className="text-xs text-sky-200 mt-1 max-w-2xl leading-relaxed">
            Ordens de serviço ordenadas por sequência de atendimento. O colaborador é guiado por GPS até a matrícula, realiza o censo cadastral, fotos probatórias e demarcação cartográfica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onAbrirUploadPlanilha && (
            <button
              onClick={onAbrirUploadPlanilha}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-98 cursor-pointer"
              title="Fazer upload de planilha Excel (.xlsx) para programar as OSs pela ordem da planilha"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Upload Planilha Excel</span>
            </button>
          )}

          <button
            onClick={() => setShowAdicionarManualModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition active:scale-98 cursor-pointer"
            title="Cadastrar matrícula avulsa manualmente na rota"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-200" />
            <span>+ Matrícula Manual</span>
          </button>
        </div>
      </div>

      {/* Card de Upload Manual de Planilha no Sistema (Pedido do Usuário) */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-emerald-300 bg-gradient-to-r from-emerald-50/50 via-white to-sky-50/40">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              <span>Upload Manual de Planilha para Geração Automática de OS</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Selecione ou arraste a planilha Excel enviada pela concessionária ou pelo cliente. O sistema lê as colunas de <strong>Matrícula, Nome, Endereço, Bairro e Hidrômetro</strong> e gera as Ordens de Serviço imediatamente para os colaboradores.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Input escondido ativado pelo botão */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleUploadPlanilhaDireto}
              disabled={isProcessandoPlanilha}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessandoPlanilha}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
            >
              <FileUp className={`w-4 h-4 ${isProcessandoPlanilha ? 'animate-bounce' : ''}`} />
              <span>{isProcessandoPlanilha ? 'Processando Planilha...' : 'Selecionar Planilha (.xlsx, .csv)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdicionarManualModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 text-slate-500" />
              <span>Adicionar Avulsa</span>
            </button>
          </div>
        </div>

        {/* Feedback do Upload */}
        {feedbackPlanilha && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              feedbackPlanilha.tipo === 'sucesso'
                ? 'bg-emerald-100/90 text-emerald-900 border-emerald-300'
                : 'bg-rose-100/90 text-rose-900 border-rose-300'
            }`}
          >
            {feedbackPlanilha.tipo === 'sucesso' ? (
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span>{feedbackPlanilha.texto}</span>
          </div>
        )}
      </div>

      {/* BARRA DE MONITORAMENTO E TELEMETRIA GEOFENCING (< 50 METROS) */}
      <div className="rounded-2xl bg-slate-900 text-white p-4 shadow-md border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl border ${
              geofenceAlertaOS
                ? 'bg-emerald-600/30 border-emerald-400 text-emerald-300'
                : geofenceAtivo
                ? 'bg-sky-600/20 border-sky-400/40 text-sky-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              <Radio className={`w-5 h-5 ${geofenceAtivo ? 'animate-pulse' : ''}`} />
              {geofenceAtivo && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Geofencing Automático de Campo (Raio: 50m)</span>
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isSimulando
                    ? 'bg-purple-900/80 text-purple-200 border border-purple-500/50'
                    : gpsStatus === 'ativo'
                    ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/50'
                    : gpsStatus === 'erro'
                    ? 'bg-rose-900/80 text-rose-200 border border-rose-500/50'
                    : 'bg-amber-900/80 text-amber-200 border border-amber-500/50'
                }`}>
                  {isSimulando
                    ? 'Simulação Ativa (<50m)'
                    : gpsStatus === 'ativo'
                    ? 'GPS Conectado'
                    : gpsStatus === 'erro'
                    ? 'GPS Indisponível'
                    : 'Buscando Satélites'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Notifica o técnico instantaneamente com som e vibração ao entrar no perímetro do lote de uma OS pendente.
              </p>
            </div>
          </div>

          {/* Controles de Som, Vibração e Simulação */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSomGeofenceAtivo(!somGeofenceAtivo)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                somGeofenceAtivo
                  ? 'bg-sky-950 text-sky-300 border-sky-600 hover:bg-sky-900'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title={somGeofenceAtivo ? 'Desativar sinal sonoro de aproximação' : 'Ativar sinal sonoro'}
            >
              {somGeofenceAtivo ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span>{somGeofenceAtivo ? 'Som On' : 'Mudo'}</span>
            </button>

            <button
              type="button"
              onClick={() => setVibracaoGeofenceAtiva(!vibracaoGeofenceAtiva)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                vibracaoGeofenceAtiva
                  ? 'bg-indigo-950 text-indigo-300 border-indigo-600 hover:bg-indigo-900'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title={vibracaoGeofenceAtiva ? 'Vibração ativada para celular' : 'Vibração desativada'}
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>{vibracaoGeofenceAtiva ? 'Vibração On' : 'Vibração Off'}</span>
            </button>

            {isSimulando ? (
              <button
                type="button"
                onClick={handleDesativarSimulacao}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold flex items-center gap-1.5 border border-purple-500/40 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restaurar GPS Real</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSimularProximidade()}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-98 cursor-pointer"
                title="Simular movimento do técnico para menos de 50 metros da OS pendente"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                <span>Simular Chegada (&lt;50m)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setGeofenceAtivo(!geofenceAtivo)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                geofenceAtivo
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {geofenceAtivo ? 'Geofence Ativo' : 'Pausado'}
            </button>
          </div>
        </div>

        {/* Linha Informativa de Proximidade em Tempo Real */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {userPos ? (
              <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                <LocateFixed className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Posição: {userPos.lat.toFixed(5)}, {userPos.lng.toFixed(5)}</span>
                <span className="text-slate-500">({isSimulando ? 'Simulado' : `±${userPos.accuracy}m`})</span>
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                <LocateFixed className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{gpsErrorMsg || 'Aguardando sinal GPS para telemetria...'}</span>
              </span>
            )}
          </div>

          <div>
            {(() => {
              if (!userPos) return null;
              // Encontra a OS pendente mais próxima
              let closest: { os: OrdemServicoSCIWeb; dist: number } | null = null;
              osList.forEach((os) => {
                if (os.status === 'ABERTA' && os.coordenadas) {
                  const d = distanciasOS[os.id] ?? calcularDistanciaMetros(
                    userPos.lat,
                    userPos.lng,
                    os.coordenadas.latitude,
                    os.coordenadas.longitude
                  );
                  if (!closest || d < closest.dist) {
                    closest = { os, dist: d };
                  }
                }
              });

              if (!closest) {
                return <span className="text-slate-400 text-[11px]">Nenhuma OS pendente na rota</span>;
              }

              const { os: osMaisProx, dist } = closest as { os: OrdemServicoSCIWeb; dist: number };

              if (dist <= 50) {
                return (
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-3 py-1 rounded-xl font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>
                      🎯 NO PERÍMETRO: Matrícula {osMaisProx.matriculaEmbasa} ({dist}m)
                    </span>
                    <button
                      type="button"
                      onClick={() => onIniciarCensoMatricula(osMaisProx.matriculaEmbasa, osMaisProx)}
                      className="underline text-white font-black hover:text-emerald-300 cursor-pointer ml-1"
                    >
                      Iniciar Censo →
                    </button>
                  </div>
                );
              }

              return (
                <span className="text-sky-300 font-medium flex items-center gap-1 text-[11px]">
                  <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>
                    OS pendente mais próxima: Matrícula <strong>{osMaisProx.matriculaEmbasa}</strong> a{' '}
                    <strong className="text-white font-mono">{dist} metros</strong> (
                    {osMaisProx.logradouro})
                  </span>
                </span>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar matrícula, OS SCIWeb, lote, morador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:border-sky-500"
            />
          </div>

          <select
            value={selectedBairro}
            onChange={(e) => setSelectedBairro(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="TODOS">Todos os Bairros</option>
            {LISTA_BAIRROS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ABERTA">Abertas / Pendentes</option>
            <option value="EXECUTADA">Executadas com Sucesso</option>
            <option value="AUSENTE">Morador Ausente</option>
            <option value="IMPEDIDA">Não Executada (Impedimento)</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total: <strong>{filteredOS.length}</strong> OS na Rota
        </div>
      </div>

      {/* Lista Agrupada por Quadra com Ordenação de Lote Crescente */}
      <div className="space-y-6">
        {Object.keys(quadrasAgrupadas).length === 0 ? (
          <div className="rounded-2xl bg-white p-8 border border-slate-200 text-center text-slate-500">
            <Route className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-sm text-slate-700">Nenhuma Ordem de Serviço encontrada.</p>
            <p className="text-xs text-slate-400 mt-1">Crie um novo lote de OS ou ajuste os filtros.</p>
          </div>
        ) : (
          Object.entries(quadrasAgrupadas).map(([groupTitle, osItems]) => {
            // Garante ordenação rigorosa pelo número do lote crescente
            const sortedByLote = [...osItems].sort((a, b) => a.numeroLoteNumerico - b.numeroLoteNumerico);

            return (
              <div key={groupTitle} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-sky-600"></span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {groupTitle} — Roteiro de OS
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {sortedByLote.length} Matrículas
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {sortedByLote.map((os) => {
                    const hasCartografia = !!os.cartografiaLote;
                    const distMetros = distanciasOS[os.id];
                    const estaNoGeofence = typeof distMetros === 'number' && distMetros <= 50 && os.status === 'ABERTA';

                    return (
                      <div
                        key={os.id}
                        className={`rounded-2xl p-4 border transition flex flex-col justify-between ${
                          estaNoGeofence
                            ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500 shadow-lg shadow-emerald-600/15'
                            : os.status === 'EXECUTADA'
                            ? 'bg-emerald-50/40 border-emerald-300'
                            : os.status === 'AUSENTE'
                            ? 'bg-amber-50/40 border-amber-300'
                            : os.status === 'IMPEDIDA'
                            ? 'bg-rose-50/40 border-rose-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          {/* Banner de Geofence Ativado no Perímetro do Imóvel */}
                          {estaNoGeofence && (
                            <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white flex items-center justify-between text-[11px] font-black shadow-xs animate-pulse">
                              <div className="flex items-center gap-1.5">
                                <Radio className="w-3.5 h-3.5 text-emerald-200 animate-spin" />
                                <span>🎯 GEOFENCE: VOCÊ ESTÁ NO LOCAL!</span>
                              </div>
                              <span className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono">
                                {distMetros}m
                              </span>
                            </div>
                          )}

                          {/* Cabeçalho do Card da OS */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-indigo-900 text-white shadow-2xs">
                                {os.lote}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {os.quadra}
                              </span>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                os.status === 'EXECUTADA'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : os.status === 'AUSENTE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : os.status === 'IMPEDIDA'
                                  ? 'bg-rose-100 text-rose-800'
                                  : estaNoGeofence
                                  ? 'bg-emerald-600 text-white animate-pulse'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {os.status === 'EXECUTADA' && <CheckCircle2 className="w-3 h-3" />}
                              {os.status === 'AUSENTE' && <UserX className="w-3 h-3" />}
                              {os.status === 'IMPEDIDA' && <ShieldAlert className="w-3 h-3" />}
                              {os.status === 'ABERTA' && (estaNoGeofence ? <Radio className="w-3 h-3" /> : <Clock className="w-3 h-3" />)}
                              <span>
                                {os.status === 'EXECUTADA'
                                  ? 'Executada'
                                  : os.status === 'AUSENTE'
                                  ? `Ausente (${os.tentativasAusente}x)`
                                  : os.status === 'IMPEDIDA'
                                  ? 'Impedida'
                                  : estaNoGeofence
                                  ? `No Local (${distMetros}m)`
                                  : 'Pendente'}
                              </span>
                            </span>
                          </div>

                          {/* Matrícula e Consumidor */}
                          <div className="space-y-1">
                            <div className="flex items-baseline justify-between">
                              <span className="font-mono text-xs font-bold text-sky-900 bg-sky-100 px-1.5 py-0.5 rounded">
                                Matrícula {os.matriculaEmbasa}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {os.numeroOSSCIWeb}
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 mt-1">
                              {os.nomeConsumidorSCIWeb}
                            </h4>

                            {os.origemPlanilha && (
                              <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                                <FileSpreadsheet className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="font-semibold">Ordem Programada #{os.ordemProgramada || os.sequenciaRota}</span>
                                <span className="text-emerald-600 font-mono truncate max-w-[140px]">({os.origemPlanilha})</span>
                              </div>
                            )}

                            <p className="text-[11px] text-slate-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                              <span className="line-clamp-1">{os.logradouro}, nº {os.numeroPorta}</span>
                            </p>

                            {/* Distância em Tempo Real calculada pelo Geofence */}
                            {typeof distMetros === 'number' && (
                              <div
                                className={`mt-1.5 px-2 py-1 rounded-lg flex items-center justify-between text-[10px] ${
                                  estaNoGeofence
                                    ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300 font-black'
                                    : 'bg-slate-100 text-slate-600 font-medium'
                                }`}
                              >
                                <span className="flex items-center gap-1">
                                  <LocateFixed className={`w-3 h-3 ${estaNoGeofence ? 'text-emerald-700 animate-pulse' : 'text-slate-400'}`} />
                                  <span>Distância GPS da OS:</span>
                                </span>
                                <span className="font-mono font-bold">
                                  {distMetros > 1000 ? `${(distMetros / 1000).toFixed(1)} km` : `${distMetros} metros`}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Informações Complementares */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                            <div>
                              <span className="block text-slate-400">Hidrômetro SCI:</span>
                              <span className="font-mono font-semibold text-slate-700">{os.hidrometroCadastradoSCIWeb}</span>
                            </div>
                            <div>
                              <span className="block text-slate-400">Cartografia Lote:</span>
                              {hasCartografia ? (
                                <span className="font-semibold text-indigo-700 flex items-center gap-0.5">
                                  <Layers className="w-3 h-3" /> {os.cartografiaLote?.areaM2} m²
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Pendente</span>
                              )}
                            </div>
                          </div>

                          {os.motivoImpedimento && (
                            <div className="mt-2 p-1.5 bg-rose-50 rounded text-rose-800 text-[10px]">
                              <strong>Impedimento:</strong> {os.motivoImpedimento}
                            </div>
                          )}
                        </div>

                        {/* Botões de Ação de Campo do Cadastrista */}
                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            {/* Botão Guia GPS até a matrícula */}
                            <button
                              onClick={() => setNavigatingOS(os)}
                              className="py-1.5 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center gap-1 border border-sky-200 transition cursor-pointer"
                              title="Abrir navegador GPS até este lote"
                            >
                              <Navigation className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                              <span>Guia GPS</span>
                            </button>

                            {/* Botão Cartografia Mobile */}
                            <button
                              onClick={() => setCartografiaOS(os)}
                              className="py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center gap-1 border border-indigo-200 transition cursor-pointer"
                              title="Demarcar polígono cartográfico do lote/quadra"
                            >
                              <Layers className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Cartografia</span>
                            </button>
                          </div>

                          {/* Botão rápido para testar o Geofence individualmente nesta OS pendente */}
                          {os.status === 'ABERTA' && (
                            <button
                              type="button"
                              onClick={() => handleSimularProximidade(os)}
                              className="w-full py-1 px-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center gap-1 border border-purple-200 transition cursor-pointer"
                              title="Simular que o técnico se aproximou a menos de 50m desta OS"
                            >
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              <span>Testar Geofence Aqui (&lt;50m)</span>
                            </button>
                          )}

                          {/* Botão Principal: Realizar Censo com o Morador */}
                          <button
                            onClick={() => onIniciarCensoMatricula(os.matriculaEmbasa, os)}
                            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              estaNoGeofence
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md shadow-emerald-600/30 active:scale-98 animate-pulse'
                                : 'bg-sky-700 hover:bg-sky-800 text-white shadow-xs'
                            }`}
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>{estaNoGeofence ? 'Iniciar Censo Agora (No Local)' : 'Realizar Censo & Fotos'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE PROXIMIDADE GEOFENCING (< 50 METROS) */}
      {geofenceAlertaOS && (
        <GeofenceProximityModal
          os={geofenceAlertaOS.os}
          distanciaMetros={geofenceAlertaOS.distance}
          onIniciarCenso={handleIniciarCensoPeloAlerta}
          onAbrirGPS={(os) => {
            setGeofenceAlertaOS(null);
            setNavigatingOS(os);
          }}
          onDispensar={handleDispensarAlerta}
          onSilenciarTemporario={handleDispensarAlerta}
        />
      )}

      {/* Modal Guia GPS em Tempo Real */}
      {navigatingOS && (
        <GPSNavigatorModal
          os={navigatingOS}
          onClose={() => setNavigatingOS(null)}
          onIniciarCenso={(matricula, os) => {
            setNavigatingOS(null);
            onIniciarCensoMatricula(matricula, os);
          }}
          onIniciarCartografia={(os) => {
            setNavigatingOS(null);
            setCartografiaOS(os);
          }}
          onRegistrarAusente={handleRegistrarAusente}
          onRegistrarImpedimento={handleOpenImpedimento}
        />
      )}

      {/* Modal de Cartografia de Lote de Alta Precisão */}
      {cartografiaOS && (
        <MapaCartografiaAbertaModal
          os={cartografiaOS}
          onClose={() => setCartografiaOS(null)}
        />
      )}

      {/* Modal de Registro de Impedimento */}
      {impedimentoModalOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Registrar Motivo de Impedimento da OS</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Matrícula <strong>{impedimentoModalOS.matriculaEmbasa}</strong> — Lote <strong>{impedimentoModalOS.lote}</strong>
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selecione o Impedimento Físico Encontrado:
                </label>
                <select
                  value={motivoImpedimento}
                  onChange={(e) => setMotivoImpedimento(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 font-medium"
                >
                  <option value="CASA_FECHADA">Casa Fechada / Trancada sem campainha</option>
                  <option value="CAO_BRAVO">Cão Bravo sem focinheira / Risco de ataque</option>
                  <option value="AREA_RISCO">Área de Risco / Segurança de Campo</option>
                  <option value="RECUSA_MORADOR">Recusa Formal do Morador em atender</option>
                  <option value="LOTE_VAGO">Lote Vago / Terreno Baldio</option>
                  <option value="IMOVEL_DEMOLIDO">Imóvel Demolido / Em ruínas</option>
                  <option value="OUTRO">Outro Motivo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações de Campo (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={obsImpedimento}
                  onChange={(e) => setObsImpedimento(e.target.value)}
                  placeholder="Detalhe o motivo que impediu a execução do censo..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setImpedimentoModalOS(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarImpedimento}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                Confirmar Impedimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Adicionar Matrícula Avulsa Manualmente */}
      {showAdicionarManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
               <div className="flex items-center gap-2 text-slate-900">
                <PlusCircle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base">Adicionar Matrícula Manual Avulsa</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdicionarManualModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarMatriculaManual} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Matrícula da Ligação *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 10982341"
                    value={manualMatricula}
                    onChange={(e) => setManualMatricula(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bairro *</label>
                  <select
                    value={manualBairro}
                    onChange={(e) => setManualBairro(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                  >
                    {LISTA_BAIRROS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Consumidor / Titular</label>
                <input
                  type="text"
                  placeholder="Nome completo do morador ou titular"
                  value={manualNome}
                  onChange={(e) => setManualNome(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Logradouro / Rua</label>
                  <input
                    type="text"
                    placeholder="Ex: Rua São Jorge"
                    value={manualLogradouro}
                    onChange={(e) => setManualLogradouro(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nº Porta</label>
                  <input
                    type="text"
                    placeholder="Ex: 142"
                    value={manualNumero}
                    onChange={(e) => setManualNumero(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quadra</label>
                  <input
                    type="text"
                    value={manualQuadra}
                    onChange={(e) => setManualQuadra(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lote</label>
                  <input
                    type="text"
                    value={manualLote}
                    onChange={(e) => setManualLote(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hidrômetro</label>
                  <input
                    type="text"
                    value={manualHidrometro}
                    onChange={(e) => setManualHidrometro(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cadastrista Atribuído</label>
                <select
                  value={manualCadastrista}
                  onChange={(e) => setManualCadastrista(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                >
                  {authService.getCadastristasAtivos().map((c) => (
                    <option key={c.id} value={c.nome}>
                      {c.nome} ({c.equipe})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdicionarManualModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black shadow-sm"
                >
                  Salvar Matrícula na Rota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
