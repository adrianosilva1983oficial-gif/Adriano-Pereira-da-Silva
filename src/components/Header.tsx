import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  Smartphone,
  BarChart3,
  MapPin,
  Handshake,
  MessageSquareWarning,
  HelpCircle,
  Route,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  SlidersHorizontal,
  List,
  Plus,
  Download,
  QrCode,
  FileSpreadsheet,
  Users,
  Key,
  Building2,
  Building,
  CreditCard,
  BookOpen,
  Lock,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { SyncState } from '../services/syncManager';
import { PWAInstallButton } from './PWAInstallButton';
import { UsuarioSistema } from '../types/auth';
import { authService } from '../services/authService';

export type UnifiedActiveTab =
  | 'clientes_master'
  | 'rotas_os'
  | 'upload_excel'
  | 'mobile_colaborador'
  | 'erp_empresa'
  | 'funcionarios'
  | 'form'
  | 'validacao'
  | 'produtividade'
  | 'list'
  | 'map'
  | 'supervisao'
  | 'contrato'
  | 'negociacao'
  | 'reclamacoes';

interface HeaderProps {
  syncState: SyncState;
  onManualSync: () => void;
  onOpenFila?: () => void;
  isSimulatingOffline: boolean;
  onToggleSimulatedOffline: () => void;
  activeTab: UnifiedActiveTab;
  onSelectTab: (tab: UnifiedActiveTab) => void;
  onOpenLoginModal: () => void;
  onOpenCadernoTecnico?: () => void;
  onOpenLicenciamentoMaster?: () => void;
  onOpenCentralDownload?: () => void;
  onOpenPlanosAssinatura?: () => void;
  onOpenVideoAulas?: () => void;
  onOpenBancoDados?: () => void;
  onOpenGeradorPix?: () => void;
  versaoAtiva?: 'master' | 'cliente' | 'mobile';
  onSelecionarVersao?: (versao: 'master' | 'cliente' | 'mobile') => void;
  onAbrirModalExecutaveis?: () => void;
  onBaixarExecutavelAtual?: () => void;
  statusFinanceiro?: {
    valida: boolean;
    emDia: boolean;
    diasRestantes: number;
    diasAtraso: number;
    toleranciaRestante: number;
    modoSomenteLeitura: boolean;
  };
  recordsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  syncState,
  onManualSync,
  onOpenFila,
  isSimulatingOffline,
  onToggleSimulatedOffline,
  activeTab,
  onSelectTab,
  onOpenLoginModal,
  onOpenCadernoTecnico,
  onOpenLicenciamentoMaster,
  onOpenCentralDownload,
  onOpenPlanosAssinatura,
  onOpenVideoAulas,
  onOpenBancoDados,
  onOpenGeradorPix,
  versaoAtiva = 'cliente',
  onSelecionarVersao,
  onAbrirModalExecutaveis,
  onBaixarExecutavelAtual,
  statusFinanceiro,
  recordsCount = 0,
}) => {
  const [currentUser, setCurrentUser] = useState<UsuarioSistema>(authService.getCurrentUser());
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);

  useEffect(() => {
    const unsub = authService.subscribe((u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  const perfilBadgeLabel =
    currentUser.perfil === 'CADASTRISTA_CAMPO'
      ? 'Cadastrista de Campo'
      : currentUser.perfil === 'VALIDADOR_AUDITOR'
      ? 'Auditor de Campo'
      : currentUser.perfil === 'SUPERVISOR_GERAL'
      ? 'Supervisor Geral'
      : 'Admin Contrato';

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
      {/* Top Bar Institucional do Contrato */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-sky-950 px-4 py-1 text-[11px] text-slate-300 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-900/80 text-sky-200 font-semibold text-[10px] tracking-wide uppercase">
            Saneamento Universal
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="font-medium text-slate-200">AquaSane Pro Tecnologia Operacional</span>
          <span className="hidden md:inline text-slate-400">— Sistema Web & APK Campo 100% Offline</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Planos & Licenciamento com aviso de inadimplência se houver */}
          {onOpenPlanosAssinatura && (
            <button
              onClick={onOpenPlanosAssinatura}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer border ${
                statusFinanceiro?.modoSomenteLeitura
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/50 animate-pulse'
                  : statusFinanceiro && !statusFinanceiro.emDia
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
              }`}
              title="Planos, Faturamento e Regularização de Licenças"
            >
              <CreditCard className="w-3 h-3" />
              <span>
                {statusFinanceiro?.modoSomenteLeitura
                  ? 'Bloqueio: Somente Leitura'
                  : statusFinanceiro && !statusFinanceiro.emDia
                  ? `Carência: ${statusFinanceiro.toleranciaRestante}d`
                  : 'Planos & Pagamento'}
              </span>
            </button>
          )}

          {/* Botão Vídeo Aulas */}
          {onOpenVideoAulas && (
            <button
              onClick={onOpenVideoAulas}
              className="px-2 py-0.5 rounded-md bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
              title="Central de Treinamento Oficial e Vídeo Aulas"
            >
              <BookOpen className="w-3 h-3 text-sky-400" />
              <span>Vídeo Aulas</span>
            </button>
          )}

          {onOpenLicenciamentoMaster && (
            <button
              onClick={onOpenLicenciamentoMaster}
              className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
              title="Painel Master do Sistema - Gestão de Licenças e Aparelhos"
            >
              <Smartphone className="w-3 h-3 text-amber-400" />
              <span>Licença: Celular Ativo</span>
            </button>
          )}

          {onOpenCadernoTecnico && (
            <button
              onClick={onOpenCadernoTecnico}
              className="hover:text-white underline underline-offset-2 flex items-center gap-1 text-[11px] text-sky-400 cursor-pointer"
              title="Diretrizes Operacionais e Procedimentos Técnicos"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Caderno Técnico</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra Principal */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Identidade com indicação clara da Versão Desmembrada */}
        <div className="flex items-center gap-2.5">
          <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-inner font-black text-lg ${
            versaoAtiva === 'master'
              ? 'bg-gradient-to-br from-amber-500 to-amber-700'
              : versaoAtiva === 'mobile'
              ? 'bg-gradient-to-br from-emerald-500 to-teal-700'
              : 'bg-gradient-to-br from-sky-500 to-sky-700'
          }`}>
            {versaoAtiva === 'master' ? 'WM' : versaoAtiva === 'mobile' ? 'AM' : 'WC'}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white ring-2 ring-slate-900">
              ✓
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                {versaoAtiva === 'master'
                  ? 'AquaSane Pro — Web Master'
                  : versaoAtiva === 'mobile'
                  ? 'AquaSane Pro — Mobile'
                  : 'AquaSane Pro — Web Cliente ERP'}
              </h1>
              <span className={`hidden xs:inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase font-mono border ${
                versaoAtiva === 'master'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : versaoAtiva === 'mobile'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
              }`}>
                {versaoAtiva === 'master' ? 'RESTRITO MEU' : versaoAtiva === 'mobile' ? 'CAMPO OFFLINE' : 'ERP & PLANILHAS'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none mt-0.5">
              {versaoAtiva === 'master'
                ? 'Painel de Controle Restrito (Adriano Silva) • Licenciamento & PIX'
                : versaoAtiva === 'mobile'
                ? 'Ordens de Serviço e Censo Móvel com Fotos • 100% Offline'
                : 'Gestão Operacional, Inserção ERP, Planilhas 111k+ & Relatórios'}
            </p>
          </div>
        </div>

        {/* Controles de Conexão, Perfil e Sincronização */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botão Baixar Executável Desta Versão */}
          {onBaixarExecutavelAtual && (
            <button
              onClick={onBaixarExecutavelAtual}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black text-white shadow-md transition active:scale-98 cursor-pointer ${
                versaoAtiva === 'master'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600'
                  : versaoAtiva === 'mobile'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                  : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500'
              }`}
              title={`Baixar o executável de instalação específico para ${versaoAtiva === 'master' ? 'Web Master' : versaoAtiva === 'mobile' ? 'App Mobile (APK)' : 'Web Cliente ERP'}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {versaoAtiva === 'master' ? 'Executável Master (.bat)' : versaoAtiva === 'mobile' ? 'Baixar APK (.apk)' : 'Executável ERP (.bat)'}
              </span>
              <span className="sm:hidden">Executável</span>
            </button>
          )}

          {/* Botão Central de Desmembramento / 3 Executáveis */}
          {onAbrirModalExecutaveis && (
            <button
              onClick={onAbrirModalExecutaveis}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-200 transition cursor-pointer shadow-xs"
              title="Ver as 3 versões desmembradas e baixar os instaladores"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">3 Executáveis</span>
            </button>
          )}

          {/* Botão Baixar App Mobile / Central de Links */}
          {onOpenCentralDownload && (
            <button
              id="btn-central-download"
              onClick={onOpenCentralDownload}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
              title="Baixar App no Celular, Links Oficiais de Acesso e Publicação nas Lojas"
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden lg:inline">Links Celular</span>
            </button>
          )}

          {/* Botão de Perfil de Usuário / Login */}
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer shadow-2xs"
            title="Alternar Perfil ou Fazer Login"
          >
            <div className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center text-[11px]">
              {currentUser.nome.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left hidden md:block leading-tight">
              <span className="text-[11px] font-bold text-white block">{currentUser.nome}</span>
              <span className="text-[9px] text-sky-300 block">{perfilBadgeLabel}</span>
            </div>
          </button>

          {/* Botão de Rede / Offline Simulado */}
          <div className="relative">
            <button
              id="btn-network-status"
              onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition border cursor-pointer ${
                syncState.isOnline
                  ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-amber-950/70 border-amber-600/60 text-amber-300 hover:bg-amber-900/70 animate-pulse'
              }`}
            >
              {syncState.isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Offline {isSimulatingOffline ? '(Simulado)' : ''}</span>
                </>
              )}
            </button>

            {showNetworkDropdown && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-800 p-3.5 shadow-2xl border border-slate-700 text-xs z-50">
                <div className="font-semibold text-slate-200 mb-2 border-b border-slate-700 pb-1.5 flex items-center justify-between">
                  <span>Modo Anti-Perda de Dados</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${syncState.isOnline ? 'bg-emerald-900 text-emerald-300' : 'bg-amber-900 text-amber-300'}`}>
                    {syncState.isOnline ? 'Conectado 4G' : 'Sem Conexão'}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mb-3 leading-relaxed">
                  Os dados, polígonos cartográficos e fotos coletados são gravados instantaneamente no IndexedDB do aparelho com carimbo probatório.
                </p>

                <div className="pt-2 border-t border-slate-700">
                  <label className="flex items-center justify-between gap-2 cursor-pointer">
                    <span className="text-slate-200 font-medium">Simular Área Sem Sinal 4G</span>
                    <input
                      type="checkbox"
                      checked={isSimulatingOffline}
                      onChange={() => {
                        onToggleSimulatedOffline();
                        setShowNetworkDropdown(false);
                      }}
                      className="rounded border-slate-600 bg-slate-700 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Permite testar o comportamento em vales ou garagens sem cobertura de rede móvel.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Fila de Sincronização & Priorização de Emergência */}
          {onOpenFila && (
            <button
              id="btn-open-sync-queue"
              onClick={onOpenFila}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer border ${
                syncState.criticalPendingCount > 0
                  ? 'bg-rose-950/90 hover:bg-rose-900 text-rose-200 border-rose-500/50 animate-pulse'
                  : syncState.pendingCount > 0
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
              }`}
              title="Fila de Sincronização & Prioridades de Emergência"
            >
              <Zap
                className={`w-3.5 h-3.5 ${
                  syncState.criticalPendingCount > 0
                    ? 'text-rose-400'
                    : syncState.pendingCount > 0
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              />
              <span className="hidden sm:inline">Fila</span>
              {syncState.pendingCount > 0 && (
                <span
                  className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    syncState.criticalPendingCount > 0
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  {syncState.criticalPendingCount > 0
                    ? `${syncState.criticalPendingCount} 🚨`
                    : syncState.pendingCount}
                </span>
              )}
            </button>
          )}

          {/* Sincronização Manual */}
          <button
            id="btn-sync-action"
            onClick={onManualSync}
            disabled={syncState.isSyncing}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition shadow-xs cursor-pointer ${
              syncState.pendingCount > 0
                ? 'bg-sky-600 hover:bg-sky-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Sincronizar fila pendente com o servidor"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin text-sky-200' : ''}`} />
            {syncState.isSyncing ? (
              <span>Sincronizando...</span>
            ) : syncState.pendingCount > 0 ? (
              <span className="flex items-center gap-1.5">
                <span>Sincronizar</span>
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-900">
                  {syncState.pendingCount}
                </span>
              </span>
            ) : (
              <span className="hidden sm:inline text-slate-300">Sincronizado</span>
            )}
          </button>

          {/* Gerador de Link de Pagamento PIX Oficial (adrianosilva1983oficial@gmail.com) */}
          {onOpenGeradorPix && (
            <button
              id="btn-open-pix-vendas"
              onClick={onOpenGeradorPix}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition shadow-xs cursor-pointer"
              title="Gerar Link de Pagamento PIX Oficial para Vendas Online (adrianosilva1983oficial@gmail.com)"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">PIX Vendas Online</span>
              <span className="sm:hidden">PIX</span>
            </button>
          )}

          {/* Gerenciador de Banco de Dados de Alta Capacidade (+200k Matrículas) */}
          {onOpenBancoDados && (
            <button
              id="btn-open-database-manager"
              onClick={onOpenBancoDados}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 transition shadow-xs cursor-pointer"
              title="Gerenciador de Banco de Dados Persistente (+200.000 Matrículas, Censo e Fotos)"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Banco 200k+</span>
            </button>
          )}

          {/* Botão Instalar PWA */}
          <PWAInstallButton />
        </div>
      </div>

      {/* Navegação por Abas Principais de acordo com a Versão Ativa */}
      <nav className="bg-slate-950/80 border-t border-slate-800 px-2 sm:px-4 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 py-1.5">
          {/* MODO 1: WEB MASTER (Uso Restrito Adriano Silva) */}
          {versaoAtiva === 'master' && (
            <>
              <button
                id="tab-clientes-master"
                onClick={() => onSelectTab('clientes_master')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'clientes_master'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/50 border border-amber-500/40'
                }`}
                title="Gestão de Todas as Empresas, Contratos e Bases Multi-Tenant"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>🛡️ Gestão de Clientes & Bases (Master)</span>
              </button>

              {onOpenLicenciamentoMaster && (
                <button
                  onClick={onOpenLicenciamentoMaster}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-amber-300 hover:bg-slate-800/60 whitespace-nowrap transition cursor-pointer"
                  title="Liberação de Celulares por IMEI e Chaves Comerciais"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>📱 Licenças & Aparelhos (IMEI)</span>
                </button>
              )}

              {onOpenGeradorPix && (
                <button
                  onClick={onOpenGeradorPix}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-300 hover:bg-slate-800/60 whitespace-nowrap transition cursor-pointer"
                  title="Gerador de Links de Pagamento PIX Oficial (adrianosilva1983oficial@gmail.com)"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>💳 PIX Vendas Online</span>
                </button>
              )}

              {onOpenBancoDados && (
                <button
                  onClick={onOpenBancoDados}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-sky-300 hover:bg-slate-800/60 whitespace-nowrap transition cursor-pointer"
                  title="Gerenciador Global do Banco de Dados (+200k a 1.5M Matrículas)"
                >
                  <Database className="w-3.5 h-3.5 text-sky-400" />
                  <span>🗄️ Banco Global (1.5M Matrículas)</span>
                </button>
              )}

              {onOpenVideoAulas && (
                <button
                  onClick={onOpenVideoAulas}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 whitespace-nowrap transition cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  <span>🎓 Vídeo Aulas</span>
                </button>
              )}
            </>
          )}

          {/* MODO 2: WEB CLIENTE (ERP, Planilhas 111k+ e Relatórios) */}
          {versaoAtiva === 'cliente' && (
            <>
              {/* Sistema ERP & Cadastro da Empresa */}
              <button
                onClick={() => onSelectTab('erp_empresa')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'erp_empresa'
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-sky-300" />
                <span>🏢 Empresa & Setores (ERP)</span>
              </button>

              {/* Upload de Planilha Excel */}
              <button
                onClick={() => onSelectTab('upload_excel')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'upload_excel'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/30'
                }`}
                title="Subir Planilhas de Matrículas (111 mil a 1.500.000 linhas) sem travamento"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span>📊 Subir Planilha (111k+ Matrículas)</span>
              </button>

              {/* Rotas OS Lotes Crescentes */}
              <button
                onClick={() => onSelectTab('rotas_os')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'rotas_os'
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Route className="w-3.5 h-3.5 text-sky-300" />
                <span>Rotas de O.S.</span>
              </button>

              {/* Cadastros de Funcionários & Direitos de Uso */}
              <button
                onClick={() => onSelectTab('funcionarios')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'funcionarios'
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-sky-300" />
                <span>Funcionários & Direitos</span>
              </button>

              {/* Relatórios de Produtividade dos Colaboradores */}
              <button
                onClick={() => onSelectTab('produtividade')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'produtividade'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-indigo-300" />
                <span>Produtividade</span>
              </button>

              {/* Auditoria Pré-Envio Concessionária */}
              <button
                onClick={() => onSelectTab('validacao')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'validacao'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Auditoria Pré-Envio</span>
              </button>

              {/* Supervisão Operacional */}
              <button
                onClick={() => onSelectTab('supervisao')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'supervisao'
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Painel de Metas</span>
              </button>

              {/* Mapa GIS */}
              <button
                onClick={() => onSelectTab('map')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Mapa GIS</span>
              </button>

              {/* Ligações Cadastradas */}
              <button
                onClick={() => onSelectTab('list')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'list'
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Ligações ({recordsCount})</span>
              </button>

              {/* Negociação */}
              <button
                onClick={() => onSelectTab('negociacao')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'negociacao'
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>Negociação & Tarifa</span>
              </button>

              {/* Ouvidoria */}
              <button
                onClick={() => onSelectTab('reclamacoes')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'reclamacoes'
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <MessageSquareWarning className="w-3.5 h-3.5" />
                <span>Ouvidoria SLA 48h</span>
              </button>

              {/* Formulário de Coleta em Campo */}
              <button
                onClick={() => onSelectTab('form')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'form'
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Coleta de Campo</span>
              </button>

              {/* Campos do Contrato */}
              <button
                onClick={() => onSelectTab('contrato')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'contrato'
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Campos Contrato (38)</span>
              </button>
            </>
          )}

          {/* MODO 3: APP MOBILE (Campo / Cadastristas) */}
          {versaoAtiva === 'mobile' && (
            <>
              <button
                onClick={() => onSelectTab('mobile_colaborador')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'mobile_colaborador'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/30'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
                <span>📱 Minhas O.S. (Ordem de Campo)</span>
              </button>

              <button
                onClick={() => onSelectTab('form')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'form'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>➕ Censo com Morador & Fotos</span>
              </button>

              {onSelecionarVersao && (
                <button
                  onClick={() => onSelecionarVersao('cliente')}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 hover:bg-slate-800/60 whitespace-nowrap transition cursor-pointer ml-auto"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>← Voltar ao Web Cliente (ERP)</span>
                </button>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
