import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  Smartphone,
  KeyRound,
  Plus,
  Lock,
  Unlock,
  Copy,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Send,
  Calendar,
  CheckCircle2,
  UserCheck,
  Share2,
  ExternalLink,
  Monitor,
  MessageCircle,
  Link,
  Globe
} from 'lucide-react';
import {
  licenciamentoService,
  MASTER_EMAIL,
  MASTER_NOME,
} from '../services/licenciamentoService';
import { EmpresaPrestadora, LicencaDispositivo } from '../types/licenciamento';

interface PainelLicenciamentoMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PainelLicenciamentoMasterModal: React.FC<PainelLicenciamentoMasterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [abaAtiva, setAbaAtiva] = useState<'links_cliente' | 'aparelhos' | 'gerador' | 'empresas'>('links_cliente');
  const [empresas, setEmpresas] = useState<EmpresaPrestadora[]>(licenciamentoService.getEmpresas());
  const [dispositivos, setDispositivos] = useState<LicencaDispositivo[]>(
    licenciamentoService.getTodosDispositivos()
  );
  const currentDeviceId = licenciamentoService.getDeviceId();
  const currentIMEI = licenciamentoService.getDeviceIMEI();

  // Links Oficiais Válidos para o Cliente
  const liveUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-ngtjzalhi77e43bxamfamp-530667778944.us-west2.run.app';
  const linkWebCliente = `${liveUrl}/?modo=web&cadastro=cliente`;
  const linkApkMobile = `${liveUrl}/?modo=apk_mobile&download_apk=true`;

  // Links do Cliente e Anti-Burlagem por IMEI
  const [clienteIMEI, setClienteIMEI] = useState('');
  const [clienteEmpresaId, setClienteEmpresaId] = useState(empresas[0]?.id || '');
  const [clienteCadastrista, setClienteCadastrista] = useState('');
  const [linkAtivacaoIMEIGerado, setLinkAtivacaoIMEIGerado] = useState<{ url: string; chave: string } | null>(null);
  const [copiadoWeb, setCopiadoWeb] = useState(false);
  const [copiadoAPK, setCopiadoAPK] = useState(false);
  const [copiadoAtivacao, setCopiadoAtivacao] = useState(false);
  const [copiadoMensagem, setCopiadoMensagem] = useState(false);

  // Gerador de Chave Avulsa
  const [gerarDeviceId, setGerarDeviceId] = useState('');
  const [gerarIMEI, setGerarIMEI] = useState('');
  const [gerarEmpresaId, setGerarEmpresaId] = useState(empresas[0]?.id || '');
  const [gerarCadastrista, setGerarCadastrista] = useState('');
  const [chaveGerada, setChaveGerada] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Nova Empresa
  const [novaRazao, setNovaRazao] = useState('');
  const [novoFantasia, setNovoFantasia] = useState('');
  const [novoCnpj, setNovoCnpj] = useState('');
  const [novoTipo, setNovoTipo] = useState<EmpresaPrestadora['tipoServico']>('AGUA_ESGOTO');
  const [novoContrato, setNovoContrato] = useState('');
  const [novoLimite, setNovoLimite] = useState(10);
  const [novoValorAparelho, setNovoValorAparelho] = useState(99.0);
  const [novoContato, setNovoContato] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [feedbackEmpresa, setFeedbackEmpresa] = useState<string | null>(null);

  const atualizarListas = () => {
    setEmpresas([...licenciamentoService.getEmpresas()]);
    setDispositivos([...licenciamentoService.getTodosDispositivos()]);
  };

  const handleGerarLinkAtivacaoIMEI = (e: React.FormEvent) => {
    e.preventDefault();
    const imeiLimpo = clienteIMEI.replace(/\D/g, '').slice(0, 15);
    if (!imeiLimpo) return;

    const res = licenciamentoService.gerarLinkAtivacaoIMEI(
      imeiLimpo,
      clienteEmpresaId,
      clienteCadastrista.trim() || 'Operador de Campo',
      liveUrl
    );

    // Registra na base de dispositivos para rastreio
    licenciamentoService.masterLiberarDispositivo(
      `CEL-${imeiLimpo.slice(-4)}`,
      clienteEmpresaId,
      365,
      clienteCadastrista.trim() || 'Operador Homologado',
      imeiLimpo
    );

    setLinkAtivacaoIMEIGerado(res);
    atualizarListas();
  };

  const mensagemWhatsAppPronta = `*AQUASANE PRO - LINKS OFICIAIS (SISTEMA WEB & APK MOBILE)*
Prezado(a) Cliente,

Seguem os links oficiais para acesso e implantação:

💻 *1. LINK DO SISTEMA WEB (Para abrir no Computador):*
👉 ${linkWebCliente}
_Ao clicar pelo computador, você criará diretamente seu login de Administrador e terá acesso total ao painel de gestão._

📲 *2. LINK DO APK MOBILE (Para abrir no Celular):*
👉 ${linkApkMobile}
_Ao abrir pelo celular, baixará o aplicativo Android APK com operação 100% offline em campo._

🔒 *3. ATIVAÇÃO DA LICENÇA NO CELULAR (R$ 99,00 por aparelho):*
O sistema utiliza trava de segurança exclusiva pelo IMEI físico de cada celular para garantir a licença única e impedir que compartilhem licenças.
${
  linkAtivacaoIMEIGerado
    ? `\n🔑 *LINK DE ATIVAÇÃO DIRETA PARA O SEU CELULAR (IMEI: ${clienteIMEI}):*\n👉 ${linkAtivacaoIMEIGerado.url}\n(Ao clicar neste link direto no seu celular, a licença será ativada instantaneamente!)`
    : `\nAo abrir o aplicativo no smartphone, nos envie o número do IMEI exibido na tela para liberarmos sua ativação imediata.`
}

Atenciosamente,
${MASTER_NOME} - AquaSane Pro
E-mail: ${MASTER_EMAIL}
WhatsApp: (71) 98822-4411`;

  const handleGerarChave = (e: React.FormEvent) => {
    e.preventDefault();
    const idOuImei = (gerarIMEI.trim() || gerarDeviceId.trim());
    if (!idOuImei) return;

    const chave = licenciamentoService.masterLiberarDispositivo(
      gerarDeviceId.trim() || `CEL-${idOuImei.slice(-4)}`,
      gerarEmpresaId,
      365,
      gerarCadastrista.trim() || 'Operador Homologado',
      gerarIMEI.trim() || undefined
    );
    setChaveGerada(chave);
    atualizarListas();
  };

  const handleBloquear = (deviceId: string) => {
    licenciamentoService.masterBloquearDispositivo(deviceId);
    atualizarListas();
  };

  const handleDesbloquear = (deviceId: string) => {
    licenciamentoService.masterReativarDispositivo(deviceId);
    atualizarListas();
  };

  const handleCadastrarEmpresa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoFantasia.trim() || !novoCnpj.trim()) return;

    licenciamentoService.cadastrarEmpresa({
      razaoSocial: novaRazao || novoFantasia,
      nomeFantasia: novoFantasia,
      cnpj: novoCnpj,
      tipoServico: novoTipo,
      contratoNumero: novoContrato || `CT-${Math.floor(100000 + Math.random() * 900000)}`,
      limiteAparelhos: Number(novoLimite) || 10,
      status: 'ATIVO',
      dataInicioContrato: Date.now(),
      dataFimContrato: Date.now() + 365 * 86400000,
      contatoResponsavel: novoContato || 'Gestor Operacional',
      telefoneContato: novoTelefone || '(71) 90000-0000',
      emailContato: novoEmail || 'contato@empresa.com.br',
      valorMensalPorAparelho: Number(novoValorAparelho) || 99.0,
    });

    setFeedbackEmpresa('Nova Empresa Prestadora cadastrada com sucesso!');
    setNovaRazao('');
    setNovoFantasia('');
    setNovoCnpj('');
    atualizarListas();
    setTimeout(() => setFeedbackEmpresa(null), 3000);
  };

  const totalAparelhosAtivos = dispositivos.filter((d) => d.status === 'ATIVO').length;
  const faturamentoMensalTotal = empresas.reduce((acc, emp) => {
    const ativosDaEmpresa = dispositivos.filter((d) => d.empresaId === emp.id && d.status === 'ATIVO').length;
    return acc + ativosDaEmpresa * emp.valorMensalPorAparelho;
  }, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95">
        {/* Top Header Master */}
        <div className="bg-gradient-to-r from-amber-600 via-sky-900 to-indigo-950 p-5 sm:p-6 flex items-center justify-between shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Painel Master de Licenciamento Comercial
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  Acesso Exclusivo
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Proprietário: <strong>{MASTER_NOME}</strong> ({MASTER_EMAIL}) • Controle de Licença por Celular
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

        {/* Métricas Comerciais Resumidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/60 border-b border-slate-800 text-xs shrink-0">
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Aparelhos Ativos</span>
            <span className="text-lg font-black text-emerald-400">{totalAparelhosAtivos} celulares</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Empresas Clientes</span>
            <span className="text-lg font-black text-sky-400">{empresas.length} contratantes</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Faturamento Estimado</span>
            <span className="text-lg font-black text-amber-400">
              {faturamentoMensalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Aparelho Atual</span>
            <span className="text-xs font-mono font-bold text-slate-300 truncate block">
              {currentDeviceId}
            </span>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-4 sm:px-6 pt-2 shrink-0 gap-2 overflow-x-auto">
          <button
            onClick={() => setAbaAtiva('links_cliente')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              abaAtiva === 'links_cliente'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4 text-sky-400" />
            <span>Links do Cliente (Web & Celular)</span>
          </button>
          <button
            onClick={() => setAbaAtiva('aparelhos')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              abaAtiva === 'aparelhos'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Celulares Licenciados ({dispositivos.length})</span>
          </button>
          <button
            onClick={() => setAbaAtiva('gerador')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              abaAtiva === 'gerador'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Gerar Chave de Liberação</span>
          </button>
          <button
            onClick={() => setAbaAtiva('empresas')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              abaAtiva === 'empresas'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Empresas Prestadoras ({empresas.length})</span>
          </button>
        </div>

        {/* Conteúdo Dinâmico */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* ABA 0: LINKS OFICIAIS DO CLIENTE E ATIVAÇÃO POR IMEI */}
          {abaAtiva === 'links_cliente' && (
            <div className="space-y-5">
              {/* Banner Informativo */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950 via-slate-850 to-indigo-950 border border-sky-500/40 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Links Oficiais Prontos para Enviar aos Clientes
                      </h3>
                      <p className="text-slate-300 text-[11px]">
                        O cliente clica no computador e cria seu login administrativo; clica no celular e baixa o APK com reconhecimento de IMEI.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Links Homologados e Válidos
                  </span>
                </div>
              </div>

              {/* Grid: Link Web + Link APK */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card Link Web */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-sky-500/40 flex flex-col justify-between space-y-3 shadow-lg">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5" />
                        1. Link Sistema Web (Computador)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-[9px] font-bold">
                        Cria Login Admin
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Envie este link para o cliente abrir no computador. Ele cai diretamente na tela para cadastrar sua empresa e criar seu login de Administrador.
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-[11px] text-sky-300 break-all select-all">
                      {linkWebCliente}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(linkWebCliente);
                        setCopiadoWeb(true);
                        setTimeout(() => setCopiadoWeb(false), 3000);
                      }}
                      className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-sky-600/20"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiadoWeb ? 'Link Copiado!' : 'Copiar Link Web'}</span>
                    </button>
                    <a
                      href={linkWebCliente}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700"
                      title="Testar abertura no navegador"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </a>
                  </div>
                </div>

                {/* Card Link APK */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/40 flex flex-col justify-between space-y-3 shadow-lg">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5" />
                        2. Link APK Mobile (Smartphone Android)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                        Download Automático
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Envie este link para abrir no celular Android. Ao clicar, inicia o download do APK e abre o app de campo 100% offline.
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-[11px] text-emerald-300 break-all select-all">
                      {linkApkMobile}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(linkApkMobile);
                        setCopiadoAPK(true);
                        setTimeout(() => setCopiadoAPK(false), 3000);
                      }}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiadoAPK ? 'Link Copiado!' : 'Copiar Link Mobile APK'}</span>
                    </button>
                    <a
                      href={linkApkMobile}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700"
                      title="Testar download no navegador"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Seção Anti-Fraude: Gerador de Link Travado no IMEI */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Trava de Segurança Anti-Burlagem por IMEI</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                          R$ 99,00 / Celular
                        </span>
                      </h4>
                      <p className="text-slate-400 text-[10px]">
                        Gere um link oficial com chave criptográfica atrelada exclusivamente ao IMEI do smartphone do cliente.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleGerarLinkAtivacaoIMEI} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">
                        IMEI do Celular do Cliente (15 Dígitos) *
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          required
                          value={clienteIMEI}
                          onChange={(e) => setClienteIMEI(e.target.value.replace(/\D/g, '').slice(0, 15))}
                          placeholder="Ex: 358920109283741"
                          maxLength={15}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 focus:outline-hidden focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setClienteIMEI(currentIMEI)}
                          className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 shrink-0 transition"
                          title="Inserir IMEI do aparelho atual"
                        >
                          Usar Meu
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">
                        Empresa Prestadora Contratante
                      </label>
                      <select
                        value={clienteEmpresaId}
                        onChange={(e) => setClienteEmpresaId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500"
                      >
                        {empresas.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.nomeFantasia} ({emp.contratoNumero})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">
                        Nome do Colaborador / Cadastrista
                      </label>
                      <input
                        type="text"
                        value={clienteCadastrista}
                        onChange={(e) => setClienteCadastrista(e.target.value)}
                        placeholder="Ex: Carlos Silva ou Equipe 01"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Gerar Link de Ativação 1-Clique Travado no IMEI (R$ 99,00)</span>
                  </button>
                </form>

                {linkAtivacaoIMEIGerado && (
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/50 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Link de Ativação Travado no IMEI Gerado com Sucesso:
                      </span>
                      <span className="font-mono text-[10px] font-bold text-amber-300">
                        Chave: {linkAtivacaoIMEIGerado.chave}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 break-all select-all">
                      {linkAtivacaoIMEIGerado.url}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(linkAtivacaoIMEIGerado.url);
                          setCopiadoAtivacao(true);
                          setTimeout(() => setCopiadoAtivacao(false), 3000);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiadoAtivacao ? 'Link de Ativação Copiado!' : 'Copiar Link de Ativação'}</span>
                      </button>

                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Reconhecimento exclusivo: outros celulares com outro IMEI serão bloqueados.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mensagem Formatada para WhatsApp / E-mail */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Mensagem Pronta para Envio (WhatsApp ou E-mail)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Clique em copiar e cole na conversa do cliente
                  </span>
                </div>

                <textarea
                  readOnly
                  rows={8}
                  value={mensagemWhatsAppPronta}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-200 select-all focus:outline-hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(mensagemWhatsAppPronta);
                      setCopiadoMensagem(true);
                      setTimeout(() => setCopiadoMensagem(false), 3000);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiadoMensagem ? 'Mensagem Copiada!' : 'Copiar Mensagem para WhatsApp'}</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemWhatsAppPronta)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-emerald-500/30"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Abrir no WhatsApp Web</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ABA 1: APARELHOS CELULARES */}
          {abaAtiva === 'aparelhos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Dispositivos Celulares Cadastrados</h3>
                  <p className="text-slate-400 text-[11px]">
                    Bloqueie celulares de empresas inadimplentes ou ative novos coletores de campo com 1 clique.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGerarDeviceId(currentDeviceId);
                      setAbaAtiva('gerador');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold transition cursor-pointer"
                  >
                    Liberar Celular Atual
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">IMEI / ID do Celular</th>
                      <th className="p-3">Empresa Prestadora</th>
                      <th className="p-3">Cadastrista / Modelo</th>
                      <th className="p-3">Licença & Status</th>
                      <th className="p-3">Validade</th>
                      <th className="p-3 text-right">Ação Master</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {dispositivos.map((disp) => {
                      const isEste = disp.deviceId === currentDeviceId;
                      const isAtivo = disp.status === 'ATIVO';

                      return (
                        <tr key={disp.deviceId} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-mono">
                            {disp.imeiAparelho && (
                              <div className="font-bold text-emerald-300 text-[11px] flex items-center gap-1">
                                <span>IMEI: {disp.imeiAparelho}</span>
                                <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[8px] font-bold">ÚNICA</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                              <span>{disp.deviceId}</span>
                              {isEste && (
                                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold">
                                  Este Celular
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal block font-sans">
                              {disp.chaveLiberacao}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">
                            <span className="font-semibold block">{disp.empresaNome}</span>
                            <span className="text-[10px] text-amber-300 font-bold">R$ 99,00 / celular</span>
                          </td>
                          <td className="p-3 text-slate-400">
                            <span className="text-slate-200 font-medium block">{disp.cadastristaNome || 'Não informado'}</span>
                            <span className="text-[10px]">{disp.modeloAparelho}</span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isAtivo
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {isAtivo ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                              <span>{disp.status}</span>
                            </span>
                            <span className="block text-[9px] text-slate-400 mt-0.5">Licença IMEI</span>
                          </td>
                          <td className="p-3 text-slate-400">
                            {disp.dataExpiracao
                              ? new Date(disp.dataExpiracao).toLocaleDateString('pt-BR')
                              : 'Indefinida'}
                          </td>
                          <td className="p-3 text-right">
                            {isAtivo ? (
                              <button
                                type="button"
                                onClick={() => handleBloquear(disp.deviceId)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold transition cursor-pointer"
                                title="Bloquear imediatamente o aparelho celular"
                              >
                                Bloquear
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDesbloquear(disp.deviceId)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold transition cursor-pointer"
                                title="Desbloquear e renovar por +1 ano"
                              >
                                Desbloquear
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Botões de Teste para o Dono */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-200 block">Testar Simulação de Bloqueio</span>
                  <span className="text-[11px] text-slate-400">
                    Coloque este aparelho celular no estado Bloqueado ou Pendente para validar a tela de ativação vista pelos clientes.
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      licenciamentoService.simularBloqueioParaTeste();
                      atualizarListas();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700 text-xs font-bold transition cursor-pointer"
                  >
                    Simular Celular Bloqueado
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      licenciamentoService.masterReativarDispositivo(currentDeviceId);
                      atualizarListas();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700 text-xs font-bold transition cursor-pointer"
                  >
                    Reativar Este Celular
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: GERADOR DE CHAVE */}
          {abaAtiva === 'gerador' && (
            <div className="max-w-xl mx-auto space-y-5">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white text-sm">
                    Gerar Chave de Liberação para Celular do Cliente
                  </h3>
                </div>
                <p className="text-slate-400 text-xs">
                  Insira o ID informado pelo cliente (ex: <code className="text-sky-300">CEL-1080-8B2A-99FE</code>) e vincule à empresa contratante para emitir a chave comercial.
                </p>

                <form onSubmit={handleGerarChave} className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      ID do Aparelho Celular (Fornecido pelo Cliente)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: CEL-7B4F-8201-C99A"
                        value={gerarDeviceId}
                        onChange={(e) => setGerarDeviceId(e.target.value)}
                        className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white font-mono uppercase focus:outline-hidden focus:border-amber-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setGerarDeviceId(currentDeviceId)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                      >
                        Meu ID
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Empresa Prestadora
                    </label>
                    <select
                      value={gerarEmpresaId}
                      onChange={(e) => setGerarEmpresaId(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                    >
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nomeFantasia} ({emp.contratoNumero}) — {emp.valorMensalPorAparelho.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Nome do Cadastrista / Operador (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Marcos Vinícius ou Equipe 02"
                      value={gerarCadastrista}
                      onChange={(e) => setGerarCadastrista(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Emitir Chave de Liberação (Validade: 365 dias)</span>
                  </button>
                </form>

                {chaveGerada && (
                  <div className="mt-4 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider block text-emerald-400">
                      Chave Gerada com Sucesso!
                    </span>
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-emerald-800">
                      <span className="font-mono text-base font-black text-white tracking-widest">
                        {chaveGerada}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(chaveGerada);
                          setCopiado(true);
                          setTimeout(() => setCopiado(false), 3000);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-400/90">
                      Envie esta chave ao cliente. O celular correspondente será ativado imediatamente ao ser inserida.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 3: EMPRESAS PRESTADORAS */}
          {abaAtiva === 'empresas' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Empresas Prestadoras de Serviço Clientes</h3>
                  <p className="text-slate-400 text-[11px]">
                    Gerencie contratos, limite de smartphones e valor mensal por aparelho coletor.
                  </p>
                </div>
              </div>

              {/* Lista de Empresas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {empresas.map((emp) => {
                  const ativos = dispositivos.filter((d) => d.empresaId === emp.id && d.status === 'ATIVO').length;
                  const faturamentoEmpresa = ativos * emp.valorMensalPorAparelho;

                  return (
                    <div
                      key={emp.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-white text-sm">{emp.nomeFantasia}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            {emp.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{emp.razaoSocial}</p>
                        <div className="mt-2 text-[11px] text-slate-400 space-y-1">
                          <div>CNPJ: <span className="text-slate-200 font-mono">{emp.cnpj}</span></div>
                          <div>Contrato: <span className="text-sky-300 font-mono">{emp.contratoNumero}</span></div>
                          <div>Contato: <span className="text-slate-200">{emp.contatoResponsavel} ({emp.telefoneContato})</span></div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Celulares Ativos</span>
                          <strong className="text-white font-mono">{ativos} / {emp.limiteAparelhos}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] block">Valor Mensal</span>
                          <strong className="text-amber-400 font-mono">
                            {faturamentoEmpresa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Formulário para Cadastrar Nova Prestadora */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-sky-400" />
                  <h4 className="font-bold text-white text-sm">Cadastrar Nova Empresa Prestadora</h4>
                </div>

                {feedbackEmpresa && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs">
                    {feedbackEmpresa}
                  </div>
                )}

                <form onSubmit={handleCadastrarEmpresa} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Nome Fantasia da Empresa</label>
                    <input
                      type="text"
                      placeholder="Ex: Bahia Saneamento Norte"
                      value={novoFantasia}
                      onChange={(e) => setNovoFantasia(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">CNPJ</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={novoCnpj}
                      onChange={(e) => setNovoCnpj(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Tipo de Serviço</label>
                    <select
                      value={novoTipo}
                      onChange={(e) => setNovoTipo(e.target.value as any)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                    >
                      <option value="AGUA_ESGOTO">Água e Esgoto</option>
                      <option value="MANUTENCAO_REDES">Manutenção de Redes</option>
                      <option value="RECADASTRRAMENTO">Recadastramento / Censo</option>
                      <option value="CORTE_RELIGACAO">Corte e Religação</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Nº do Contrato</label>
                    <input
                      type="text"
                      placeholder="CT-102934-EMB"
                      value={novoContrato}
                      onChange={(e) => setNovoContrato(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Limite de Celulares</label>
                    <input
                      type="number"
                      min={1}
                      value={novoLimite}
                      onChange={(e) => setNovoLimite(parseInt(e.target.value, 10))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Valor por Celular (R$/mês)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={novoValorAparelho}
                      onChange={(e) => setNovoValorAparelho(parseFloat(e.target.value))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Gestor / Contato</label>
                    <input
                      type="text"
                      placeholder="Nome do Gestor"
                      value={novoContato}
                      onChange={(e) => setNovoContato(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">WhatsApp / Telefone</label>
                    <input
                      type="text"
                      placeholder="(71) 99999-0000"
                      value={novoTelefone}
                      onChange={(e) => setNovoTelefone(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Cadastrar Prestadora e Habilitar Aparelhos</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Master */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Licenciamento Criptográfico por Hardware • Adriano Silva</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Fechar Painel Master
          </button>
        </div>
      </div>
    </div>
  );
};
