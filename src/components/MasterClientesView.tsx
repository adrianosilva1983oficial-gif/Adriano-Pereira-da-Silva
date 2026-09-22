import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Link,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Users,
  Database,
  QrCode,
  Lock,
  Search,
  Globe,
  Download,
  Send,
  ShieldAlert,
  Clock,
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { tenantService, ClienteTenant } from '../services/tenantService';
import { MASTER_NOME, MASTER_EMAIL } from '../services/licenciamentoService';
import { PIX_OFICIAL_CONFIG } from '../services/pixService';
import { GeradorLinkPixModal } from './GeradorLinkPixModal';
import QRCode from 'qrcode';

export const MasterClientesView: React.FC = () => {
  const [tenants, setTenants] = useState<ClienteTenant[]>(tenantService.getAllTenants());
  const [tenantAtivo, setTenantAtivo] = useState<ClienteTenant>(tenantService.getActiveTenant());
  const [modalNovoCliente, setModalNovoCliente] = useState(false);
  const [modalPixVendas, setModalPixVendas] = useState(false);
  const [clienteSelecionadoPix, setClienteSelecionadoPix] = useState('');
  const [modalQrCode, setModalQrCode] = useState<{ cliente: ClienteTenant; tipo: 'web' | 'apk'; qrDataUrl: string } | null>(null);
  const [copiadoTipo, setCopiadoTipo] = useState<{ id: string; tipo: 'web' | 'apk' | 'msg' } | null>(null);
  const [busca, setBusca] = useState('');
  const [notificacao, setNotificacao] = useState<string | null>(null);

  // Formulário de Novo Cliente
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contratoNumero, setContratoNumero] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [senhaAdminInicial, setSenhaAdminInicial] = useState('empresa123');
  const [limiteAparelhos, setLimiteAparelhos] = useState(20);
  const [diasValidadeLicenca, setDiasValidadeLicenca] = useState(30);

  useEffect(() => {
    const unsub = tenantService.subscribe(() => {
      setTenants(tenantService.getAllTenants());
      setTenantAtivo(tenantService.getActiveTenant());
    });
    return unsub;
  }, []);

  const exibirNotificacao = (msg: string) => {
    setNotificacao(msg);
    setTimeout(() => setNotificacao(null), 4000);
  };

  const handleCopiarLinkWeb = (cliente: ClienteTenant) => {
    const link = tenantService.gerarLinkSistemaWeb(cliente);
    navigator.clipboard.writeText(link);
    setCopiadoTipo({ id: cliente.id, tipo: 'web' });
    exibirNotificacao(`Link Sistema Web - Cliente copiado para a empresa ${cliente.nomeFantasia}!`);
    setTimeout(() => setCopiadoTipo(null), 3000);
  };

  const handleCopiarLinkApk = (cliente: ClienteTenant) => {
    const link = tenantService.gerarLinkAPKMobile(cliente);
    navigator.clipboard.writeText(link);
    setCopiadoTipo({ id: cliente.id, tipo: 'apk' });
    exibirNotificacao(`Link APK Mobile - Cliente copiado para a empresa ${cliente.nomeFantasia}!`);
    setTimeout(() => setCopiadoTipo(null), 3000);
  };

  const handleCopiarMensagemWhatsApp = (cliente: ClienteTenant) => {
    const msg = tenantService.gerarMensagemCompartilhamentoCliente(cliente);
    navigator.clipboard.writeText(msg);
    setCopiadoTipo({ id: cliente.id, tipo: 'msg' });
    exibirNotificacao(`Mensagem com os dois links copiada para envio ao cliente!`);
    setTimeout(() => setCopiadoTipo(null), 3000);
  };

  const handleAbrirQrCode = async (cliente: ClienteTenant, tipo: 'web' | 'apk') => {
    const link = tipo === 'web' ? tenantService.gerarLinkSistemaWeb(cliente) : tenantService.gerarLinkAPKMobile(cliente);
    try {
      const qrUrl = await QRCode.toDataURL(link, { width: 320, margin: 2 });
      setModalQrCode({ cliente, tipo, qrDataUrl: qrUrl });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCriarCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFantasia.trim() || !emailAdmin.trim()) return;

    const { cliente } = tenantService.criarNovoCliente({
      nomeFantasia,
      razaoSocial: razaoSocial || nomeFantasia,
      cnpj,
      contratoNumero: contratoNumero || `CT-2026-SAN-${Math.floor(100 + Math.random() * 900)}`,
      emailAdmin,
      senhaAdminInicial,
      limiteAparelhos,
      diasValidadeLicenca,
    });

    setModalNovoCliente(false);
    setNomeFantasia('');
    setRazaoSocial('');
    setCnpj('');
    setContratoNumero('');
    setEmailAdmin('');

    exibirNotificacao(`Cliente ${cliente.nomeFantasia} cadastrado com sucesso! Banco local e links gerados.`);
    handleAbrirQrCode(cliente, 'web');
  };

  const handleSelecionarTenant = (id: string) => {
    tenantService.setActiveTenant(id);
    const cliente = tenants.find((t) => t.id === id);
    exibirNotificacao(`Base selecionada: ${cliente?.nomeFantasia || id}. O sistema agora exibe os dados deste cliente.`);
  };

  const handleRenovar = (clienteId: string, dias: number) => {
    tenantService.renovarLicenca(clienteId, dias);
    exibirNotificacao(`Licença da base renovada por mais ${dias} dias.`);
  };

  const handleSimularInadimplencia = (clienteId: string, diasAtraso: number) => {
    tenantService.simularInadimplencia(clienteId, diasAtraso);
    if (diasAtraso > 5) {
      exibirNotificacao(`Simulação ativada: ${diasAtraso} dias de atraso. Base bloqueada para modo SOMENTE LEITURA.`);
    } else {
      exibirNotificacao(`Simulação ativada: ${diasAtraso} dias de atraso. Base em período de tolerância de 5 dias.`);
    }
  };

  const handleRegularizar = (clienteId: string) => {
    tenantService.simularRegularizacao(clienteId);
    exibirNotificacao(`Base regularizada com sucesso! Acesso liberado.`);
  };

  const handleExportarBase = (cliente: ClienteTenant) => {
    const dadosExport = {
      cliente,
      databaseName: `AquaSaneDB_${cliente.id}`,
      exportTimestamp: Date.now(),
      statusFinanceiro: tenantService.verificarStatusFinanceiroELicenca(cliente.id),
      links: {
        linkSistemaWeb: tenantService.gerarLinkSistemaWeb(cliente),
        linkAPKMobile: tenantService.gerarLinkAPKMobile(cliente),
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dadosExport, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `Base_${cliente.id}_${new Date().toISOString().slice(0, 10)}.json`);
    dl.click();
    exibirNotificacao(`Backup da base ${cliente.nomeFantasia} exportado com sucesso!`);
  };

  const tenantsFiltrados = tenants.filter(
    (t) =>
      t.nomeFantasia.toLowerCase().includes(busca.toLowerCase()) ||
      t.cnpj.includes(busca) ||
      t.contratoNumero.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Notificação Toast */}
      {notificacao && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>{notificacao}</span>
        </div>
      )}

      {/* Banner de Controle Master */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-sky-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-black tracking-wider uppercase mb-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Administrador & Gerenciador de Clientes • {MASTER_NOME} ({MASTER_EMAIL})
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Gerenciador de Clientes e Bases de Dados
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
            Cada cliente possui seu próprio <strong>Banco de Dados Local Isolado (IndexedDB)</strong>. Você pode visualizar, gerir, alternar entre as bases, regularizar ou bloquear licenças com a regra de tolerância de 5 dias e enviar os links oficiais do cliente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setClienteSelecionadoPix(tenantAtivo.nomeFantasia);
              setModalPixVendas(true);
            }}
            className="px-4 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-md transition transform active:scale-95 cursor-pointer flex items-center gap-2 shrink-0 justify-center"
            title="Gerar Link de Pagamento PIX Oficial (adrianosilva1983oficial@gmail.com)"
          >
            <QrCode className="w-5 h-5 text-emerald-200" />
            <span>Link PIX Vendas Online</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNovoCliente(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500 hover:from-amber-400 hover:to-sky-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition transform active:scale-95 cursor-pointer flex items-center gap-2 shrink-0 justify-center"
          >
            <Plus className="w-5 h-5" />
            <span>Cadastrar Novo Cliente & Gerar Base</span>
          </button>
        </div>
      </div>

      {/* Barra de Indicadores Globais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] block">Total de Clientes / Bases</span>
          <strong className="text-lg font-black text-slate-900">{tenants.length} empresas</strong>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] block">Base Ativa no Navegador</span>
          <strong className="text-sm font-black text-emerald-600 truncate block">{tenantAtivo.nomeFantasia}</strong>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] block">Regra de Inadimplência</span>
          <strong className="text-sm font-black text-amber-600">5 dias de carência</strong>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] block">Banco de Dados</span>
          <strong className="text-sm font-black text-sky-600">IndexedDB Isolado</strong>
        </div>
      </div>

      {/* Barra de Busca e Indicador de Tenant Ativo */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente por nome, CNPJ ou contrato..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Banco Local Selecionado:</span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold">
            {tenantAtivo.nomeFantasia} (AquaSaneDB_{tenantAtivo.id})
          </span>
        </div>
      </div>

      {/* Grid de Clientes e suas Respectivas Bases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {tenantsFiltrados.map((cliente) => {
          const statusFin = tenantService.verificarStatusFinanceiroELicenca(cliente.id);
          const isAtivo = tenantAtivo.id === cliente.id;
          const linkWeb = tenantService.gerarLinkSistemaWeb(cliente);
          const linkApk = tenantService.gerarLinkAPKMobile(cliente);

          return (
            <div
              key={cliente.id}
              className={`bg-white rounded-3xl p-5 border transition shadow-xs flex flex-col justify-between gap-4 ${
                isAtivo ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3.5">
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 font-black text-base shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base leading-tight">
                        {cliente.nomeFantasia}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        CNPJ: {cliente.cnpj} • {cliente.contratoNumero}
                      </p>
                    </div>
                  </div>

                  {/* Badge de Status de Licença / Inadimplência */}
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-black border flex items-center gap-1 shrink-0 ${
                      statusFin.modoSomenteLeitura
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : !statusFin.emDia
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {statusFin.modoSomenteLeitura ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                        <span>Bloqueio: Somente Leitura ({statusFin.diasAtraso}d atraso)</span>
                      </>
                    ) : !statusFin.emDia ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Carência: {statusFin.toleranciaRestante}d restantes</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{statusFin.diasRestantes} dias válidos</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Detalhes Técnicos e Banco de Dados Isolado */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base de Dados do Cliente:</span>
                    <strong className="text-emerald-700 font-mono text-[11px]">
                      AquaSaneDB_{cliente.id}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Admin da Empresa:</span>
                    <strong className="text-slate-800 font-mono">{cliente.emailAdmin}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Senha Inicial:</span>
                    <strong className="text-slate-800 font-mono">{cliente.senhaAdminInicial}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Limite de Aparelhos Mobile:</span>
                    <strong className="text-sky-700 font-bold">{cliente.limiteAparelhos} celulares</strong>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* OS DOIS LINKS SOLICITADOS COM DESTAQUE CLARO E NOMES EXATOS */}
                {/* ============================================================== */}
                <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
                  <div className="text-[11px] font-black text-sky-950 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-sky-600" />
                      <span>Links Oficiais de Acesso e Download</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopiarMensagemWhatsApp(cliente)}
                      className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      title="Copiar mensagem com os 2 links formatada para WhatsApp"
                    >
                      <Send className="w-2.5 h-2.5" />
                      <span>{copiadoTipo?.id === cliente.id && copiadoTipo.tipo === 'msg' ? 'Mensagem Copiada!' : 'Copiar Ambos p/ WhatsApp'}</span>
                    </button>
                  </div>

                  {/* 1. LINK SISTEMA WEB - CLIENTE */}
                  <div className="space-y-1 bg-white p-2.5 rounded-xl border border-sky-100">
                    <div className="flex items-center justify-between text-slate-700 font-bold text-[11px]">
                      <span className="flex items-center gap-1 text-slate-900 font-black">
                        💻 Link Sistema Web - Cliente
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAbrirQrCode(cliente, 'web')}
                          className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          title="Ver QR Code do Sistema Web"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={linkWeb}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-md text-sky-600 hover:text-sky-800 hover:bg-sky-50"
                          title="Abrir Sistema Web - Cliente em nova aba"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={linkWeb}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-600 truncate select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopiarLinkWeb(cliente)}
                        className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer ${
                          copiadoTipo?.id === cliente.id && copiadoTipo.tipo === 'web'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-sky-700 hover:bg-sky-800 text-white'
                        }`}
                      >
                        {copiadoTipo?.id === cliente.id && copiadoTipo.tipo === 'web' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiadoTipo?.id === cliente.id && copiadoTipo.tipo === 'web' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. LINK APK MOBILE - CLIENTE */}
                  <div className="space-y-1 bg-white p-2.5 rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-between text-slate-700 font-bold text-[11px]">
                      <span className="flex items-center gap-1 text-emerald-950 font-black">
                        📲 Link APK Mobile - Cliente
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAbrirQrCode(cliente, 'apk')}
                          className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          title="Ver QR Code do APK Mobile"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={linkApk}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                          title="Abrir página de download do APK"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={linkApk}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-600 truncate select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopiarLinkApk(cliente)}
                        className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer ${
                          copiadoTipo?.id === cliente.id && copiadoTipo.tipo === 'apk'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        }`}
                      >
                        {copiadoTipo?.id === cliente.id && copiadoTipo.tipo === 'apk' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiadoTipo?.id === cliente.id && copiadoTipo.tipo === 'apk' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. LINK DE PAGAMENTO PIX OFICIAL */}
                  <div className="flex items-center justify-between bg-emerald-50/90 p-2 rounded-xl border border-emerald-200 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-950 font-black text-[11px]">
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Link PIX Venda Online</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setClienteSelecionadoPix(cliente.nomeFantasia);
                        setModalPixVendas(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer shadow-xs"
                      title="Gerar link de pagamento PIX e QR Code para este cliente"
                    >
                      <Link className="w-3 h-3" />
                      <span>Gerar Link PIX</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Ações de Gestão da Base pelo Administrador Master */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Gestão Master da Base:</span>
                  <button
                    type="button"
                    onClick={() => handleExportarBase(cliente)}
                    className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-bold cursor-pointer"
                    title="Exportar dados da base em JSON"
                  >
                    <Download className="w-3 h-3" />
                    <span>Backup Base (.JSON)</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Alternar e Visualizar a Base no Navegador */}
                  <button
                    type="button"
                    onClick={() => handleSelecionarTenant(cliente.id)}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      isAtivo
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                    title="Carrega os dados e rotas desta base no navegador do Administrador"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{isAtivo ? 'Base Ativa em Uso' : 'Visualizar / Gerir Base'}</span>
                  </button>

                  {/* Renovar Licença */}
                  <button
                    type="button"
                    onClick={() => handleRenovar(cliente.id, 30)}
                    className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    title="Renovar mais 30 dias de licença desta base"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+30 Dias</span>
                  </button>

                  {/* Simular Bloqueio de 5 dias ou Regularizar */}
                  {statusFin.modoSomenteLeitura ? (
                    <button
                      type="button"
                      onClick={() => handleRegularizar(cliente.id)}
                      className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                      title="Desbloquear sistema e regularizar pagamento"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Regularizar Base</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSimularInadimplencia(cliente.id, 6)}
                      className="py-2 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                      title="Testar bloqueio para somente leitura após 5 dias de atraso"
                    >
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Testar Bloqueio 5d</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Cadastro de Novo Cliente */}
      {modalNovoCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Cadastrar Novo Cliente & Base</h3>
                  <p className="text-xs text-slate-500">Cria banco local isolado e gera os links para o cliente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoCliente(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarCliente} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Fantasia da Empresa *</label>
                <input
                  type="text"
                  required
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Ex: Águas de Salvador Saneamento"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nº do Contrato</label>
                  <input
                    type="text"
                    value={contratoNumero}
                    onChange={(e) => setContratoNumero(e.target.value)}
                    placeholder="CT-2026-SAN-01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">E-mail do Administrador da Empresa *</label>
                <input
                  type="email"
                  required
                  value={emailAdmin}
                  onChange={(e) => setEmailAdmin(e.target.value)}
                  placeholder="diretoria@empresa.com.br"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Senha Inicial de Acesso</label>
                  <input
                    type="text"
                    value={senhaAdminInicial}
                    onChange={(e) => setSenhaAdminInicial(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Limite de Celulares Mobile</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={limiteAparelhos}
                    onChange={(e) => setLimiteAparelhos(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Validade Inicial da Licença</label>
                <div className="flex gap-2">
                  {[30, 60, 90, 365].map((dias) => (
                    <button
                      key={dias}
                      type="button"
                      onClick={() => setDiasValidadeLicenca(dias)}
                      className={`flex-1 py-2 rounded-xl font-bold transition cursor-pointer ${
                        diasValidadeLicenca === dias
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {dias} dias
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoCliente(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Criar Base & Gerar Links</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de QR Code para Escanear no Celular */}
      {modalQrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-1">
              {modalQrCode.tipo === 'web' ? '💻 Link Sistema Web - Cliente' : '📲 Link APK Mobile - Cliente'}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              {modalQrCode.cliente.nomeFantasia} • Aponte a câmera do celular para abrir imediatamente.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-center mb-4 shadow-inner">
              <img src={modalQrCode.qrDataUrl} alt="QR Code" className="w-60 h-60 rounded-xl" />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (modalQrCode.tipo === 'web') {
                    handleCopiarLinkWeb(modalQrCode.cliente);
                  } else {
                    handleCopiarLinkApk(modalQrCode.cliente);
                  }
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar {modalQrCode.tipo === 'web' ? 'Link Sistema Web - Cliente' : 'Link APK Mobile - Cliente'}</span>
              </button>

              <button
                type="button"
                onClick={() => setModalQrCode(null)}
                className="w-full py-2 text-slate-500 hover:text-slate-800 font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gerador de Links de Pagamento PIX Vendas Online */}
      <GeradorLinkPixModal
        isOpen={modalPixVendas}
        onClose={() => setModalPixVendas(false)}
        clienteInicial={clienteSelecionadoPix}
      />
    </div>
  );
};
