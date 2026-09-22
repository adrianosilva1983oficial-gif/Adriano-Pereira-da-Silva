import React, { useState, useEffect } from 'react';
import {
  FileText,
  List,
  MapPin,
  BarChart3,
  Handshake,
  MessageSquareWarning,
  Plus,
  Wifi,
  WifiOff,
  RefreshCw,
  Sparkles,
  Download,
  Database,
  CheckCircle2,
  SlidersHorizontal,
  Route,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Copy,
  QrCode,
  Save,
  Smartphone
} from 'lucide-react';
import { Header, UnifiedActiveTab } from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';
import { CensoForm } from './components/CensoForm';
import { CensoList } from './components/CensoList';
import { MapGISView } from './components/MapGISView';
import { SupervisaoDashboard } from './components/SupervisaoDashboard';
import { NegociacaoView } from './components/NegociacaoView';
import { ReclamacoesView } from './components/ReclamacoesView';
import { ConfigContratoView } from './components/ConfigContratoView';
import { CensoDetailModal } from './components/CensoDetailModal';
import { RotasOSView } from './components/RotasOSView';
import { ValidacaoEmbasaView } from './components/ValidacaoEmbasaView';
import { RelatorioProdutividadeView } from './components/RelatorioProdutividadeView';
import { GestaoFuncionariosView } from './components/GestaoFuncionariosView';
import { UploadPlanilhaExcelView } from './components/UploadPlanilhaExcelView';
import { LoginModal } from './components/LoginModal';
import { CadernoTecnicoModal } from './components/CadernoTecnicoModal';
import { TelaAtivacaoLicenca } from './components/TelaAtivacaoLicenca';
import { PainelLicenciamentoMasterModal } from './components/PainelLicenciamentoMasterModal';
import { CentralDownloadModal } from './components/CentralDownloadModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SistemaERPView } from './components/SistemaERPView';
import { MobileColaboradorView } from './components/MobileColaboradorView';
import { ContratacaoPlanosModal } from './components/ContratacaoPlanosModal';
import { GeradorLinkPixModal } from './components/GeradorLinkPixModal';
import { VideoAulasModal } from './components/VideoAulasModal';
import { MasterClientesView } from './components/MasterClientesView';
import { CadastroClienteWebModal } from './components/CadastroClienteWebModal';
import { BancoDadosGerenciadorModal } from './components/BancoDadosGerenciadorModal';
import { FilaSincronizacaoModal } from './components/FilaSincronizacaoModal';
import { VersaoSwitcherBar, VersaoSistema } from './components/VersaoSwitcherBar';
import { DesmembramentoExecutaveisModal } from './components/DesmembramentoExecutaveisModal';
import {
  downloadExecutavelWebMaster,
  downloadExecutavelWebCliente,
  downloadExecutavelMobile,
} from './services/executaveisService';

import { CensoRecord } from './types/censo';
import { OrdemServicoSCIWeb } from './types/os';
import { getAllCensoRecords, saveCensoRecord } from './services/db';
import { syncManager, SyncState } from './services/syncManager';
import { authService } from './services/authService';
import { licenciamentoService } from './services/licenciamentoService';
import { tenantService } from './services/tenantService';
import { generateDirectAPKFile } from './services/apkPackageService';
import { pushNotificationService } from './services/pushNotificationService';
import { backupRedundancyService, RedundancyState } from './services/backupRedundancyService';
import { CentralBackupRedundanciaModal } from './components/CentralBackupRedundanciaModal';

