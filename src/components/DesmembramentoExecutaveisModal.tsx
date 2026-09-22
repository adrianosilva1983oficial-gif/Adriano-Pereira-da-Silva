import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  Smartphone,
  Download,
  ExternalLink,
  Copy,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Terminal,
  Cpu,
  Monitor,
  Check,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import {
  LISTA_EXECUTAVEIS,
  downloadExecutavelWebMaster,
  downloadExecutavelWebCliente,
  downloadExecutavelMobile,
  downloadBatDireto,
  ExecutavelInfo
} from '../services/executaveisService';
import { generateDirectAPKFile } from '../services/apkPackageService';

interface DesmembramentoExecutaveisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelecionarVersao: (versao: 'master' | 'cliente' | 'mobile') => void;
  versaoAtiva: 'master' | 'cliente' | 'mobile';
}

export const DesmembramentoExecutaveisModal: React.FC<DesmembramentoExecutaveisModalProps> = ({
  isOpen,
  onClose,
  onSelecionarVersao,
  versaoAtiva,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://ais-dev-ngtjzalhi77e43bxamfamp-530667778944.us-west2.run.app';

  const handleBaixarExecutavel = async (id: 'master' | 'cliente' | 'mobile') => {
    setDownloadingId(id);
    setFeedbackMsg(`Gerando executável de instalação para ${id === 'master' ? 'Web Master' : id === 'cliente' ? 'Web Cliente ERP' : 'App Mobile'}...`);

    try {
      if (id === 'master') {
        await downloadExecutavelWebMaster(baseUrl);
      } else if (id === 'cliente') {
        await downloadExecutavelWebCliente(baseUrl);
      } else {
        await downloadExecutavelMobile(baseUrl);
      }
      setFeedbackMsg(`✅ Pacote executável gerado e baixado com sucesso!`);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err: any) {
      setFeedbackMsg(`Erro ao gerar pacote executável: ${err.message || 'Falha inesperada'}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleBaixarBatDireto = (id: 'master' | 'cliente') => {
    downloadBatDireto(id, baseUrl);
    setFeedbackMsg(`✅ Script instalador executável (.bat) baixado! Dê 2 cliques no Windows para instalar.`);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleBaixarAPKDireto = async () => {
    setDownloadingId('mobile_apk');
    setFeedbackMsg('Gerando arquivo APK instalável para Android...');
    try {
      const apkBlob = await generateDirectAPKFile(`${baseUrl}/?versao=mobile`);
      const url = URL.createObjectURL(apkBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AquaSane_Mobile_Campo.apk';
      a.click();
      URL.revokeObjectURL(url);
      setFeedbackMsg('✅ Arquivo APK gerado e baixado! Instale diretamente no celular.');
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err: any) {
      setFeedbackMsg(`Erro ao gerar APK: ${err.message || 'Falha'}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopiarLink = (id: 'master' | 'cliente' | 'mobile') => {
    const link = `${baseUrl}/?versao=${id}`;
    navigator.clipboard.writeText(link);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-slate-900 rounded-3xl max-w-5xl w-full my-auto flex flex-col shadow-2xl border border-slate-800 text-white overflow-hidden font-sans max-h-[94vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-sky-950 to-indigo-950 border-b border-sky-500/20 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-lg sm:text-xl text-white">
                  Desmembramento dos 3 Sistemas & Executáveis
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
                  3 Executáveis Independentes
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Cada versão possui seu ambiente isolado, conjunto específico de funções e instalador autônomo executável.
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

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="px-5 py-2.5 bg-sky-950/90 border-b border-sky-500/30 text-sky-200 text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Conteúdo com os 3 Cards Desmembrados */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* 1. WEB MASTER */}
            <div className={`rounded-3xl p-5 border transition flex flex-col justify-between ${
              versaoAtiva === 'master'
                ? 'bg-amber-950/30 border-amber-500 shadow-xl shadow-amber-950/40 ring-1 ring-amber-500/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}>
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
                    Uso Restrito Meu
                  </span>
                </div>

                <h3 className="font-black text-base text-white">1. Web Master</h3>
                <p className="text-xs text-amber-200/90 font-medium mt-0.5">
                  Painel de Controle Restrito (Adriano Silva)
                </p>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  Ambiente exclusivo para gestão das licenças de celulares por IMEI, cobranças PIX, criação de bases de clientes e auditoria master.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                    <span>Recursos Exclusivos:</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Gestão de Licenças e Aparelhos Celulares (IMEI)</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Gerenciador de Clientes & Bases Multi-Tenant</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Gerador de Links PIX (adrianosilva1983oficial@gmail.com)</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Banco de Dados Global Particionado</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Regra de Tolerância de 5 dias & Bloqueios</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelecionarVersao('master');
                    onClose();
                  }}
                  className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    versaoAtiva === 'master'
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <span>{versaoAtiva === 'master' ? '✓ Versão Ativa no Navegador' : '🚀 Alternar para Web Master'}</span>
                </button>

                <button
                  type="button"
                  disabled={downloadingId === 'master'}
                  onClick={() => handleBaixarExecutavel('master')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition disabled:opacity-50"
                  title="Baixa o pacote instalador executável para Windows Desktop"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingId === 'master' ? 'Gerando Pacote...' : '📥 Baixar Executável (.exe/.bat)'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBaixarBatDireto('master')}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition cursor-pointer"
                    title="Baixar arquivo .bat individual direto"
                  >
                    Script .BAT Direto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopiarLink('master')}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1"
                    title="Copiar link dedicado desta versão"
                  >
                    {copiadoId === 'master' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Link</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. WEB CLIENTE */}
            <div className={`rounded-3xl p-5 border transition flex flex-col justify-between ${
              versaoAtiva === 'cliente'
                ? 'bg-sky-950/30 border-sky-500 shadow-xl shadow-sky-950/40 ring-1 ring-sky-500/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}>
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-sky-400" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-black uppercase">
                    Empresa & Escritório
                  </span>
                </div>

                <h3 className="font-black text-base text-white">2. Web Cliente</h3>
                <p className="text-xs text-sky-200/90 font-medium mt-0.5">
                  Gestão ERP, Planilhas & Relatórios
                </p>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  Destinado aos computadores e estações de trabalho da contratante. Permite alimentar o sistema ERP, subir planilhas de 111k matrículas e gerar relatórios.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold text-sky-300 mb-1">
                    <span>Recursos Exclusivos:</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>Módulo ERP: Empresa, Setores, Cargos e Viaturas</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>Subir Planilhas de 111k a 1.500.000 Matrículas</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>Roteirizador Porta a Porta por Ordem Estrita</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>Relatórios de Produtividade, Supervisão & GIS</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>Validação de Dados Prévia (Embasa)</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelecionarVersao('cliente');
                    onClose();
                  }}
                  className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    versaoAtiva === 'cliente'
                      ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30'
                  }`}
                >
                  <span>{versaoAtiva === 'cliente' ? '✓ Versão Ativa no Navegador' : '🚀 Alternar para Web Cliente'}</span>
                </button>

                <button
                  type="button"
                  disabled={downloadingId === 'cliente'}
                  onClick={() => handleBaixarExecutavel('cliente')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition disabled:opacity-50"
                  title="Baixa o pacote instalador executável para as estações da empresa"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingId === 'cliente' ? 'Gerando Pacote...' : '📥 Baixar Executável (.exe/.bat)'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBaixarBatDireto('cliente')}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition cursor-pointer"
                    title="Baixar arquivo .bat individual direto"
                  >
                    Script .BAT Direto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopiarLink('cliente')}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1"
                    title="Copiar link dedicado desta versão"
                  >
                    {copiadoId === 'cliente' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Link</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. APLICATIVO MOBILE */}
            <div className={`rounded-3xl p-5 border transition flex flex-col justify-between ${
              versaoAtiva === 'mobile'
                ? 'bg-emerald-950/30 border-emerald-500 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}>
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase">
                    Campo & Offline
                  </span>
                </div>

                <h3 className="font-black text-base text-white">3. Aplicativo Mobile</h3>
                <p className="text-xs text-emerald-200/90 font-medium mt-0.5">
                  App de Coleta em Campo para Cadastristas
                </p>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  Instalado no smartphone (Android ou iPhone) dos operadores de campo. Roda 100% offline com fotos, GPS e roteirização sequencial.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-1">
                    <span>Recursos Exclusivos:</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Interface Móvel Ergonômica para Celular</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Execução de O.S. da Rota Porta a Porta</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Fotos HD com Carimbo Georreferenciado</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Operação 100% Offline (Banco IndexedDB Local)</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Ativação Segura por IMEI / Chave Master</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelecionarVersao('mobile');
                    onClose();
                  }}
                  className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    versaoAtiva === 'mobile'
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  <span>{versaoAtiva === 'mobile' ? '✓ Versão Ativa no Navegador' : '🚀 Alternar para App Mobile'}</span>
                </button>

                <button
                  type="button"
                  disabled={downloadingId === 'mobile_apk'}
                  onClick={handleBaixarAPKDireto}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition disabled:opacity-50"
                  title="Baixa o arquivo .APK instalável no Android"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingId === 'mobile_apk' ? 'Gerando APK...' : '📱 Baixar Arquivo APK (.apk)'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={downloadingId === 'mobile'}
                    onClick={() => handleBaixarExecutavel('mobile')}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition cursor-pointer"
                    title="Baixar pacote ZIP completo com APK e Perfil iOS"
                  >
                    Pacote Mobile (.ZIP)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopiarLink('mobile')}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1"
                    title="Copiar link dedicado do App Mobile"
                  >
                    {copiadoId === 'mobile' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Link</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Guia Rápido dos Executáveis */}
          <div className="bg-slate-950/70 rounded-2xl p-4 sm:p-5 border border-slate-800 text-xs text-slate-300">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>Como funcionam os executáveis de instalação gerados</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-[11px] text-slate-400">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="font-bold text-amber-300 block mb-1">🖥️ Executável Web Master (.bat)</span>
                Cria atalho na Área de Trabalho do Windows que roda o painel do administrador em janela nativa de aplicativo, sem interferência de abas ou barras de navegação.
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="font-bold text-sky-300 block mb-1">💼 Executável Web Cliente ERP (.bat)</span>
                Instala o ambiente corporativo da empresa nas máquinas do escritório para subida de grandes planilhas (111k a 1.5M linhas) e extração de relatórios.
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-300 block mb-1">📱 Executável Mobile (.apk / PWA)</span>
                Arquivo APK compilado para celulares Android ou perfil para iPhone/iPad, permitindo cadastros mesmo no meio da rua sem sinal 4G.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Desenvolvido por Adriano Silva • 3 Módulos Independentes
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
