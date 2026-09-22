import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Smartphone,
  DownloadCloud,
  QrCode,
  Copy,
  ExternalLink,
  CheckCircle2,
  Apple,
  Store,
  ShieldCheck,
  Globe,
  Check,
  FileText,
  Save,
  Download,
  Database,
  AlertTriangle,
  Info,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  Package,
  HardDrive,
  Send,
  Building2,
  CheckCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { getAllCensoRecords, getDraftCenso } from '../services/db';
import { contractSchemaService } from '../services/contractSchemaService';
import {
  generateAndroidAPKPackage,
  generateAppleMobileConfig,
  generateStandaloneInstallerHtml,
  generateDirectAPKFile
} from '../services/apkPackageService';

interface CentralDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshRecords?: () => void;
}

export const CentralDownloadModal: React.FC<CentralDownloadModalProps> = ({
  isOpen,
  onClose,
  onRefreshRecords,
}) => {
  const [abaAtiva, setAbaAtiva] = useState<'gerar_apk' | 'enviar_empresa' | 'links_qr' | 'salvar_backup' | 'instalacao_celular' | 'publicacao_lojas'>('gerar_apk');
  const [copiadoAtivo, setCopiadoAtivo] = useState(false);
  const [copiadoShared, setCopiadoShared] = useState(false);
  const [copiadoMetadados, setCopiadoMetadados] = useState(false);
  const [copiadoEmpresa, setCopiadoEmpresa] = useState(false);
  const [salvamentoFeedback, setSalvamentoFeedback] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [abaPlataforma, setAbaPlataforma] = useState<'android' | 'ios'>('android');
  const [qrUrlType, setQrUrlType] = useState<'apk' | 'web' | 'shared'>('apk');
  const [selectedDomain, setSelectedDomain] = useState<'active' | 'shared'>('active');
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeLiveUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://ais-dev-ngtjzalhi77e43bxamfamp-530667778944.us-west2.run.app';
  const sharedUrl = 'https://ais-pre-ngtjzalhi77e43bxamfamp-530667778944.us-west2.run.app';

  const currentBaseUrl = selectedDomain === 'active' ? activeLiveUrl : sharedUrl;
  const linkSistemaWebCliente = `${currentBaseUrl}/?modo=web&cadastro=cliente`;
  // Link limpo para abrir o sistema mobile instantaneamente sem bloqueio de download pelo Chrome no Android
  const linkAPKMobileCliente = `${currentBaseUrl}/?modo=apk_mobile`;
  const linkDownloadDiretoAPK = `${currentBaseUrl}/?modo=apk_mobile&download_apk=true`;

  // Renderizar QR Code no Canvas apontando para o link correto (por padrão para o APK Mobile!)
  const urlParaQRCode =
    qrUrlType === 'apk'
      ? linkAPKMobileCliente
      : qrUrlType === 'web'
      ? linkSistemaWebCliente
      : `${sharedUrl}/?modo=apk_mobile`;

  // Hook do PWA
  const { isInstallable, install } = usePWAInstall();

  // Carregar status do banco local
  useEffect(() => {
    async function checkStorage() {
      try {
        const records = await getAllCensoRecords();
        setTotalRecords(records.length);
        const draft = await getDraftCenso();
        setHasDraft(Boolean(draft && draft.matriculaEmbasa));
      } catch (err) {
        console.error('Erro ao verificar banco local:', err);
      }
    }
    if (isOpen) {
      checkStorage();
    }
  }, [isOpen]);

  useEffect(() => {
    if ((abaAtiva === 'links_qr' || abaAtiva === 'gerar_apk') && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        urlParaQRCode,
        {
          width: 190,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Erro ao renderizar QR Code:', error);
        }
      );
    }
  }, [abaAtiva, urlParaQRCode]);

  const handleCopiarAtivo = () => {
    navigator.clipboard.writeText(activeLiveUrl);
    setCopiadoAtivo(true);
    setTimeout(() => setCopiadoAtivo(false), 3000);
  };

  const handleCopiarShared = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopiadoShared(true);
    setTimeout(() => setCopiadoShared(false), 3000);
  };

  // Baixar Arquivo .APK Direto (application/vnd.android.package-archive)
  const handleBaixarDiretoAPK = async () => {
    try {
      setIsGeneratingZip(true);
      const apkBlob = await generateDirectAPKFile(activeLiveUrl);
      const url = URL.createObjectURL(apkBlob);
      const dl = document.createElement('a');
      dl.href = url;
      dl.download = `AquaSanePro_Offline.apk`;
      dl.click();
      URL.revokeObjectURL(url);
      setSalvamentoFeedback('📲 Arquivo .APK baixado com sucesso! Abra no seu celular para instalar.');
      setTimeout(() => setSalvamentoFeedback(null), 6000);
    } catch (err: any) {
      setSalvamentoFeedback(`Erro ao gerar APK: ${err?.message || 'Falha ao empacotar'}`);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // Baixar Pacote APK / Android Studio (.ZIP)
  const handleBaixarPacoteAPK = async () => {
    try {
      setIsGeneratingZip(true);
      const zipBlob = await generateAndroidAPKPackage(activeLiveUrl);
      const url = URL.createObjectURL(zipBlob);
      const dl = document.createElement('a');
      dl.href = url;
      dl.download = `AquaSanePro_Pacote_APK_Android_${new Date().toISOString().slice(0, 10)}.zip`;
      dl.click();
      URL.revokeObjectURL(url);
      setSalvamentoFeedback('📦 Pacote Android APK baixado! Contém AndroidManifest.xml, configurações do app e banco de dados offline.');
      setTimeout(() => setSalvamentoFeedback(null), 6000);
    } catch (err: any) {
      setSalvamentoFeedback(`Erro ao gerar pacote: ${err?.message || 'Falha ao empacotar'}`);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // Baixar Instalador Perfil Apple iOS (.mobileconfig - 2 Cliques)
  const handleBaixarInstaladorIOS = () => {
    try {
      const blob = generateAppleMobileConfig(activeLiveUrl);
      const url = URL.createObjectURL(blob);
      const dl = document.createElement('a');
      dl.href = url;
      dl.download = `AquaSanePro_Instalador_iOS.mobileconfig`;
      dl.click();
      URL.revokeObjectURL(url);
      setSalvamentoFeedback('🍏 Perfil iOS baixado! Abra no iPhone em Ajustes ➔ Perfil Baixado ➔ Instalar (2 cliques).');
      setTimeout(() => setSalvamentoFeedback(null), 6000);
    } catch (err: any) {
      setSalvamentoFeedback(`Erro ao gerar perfil iOS: ${err?.message || 'Falha ao gerar perfil'}`);
    }
  };

  // Baixar Instalador Autônomo 2 Cliques (.html)
  const handleBaixarInstaladorAndroid = () => {
    try {
      const blob = generateStandaloneInstallerHtml(activeLiveUrl);
      const url = URL.createObjectURL(blob);
      const dl = document.createElement('a');
      dl.href = url;
      dl.download = `Instalador_2Cliques_AquaSanePro.html`;
      dl.click();
      URL.revokeObjectURL(url);
      setSalvamentoFeedback('📱 Instalador 2 Cliques baixado! Basta abrir no celular ou enviar para a equipe.');
      setTimeout(() => setSalvamentoFeedback(null), 6000);
    } catch (err: any) {
      setSalvamentoFeedback(`Erro ao gerar instalador: ${err?.message || 'Falha ao gerar instalador'}`);
    }
  };

  const mensagemEmpresaCompradora = `*AQUASANE PRO - SISTEMA DE CENSO E SANEAMENTO MÓVEL 100% OFFLINE*
Prezados(as),

Seguem os links oficiais homologados para contratos de saneamento, censo cadastral de água/esgoto, rotas de OSs e auditoria comercial pré-envio:

💻 *Link Sistema Web - Cliente (Computador):*
${linkSistemaWebCliente}
👉 _Basta abrir este link no computador para criar seu login de Administrador da empresa e acessar imediatamente o painel._

📲 *Link APK Mobile - Cliente (para baixar e instalar no celular):*
${linkAPKMobileCliente}
👉 _Abra este link no celular para baixar o APK Android oficial 100% offline._

🔒 *Licença do Celular com Reconhecimento de IMEI (Anti-Fraude - R$ 99,00):*
O aplicativo móvel possui reconhecimento automático do IMEI físico do aparelho, garantindo que a licença seja ativada exclusivamente no dispositivo autorizado e impossibilitando o compartilhamento indevido de licenças.

📱 *COMO INSTALAR NO SMARTPHONE DOS CADASTRISTAS (EM 2 CLIQUES):*
• *Android:* Abra o Link APK Mobile no Google Chrome do celular e clique em "Instalar Aplicativo" no topo ou no menu ⋮ do Chrome ➔ "Instalar aplicativo". O app é instalado direto na tela inicial.
• *iPhone (iOS):* Abra o link no Safari, toque no botão de Compartilhar (quadrado com seta) ➔ "Adicionar à Tela de Início".

⚡ *PRINCIPAIS RECURSOS DO SISTEMA:*
✅ Funcionamento 100% Offline (banco de dados IndexedDB no celular, não perde dados mesmo sem internet)
✅ 38 Campos Contratuais Parametrizáveis com Auditoria Técnica Pré-Envio
✅ Sequenciamento de Rotas de O.S. e Importação Direta de Planilhas Excel (.xlsx)
✅ Radar GPS de Proximidade e Demarcação Cartográfica de Lotes
✅ Cadastro de Colaboradores e Matriz de Direitos de Uso (RBAC)
✅ Central de Licenciamento Criptográfico por IMEI do Aparelho

Contato Comercial / Suporte:
📧 adrianosilva1983oficial@gmail.com`;

  const handleCopiarMensagemEmpresa = () => {
    navigator.clipboard.writeText(mensagemEmpresaCompradora);
    setCopiadoEmpresa(true);
    setTimeout(() => setCopiadoEmpresa(false), 3000);
  };

  // Salvar tudo imediatamente e criar ponto de restauração
  const handleSalvarTudoAgora = async () => {
    try {
      const records = await getAllCensoRecords();
      const fields = await contractSchemaService.getContractFields();
      localStorage.setItem('aquasane_last_saved_timestamp', Date.now().toString());
      localStorage.setItem('aquasane_snapshot_records_count', records.length.toString());
      
      setSalvamentoFeedback(`✅ Ponto de restauração fixado! ${records.length} cadastros e ${fields.length} campos de censo salvos com segurança.`);
      if (onRefreshRecords) onRefreshRecords();
      setTimeout(() => setSalvamentoFeedback(null), 5000);
    } catch (err: any) {
      setSalvamentoFeedback(`Erro ao salvar ponto: ${err?.message || 'Falha ao gravar'}`);
    }
  };

  // Baixar Backup Físico Completo (.json)
  const handleBaixarBackupCompleto = async () => {
    try {
      const records = await getAllCensoRecords();
      const contractFields = await contractSchemaService.getContractFields();
      const draft = await getDraftCenso();

      const backupPackage = {
        app: 'AquaSane Pro',
        exportDate: new Date().toISOString(),
        liveAccessUrl: activeLiveUrl,
        totalRecords: records.length,
        records,
        contractFields,
        draft,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPackage, null, 2));
      const dl = document.createElement('a');
      dl.setAttribute('href', dataStr);
      dl.setAttribute('download', `AquaSanePro_Backup_Completo_${new Date().toISOString().slice(0, 10)}.json`);
      dl.click();

      setSalvamentoFeedback('📥 Arquivo de backup (.json) baixado com sucesso no seu dispositivo!');
      setTimeout(() => setSalvamentoFeedback(null), 5000);
    } catch (err: any) {
      setSalvamentoFeedback(`Erro ao gerar backup: ${err?.message || 'Falha na exportação'}`);
    }
  };

  const metadadosTexto = `=====================================================
FICHA DE PUBLICAÇÃO DO APLICATIVO NAS LOJAS
=====================================================
NOME COMERCIAL: AquaSane Pro - Censo & Saneamento Móvel
NOME CURTO: AquaSane Pro
CATEGORIA: Produtividade / Negócios / Ferramentas Comerciais
DESENVOLVEDOR / PROPRIETÁRIO: Adriano Silva (adrianosilva1983oficial@gmail.com)

DESCRIÇÃO CURTA (Até 80 caracteres):
Censo cadastral, atualização comercial e ordens de serviço offline em saneamento.

DESCRIÇÃO COMPLETA:
O AquaSane Pro é a solução móvel corporativa definitiva para equipes de campo em saneamento básico, abastecimento de água e redes de esgotamento sanitário (desenhado para concessionárias públicas, autarquias municipais e prestadoras de serviços terceirizadas).

Destaques e Recursos:
- Operação 100% Offline: Registre censos, fotos de hidrômetros, fachadas e ocorrências sem depender de sinal de internet.
- Navegação GPS e Lotes Crescentes: Sequenciamento automático porta a porta para maximizar a produtividade diária dos cadastristas.
- Validador Comercial e Pré-Auditoria: Verificação em tempo real de dígitos de hidrômetro, matrículas e anomalias de faturamento.
- Gestão de Ordens de Serviço: Carga e baixa imediata de O.S. com espelhamento digital em lote.
- Licenciamento Criptográfico por Celular: Segurança comercial e controle individualizado por smartphone do operador.
- Sincronização Inteligente com Prevenção de Perda de Dados: Fila local segura em IndexedDB/LocalStorage.

PALAVRAS-CHAVE (ASO / Busca):
saneamento, censo agua, hidrometro, cadastro comercial, ordem de servico, aquasane pro, saneamento basico, agua e esgoto, coletor offline, vistoria tecnica.
=====================================================`;

  const handleCopiarMetadados = () => {
    navigator.clipboard.writeText(metadadosTexto);
    setCopiadoMetadados(true);
    setTimeout(() => setCopiadoMetadados(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  AquaSane Pro • APK & Banco Offline Mobile
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Android & iOS 100% Offline
                </span>
              </div>
              <p className="text-xs text-sky-200/90 mt-0.5">
                Execução nativa no smartphone com banco de dados IndexedDB local e sem dependência de internet.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-2 sm:px-5 pt-2 shrink-0 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setAbaAtiva('gerar_apk')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              abaAtiva === 'gerar_apk'
                ? 'border-emerald-600 text-emerald-700 bg-white/80 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-600" />
            <span>📱 Baixar App • 2 Cliques</span>
          </button>

          <button
            onClick={() => setAbaAtiva('enviar_empresa')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              abaAtiva === 'enviar_empresa'
                ? 'border-indigo-600 text-indigo-700 bg-white/80 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>🏢 Link Web & Enviar p/ Empresa</span>
          </button>

          <button
            onClick={() => setAbaAtiva('links_qr')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              abaAtiva === 'links_qr'
                ? 'border-sky-600 text-sky-700 bg-white/80 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4 text-sky-600" />
            <span>Links & QR Code</span>
          </button>

          <button
            onClick={() => setAbaAtiva('salvar_backup')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              abaAtiva === 'salvar_backup'
                ? 'border-sky-600 text-sky-700 bg-white/80 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-slate-600" />
            <span>Banco Offline ({totalRecords})</span>
          </button>

          <button
            onClick={() => setAbaAtiva('instalacao_celular')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              abaAtiva === 'instalacao_celular'
                ? 'border-sky-600 text-sky-700 bg-white/80 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DownloadCloud className="w-4 h-4 text-sky-600" />
            <span>Manual Celular</span>
          </button>

          <button
            onClick={() => setAbaAtiva('publicacao_lojas')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              abaAtiva === 'publicacao_lojas'
                ? 'border-amber-600 text-amber-700 bg-white/80 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-4 h-4 text-amber-600" />
            <span>Google Play & Apple</span>
          </button>
        </div>

        {/* Notificação / Feedback de Salvamento */}
        {salvamentoFeedback && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between">
            <span>{salvamentoFeedback}</span>
            <button onClick={() => setSalvamentoFeedback(null)} className="text-emerald-700 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Conteúdo das Abas */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-slate-700 text-xs">
          
          {/* ================= ABA 0: GERAR APK & CELULAR ================= */}
          {abaAtiva === 'gerar_apk' && (
            <div className="space-y-4">
              
              {/* Destaque do Modo Celular & Banco Offline */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-sky-950 text-white space-y-2 border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">
                      Aplicativo Instalável em 2 Cliques (Android & iOS)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    100% Offline • IndexedDB Local
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O AquaSane Pro salva <strong>todas as fotos de hidrômetro, coordenadas GPS, cadastros de moradores e rotas O.S. diretamente no banco IndexedDB do celular</strong>. Os cadastristas trabalham em áreas sem sinal de internet e nada é perdido.
                </p>
              </div>

              {/* Grid Principal: Android (2 Cliques) vs Apple iOS (2 Cliques) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* CARD ANDROID */}
                <div className="p-4 rounded-2xl bg-emerald-50/80 border-2 border-emerald-500 flex flex-col justify-between space-y-3 shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider">
                        Android (Samsung, Xiaomi, Motorola)
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs mt-2">
                      Instalador 2 Cliques para Android (WebAPK)
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                      Instala nativamente no Android com ícone oficial, tela cheia, permissões de GPS/Câmera e banco de dados offline autônomo.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    {isInstallable ? (
                      <button
                        type="button"
                        onClick={install}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition cursor-pointer active:scale-98"
                      >
                        <DownloadCloud className="w-4 h-4" />
                        <span>1 Toque: Instalar App no Android Agora</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleBaixarInstaladorAndroid}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition cursor-pointer active:scale-98"
                      >
                        <Download className="w-4 h-4" />
                        <span>Baixar Instalador 2 Cliques (.html)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleBaixarDiretoAPK}
                      disabled={isGeneratingZip}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition cursor-pointer active:scale-98 text-xs"
                    >
                      <DownloadCloud className="w-4 h-4 text-white" />
                      <span>⬇️ Baixar Arquivo .APK Direto no Celular</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBaixarPacoteAPK}
                      disabled={isGeneratingZip}
                      className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-100/70 text-emerald-900 border border-emerald-300 font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 text-xs"
                    >
                      <Package className={`w-4 h-4 ${isGeneratingZip ? 'animate-bounce' : 'text-emerald-700'}`} />
                      <span>{isGeneratingZip ? 'Gerando Pacote...' : 'Baixar Pacote Completo Android (.ZIP)'}</span>
                    </button>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-emerald-200 text-[10px] text-emerald-950 font-medium">
                    💡 <strong>Como instalar no Android:</strong> Basta abrir o link no Google Chrome, tocar nos <strong>3 pontinhos (⋮)</strong> e selecionar <strong>"Instalar aplicativo"</strong>.
                  </div>
                </div>

                {/* CARD APPLE IOS */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white border-2 border-slate-700 flex flex-col justify-between space-y-3 shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300 text-[10px] font-bold uppercase tracking-wider border border-slate-700">
                        Apple iOS (iPhone & iPad)
                      </span>
                      <Apple className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-bold text-white text-xs mt-2">
                      Instalador 2 Cliques para Apple iOS
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                      A Apple não usa arquivos .apk. Você pode baixar o <strong>Perfil de Configuração Oficial Apple (.mobileconfig)</strong> ou adicionar à tela inicial via Safari em 2 toques.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleBaixarInstaladorIOS}
                      className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition cursor-pointer active:scale-98"
                    >
                      <Download className="w-4 h-4" />
                      <span>Baixar Perfil Apple iOS (.mobileconfig)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAbaAtiva('instalacao_celular')}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 text-xs"
                    >
                      <Apple className="w-4 h-4 text-slate-400" />
                      <span>Ver Passo a Passo Safari (2 Toques)</span>
                    </button>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-[10px] text-slate-300 font-medium">
                    🍏 <strong>Como instalar no iPhone:</strong> No <strong>Safari</strong>, toque no botão <strong>Compartilhar (quadrado com seta)</strong> ➔ <strong>"Adicionar à Tela de Início"</strong>.
                  </div>
                </div>

              </div>

              {/* Status do Banco de Dados Offline */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Banco de Dados IndexedDB:</strong> {totalRecords} censos salvos localmente • 38 campos contratuais ativos
                  </span>
                </div>
                <button
                  onClick={handleSalvarTudoAgora}
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold text-[11px] hover:bg-emerald-800 transition cursor-pointer"
                >
                  Salvar Ponto Agora
                </button>
              </div>

            </div>
          )}

          {/* ================= ABA: ENVIAR PARA EMPRESA COMPRADORA ================= */}
          {abaAtiva === 'enviar_empresa' && (
            <div className="space-y-4">
              
              {/* Header de Apresentação Comercial */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-sky-950 text-white space-y-2 border border-indigo-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-sm text-white">
                      Link do Sistema & Proposta para a Empresa Compradora
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                    Pronto para Venda & Demonstração
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Copie o link oficial ou a mensagem formatada completa abaixo para enviar por <strong>WhatsApp ou E-mail</strong> para a concessionária ou prestadora que for comprar o sistema.
                </p>
              </div>

              {/* Card do Link Web Oficial para Envio */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border-2 border-indigo-400 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-700 text-white font-bold text-[11px]">
                    <Globe className="w-3.5 h-3.5" /> Link Oficial do Sistema Web (Acesso Imediato)
                  </span>
                  <span className="text-indigo-800 font-bold text-[10px]">Homologado</span>
                </div>

                <div className="font-mono text-xs text-indigo-950 font-bold p-3 bg-white rounded-xl border border-indigo-200 break-all select-all shadow-inner">
                  {activeLiveUrl}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopiarAtivo}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-98"
                  >
                    {copiadoAtivo ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiadoAtivo ? 'Link Copiado com Sucesso!' : 'Copiar Link Web Direto'}</span>
                  </button>

                  <a
                    href={activeLiveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-600" />
                    <span>Testar Link</span>
                  </a>
                </div>
              </div>

              {/* Card da Mensagem Completa Formatada para Envio */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-slate-900 text-xs">
                      Mensagem Completa para WhatsApp / E-mail da Empresa
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopiarMensagemEmpresa}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    {copiadoEmpresa ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoEmpresa ? 'Mensagem Copiada!' : 'Copiar Mensagem Completa'}</span>
                  </button>
                </div>

                <pre className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {mensagemEmpresaCompradora}
                </pre>
              </div>

              {/* Credenciais Demonstrativas dos Perfis de Acesso */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5">
                <strong className="block text-xs font-bold text-amber-900">
                  🔐 Perfis de Acesso Pré-Configurados para Demonstração:
                </strong>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-amber-200">
                    <strong>1. Cadastrista de Campo:</strong> Coleta com fotos, GPS, radar de rotas e rascunho offline.
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-amber-200">
                    <strong>2. Validador Comercial:</strong> Mesa técnica, checklist dos 38 campos e auditoria.
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-amber-200">
                    <strong>3. Supervisor Geral:</strong> Gráficos de produtividade, metas e SLA de 48h.
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-amber-200">
                    <strong>4. Administrador:</strong> Gestão de funcionários, matriz de direitos e upload Excel.
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= ABA 1: LINKS & QR CODE ================= */}
          {abaAtiva === 'links_qr' && (
            <div className="space-y-4">
              
              {/* Alerta de Diagnóstico do Erro 404 */}
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong className="block text-amber-950 font-bold mb-0.5">
                    Por que ocorreu "404 Page not found" no link anterior?
                  </strong>
                  O link de compartilhamento externo (<em>ais-pre-...</em>) só responde na internet quando o botão <strong>"Share"</strong> (Compartilhar) é clicado no Google AI Studio. 
                  Para acessar <strong>imediatamente sem nenhum erro 404</strong> no seu celular ou computador, use o <strong>Link Principal Ativo</strong> abaixo!
                </div>
              </div>

              {/* SELETOR DE DOMÍNIO ATIVO VS COMPARTILHADO */}
              <div className="p-3 bg-slate-100 rounded-2xl border border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Globe className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <span className="font-bold block text-slate-900">Domínio da Aplicação:</span>
                    <span className="text-[11px] text-slate-500">
                      {selectedDomain === 'active'
                        ? 'Ambiente Ativo Atual (Abre de imediato no celular sem erro 404)'
                        : 'Link Público Compartilhado (Para clientes externos após clicar em Share)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedDomain('active')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                      selectedDomain === 'active'
                        ? 'bg-sky-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ambiente Ativo (Recomendado)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDomain('shared')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                      selectedDomain === 'shared'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Compartilhado (ais-pre)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* Lado Esquerdo: Links */}
                <div className="space-y-3">
                  
                  {/* 1. LINK SISTEMA WEB - CLIENTE */}
                  <div className="p-3.5 rounded-2xl bg-sky-50 border-2 border-sky-400 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-700 text-white font-black text-[10px] uppercase">
                        💻 Link Sistema Web - Cliente
                      </span>
                      <span className="text-[10px] text-sky-800 font-bold">Acesso Online / ERP</span>
                    </div>

                    <p className="text-[11px] text-slate-700 font-medium">
                      Link oficial para acesso ao <strong>Sistema Web do Cliente</strong> (gestão de rotas, upload Excel, mapas e relatórios):
                    </p>

                    <div className="font-mono text-xs text-sky-950 font-bold p-2 bg-white rounded-xl border border-sky-200 break-all select-all shadow-inner">
                      {linkSistemaWebCliente}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(linkSistemaWebCliente);
                          setSalvamentoFeedback('💻 Link Sistema Web copiado com sucesso!');
                          setTimeout(() => setSalvamentoFeedback(null), 3000);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer active:scale-98"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Link Sistema Web - Cliente</span>
                      </button>

                      <a
                        href={linkSistemaWebCliente}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                        <span>Abrir</span>
                      </a>
                    </div>
                  </div>

                  {/* 2. LINK APK MOBILE - CLIENTE */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-700 text-white font-black text-[10px] uppercase">
                        📲 Link APK Mobile - Cliente
                      </span>
                      <span className="text-[10px] text-emerald-800 font-bold">App Campo 100% Offline</span>
                    </div>

                    <p className="text-[11px] text-slate-700 font-medium">
                      Link direto para o cliente abrir instantaneamente no smartphone Android ou iOS:
                    </p>

                    <div className="font-mono text-xs text-emerald-950 font-bold p-2 bg-white rounded-xl border border-emerald-200 break-all select-all shadow-inner">
                      {linkAPKMobileCliente}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(linkAPKMobileCliente);
                          setSalvamentoFeedback('📲 Link APK Mobile copiado com sucesso!');
                          setTimeout(() => setSalvamentoFeedback(null), 3000);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer active:scale-98"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Link Mobile</span>
                      </button>

                      <a
                        href={linkAPKMobileCliente}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Abrir</span>
                      </a>
                    </div>
                  </div>

                  {/* CARD DO LINK DE COMPARTILHAMENTO PÚBLICO (SHARED) */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                        <span>Link Público Compartilhado (ais-pre)</span>
                      </h4>
                      <span className="text-[9px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                        Requer Share no Topo
                      </span>
                    </div>

                    <div className="font-mono text-[10px] text-slate-600 truncate bg-white p-1.5 rounded-lg border border-slate-200">
                      {sharedUrl}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500">
                        Ativado ao clicar em <strong>"Share"</strong> no topo do AI Studio.
                      </span>
                      <button
                        type="button"
                        onClick={handleCopiarShared}
                        className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[10px] flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiadoShared ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiadoShared ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Lado Direito: QR Code Escaneável */}
                <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-50 border border-slate-200 text-center">
                  <div className="flex flex-wrap justify-center items-center gap-1.5 mb-2 bg-slate-200 p-1 rounded-xl text-[10px] font-bold text-slate-700">
                    <button
                      onClick={() => setQrUrlType('apk')}
                      className={`px-2.5 py-1 rounded-lg transition ${qrUrlType === 'apk' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600'}`}
                    >
                      📲 QR Code APK Android
                    </button>
                    <button
                      onClick={() => setQrUrlType('web')}
                      className={`px-2.5 py-1 rounded-lg transition ${qrUrlType === 'web' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600'}`}
                    >
                      💻 QR Code Web
                    </button>
                    <button
                      onClick={() => setQrUrlType('shared')}
                      className={`px-2.5 py-1 rounded-lg transition ${qrUrlType === 'shared' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
                    >
                      🌐 ais-pre
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-white shadow-md border border-slate-200 mb-2">
                    <canvas ref={canvasRef} className="rounded-lg" />
                  </div>

                  <div className="font-mono text-[10px] text-slate-500 break-all max-w-[260px] bg-white px-2 py-1 rounded border border-slate-200 mb-2">
                    {urlParaQRCode}
                  </div>

                  <div className="flex gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(urlParaQRCode);
                        setSalvamentoFeedback('QR Code Link copiado!');
                        setTimeout(() => setSalvamentoFeedback(null), 3000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar URL do QR</span>
                    </button>
                    <a
                      href={urlParaQRCode}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Abrir</span>
                    </a>
                  </div>

                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1 justify-center">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Aponte a Câmera do Smartphone</span>
                  </h4>
                  <p className="text-slate-500 text-[11px] mt-0.5 max-w-xs leading-tight">
                    {qrUrlType === 'apk'
                      ? 'Ao escanear com o celular, abre diretamente o sistema mobile com banco 100% offline e botão de instalação.'
                      : qrUrlType === 'web'
                      ? 'Abre o sistema Web do cliente no navegador do celular.'
                      : 'Abre a versão compartilhada ais-pre após clicar em Share no topo.'}
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* ================= ABA 2: SALVAR TUDO & BANCO OFFLINE ================= */}
          {abaAtiva === 'salvar_backup' && (
            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Banco de Dados Local 100% Offline (IndexedDB)</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                    IndexedDB Ativo
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Todo o trabalho realizado fica gravado permanentemente no banco local do seu próprio aparelho celular (IndexedDB e LocalStorage). Mesmo fechando o navegador, desligando o celular ou ficando em áreas rurais sem sinal de internet, os dados permanecem salvos.
                </p>
              </div>

              {/* Indicadores de Estado do Sistema */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Cadastros no Aparelho</span>
                  <span className="text-xl font-black text-slate-900">{totalRecords}</span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">Registros em banco local</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Rascunho de Censo</span>
                  <span className="text-xl font-black text-slate-900">{hasDraft ? '1 Salvo' : 'Nenhum'}</span>
                  <span className="text-[10px] text-sky-700 block mt-0.5">Auto-save a cada alteração</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Campos do Contrato</span>
                  <span className="text-xl font-black text-slate-900">38 Oficiais + Custom</span>
                  <span className="text-[10px] text-indigo-700 block mt-0.5">Sincronizados em tempo real</span>
                </div>
              </div>

              {/* Botões de Ação de Salvamento e Backup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSalvarTudoAgora}
                  className="p-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition cursor-pointer active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>Fixar e Salvar Ponto de Restauração Agora</span>
                </button>

                <button
                  type="button"
                  onClick={handleBaixarBackupCompleto}
                  className="p-3.5 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-700/20 transition cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo Físico de Backup (.json)</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-[11px] leading-relaxed">
                💡 <strong>Dica de Segurança:</strong> Ao clicar em <em>"Baixar Arquivo Físico de Backup"</em>, você faz o download de um arquivo .json contendo todos os cadastros, rotas e configurações de campos para o seu computador ou smartphone, garantindo redundância total do seu trabalho.
              </div>

            </div>
          )}

          {/* ================= ABA 3: INSTALAÇÃO NO CELULAR (PWA) ================= */}
          {abaAtiva === 'instalacao_celular' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-sky-50 to-indigo-50 p-4 rounded-2xl border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Instalação Imediata como Aplicativo Nativo no Smartphone
                  </h3>
                  <p className="text-slate-600 text-xs mt-0.5">
                    Instale no seu smartphone com ícone na tela inicial e funcionamento 100% offline em áreas sem sinal de internet!
                  </p>
                </div>

                {isInstallable && (
                  <button
                    type="button"
                    onClick={install}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition shrink-0 cursor-pointer"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>Instalar Neste Aparelho</span>
                  </button>
                )}
              </div>

              {/* Seletor de Plataforma Android / iPhone */}
              <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setAbaPlataforma('android')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    abaPlataforma === 'android'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>No Android (Samsung, Motorola, Xiaomi...)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAbaPlataforma('ios')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    abaPlataforma === 'ios'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5" />
                  <span>No iPhone / iPad (Apple iOS)</span>
                </button>
              </div>

              {/* Passos Android */}
              {abaPlataforma === 'android' && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Abra o Link Ativo no Google Chrome</h4>
                      <p className="text-slate-600 text-[11px]">
                        Acesse <strong className="text-sky-700 font-mono">{activeLiveUrl}</strong> no Chrome do celular ou escaneie o QR Code.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Clique em "Adicionar à Tela Inicial" ou "Instalar Aplicativo"</h4>
                      <p className="text-slate-600 text-[11px]">
                        Toque no menu de <strong>3 pontinhos (⋮)</strong> no canto superior direito do Chrome e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Pronto! O App estará instalado na tela inicial</h4>
                      <p className="text-slate-600 text-[11px]">
                        Ele funciona em tela cheia com ícone oficial, sem barras de navegador, operando 100% offline mesmo no modo avião.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Passos iPhone / iOS */}
              {abaPlataforma === 'ios' && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Abra o Link Ativo no Safari do iPhone</h4>
                      <p className="text-slate-600 text-[11px]">
                        Abra o Safari e acesse <strong className="text-sky-700 font-mono">{activeLiveUrl}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Toque no botão "Compartilhar" (Ícone central com seta para cima)</h4>
                      <p className="text-slate-600 text-[11px]">
                        Na barra inferior do Safari, toque no ícone de compartilhamento.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Selecione "Adicionar à Tela de Início"</h4>
                      <p className="text-slate-600 text-[11px]">
                        Role as opções e toque em <strong>"Adicionar à Tela de Início"</strong>. O ícone do AquaSane Pro surgirá no seu iPhone.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= ABA 4: GOOGLE PLAY STORE & APPLE APP STORE ================= */}
          {abaAtiva === 'publicacao_lojas' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">
                    Publicação Oficial na Google Play Store & Apple App Store
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O sistema possui Service Worker, Web Manifest, ícone SVG/PNG e suporte offline total, estando <strong>100% pronto para empacotamento .APK / .AAB</strong> para as lojas.
                </p>
              </div>

              {/* Guia Google Play Store */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Store className="w-4 h-4 text-emerald-600" />
                    <span>Publicação na Google Play Store (Android)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    PWABuilder
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  1. Acesse <a href="https://www.pwabuilder.com/" target="_blank" rel="noreferrer" className="text-sky-700 underline font-bold">pwabuilder.com</a><br />
                  2. Cole o Link Ativo: <code className="bg-slate-200 px-1 rounded font-bold text-slate-800 text-[10px]">{activeLiveUrl}</code> e clique em <strong>Start</strong>.<br />
                  3. Clique em <strong>"Package for Android"</strong> para baixar o arquivo <strong>.AAB (Android App Bundle)</strong> assinado.<br />
                  4. No <a href="https://play.google.com/console" target="_blank" rel="noreferrer" className="text-sky-700 underline font-bold">Google Play Console</a>, crie o app e envie o pacote .aab.
                </p>
              </div>

              {/* Guia Apple App Store */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Apple className="w-4 h-4 text-slate-800" />
                    <span>Publicação na Apple App Store (iOS)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold">
                    Apple Developer
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  1. No <a href="https://www.pwabuilder.com/" target="_blank" rel="noreferrer" className="text-sky-700 underline font-bold">PWABuilder</a>, selecione <strong>"Package for iOS"</strong>.<br />
                  2. Ele gera o projeto Xcode pronto para compilação.<br />
                  3. Submeta para o App Store Connect usando sua conta no <a href="https://developer.apple.com/" target="_blank" rel="noreferrer" className="text-sky-700 underline font-bold">Apple Developer Program</a>.
                </p>
              </div>

              {/* Ficha Técnica Copiável */}
              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 flex items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sky-950 text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-700" />
                    <span>Ficha Técnica & Textos ASO para Cadastro nas Lojas</span>
                  </h4>
                  <p className="text-[10px] text-sky-800 mt-0.5">
                    Nome, descrição curta, descrição longa e palavras-chave já formatadas para o formulário das lojas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopiarMetadados}
                  className="px-3 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs flex items-center gap-1 transition shrink-0 cursor-pointer"
                >
                  {copiadoMetadados ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiadoMetadados ? 'Copiado!' : 'Copiar Textos'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Rodapé */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px]">
              Proprietário: <strong>Adriano Silva</strong> • Banco Offline no Celular
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