export default function App() {
  const [versaoAtiva, setVersaoAtiva] = useState<VersaoSistema>('cliente');
  const [isExecutaveisModalOpen, setIsExecutaveisModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<UnifiedActiveTab>('rotas_os');
  const [records, setRecords] = useState<CensoRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<CensoRecord | null>(null);
  const [syncState, setSyncState] = useState<SyncState>(syncManager.getInitialState());
  const [isFilaModalOpen, setIsFilaModalOpen] = useState(false);
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(null);

  // Status de Inadimplência e Bloqueio de 5 Dias
  const [statusFinanceiro, setStatusFinanceiro] = useState(
    tenantService.verificarStatusFinanceiroELicenca()
  );
  const [isPlanosModalOpen, setIsPlanosModalOpen] = useState(false);
  const [isVideoAulasModalOpen, setIsVideoAulasModalOpen] = useState(false);
  const [isGeradorPixOpen, setIsGeradorPixOpen] = useState(false);

  // Licenciamento Comercial por Aparelho Celular (Adriano Silva)
  const [isDispositivoAutorizado, setIsDispositivoAutorizado] = useState<boolean>(
    licenciamentoService.isDispositivoAutorizado()
  );
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

  // Modais de Apoio
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCadastroClienteOpen, setIsCadastroClienteOpen] = useState(false);
  const [isCadernoTecnicoOpen, setIsCadernoTecnicoOpen] = useState(false);
  const [isCentralDownloadOpen, setIsCentralDownloadOpen] = useState(false);
  const [isBancoDadosModalOpen, setIsBancoDadosModalOpen] = useState(false);
  const [isBackupRedundanciaModalOpen, setIsBackupRedundanciaModalOpen] = useState(false);
  const [redundancyState, setRedundancyState] = useState<RedundancyState>(
    backupRedundancyService.getState()
  );
  const [isMobileFramed, setIsMobileFramed] = useState(false);

  // Pré-preenchimento ao vir de uma Ordem de Serviço da rota
  const [prefillOS, setPrefillOS] = useState<OrdemServicoSCIWeb | undefined>(undefined);
  const [prefillData, setPrefillData] = useState<Partial<CensoRecord> | undefined>(undefined);

  // Carrega registros locais do IndexedDB
  const refreshRecords = async () => {
    try {
      const stored = await getAllCensoRecords();

      if (stored.length === 0) {
        // Se banco novo, insere amostras realistas de bairros do R7 para teste imediato
        const initialSamples: CensoRecord[] = [
          {
            id: 'censo_sample_1',
            matriculaEmbasa: '10928471',
            numeroOS: 'OS-2026-10482',
            zonaAbastecimento: 'ZA 23',
            bairro: 'Arenoso',
            logradouro: 'Rua Manoel Rufino',
            numeroPorta: '45',
            quadra: 'QD-02',
            lote: 'LT-01',
            complemento: 'Casa térrea, muro amarelo',
            coordenadas: { latitude: -12.952, longitude: -38.441, precisaoMetros: 3.5, timestamp: Date.now() },
            nomeCliente: 'Ana Lúcia dos Santos',
            cpfCnpj: '459.***.***-20',
            telefoneContato: '(71) 98822-4411',
            sexoResponsavel: 'FEMININO',
            faixaEtariaResponsavel: '25 a 49 anos',
            escolaridade: '4_A_7_ANOS',
            faixaRenda: '0_A_1_SM',
            numeroMoradores: 4,
            possuiCadUnicoBolsaFamilia: true,
            interesseTarifaSocial: true,
            tipoImovel: 'CASA',
            numeroPavimentos: 1,
            condicaoOcupacao: 'PROPRIO',
            tipoEsgotamento: 'REDE_PUBLICA',
            situacaoLigacao: 'ATIVA',
            numeroHidrometro: 'A23N849120',
            leituraAtualM3: 142,
            estadoHidrometro: 'NORMAL',
            estadoLacre: 'INTACTO',
            tipoAbrigo: 'PADRAO_EMBASA_MURO',
            tipoVazamento: 'NENHUM',
            observacaoTecnica: 'Cavalete padrão mureta em conformidade.',
            tentativaVisita: 1,
            statusVisita: 'REALIZADA_COM_CLIENTE',
            diaAlternativoVisita: false,
            fotoFachada: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%230284c7"/><text x="150" y="100" fill="white" font-size="16" text-anchor="middle" font-family="sans-serif">Fachada Arenoso %2345</text></svg>',
            fotoHidrometro: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%230369a1"/><text x="150" y="100" fill="white" font-size="16" text-anchor="middle" font-family="sans-serif">Visor: 00142 m3</text></svg>',
            solicitouNegociacaoDebito: false,
            registrouReclamacao: false,
            equipeCadastrista: 'Equipe 01 - Cabula',
            nomeCadastrista: 'Adelmo Ribeiro',
            criadoEm: Date.now() - 3600000 * 5,
            atualizadoEm: Date.now() - 3600000 * 5,
            syncStatus: 'synced',
            syncAttempts: 1,
            serverSyncedAt: Date.now() - 3600000 * 5,
          },
          {
            id: 'censo_sample_2',
            matriculaEmbasa: '20491823',
            numeroOS: 'OS-2026-10483',
            zonaAbastecimento: 'ZA 25',
            bairro: 'Cabula',
            logradouro: 'Rua Silveira Martins',
            numeroPorta: '312',
            quadra: 'QD-05',
            lote: 'LT-02',
            complemento: 'Próximo à UNEB',
            coordenadas: { latitude: -12.956, longitude: -38.469, precisaoMetros: 4.1, timestamp: Date.now() },
            nomeCliente: 'Carlos Alberto Cerqueira',
            cpfCnpj: '712.***.***-85',
            telefoneContato: '(71) 99192-3344',
            sexoResponsavel: 'MASCULINO',
            faixaEtariaResponsavel: '50 a 64 anos',
            escolaridade: '11_A_14_ANOS',
            faixaRenda: '1_A_3_SM',
            numeroMoradores: 3,
            possuiCadUnicoBolsaFamilia: false,
            interesseTarifaSocial: false,
            tipoImovel: 'CASA',
            numeroPavimentos: 2,
            condicaoOcupacao: 'PROPRIO',
            tipoEsgotamento: 'REDE_PUBLICA',
            situacaoLigacao: 'INATIVA',
            numeroHidrometro: 'A21N551209',
            leituraAtualM3: 88,
            estadoHidrometro: 'PARADO',
            estadoLacre: 'VIOLADO',
            tipoAbrigo: 'INTERNO',
            tipoVazamento: 'CAVALETE',
            observacaoTecnica: 'Ligação inativa com vazamento na conexão de entrada. Necessita troca de hidrômetro.',
            tentativaVisita: 2,
            statusVisita: 'REALIZADA_COM_CLIENTE',
            diaAlternativoVisita: false,
            fotoFachada: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%230f172a"/><text x="150" y="100" fill="white" font-size="16" text-anchor="middle" font-family="sans-serif">Fachada Cabula %23312</text></svg>',
            fotoHidrometro: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23b45309"/><text x="150" y="100" fill="white" font-size="16" text-anchor="middle" font-family="sans-serif">Lacre Violado / Parado</text></svg>',
            solicitouNegociacaoDebito: true,
            registrouReclamacao: false,
            equipeCadastrista: 'Equipe 02 - Cabula',
            nomeCadastrista: 'Marcos Vinicius',
            criadoEm: Date.now() - 3600000 * 2,
            atualizadoEm: Date.now() - 3600000 * 2,
            syncStatus: 'pending',
            syncAttempts: 0,
          },
          {
            id: 'censo_sample_3',
            matriculaEmbasa: 'NOVA-0092',
            numeroOS: 'OS-2026-10499',
            zonaAbastecimento: 'ZA 26',
            bairro: 'Pernambués',
            logradouro: 'Travessa Santa Efigênia',
            numeroPorta: '18',
            quadra: 'QD-01',
            lote: 'LT-04',
            complemento: 'Beco do Sossego',
            coordenadas: { latitude: -12.964, longitude: -38.468, precisaoMetros: 5.0, timestamp: Date.now() },
            nomeCliente: 'Valdete Santos de Jesus',
            cpfCnpj: '018.***.***-91',
            telefoneContato: '(71) 98711-9988',
            sexoResponsavel: 'FEMININO',
            faixaEtariaResponsavel: '20 a 49 anos',
            escolaridade: '4_A_7_ANOS',
            faixaRenda: '0_A_1_SM',
            numeroMoradores: 5,
            possuiCadUnicoBolsaFamilia: true,
            interesseTarifaSocial: true,
            tipoImovel: 'CASA',
            numeroPavimentos: 1,
            condicaoOcupacao: 'CEDIDO',
            tipoEsgotamento: 'FOSSA',
            situacaoLigacao: 'CLANDESTINA_GATO',
            numeroHidrometro: 'SEM_MEDIDOR',
            leituraAtualM3: 0,
            estadoHidrometro: 'SEM_HIDROMETRO',
            estadoLacre: 'SEM_LACRE',
            tipoAbrigo: 'SEM_ABRIGO',
            tipoVazamento: 'NENHUM',
            observacaoTecnica: 'Ligação não cadastrada direta na rede ("gato"). Família vulnerável inscrita no CadÚnico; solicitada regularização com Tarifa Social.',
            tentativaVisita: 1,
            statusVisita: 'REALIZADA_COM_CLIENTE',
            diaAlternativoVisita: false,
            fotoFachada: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23dc2626"/><text x="150" y="100" fill="white" font-size="16" text-anchor="middle" font-family="sans-serif">Ligação Clandestina</text></svg>',
            solicitouNegociacaoDebito: true,
            registrouReclamacao: false,
            equipeCadastrista: 'Equipe 03 - Pernambués',
            nomeCadastrista: 'Adelmo Ribeiro',
            criadoEm: Date.now() - 3600000 * 1,
            atualizadoEm: Date.now() - 3600000 * 1,
            syncStatus: 'pending',
            syncAttempts: 0,
          },
        ];

        for (const s of initialSamples) {
          await saveCensoRecord(s);
        }
        setRecords(initialSamples);
      } else {
        setRecords(stored);
      }
    } catch (err) {
      console.error('Erro ao ler registros:', err);
    }
  };

  useEffect(() => {
    refreshRecords();
    pushNotificationService.registrarServiceWorker();

    const unsubBackup = backupRedundancyService.subscribe((state) => {
      setRedundancyState(state);
      if (state.ultimoSnapshot && state.ultimoSnapshot.motivoGatilho === 'VOLUME_THRESHOLD') {
        const timeSince = Date.now() - state.ultimoSnapshot.timestamp;
        if (timeSince < 4000) {
          setNotification({
            message: `🛡️ Backup de Redundância Concluído! Grande volume de novos cadastros (+${state.ultimoSnapshot.volumeSincronizadoGatilho}) salvo em Cloud Storage e arquivo local.`,
            type: 'success',
          });
          setTimeout(() => setNotification(null), 6000);
        }
      }
    });

    // Verifica se a URL contém parâmetros de checkout/pagamento, cadastro web ou modo APK mobile
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('checkout') === 'true' || params.get('fatura') || params.get('plano')) {
        setIsPlanosModalOpen(true);
      }

      if (
        params.get('pix') === 'vendas' ||
        params.get('pix') === 'true' ||
        params.get('link_pix') === 'true' ||
        params.get('gerador_pix') === 'true'
      ) {
        setIsGeradorPixOpen(true);
      }
      
      // Link do Sistema Web - Cliente para criar o login no computador
      if (
        params.get('cadastro') === 'cliente' ||
        params.get('novo_cliente') === 'true' ||
        params.get('criar_login') === 'true'
      ) {
        setIsCadastroClienteOpen(true);
      }

      // Reconhecimento de IMEI e Ativação Anti-Fraude com chave
      const paramImei = params.get('ativar_imei');
      const paramChave = params.get('chave');
      if (paramImei && paramChave) {
        setActiveTab('mobile_colaborador');
        const resAtivacao = licenciamentoService.ativarPorLinkIMEI(paramChave, paramImei);
        if (resAtivacao.success) {
          setIsDispositivoAutorizado(true);
          setNotification({
            message: resAtivacao.message,
            type: 'success',
          });
        } else {
          setNotification({
            message: resAtivacao.message,
            type: 'warn',
          });
        }
      }

      // Detecção das 3 Versões Desmembradas (Web Master, Web Cliente, Mobile App)
      const versaoParam = params.get('versao') || params.get('modulo');
      const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const modoParam = params.get('modo');
      const isMobileRequest =
        versaoParam === 'mobile' ||
        modoParam === 'apk_mobile' ||
        params.get('download_apk') === 'true' ||
        params.get('download') === 'apk' ||
        params.get('app') === 'mobile' ||
        (isMobileDevice && modoParam !== 'web');

      if (versaoParam === 'master' || params.get('master') === 'true') {
        setVersaoAtiva('master');
        setActiveTab('clientes_master');
      } else if (isMobileRequest) {
        setVersaoAtiva('mobile');
        setActiveTab('mobile_colaborador');
        if (params.get('download_apk') === 'true' || params.get('download') === 'apk') {
          setNotification({
            message: '📲 AquaSane Mobile Ativo! Toque em "Instalar" para usar 100% offline em campo.',
            type: 'success',
          });
        }
      } else if (versaoParam === 'cliente' || modoParam === 'web') {
        setVersaoAtiva('cliente');
        setActiveTab('erp_empresa');
      }
    }

    // Inscreve no SyncManager para atualizar estado em tempo real
    const unsubscribe = syncManager.subscribe((state) => {
      setSyncState(state);
      refreshRecords();
    });

    // Inscreve no serviço de licenciamento de aparelhos
    const unsubLic = licenciamentoService.subscribe(() => {
      setIsDispositivoAutorizado(licenciamentoService.isDispositivoAutorizado());
    });

    // Inscreve no serviço de tenant/financeiro para conferir tolerância de 5 dias
    const unsubTenant = tenantService.subscribe(() => {
      setStatusFinanceiro(tenantService.verificarStatusFinanceiroELicenca());
    });

    return () => {
      unsubscribe();
      unsubLic();
      unsubTenant();
    };
  }, []);

  const handleSelecionarVersao = (novaVersao: VersaoSistema) => {
    setVersaoAtiva(novaVersao);
    if (novaVersao === 'master') {
      setActiveTab('clientes_master');
      setNotification({
        message: '👑 Módulo Web Master ativado (Uso Restrito Adriano Silva).',
        type: 'info',
      });
    } else if (novaVersao === 'mobile') {
      setActiveTab('mobile_colaborador');
      setNotification({
        message: '📱 Módulo Mobile ativado (Operação 100% Offline em Campo).',
        type: 'info',
      });
    } else {
      setActiveTab('erp_empresa');
      setNotification({
        message: '🏢 Módulo Web Cliente ativado (Gestão ERP, Planilhas & Relatórios).',
        type: 'info',
      });
    }
  };

  const handleBaixarExecutavelAtual = async () => {
    const baseUrl =
      typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
        ? window.location.origin
        : 'https://ais-dev-ngtjzalhi77e43bxamfamp-530667778944.us-west2.run.app';

    try {
      if (versaoAtiva === 'master') {
        await downloadExecutavelWebMaster(baseUrl);
        setNotification({
          message: '👑 Pacote Instalador Web Master (.bat / .zip) baixado com sucesso!',
          type: 'success',
        });
      } else if (versaoAtiva === 'cliente') {
        await downloadExecutavelWebCliente(baseUrl);
        setNotification({
          message: '🏢 Pacote Instalador Web Cliente ERP (.bat / .zip) baixado com sucesso!',
          type: 'success',
        });
      } else {
        await downloadExecutavelMobile(baseUrl);
        setNotification({
          message: '📱 Pacote Instalador Mobile APK (.apk) baixado com sucesso!',
          type: 'success',
        });
      }
    } catch (err: any) {
      setNotification({
        message: `Falha ao gerar executável: ${err?.message || 'Erro desconhecido'}`,
        type: 'warn',
      });
    }
  };

  const handleCensoCreated = (newRecord: CensoRecord) => {
    refreshRecords();
    setActiveTab('rotas_os');
    setPrefillOS(undefined);
    setPrefillData(undefined);
    setNotification({
      message: `Censo Matrícula ${newRecord.matriculaEmbasa} gravado com sucesso no aparelho!`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleManualSync = () => {
    syncManager.triggerAutomaticSync('Disparo manual pelo operador');
  };

  const handleToggleSimulatedOffline = () => {
    const nextState = !isSimulatingOffline;
    setIsSimulatingOffline(nextState);
    syncManager.setSimulationMode(nextState);
    setNotification({
      message: nextState
        ? 'Modo Offline Simulado ativado. Você pode coletar dados sem conexão!'
        : 'Conexão restabelecida! Sincronização automática iniciada.',
      type: nextState ? 'warn' : 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleIniciarCensoDeOS = (matricula: string, os: OrdemServicoSCIWeb) => {
    setPrefillOS(os);
    setPrefillData({
      matriculaEmbasa: matricula,
      numeroOS: os.numeroOSSCIWeb,
      logradouro: os.logradouro,
      numeroPorta: os.numeroPorta,
      quadra: os.quadra,
      lote: os.lote,
      bairro: os.bairro as any,
      nomeCliente: os.nomeConsumidorSCIWeb,
      numeroHidrometro: os.hidrometroCadastradoSCIWeb,
      coordenadas: {
        latitude: os.coordenadas.latitude,
        longitude: os.coordenadas.longitude,
        precisaoMetros: 3.5,
        timestamp: Date.now(),
      },
    });
    setActiveTab('form');
  };

  // Exportar backup completo dos dados físicos em JSON
  const handleExportBackup = async () => {
    try {
      const allRecords = await getAllCensoRecords();
      const backupPackage = {
        app: 'AquaSane Pro',
        exportDate: new Date().toISOString(),
        totalRecords: allRecords.length,
        records: allRecords,
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPackage, null, 2));
      const dl = document.createElement('a');
      dl.setAttribute('href', dataStr);
      dl.setAttribute('download', `AquaSanePro_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      dl.click();
      setNotification({ message: 'Backup salvo com sucesso no seu dispositivo!', type: 'success' });
      setTimeout(() => setNotification(null), 4000);
    } catch {
      setNotification({ message: 'Erro ao gerar backup de segurança.', type: 'warn' });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Se o aparelho celular não estiver com licença liberada e ativa por Adriano Silva, trava o acesso
  if (!isDispositivoAutorizado && !licenciamentoService.isMaster()) {
    return (
      <>
        <TelaAtivacaoLicenca
          onDispositivoAtivado={() => setIsDispositivoAutorizado(true)}
          onAbrirPainelMaster={() => setIsMasterModalOpen(true)}
        />
        <PainelLicenciamentoMasterModal
          isOpen={isMasterModalOpen}
          onClose={() => setIsMasterModalOpen(false)}
        />
      </>
    );
  }

  // Quando estiver no Modo Mobile (Android/iOS), renderiza diretamente a aplicação móvel nativa em tela cheia
  if (activeTab === 'mobile_colaborador') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Barra Superior de Desmembramento de Versões & Gerador de Executáveis */}
        <VersaoSwitcherBar
          versaoAtiva={versaoAtiva}
          onSelecionarVersao={handleSelecionarVersao}
          onAbrirModalExecutaveis={() => setIsExecutaveisModalOpen(true)}
        />

        {/* Barra de controle informativa para desktop quando estiver inspecionando o mobile */}
        <div className="hidden md:flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
          <span className="text-emerald-400 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AquaSane Mobile (Visualização de Campo) • No celular este aplicativo opera 100% offline via APK / PWA.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBaixarExecutavelAtual}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold transition cursor-pointer"
            >
              📥 Baixar APK Mobile (.apk)
            </button>
            <button
              type="button"
              onClick={() => handleSelecionarVersao('cliente')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg font-bold border border-slate-700 transition cursor-pointer"
            >
              ← Voltar ao Web Cliente (ERP)
            </button>
          </div>
        </div>

        <MobileColaboradorView
          onIniciarCensoMatricula={handleIniciarCensoDeOS}
        />

        {/* Modal de Desmembramento e Executáveis das 3 Versões */}
        <DesmembramentoExecutaveisModal
          isOpen={isExecutaveisModalOpen}
          onClose={() => setIsExecutaveisModalOpen(false)}
          onSelecionarVersao={handleSelecionarVersao}
        />

        {/* Modal de Central de Download e Instalação */}
        <CentralDownloadModal
          isOpen={isCentralDownloadOpen}
          onClose={() => setIsCentralDownloadOpen(false)}
          onRefreshRecords={refreshRecords}
        />

        {/* Modal de Vídeo Aulas */}
        <VideoAulasModal
          isOpen={isVideoAulasModalOpen}
          onClose={() => setIsVideoAulasModalOpen(false)}
        />

        {/* Notificação Flutuante */}
        {notification && (
          <div
            className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 border ${
              notification.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-500'
                : notification.type === 'warn'
                ? 'bg-amber-950 text-amber-100 border-amber-500'
                : 'bg-rose-950 text-rose-100 border-rose-500'
            }`}
          >
            <span>{notification.message}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-white/70 hover:text-white font-black ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-sky-200">
      {/* Barra Superior de Desmembramento de Versões & Gerador de Executáveis */}
      <VersaoSwitcherBar
        versaoAtiva={versaoAtiva}
        onSelecionarVersao={handleSelecionarVersao}
        onAbrirModalExecutaveis={() => setIsExecutaveisModalOpen(true)}
      />

      {/* Header Principal com seletor de perfil e abas integradas */}
      <Header
        syncState={syncState}
        onManualSync={handleManualSync}
        onOpenFila={() => setIsFilaModalOpen(true)}
        isSimulatingOffline={isSimulatingOffline}
        onToggleSimulatedOffline={handleToggleSimulatedOffline}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenCadernoTecnico={() => setIsCadernoTecnicoOpen(true)}
        onOpenLicenciamentoMaster={() => setIsMasterModalOpen(true)}
        onOpenCentralDownload={() => setIsCentralDownloadOpen(true)}
        onOpenPlanosAssinatura={() => setIsPlanosModalOpen(true)}
        onOpenVideoAulas={() => setIsVideoAulasModalOpen(true)}
        onOpenBancoDados={() => setIsBancoDadosModalOpen(true)}
        onOpenGeradorPix={() => setIsGeradorPixOpen(true)}
        versaoAtiva={versaoAtiva}
        onSelecionarVersao={handleSelecionarVersao}
        onAbrirModalExecutaveis={() => setIsExecutaveisModalOpen(true)}
        onBaixarExecutavelAtual={handleBaixarExecutavelAtual}
        statusFinanceiro={statusFinanceiro}
        recordsCount={records.length}
      />

      {/* Banner de Bloqueio por Inadimplência (> 5 dias de atraso - Regra Estrita) */}
      {statusFinanceiro.modoSomenteLeitura ? (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg border-b border-rose-700">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-rose-800 text-white flex items-center justify-center font-black text-xs shrink-0">
              ✕
            </span>
            <div>
              <span className="font-black uppercase tracking-wider text-rose-100">
                MODO SOMENTE LEITURA ATIVADO (INADIMPLÊNCIA &gt; 5 DIAS):
              </span>
              <span className="ml-1.5 font-normal text-rose-50">
                A licença deste cliente está vencida há <strong>{statusFinanceiro.diasAtraso} dias</strong>. Novas O.S. e alterações de dados estão suspensas até a compensação do pagamento.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPlanosModalOpen(true)}
            className="px-4 py-1.5 bg-white text-rose-700 hover:bg-rose-50 rounded-xl font-black text-xs transition cursor-pointer shadow-md shrink-0 whitespace-nowrap active:scale-98"
          >
            Regularizar Licença Agora
          </button>
        </div>
      ) : !statusFinanceiro.emDia ? (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md border-b border-amber-600">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-300 font-mono text-[10px] font-bold">
              TOLERÂNCIA LEGAL
            </span>
            <span>
              Fatura em atraso há {statusFinanceiro.diasAtraso} dia(s). Restam{' '}
              <strong>{statusFinanceiro.toleranciaRestante} dia(s)</strong> antes do bloqueio automático em modo somente leitura.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsPlanosModalOpen(true)}
            className="px-3 py-1 bg-slate-950 text-amber-300 hover:bg-slate-900 rounded-lg font-black text-xs transition cursor-pointer shadow shrink-0 whitespace-nowrap"
          >
            Pagar Licença
          </button>
        </div>
      ) : null}

      {/* Barra de Acesso e Link Fixado - Continuar de onde parou */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-3 sm:px-6 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-600/40 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SISTEMA SALVO • 100% ATIVO
            </span>
            <span className="font-semibold text-slate-300">
              Link de Acesso Fixado:
            </span>
            <span className="font-mono text-[11px] text-sky-300 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700 select-all max-w-[280px] sm:max-w-none truncate font-bold">
              {typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
                ? window.location.origin
                : 'https://ais-dev-ngtjzalhi77e43bxamfamp-530667778944.us-west2.run.app'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsVideoAulasModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-98"
              title="Central de Treinamento Oficial e Vídeo Aulas"
            >
              <span>🎓 Vídeo Aulas</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPlanosModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-98"
              title="Contratar Planos, Preços e Links de Pagamento"
            >
              <span>💳 Planos & Licenças</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCentralDownloadOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-98"
              title="Gerar APK para celular Android & iOS, instalar no aparelho ou baixar pacote .ZIP"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">APK / Celular</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const url = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
                  ? window.location.origin
                  : 'https://ais-dev-ngtjzalhi77e43bxamfamp-530667778944.us-west2.run.app';
                navigator.clipboard.writeText(url);
                setNotification({ message: 'Link ativo copiado! Guarde este link para acessar de onde parou sem erro 404.', type: 'success' });
                setTimeout(() => setNotification(null), 4000);
              }}
              className="px-2.5 py-1 rounded-lg bg-sky-700 hover:bg-sky-600 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="Copiar link ativo para acessar de onde parou"
            >
              <Copy className="w-3 h-3" />
              <span className="hidden sm:inline">Copiar Link</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCentralDownloadOpen(true)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="Abrir QR Code para celular"
            >
              <QrCode className="w-3 h-3 text-sky-400" />
              <span className="hidden sm:inline">QR Code</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileFramed(!isMobileFramed)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold hidden lg:flex items-center gap-1 transition cursor-pointer ${
                isMobileFramed
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title="Alternar entre simulação de tela de celular e tela cheia"
            >
              <Smartphone className="w-3 h-3" />
              <span>{isMobileFramed ? 'Modo Smartphone Ativo' : 'Simular Celular'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBackupRedundanciaModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-[11px] hidden md:flex items-center gap-1.5 transition cursor-pointer hover:border-sky-500/40"
              title="Central de Redundância e Backup Automático (Cloud Storage & Download Local)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Redundância & Backup</span>
              {redundancyState.config.enabled && (
                <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {redundancyState.registrosSincronizadosDesdeUltimoBackup}/{redundancyState.config.triggerVolumeThreshold}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Conexão e Sincronização em Background */}
      <OfflineBanner
        syncState={syncState}
        onManualSync={handleManualSync}
        onOpenFila={() => setIsFilaModalOpen(true)}
        isSimulatedOffline={isSimulatingOffline}
        onToggleOfflineSimulation={handleToggleSimulatedOffline}
      />

      {/* Alerta / Toast Temporário */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full mt-3">
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs border ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : notification.type === 'warn'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-sky-50 text-sky-900 border-sky-300'
            }`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-xs opacity-70 hover:opacity-100 px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal de acordo com a aba selecionada */}
      <main className={`flex-1 mx-auto px-2 sm:px-6 py-4 sm:py-5 w-full pb-20 md:pb-6 transition-all ${
        isMobileFramed
          ? 'max-w-md bg-white sm:my-6 sm:p-4 sm:rounded-3xl sm:border-4 sm:border-slate-800 sm:shadow-2xl'
          : 'max-w-7xl'
      }`}>
        {/* Painel Master de Gerenciamento de Clientes & Bases (Adriano Silva) */}
        {activeTab === 'clientes_master' && (
          <MasterClientesView />
        )}

        {/* Aplicativo Mobile Fluido do Colaborador de Campo */}
        {activeTab === 'mobile_colaborador' && (
          <MobileColaboradorView
            onIniciarCensoMatricula={handleIniciarCensoDeOS}
          />
        )}

        {/* Sistema ERP Completo - Cadastro da Empresa, Setores, Funcionários e Equipes */}
        {activeTab === 'erp_empresa' && (
          <SistemaERPView />
        )}

        {/* Rota de Ordens de Serviço Programadas (OS) */}
        {activeTab === 'rotas_os' && (
          <RotasOSView
            onIniciarCensoMatricula={handleIniciarCensoDeOS}
            onAbrirUploadPlanilha={() => setActiveTab('upload_excel')}
          />
        )}

        {/* Upload de Planilha Excel & Programação por Ordem Estrita */}
        {activeTab === 'upload_excel' && (
          <UploadPlanilhaExcelView onIrParaRotasOS={() => setActiveTab('rotas_os')} />
        )}

        {/* Cadastros de Funcionários & Direitos de Uso do Sistema */}
        {activeTab === 'funcionarios' && (
          <GestaoFuncionariosView />
        )}

        {/* Formulário de Censo com Morador & Fotos */}
        {activeTab === 'form' && (
          <CensoForm
            onCensoCreated={handleCensoCreated}
            onCancel={() => setActiveTab('rotas_os')}
            onNavigateToConfig={() => setActiveTab('contrato')}
            prefillData={prefillData}
            prefillOS={prefillOS}
          />
        )}

        {/* Validação de Dados Prévia antes do envio à Concessionária */}
        {activeTab === 'validacao' && (
          <ValidacaoEmbasaView onValidarCenso={() => refreshRecords()} />
        )}

        {/* Relatórios de Produtividade dos Colaboradores */}
        {activeTab === 'produtividade' && <RelatorioProdutividadeView />}

        {/* Lista de Ligações Cadastradas */}
        {activeTab === 'list' && (
          <CensoList
            records={records}
            onAddNew={() => {
              setPrefillOS(undefined);
              setPrefillData(undefined);
              setActiveTab('form');
            }}
            onSelectRecord={(r) => setSelectedRecord(r)}
          />
        )}

        {/* Mapa Cartográfico GIS */}
        {activeTab === 'map' && (
          <MapGISView
            records={records}
            onSelectRecord={(r) => setSelectedRecord(r)}
          />
        )}

        {/* Painel de Supervisão e Metas R7 */}
        {activeTab === 'supervisao' && (
          <SupervisaoDashboard
            records={records}
            syncState={syncState}
            onExportBackup={handleExportBackup}
          />
        )}

        {/* Gerenciamento dos 38 Campos do Contrato */}
        {activeTab === 'contrato' && <ConfigContratoView />}

        {/* Módulo Social de Negociação & Tarifa Social */}
        {activeTab === 'negociacao' && <NegociacaoView />}

        {/* Ouvidoria e Reclamações de Obra (SLA 48h) */}
        {activeTab === 'reclamacoes' && <ReclamacoesView />}
      </main>

      {/* Modal de Detalhe de Censo */}
      <CensoDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      {/* Modal de Login & Perfis de Usuário */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          setNotification({
            message: `Perfil alterado para ${user.nome} (${user.perfil.replace(/_/g, ' ')})`,
            type: 'info',
          });
          setTimeout(() => setNotification(null), 4000);
        }}
      />

      {/* Modal de Caderno Técnico PGCSA */}
      <CadernoTecnicoModal
        isOpen={isCadernoTecnicoOpen}
        onClose={() => setIsCadernoTecnicoOpen(false)}
      />

      {/* Modal de Criação de Login do Cliente Web */}
      <CadastroClienteWebModal
        isOpen={isCadastroClienteOpen}
        onClose={() => setIsCadastroClienteOpen(false)}
        onSucesso={(user) => {
          setIsCadastroClienteOpen(false);
          setNotification({
            message: `🎉 Bem-vindo(a) ao AquaSane Pro, ${user.nome}! Seu login de Administrador foi configurado com sucesso.`,
            type: 'success',
          });
          setTimeout(() => setNotification(null), 6000);
        }}
      />

      {/* Painel Master de Licenciamento Comercial (Adriano Silva) */}
      <PainelLicenciamentoMasterModal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
      />

      {/* Modal de Desmembramento e Executáveis das 3 Versões */}
      <DesmembramentoExecutaveisModal
        isOpen={isExecutaveisModalOpen}
        onClose={() => setIsExecutaveisModalOpen(false)}
        onSelecionarVersao={handleSelecionarVersao}
      />

      {/* Central Mobile de Download, Links & Lojas (Google Play & App Store) */}
      <CentralDownloadModal
        isOpen={isCentralDownloadOpen}
        onClose={() => setIsCentralDownloadOpen(false)}
        onRefreshRecords={refreshRecords}
      />

      {/* Modal de Contratação de Planos, Licenças e Checkout Instantâneo */}
      <ContratacaoPlanosModal
        isOpen={isPlanosModalOpen}
        onClose={() => setIsPlanosModalOpen(false)}
        onPagamentoConfirmado={() => {
          setStatusFinanceiro(tenantService.verificarStatusFinanceiroELicenca());
          setNotification({
            message: 'Pagamento confirmado com sucesso! Licença de 30 dias renovada e banco de dados liberado.',
            type: 'success',
          });
          setTimeout(() => setNotification(null), 5000);
        }}
      />

      {/* Modal Gerador de Links de Pagamento PIX Oficial para Vendas Online */}
      <GeradorLinkPixModal
        isOpen={isGeradorPixOpen}
        onClose={() => setIsGeradorPixOpen(false)}
      />

      {/* Modal de Vídeo Aulas e Capacitação Técnica Completa */}
      <VideoAulasModal
        isOpen={isVideoAulasModalOpen}
        onClose={() => setIsVideoAulasModalOpen(false)}
        onNavegarParaFuncao={(tab) => setActiveTab(tab)}
      />

      {/* Gerenciador de Banco de Dados de Alta Capacidade (+200.000 Matrículas por Base) */}
      {isBancoDadosModalOpen && (
        <BancoDadosGerenciadorModal
          onClose={() => {
            setIsBancoDadosModalOpen(false);
            refreshRecords();
          }}
        />
      )}

      {/* Modal do Sistema de Filas Prioritárias (syncManager) */}
      <FilaSincronizacaoModal
        isOpen={isFilaModalOpen}
        onClose={() => setIsFilaModalOpen(false)}
        onItemPriorizado={() => refreshRecords()}
      />

      {/* Central de Redundância e Backup Automático (Cloud Storage / Download Local) */}
      <CentralBackupRedundanciaModal
        isOpen={isBackupRedundanciaModalOpen}
        onClose={() => setIsBackupRedundanciaModalOpen(false)}
        onDadosRestaurados={() => refreshRecords()}
      />

      {/* Rodapé Institucional do Sistema */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 text-slate-500 text-xs mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-bold text-sky-900">AquaSane Pro</span>
            <span>—</span>
            <span className="text-slate-700">Plataforma Universal de Saneamento & Censo Móvel</span>
            <span>•</span>
            <span className="text-slate-500">Universal para Concessionárias, Autarquias e Prestadoras de Serviços</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <button
              onClick={() => setIsCentralDownloadOpen(true)}
              className="font-bold text-sky-700 hover:text-sky-900 underline flex items-center gap-1 cursor-pointer"
            >
              Baixar App Mobile / Links
            </button>
            <span>•</span>
            <span>Offline-First (PWA)</span>
            <span>•</span>
            <span>Licença por Celular</span>
          </div>
        </div>
      </footer>

      {/* Barra de Navegação Inferior Ergonômica para Celular Android & iOS */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenMoreMenu={() => setIsCentralDownloadOpen(true)}
        onOpenCentralDownload={() => setIsCentralDownloadOpen(true)}
        recordsCount={records.length}
      />
    </div>
  );
}
