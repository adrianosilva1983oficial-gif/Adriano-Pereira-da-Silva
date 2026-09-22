import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Search,
  RefreshCw,
  LogOut,
  ChevronRight,
  ShieldCheck,
  User,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  Navigation,
  Building,
  Layers,
  Check,
  X,
  Camera,
  Compass,
  Satellite,
  ClipboardList,
  Download,
  Monitor,
  Zap,
  Droplets,
  Wifi,
  WifiOff,
  BellRing,
  Bell,
  Radio,
} from 'lucide-react';
import { OrdemServicoSCIWeb, StatusOS } from '../types/os';
import { osService } from '../services/osService';
import { authService } from '../services/authService';
import { tenantService } from '../services/tenantService';
import { UsuarioSistema } from '../types/auth';
import { CensoCampoModal } from './CensoCampoModal';
import { FotosOSModal } from './FotosOSModal';
import { MapaCartografiaAbertaModal } from './MapaCartografiaAbertaModal';
import { FilaSincronizacaoModal } from './FilaSincronizacaoModal';
import { ModalAlertaUrgenteRecebido } from './ModalAlertaUrgenteRecebido';
import {
  pushNotificationService,
  AlertaUrgentePush,
  PushStatusState,
} from '../services/pushNotificationService';
import { syncManager, SyncState } from '../services/syncManager';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { generateDirectAPKFile } from '../services/apkPackageService';

interface MobileColaboradorViewProps {
  onIniciarCensoMatricula?: (matricula: string, os: OrdemServicoSCIWeb) => void;
  onAlternarParaWeb?: () => void;
}

export const MobileColaboradorView: React.FC<MobileColaboradorViewProps> = ({
  onIniciarCensoMatricula,
}) => {
  const [currentUser, setCurrentUser] = useState<UsuarioSistema>(authService.getCurrentUser());
  const [todasOS, setTodasOS] = useState<OrdemServicoSCIWeb[]>(osService.getAllOS());
  const [tenantAtivo, setTenantAtivo] = useState(tenantService.getActiveTenant());
  const [isLogando, setIsLogando] = useState(false);

  // Formulário de Login do Colaborador
  const [emailInput, setEmailInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroLogin, setErroLogin] = useState<string | null>(null);

  // Filtros da Rota
  const [filtroStatus, setFiltroStatus] = useState<'TODAS' | 'PENDENTES' | 'CONCLUIDAS'>('TODAS');
  const [termoBusca, setTermoBusca] = useState('');

  // Modais de Ação Direta em Campo
  const [osParaCenso, setOsParaCenso] = useState<OrdemServicoSCIWeb | null>(null);
  const [osParaCartografia, setOsParaCartografia] = useState<OrdemServicoSCIWeb | null>(null);
  const [osParaFotos, setOsParaFotos] = useState<OrdemServicoSCIWeb | null>(null);

  // Modal de Registro de Impedimento
  const [osImpedimento, setOsImpedimento] = useState<OrdemServicoSCIWeb | null>(null);
  const [motivoSelecionado, setMotivoSelecionado] = useState<OrdemServicoSCIWeb['motivoImpedimento']>('CLIENTE_AUSENTE');
  const [obsImpedimento, setObsImpedimento] = useState('');
  const [feedbackReprogramacao, setFeedbackReprogramacao] = useState<string | null>(null);

  // Fila de Sincronização & Priorização de Emergência
  const [modalFilaAberto, setModalFilaAberto] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>(syncManager.getInitialState());

  // Notificações Push & Alertas de Emergência de Campo
  const [alertasPush, setAlertasPush] = useState<AlertaUrgentePush[]>(pushNotificationService.getAlertas());
  const [pushStatus, setPushStatus] = useState<PushStatusState>(pushNotificationService.getStatus());
  const [alertaModalAtivo, setAlertaModalAtivo] = useState<AlertaUrgentePush | null>(null);
  const [modalListaAlertasAberto, setModalListaAlertasAberto] = useState(false);

  useEffect(() => {
    const unsub = syncManager.subscribe((st) => setSyncState(st));
    return () => unsub();
  }, []);

  // Monitora alertas push da supervisão e abre modal se houver urgência não confirmada
  useEffect(() => {
    const unsubAlertas = pushNotificationService.subscribe((list) => {
      setAlertasPush(list);
      const tecId = currentUser?.id || 'tec-autologin';
      const tecNome = currentUser?.nome || '';

      // Verifica se há algum alerta recente endereçado a este técnico ou geral que ainda não foi confirmado
      const pendentes = list.filter((a) => {
        const jaConfirmou = a.confirmadoPor.some((c) => c.tecnicoId === tecId);
        const destinado = a.equipeDestino === 'TODAS' || a.equipeDestino.includes(tecNome);
        return !jaConfirmou && destinado;
      });

      if (pendentes.length > 0) {
        setAlertaModalAtivo(pendentes[0]);
      }
    });

    const unsubStatus = pushNotificationService.subscribeStatus(setPushStatus);

    return () => {
      unsubAlertas();
      unsubStatus();
    };
  }, [currentUser?.id, currentUser?.nome]);

  // Instalação PWA e Download direto de APK no Mobile
  const { isInstallable, install } = usePWAInstall();
  const [isDownloadingAPK, setIsDownloadingAPK] = useState(false);
  const [feedbackInstalacao, setFeedbackInstalacao] = useState<string | null>(null);

  const handleBaixarAPK = async () => {
    try {
      setIsDownloadingAPK(true);
      setFeedbackInstalacao('📥 Gerando pacote APK offline...');
      const liveUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const blob = await generateDirectAPKFile(liveUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AquaSanePro_Mobile_Offline.apk';
      a.click();
      URL.revokeObjectURL(url);
      setFeedbackInstalacao('✅ Download do APK iniciado com sucesso!');
      setTimeout(() => setFeedbackInstalacao(null), 4000);
    } catch (e) {
      console.error('Erro ao gerar APK:', e);
      setFeedbackInstalacao('⚠️ Falha ao gerar APK. Tente instalar como aplicativo direto.');
      setTimeout(() => setFeedbackInstalacao(null), 4000);
    } finally {
      setIsDownloadingAPK(false);
    }
  };

  const dataExecucaoHojeFormatada = new Date().toLocaleDateString('pt-BR');

  // Reprograma automaticamente matrículas pendentes na ordem de lotes para o próximo dia ao logar/carregar
  useEffect(() => {
    if (currentUser && currentUser.id && currentUser.status === 'ATIVO') {
      const hojeStr = new Date().toISOString().slice(0, 10);
      osService.reprogramarOSNaoExecutadasParaProximoDia(currentUser.id, hojeStr);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const unsubAuth = authService.subscribe(setCurrentUser);
    const unsubOS = osService.subscribe(setTodasOS);
    const unsubTenant = tenantService.subscribe((t) => {
      if (t) setTenantAtivo(t);
    });

    return () => {
      unsubAuth();
      unsubOS();
      unsubTenant();
    };
  }, []);

  // Ação manual de reprogramação automática para o outro dia em ordem de lotes
  const handleReprogramarOSNaoExecutadas = () => {
    if (!currentUser || !currentUser.id) return;
    const hojeStr = new Date().toISOString().slice(0, 10);
    const resultado = osService.reprogramarOSNaoExecutadasParaProximoDia(currentUser.id, hojeStr);
    if (resultado.reprogramadas > 0) {
      setFeedbackReprogramacao(`✅ ${resultado.reprogramadas} OS não executadas foram reprogramadas automaticamente na ordem de lotes para o próximo dia (${resultado.novaData})!`);
      setTimeout(() => setFeedbackReprogramacao(null), 6000);
    } else {
      setFeedbackReprogramacao('ℹ️ Todas as suas matrículas previstas já foram executadas ou não há OS pendentes para reprogramar.');
      setTimeout(() => setFeedbackReprogramacao(null), 5000);
    }
  };

  const licencaStatus = tenantService.isLicencaValida();

  // Login do Colaborador com credenciais cadastradas pela empresa no sistema web
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroLogin(null);

    if (!licencaStatus.valida) {
      setErroLogin(`Licença de uso desta empresa expirada (${licencaStatus.motivo}). Contate o administrador ou Adriano Silva.`);
      return;
    }

    setIsLogando(true);
    setTimeout(() => {
      const res = authService.login(emailInput, senhaInput);
      setIsLogando(false);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setEmailInput('');
        setSenhaInput('');
      } else {
        setErroLogin(res.error || 'Credenciais inválidas. Verifique seu e-mail e senha cadastrados no sistema web.');
      }
    }, 300);
  };

  const handleAcessoRapido = (u: UsuarioSistema) => {
    authService.setCurrentUser(u);
    setCurrentUser(u);
  };

  const handleLogout = () => {
    authService.logout();
  };

  const colaboradoresDisponiveis = authService.getCadastristasAtivos();

  // Filtra as OS que foram programadas para o colaborador logado
  const osDoColaborador = todasOS.filter((os) => {
    // Se o usuário for Administrador ou Supervisor, pode visualizar todas ou filtrar
    if (currentUser.perfil === 'ADMIN_CONTRATO' || currentUser.perfil === 'SUPERVISOR_GERAL') {
      return true;
    }

    // Para cadastristas de campo, mostra estritamente as programadas para ele ou sua equipe
    const matchCadastrista =
      os.cadastristaDesignado &&
      os.cadastristaDesignado.toLowerCase().trim() === currentUser.nome.toLowerCase().trim();

    const matchEquipe =
      currentUser.equipe &&
      os.equipeDesignada &&
      os.equipeDesignada.toLowerCase().trim() === currentUser.equipe.toLowerCase().trim();

    return matchCadastrista || matchEquipe;
  });

  // Ordenação sequencial da rota (1º, 2º, 3º...)
  const osOrdenadas = [...osDoColaborador].sort((a, b) => {
    const seqA = a.sequenciaRota || a.ordemProgramada || 9999;
    const seqB = b.sequenciaRota || b.ordemProgramada || 9999;
    return seqA - seqB;
  });

  // Aplica filtros de status e busca
  const osFiltradas = osOrdenadas.filter((os) => {
    if (filtroStatus === 'PENDENTES' && (os.status === 'EXECUTADA' || os.status === 'IMPEDIDA')) return false;
    if (filtroStatus === 'CONCLUIDAS' && os.status !== 'EXECUTADA') return false;

    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase();
      const matchMatricula = os.matriculaEmbasa.includes(termo);
      const matchLogradouro = os.logradouro.toLowerCase().includes(termo);
      const matchConsumidor = os.consumidorNome?.toLowerCase().includes(termo);
      const matchBairro = os.bairro.toLowerCase().includes(termo);
      return matchMatricula || matchLogradouro || matchConsumidor || matchBairro;
    }

    return true;
  });

  // Métricas do Colaborador
  const totalMinhasOS = osDoColaborador.length;
  const concluidasMinhas = osDoColaborador.filter((o) => o.status === 'EXECUTADA').length;
  const impedidasMinhas = osDoColaborador.filter((o) => o.status === 'IMPEDIDA').length;
  const pendentesMinhas = totalMinhasOS - concluidasMinhas - impedidasMinhas;
  const progressoPercent = totalMinhasOS > 0 ? Math.round((concluidasMinhas / totalMinhasOS) * 100) : 0;

  const tecId = currentUser?.id || 'tec-autologin';
  const totalAlertasNaoConfirmados = alertasPush.filter(
    (a) => !a.confirmadoPor.some((c) => c.tecnicoId === tecId)
  ).length;

  const handleConfirmarRecebimentoAlerta = (alertaId: string) => {
    pushNotificationService.confirmarRecebimento(
      alertaId,
      currentUser?.id || 'tec-autologin',
      currentUser?.nome || 'Técnico de Campo'
    );
  };

  // Finalização Rápida de Atendimento
  const handleFinalizarOS = (os: OrdemServicoSCIWeb) => {
    osService.atualizarStatusOS(os.id, 'EXECUTADA');
  };

  // Confirmação de Impedimento
  const handleConfirmarImpedimento = () => {
    if (!osImpedimento) return;
    osService.registrarImpedimento(osImpedimento.id, motivoSelecionado, obsImpedimento);
    setOsImpedimento(null);
    setObsImpedimento('');
  };

  // Se o colaborador não está logado, exibe APENAS a tela de login enxuta
  const isUsuarioAnonimoOuDeslogado = !currentUser || !currentUser.id || currentUser.status !== 'ATIVO';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* 1. TOPO ENXUTO: NOME DO SISTEMA E STATUS DO BANCO LOCAL */}
      <header className="bg-slate-950 px-3 sm:px-4 py-2.5 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-white shadow-xs">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight text-white leading-none">
              AquaSane Pro Mobile
            </h1>
            <span className="text-[10px] text-sky-300 font-medium">
              {tenantAtivo.nomeFantasia}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Botão de Alertas Push e Notificações de Campo */}
          <button
            type="button"
            onClick={async () => {
              if (pushStatus.permissao !== 'granted') {
                await pushNotificationService.solicitarPermissaoNotificacoes();
              } else {
                setModalListaAlertasAberto(true);
              }
            }}
            className={`px-2 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer border shadow-xs ${
              totalAlertasNaoConfirmados > 0
                ? 'bg-rose-500/25 text-rose-200 border-rose-500/70 animate-bounce'
                : pushStatus.permissao === 'granted'
                ? 'bg-sky-500/10 text-sky-300 border-sky-500/30 hover:bg-sky-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title={
              pushStatus.permissao === 'granted'
                ? 'Notificações Push Ativas da Central PGCSA/EMBASA'
                : 'Clique para Ativar Notificações Push'
            }
          >
            <BellRing
              className={`w-3.5 h-3.5 ${
                totalAlertasNaoConfirmados > 0
                  ? 'text-rose-400'
                  : pushStatus.permissao === 'granted'
                  ? 'text-sky-400'
                  : 'text-amber-400'
              }`}
            />
            <span className="hidden xs:inline">
              {totalAlertasNaoConfirmados > 0
                ? `${totalAlertasNaoConfirmados} Alerta(s)`
                : pushStatus.permissao === 'granted'
                ? 'Push SW Ativo'
                : 'Ativar Push'}
            </span>
          </button>

          {/* Botão Interativo da Fila com Destaque de Emergência */}
          <button
            type="button"
            onClick={() => setModalFilaAberto(true)}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer border shadow-sm ${
              syncState.criticalPendingCount > 0
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                : syncState.pendingCount > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
            title="Abrir Fila de Sincronização e Priorizar Ocorrências"
          >
            <Zap
              className={`w-3.5 h-3.5 ${
                syncState.criticalPendingCount > 0
                  ? 'text-rose-400'
                  : syncState.pendingCount > 0
                  ? 'text-amber-400'
                  : 'text-sky-400'
              }`}
            />
            <span>
              Fila: {syncState.pendingCount}
              {syncState.criticalPendingCount > 0 && ` (${syncState.criticalPendingCount} 🚨)`}
            </span>
          </button>

          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {syncState.isOnline ? 'Online' : 'Offline'}
          </span>

          {!isUsuarioAnonimoOuDeslogado && (
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              title="Sair do aplicativo"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* BARRA DE INSTALAÇÃO RÁPIDA / DOWNLOAD DE APK MOBILE */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-slate-300 font-medium">
            Aplicativo de Campo • 100% Offline
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={async () => {
              if (isInstallable) {
                await install();
              } else {
                setFeedbackInstalacao('💡 No Chrome do celular, toque em ⋮ (Menu) e depois em "Instalar aplicativo" ou "Adicionar à tela inicial".');
                setTimeout(() => setFeedbackInstalacao(null), 6000);
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-98 cursor-pointer"
          >
            <Smartphone className="w-3 h-3" />
            <span>Instalar App</span>
          </button>

          <button
            type="button"
            onClick={handleBaixarAPK}
            disabled={isDownloadingAPK}
            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>{isDownloadingAPK ? 'Gerando...' : 'Baixar APK'}</span>
          </button>
        </div>
      </div>

      {feedbackInstalacao && (
        <div className="bg-sky-950 text-sky-200 border-b border-sky-800 px-3 py-1.5 text-xs font-semibold text-center animate-in fade-in">
          {feedbackInstalacao}
        </div>
      )}

      {/* 2. TELA DE LOGIN DO COLABORADOR */}
      {isUsuarioAnonimoOuDeslogado ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-6 animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 to-emerald-500 mx-auto flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Smartphone className="w-8 h-8 text-slate-950" />
              </div>
              <h2 className="text-xl font-black text-white">Login do Colaborador</h2>
              <p className="text-xs text-slate-400">
                Acesse com seu e-mail e senha cadastrados no sistema web pela empresa <strong>{tenantAtivo.nomeFantasia}</strong>.
              </p>
            </div>

            {/* Aviso de Licença de 30 dias */}
            <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
              licencaStatus.valida
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">Licença de 30 Dias:</span>
              </div>
              <span className="font-mono font-black">
                {licencaStatus.valida ? `${licencaStatus.diasRestantes} dias restantes` : 'Expirada'}
              </span>
            </div>

            {erroLogin && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {erroLogin}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">E-mail do Colaborador</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ex: colaborador@empresa.com.br"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Senha de Acesso</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    value={senhaInput}
                    onChange={(e) => setSenhaInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLogando || !licencaStatus.valida}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-sm shadow-lg transition active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isLogando ? 'Verificando...' : 'Entrar no Aplicativo'}
              </button>
            </form>

            {/* Acesso Rápido para Demonstração de Campo */}
            {colaboradoresDisponiveis.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80">
                <p className="text-[11px] font-bold text-slate-400 mb-2 text-center">
                  Colaboradores cadastrados na empresa (Toque para entrar rápido):
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {colaboradoresDisponiveis.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleAcessoRapido(c)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer"
                    >
                      <span className="block font-bold text-white text-[11px] truncate">{c.nome}</span>
                      <span className="block text-[10px] text-sky-400">{c.equipe || 'Campo'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 3. AMBIENTE DO COLABORADOR LOGADO */
        <main className="flex-1 max-w-lg w-full mx-auto p-3 sm:p-4 space-y-4">
          {/* Card de Identificação do Colaborador e Progresso */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                  Colaborador Logado
                </span>
                <h2 className="text-base font-black text-white">{currentUser.nome}</h2>
                <p className="text-xs text-slate-400">
                  {currentUser.equipe || 'Equipe Geral'} • {tenantAtivo.nomeFantasia}
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400">{progressoPercent}%</span>
                <span className="text-[10px] text-slate-400 block">
                  {concluidasMinhas} de {totalMinhasOS} OS
                </span>
              </div>
            </div>

            {/* Barra de Progresso da Rota */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${progressoPercent}%` }}
              />
            </div>

            {/* Abas Rápidas de Filtro */}
            <div className="flex gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setFiltroStatus('TODAS')}
                className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  filtroStatus === 'TODAS'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Todas ({totalMinhasOS})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatus('PENDENTES')}
                className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  filtroStatus === 'PENDENTES'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Pendentes ({pendentesMinhas})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatus('CONCLUIDAS')}
                className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  filtroStatus === 'CONCLUIDAS'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Concluídas ({concluidasMinhas})
              </button>
            </div>
          </div>

          {/* DESCRIÇÃO DE OS PROGRAMADAS E REPROGRAMAÇÃO AUTOMÁTICA SOLICITADA */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 border-2 border-sky-500/30 rounded-3xl p-4 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-sky-400" />
                OS Programadas de Campo
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Data de Execução: <strong className="text-white">{dataExecucaoHojeFormatada}</strong>
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              <strong className="text-white">OS Programadas ({currentUser.nome})</strong> logado no celular e a data da execução da matrícula ({dataExecucaoHojeFormatada}), caso o colaborador cadastrista não executar a matrícula, automaticamente programe novamente ela na ordem de lotes para o outro dia.
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400">
                Ordem sequencial: <strong className="text-sky-300">Lotes Crescentes</strong>
              </span>

              <button
                type="button"
                onClick={handleReprogramarOSNaoExecutadas}
                className="px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer active:scale-98"
                title="Reprograma automaticamente matrículas pendentes para o dia seguinte em ordem de lotes"
              >
                <RefreshCw className="w-3 h-3 text-sky-400" />
                <span>Reprogramar não executadas</span>
              </button>
            </div>

            {feedbackReprogramacao && (
              <div className="p-2.5 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-200 text-xs font-medium animate-in fade-in">
                {feedbackReprogramacao}
              </div>
            )}
          </div>

          {/* Busca na Rota */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar matrícula, rua ou consumidor..."
              className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* LISTA DAS OS RECEBIDAS DO SISTEMA WEB ROTEIRIZADAS */}
          <div className="space-y-3 pb-8">
            {osFiltradas.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 text-center space-y-2">
                <ClipboardList className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-bold text-sm text-slate-300">Nenhuma O.S. nesta lista</h3>
                <p className="text-xs text-slate-500">
                  Nenhuma Ordem de Serviço programada para você neste momento. Suas OS aparecerão aqui na ordem de lotes.
                </p>
              </div>
            ) : (
              osFiltradas.map((os, index) => {
                const sequenciaExibida = os.sequenciaRota || os.ordemProgramada || index + 1;
                const fotosCount = os.fotos?.length || 0;
                const temCartografia = Boolean(os.cartografiaLote && os.cartografiaLote.vertices?.length >= 3);
                const temCenso = Boolean(os.censoDados || os.status === 'EXECUTADA');

                return (
                  <div
                    key={os.id}
                    className={`bg-slate-950 border rounded-3xl p-4 transition shadow-lg space-y-3 ${
                      os.status === 'EXECUTADA'
                        ? 'border-emerald-500/40'
                        : os.status === 'IMPEDIDA'
                        ? 'border-amber-500/40'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header da OS: Posição na Rota + Matrícula + Nome do Cliente + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-black flex items-center justify-center font-mono shrink-0 mt-0.5">
                          {sequenciaExibida}º
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-sm font-black text-white">
                              Matrícula: {os.matriculaEmbasa}
                            </span>
                            {os.foiReprogramada && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                                ↺ Reprogramada
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-200 block mt-0.5">
                            Cliente: <strong className="text-white">{os.nomeConsumidorSCIWeb || os.consumidorNome || 'Consumidor Titular'}</strong>
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                          os.status === 'EXECUTADA'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : os.status === 'IMPEDIDA'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        }`}
                      >
                        {os.status === 'EXECUTADA'
                          ? '✓ Concluída'
                          : os.status === 'IMPEDIDA'
                          ? '⚠️ Impedida'
                          : 'Pendente'}
                      </span>
                    </div>

                    {/* DADOS DETALHADOS PARA O COLABORADOR SE ACHAR EM CAMPO */}
                    <div className="bg-slate-900/95 rounded-2xl p-3 border border-slate-800 text-xs space-y-2.5">
                      {/* Endereço e Número do Imóvel */}
                      <div className="flex items-start gap-2 text-slate-200 font-medium leading-relaxed">
                        <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-white font-bold">{os.logradouro}</span>
                          <span className="text-slate-300">, nº </span>
                          <strong className="text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            {os.numeroPorta || 'S/N'}
                          </strong>
                          <span className="text-slate-300"> - Bairro </span>
                          <strong className="text-slate-200">{os.bairro}</strong>
                        </div>
                      </div>

                      {/* 4 Caixas de Destaque: Quadra, Lote, Imóvel e Hidrômetro */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] pt-1 border-t border-slate-800/80">
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Nº Quadra</span>
                          <strong className="text-sky-400 font-mono text-xs">{os.quadra || 'S/Q'}</strong>
                        </div>

                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Nº Lote</span>
                          <strong className="text-amber-400 font-mono text-xs">{os.lote || 'S/L'}</strong>
                        </div>

                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Nº Imóvel</span>
                          <strong className="text-emerald-400 font-mono text-xs">{os.numeroPorta || 'S/N'}</strong>
                        </div>

                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Nº Hidrômetro</span>
                          <strong className="text-white font-mono text-[11px] truncate block" title={os.hidrometroCadastradoSCIWeb || 'SEM HIDRÔMETRO'}>
                            {os.hidrometroCadastradoSCIWeb || 'SEM HIDRÔMETRO'}
                          </strong>
                        </div>
                      </div>

                      {/* Data de Execução Programada / Reprogramada */}
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                        <span>Data Prevista: <strong className="text-slate-200 font-mono">{os.dataProgramacao || dataExecucaoHojeFormatada}</strong></span>
                        {os.dataReprogramada && (
                          <span className="text-amber-300 font-semibold">Reprogramada para: {os.dataReprogramada}</span>
                        )}
                      </div>
                    </div>

                    {/* Badges de Atividades Realizadas */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                      <span className={`px-2 py-0.5 rounded-lg border ${
                        temCenso
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        {temCenso ? '✓ Censo Realizado' : '○ Censo Pendente'}
                      </span>

                      <span className={`px-2 py-0.5 rounded-lg border ${
                        temCartografia
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        {temCartografia ? `✓ Cartografia (${os.cartografiaLote?.areaM2}m²)` : '○ Cartografia'}
                      </span>

                      <span className={`px-2 py-0.5 rounded-lg border ${
                        fotosCount > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        {fotosCount > 0 ? `📷 ${fotosCount}/10 Fotos` : '○ 0/10 Fotos'}
                      </span>
                    </div>

                    {/* Destaque de Vazamento Crítico e Priorização na Fila */}
                    {os.censoDados?.tipoVazamento && os.censoDados.tipoVazamento !== 'NENHUM' && (
                      <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between text-[11px] text-rose-200">
                        <span className="flex items-center gap-1.5 font-bold">
                          <Droplets className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                          <span>Vazamento: {os.censoDados.tipoVazamento}</span>
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            await syncManager.prioritizeByMatricula(
                              os.matriculaEmbasa,
                              `Vazamento em campo: ${os.censoDados?.tipoVazamento}`
                            );
                            setModalFilaAberto(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-sm cursor-pointer"
                          title="Garante o envio desta ordem em 1º lugar ao reconectar"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Subir em 1º Lugar</span>
                        </button>
                      </div>
                    )}

                    {/* 4 BOTÕES DIRETOS PARA O COLABORADOR EXECUTAR A OS */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {/* 1. CENSO */}
                      <button
                        type="button"
                        onClick={() => setOsParaCenso(os)}
                        className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 font-bold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <ClipboardList className="w-4 h-4 text-sky-400" />
                        <span>Fazer Censo</span>
                      </button>

                      {/* 2. CARTOGRAFIA ABERTA */}
                      <button
                        type="button"
                        onClick={() => setOsParaCartografia(os)}
                        className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-bold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Satellite className="w-4 h-4 text-emerald-400" />
                        <span>Cartografia</span>
                      </button>

                      {/* 3. FOTOS (ATÉ 10 FOTOS) */}
                      <button
                        type="button"
                        onClick={() => setOsParaFotos(os)}
                        className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 font-bold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-amber-400" />
                        <span>Fotos ({fotosCount}/10)</span>
                      </button>
                    </div>

                    {/* Botões de Conclusão / Impedimento */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setOsImpedimento(os)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-amber-950/40 text-amber-400 border border-slate-800 text-xs font-bold transition cursor-pointer"
                      >
                        Impedimento
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFinalizarOS(os)}
                        className={`flex-1 py-2 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          os.status === 'EXECUTADA'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{os.status === 'EXECUTADA' ? 'O.S. Concluída' : 'Finalizar Atendimento'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      )}

      {/* MODAL 1: CENSO DE CAMPO */}
      {osParaCenso && (
        <CensoCampoModal
          os={osParaCenso}
          onClose={() => setOsParaCenso(null)}
          onSave={() => setOsParaCenso(null)}
        />
      )}

      {/* MODAL 2: CARTOGRAFIA ABERTA (SATÉLITE + VIAS OSM) */}
      {osParaCartografia && (
        <MapaCartografiaAbertaModal
          os={osParaCartografia}
          onClose={() => setOsParaCartografia(null)}
          onSave={() => setOsParaCartografia(null)}
        />
      )}

      {/* MODAL 3: FOTOS DA OS (ATÉ 10 FOTOS) */}
      {osParaFotos && (
        <FotosOSModal
          os={osParaFotos}
          onClose={() => setOsParaFotos(null)}
          onSave={() => setOsParaFotos(null)}
        />
      )}

      {/* MODAL 4: REGISTRO DE IMPEDIMENTO */}
      {osImpedimento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Registrar Impedimento</h3>
              </div>
              <button
                type="button"
                onClick={() => setOsImpedimento(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Matrícula: <strong className="font-mono text-white">{osImpedimento.matriculaEmbasa}</strong>
              <br />
              {osImpedimento.logradouro}, nº {osImpedimento.numeroPorta}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Motivo do Impedimento</label>
              <select
                value={motivoSelecionado}
                onChange={(e) => setMotivoSelecionado(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white"
              >
                <option value="CLIENTE_AUSENTE">Cliente Ausente (Imóvel Fechado)</option>
                <option value="RECUSA_ACESSO">Recusa de Atendimento do Morador</option>
                <option value="CAO_BRAVO">Cão Bravo / Animal Solto</option>
                <option value="AREA_RISCO">Área de Risco / Insegurança</option>
                <option value="IMOVEL_DEMOLIDO">Imóvel Demolido / Terreno Vazio</option>
                <option value="NUMERO_NAO_LOCALIZADO">Número Não Localizado</option>
                <option value="OUTRO">Outro Motivo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Observação do Operador</label>
              <textarea
                rows={2}
                value={obsImpedimento}
                onChange={(e) => setObsImpedimento(e.target.value)}
                placeholder="Ex: Vizinho informou que o morador só retorna após as 18h..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setOsImpedimento(null)}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarImpedimento}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm"
              >
                Salvar Impedimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal da Fila de Sincronização e Priorização de Emergência */}
      <FilaSincronizacaoModal
        isOpen={modalFilaAberto}
        onClose={() => setModalFilaAberto(false)}
        onItemPriorizado={() => {
          setTodasOS(osService.getAllOS());
        }}
      />

      {/* Modal de Alerta Push Urgente em Primeiro/Segundo Plano */}
      {alertaModalAtivo && (
        <ModalAlertaUrgenteRecebido
          alerta={alertaModalAtivo}
          nomeTecnico={currentUser?.nome || 'Técnico de Campo'}
          tecnicoId={currentUser?.id || 'tec-autologin'}
          onConfirmarRecebimento={handleConfirmarRecebimentoAlerta}
          onVerOS={(mat) => {
            const osAlvo = todasOS.find((o) => o.matricula === mat);
            if (osAlvo && onIniciarCensoMatricula) {
              onIniciarCensoMatricula(mat, osAlvo);
            }
          }}
          onFechar={() => setAlertaModalAtivo(null)}
        />
      )}

      {/* Modal / Histórico de Alertas Push da Supervisão */}
      {modalListaAlertasAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-white">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Alertas da Supervisão PGCSA / EMBASA
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mensagens transmitidas em segundo plano via Push
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalListaAlertasAberto(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {alertasPush.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhum alerta recebido da supervisão até o momento.
                </div>
              ) : (
                alertasPush.map((al) => {
                  const jaConfirmou = al.confirmadoPor.some((c) => c.tecnicoId === tecId);
                  return (
                    <div
                      key={al.id}
                      onClick={() => {
                        setModalListaAlertasAberto(false);
                        setAlertaModalAtivo(al);
                      }}
                      className="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 transition cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          al.nivelUrgencia === 'CRITICA' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {al.tipo}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(al.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-100">
                        {al.titulo}
                      </h4>

                      <p className="text-[11px] text-slate-300 line-clamp-2">
                        {al.mensagem}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/50">
                        <span>{al.remetente}</span>
                        {jaConfirmou ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Ciente
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold animate-pulse">
                            Pendente confirmação
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setModalListaAlertasAberto(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
