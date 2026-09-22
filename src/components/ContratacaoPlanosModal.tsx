import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  Sparkles,
  Building2,
  Smartphone,
  Calendar,
  Zap,
  Clock,
  ArrowRight,
  RefreshCw,
  X,
  Mail,
  Phone,
  Send,
  Check
} from 'lucide-react';
import QRCode from 'qrcode';
import { tenantService, PLANOS_AQUASANE, ClienteTenant } from '../services/tenantService';
import { PlanoAquaSane, RegistroPagamento } from '../types/licenciamento';
import { PIX_OFICIAL_CONFIG, gerarPixCopiaEColaEMV } from '../services/pixService';

interface ContratacaoPlanosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPagamentoConfirmado?: () => void;
}

export const ContratacaoPlanosModal: React.FC<ContratacaoPlanosModalProps> = ({
  isOpen,
  onClose,
  onPagamentoConfirmado,
}) => {
  const [activeTenant, setActiveTenant] = useState<ClienteTenant>(tenantService.getActiveTenant());
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoAquaSane>(PLANOS_AQUASANE[1]); // PRO por padrão
  const [faturaAtual, setFaturaAtual] = useState<RegistroPagamento | null>(null);
  const [linkPagamentoGerado, setLinkPagamentoGerado] = useState<string>('');
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string>('');
  const [copiado, setCopiado] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);
  const [copiadoEmail, setCopiadoEmail] = useState(false);
  const [copiadoTelefone, setCopiadoTelefone] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Campos do Cartão de Crédito
  const [cartaoNumero, setCartaoNumero] = useState('');
  const [cartaoNome, setCartaoNome] = useState('');
  const [cartaoValidade, setCartaoValidade] = useState('');
  const [cartaoCVV, setCartaoCVV] = useState('');
  const [cartaoParcelas, setCartaoParcelas] = useState('1');

  // Chaves Oficiais Adriano Silva
  const chavePixEmailOficial = PIX_OFICIAL_CONFIG.chave;
  const chavePixTelefoneOficial = '71999368282';
  const titularOficial = PIX_OFICIAL_CONFIG.titular;

  // Detecção de Acesso de Checkout Online via Link
  const [isCheckoutOnline, setIsCheckoutOnline] = useState(false);
  const [checkoutClienteParam, setCheckoutClienteParam] = useState('');
  const [checkoutTituloParam, setCheckoutTituloParam] = useState('');

  // Dados para novo contratante
  const [modoNovoCliente, setModoNovoCliente] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoCnpj, setNovoCnpj] = useState('');

  // Status de Adimplência
  const [statusFinanceiro, setStatusFinanceiro] = useState(
    tenantService.verificarStatusFinanceiroELicenca()
  );

  useEffect(() => {
    if (isOpen) {
      const tenant = tenantService.getActiveTenant();
      setActiveTenant(tenant);
      setStatusFinanceiro(tenantService.verificarStatusFinanceiroELicenca(tenant.id));

      let planoEncontrado = PLANOS_AQUASANE.find((p) => p.id === tenant.planoId) || PLANOS_AQUASANE[1];

      // Verifica se há parâmetros de checkout online na URL
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const isOnline = params.get('checkout') === 'true' || !!params.get('fatura');
        setIsCheckoutOnline(isOnline);

        const pPlano = params.get('plano');
        const pValor = params.get('valor');
        const pCliente = params.get('cliente');
        const pTitulo = params.get('titulo');

        if (pCliente) setCheckoutClienteParam(pCliente);
        if (pTitulo) setCheckoutTituloParam(pTitulo);

        if (pPlano) {
          const match = PLANOS_AQUASANE.find((pl) => pl.id === pPlano.toUpperCase());
          if (match) {
            planoEncontrado = { ...match };
            if (pValor && !isNaN(Number(pValor)) && Number(pValor) > 0) {
              planoEncontrado.valorMensal = Number(pValor);
            }
          }
        }
      }

      setPlanoSelecionado(planoEncontrado);

      // Gera ou busca fatura inicial
      gerarCobranca(planoEncontrado, tenant);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const gerarCobranca = (plano: PlanoAquaSane, tenant: ClienteTenant) => {
    const res = tenantService.gerarFaturaELinkPagamento(plano.id as any, tenant.id);
    setFaturaAtual(res.fatura);
    setLinkPagamentoGerado(res.linkPagamento);
    if (res.fatura.pixCopiaECola) {
      QRCode.toDataURL(res.fatura.pixCopiaECola, { width: 220, margin: 1 })
        .then((url) => setPixQrCodeUrl(url))
        .catch((err) => console.error('Erro ao gerar QR Code PIX:', err));
    }
  };

  const handleSelecionarPlano = (plano: PlanoAquaSane) => {
    setPlanoSelecionado(plano);
    gerarCobranca(plano, activeTenant);
  };

  const handleCopiarPix = () => {
    if (!faturaAtual) return;
    navigator.clipboard.writeText(faturaAtual.pixCopiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleCopiarLink = () => {
    if (!linkPagamentoGerado) return;
    navigator.clipboard.writeText(linkPagamentoGerado);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 3000);
  };

  const handleCopiarEmail = () => {
    navigator.clipboard.writeText(chavePixEmailOficial);
    setCopiadoEmail(true);
    setTimeout(() => setCopiadoEmail(false), 3000);
  };

  const handleCopiarTelefone = () => {
    navigator.clipboard.writeText(chavePixTelefoneOficial);
    setCopiadoTelefone(true);
    setTimeout(() => setCopiadoTelefone(false), 3000);
  };

  const handlePagarComCartao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faturaAtual) return;
    if (cartaoNumero.replace(/\s/g, '').length < 13) {
      return;
    }
    setProcessando(true);
    setTimeout(() => {
      const res = tenantService.confirmarPagamentoFatura(faturaAtual.id);
      setProcessando(false);
      if (res.sucesso) {
        setMensagemSucesso(`Pagamento no Cartão de Crédito aprovado em ${cartaoParcelas}x! Sistema renovado com sucesso por 30 dias.`);
        setStatusFinanceiro(tenantService.verificarStatusFinanceiroELicenca(activeTenant.id));
        if (onPagamentoConfirmado) onPagamentoConfirmado();
      }
    }, 1500);
  };

  const handleConfirmarPagamentoSimulado = () => {
    if (!faturaAtual) return;
    setProcessando(true);

    setTimeout(() => {
      const res = tenantService.confirmarPagamentoFatura(faturaAtual.id);
      setProcessando(false);
      if (res.sucesso) {
        setMensagemSucesso(res.mensagem);
        setStatusFinanceiro(tenantService.verificarStatusFinanceiroELicenca(activeTenant.id));
        if (onPagamentoConfirmado) onPagamentoConfirmado();
      }
    }, 1200);
  };

  const handleCriarNovoTenantCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novoEmail.trim()) return;

    setProcessando(true);
    setTimeout(() => {
      const { cliente } = tenantService.criarNovoCliente({
        nomeFantasia: novoNome.trim(),
        emailAdmin: novoEmail.trim(),
        cnpj: novoCnpj.trim() || '00.000.000/0001-00',
        limiteAparelhos: planoSelecionado.limiteAparelhos,
      });

      tenantService.setActiveTenant(cliente.id);
      setActiveTenant(cliente);

      const res = tenantService.gerarFaturaELinkPagamento(planoSelecionado.id as any, cliente.id);
      setFaturaAtual(res.fatura);
      setLinkPagamentoGerado(res.linkPagamento);
      setModoNovoCliente(false);
      setProcessando(false);
      setStatusFinanceiro(tenantService.verificarStatusFinanceiroELicenca(cliente.id));
      setMensagemSucesso(`Ambiente isolado criado para ${cliente.nomeFantasia}! Prossiga com o pagamento para ativação.`);
    }, 800);
  };

  const handleSimularInadimplencia = () => {
    tenantService.simularInadimplencia(activeTenant.id, 6);
    setStatusFinanceiro(tenantService.verificarStatusFinanceiroELicenca(activeTenant.id));
  };

  const handleRestabelecerAdimplencia = () => {
    tenantService.simularRegularizacao(activeTenant.id);
    setStatusFinanceiro(tenantService.verificarStatusFinanceiroELicenca(activeTenant.id));
    setMensagemSucesso('Licença restabelecida com 30 dias de vigência!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-auto text-slate-800">
        {/* Cabeçalho do Modal */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              AS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Planos & Assinatura AquaSane Pro</h2>
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold border border-sky-500/30">
                  FATURAMENTO OFICIAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Licenciamento comercial, link de pagamento automático e liberação instantânea de banco de dados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerta de Status Financeiro / Regra de 5 Dias de Inadimplência ou Checkout Online */}
        <div className="px-6 pt-5 space-y-3">
          {/* Banner Especial de Checkout Online via Link */}
          {isCheckoutOnline && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/50 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                      Checkout Online Oficial • Venda Direta
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                      PIX Instantâneo
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    {checkoutTituloParam || planoSelecionado.nome}
                    {checkoutClienteParam && (
                      <span className="text-emerald-400 font-normal"> — Faturamento para: {checkoutClienteParam}</span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Favorecido: <strong className="text-white font-bold">{titularOficial}</strong> • Chave PIX Oficial:{' '}
                    <strong className="text-emerald-300 font-mono">{chavePixEmailOficial}</strong>
                  </p>
                </div>
              </div>
              <div className="sm:text-right shrink-0 bg-slate-950/80 px-4 py-2 rounded-xl border border-emerald-500/30">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Valor a Pagar:</span>
                <span className="text-xl font-black text-emerald-400">
                  R$ {(faturaAtual?.valor || planoSelecionado.valorMensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {statusFinanceiro.bloqueadoPorInadimplencia ? (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-rose-900 uppercase tracking-wide">
                      Modo Somente Leitura Ativo (Inadimplência Superior a 5 Dias)
                    </h3>
                  </div>
                  <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                    A licença deste cliente está vencida há <strong>{statusFinanceiro.diasAtraso} dias</strong>. Por segurança e conformidade,
                    novos cadastros e edições estão bloqueados. Realize o pagamento para desbloqueio imediato de todas as funções.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-rose-200 text-rose-900 font-black text-xs shrink-0">
                BLOQUEIO ATIVO
              </span>
            </div>
          ) : !statusFinanceiro.emDia ? (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-900">
                    Aviso: Fatura em Atraso • Período de Tolerância de 5 Dias
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Restam <strong>{statusFinanceiro.toleranciaRestante} dia(s)</strong> de carência antes do bloqueio em modo somente leitura.
                    Efetue a quitação para manter a operação em campo ininterrupta.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-amber-200 text-amber-900 font-black text-xs shrink-0">
                {statusFinanceiro.toleranciaRestante} DIAS DE TOLERÂNCIA
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Licença Regularizada: <strong>{activeTenant.nomeFantasia}</strong> • Restam{' '}
                  <strong>{statusFinanceiro.diasRestantes} dias</strong> de vigência ativa.
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[11px]">
                EM DIA
              </span>
            </div>
          )}

          {mensagemSucesso && (
            <div className="mt-3 p-3 rounded-xl bg-sky-50 border border-sky-300 text-sky-900 text-xs font-semibold flex items-center justify-between">
              <span>{mensagemSucesso}</span>
              <button onClick={() => setMensagemSucesso(null)} className="text-sky-700 hover:text-sky-950 font-bold">
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Corpo: Seleção de Planos & Checkout */}
        <div className="p-6 space-y-6">
          {/* Tabela de Planos Oficiais */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Escolha o Plano Ideal para a Operação</h3>
                <p className="text-xs text-slate-500">Valores transparentes com ativação de banco de dados isolado</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setModoNovoCliente(!modoNovoCliente)}
                  className="px-3 py-1 rounded-lg border border-slate-300 hover:border-slate-400 font-bold text-slate-700 transition cursor-pointer"
                >
                  {modoNovoCliente ? 'Usar Cliente Atual' : '+ Contratar para Nova Empresa'}
                </button>
              </div>
            </div>

            {/* Formulário de Nova Empresa (se selecionado) */}
            {modoNovoCliente && (
              <form onSubmit={handleCriarNovoTenantCheckout} className="mb-4 p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                  <Building2 className="w-4 h-4 text-sky-700" />
                  <span>Cadastrar Nova Empresa / Cliente para Criação de Banco Local Isolado:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nome Fantasia da Empresa *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Águas de Camaçari Ltda"
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-sky-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">E-mail do Administrador *</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@empresa.com.br"
                      value={novoEmail}
                      onChange={(e) => setNovoEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-sky-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CNPJ (Opcional)</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={novoCnpj}
                      onChange={(e) => setNovoCnpj(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-sky-600 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={processando}
                    className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    {processando ? 'Configurando...' : 'Gerar Banco e Cobrança'}
                  </button>
                </div>
              </form>
            )}

            {/* Grid dos 3 Planos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {PLANOS_AQUASANE.map((plano) => {
                const isSelected = planoSelecionado.id === plano.id;
                return (
                  <div
                    key={plano.id}
                    onClick={() => handleSelecionarPlano(plano)}
                    className={`rounded-2xl p-4 transition-all cursor-pointer border flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/40 shadow-lg ring-2 ring-sky-500/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {plano.badge && (
                      <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-sky-700 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                        {plano.badge}
                      </span>
                    )}
                    <div>
                      <h4 className="font-black text-sm text-slate-900">{plano.nome}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{plano.descricao}</p>
                      <div className="my-3">
                        <span className="text-2xl font-black text-slate-900">
                          R$ {plano.valorMensal.toFixed(0)}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold"> /mês</span>
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-slate-600 border-t border-slate-100 pt-3">
                        {plano.recursos.map((rec, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition ${
                        isSelected
                          ? 'bg-sky-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? '✓ Plano Selecionado' : 'Selecionar Plano'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seção de Pagamento Gerado Automaticamente */}
          {faturaAtual && (
            <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <h4 className="font-bold text-sm text-white">Fatura e Dados Oficiais de Pagamento</h4>
                  </div>
                  <p className="text-xs text-slate-400">
                    Fatura #{faturaAtual.id} • Cliente: <strong>{activeTenant.nomeFantasia}</strong> • Valor:{' '}
                    <strong className="text-emerald-400">R$ {faturaAtual.valor.toFixed(2)}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setMetodoPagamento('pix')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      metodoPagamento === 'pix'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>PIX Instantâneo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPagamento('cartao')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      metodoPagamento === 'cartao'
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Cartão de Crédito</span>
                  </button>
                </div>
              </div>

              {/* ABA 1: PIX INSTANTÂNEO COM DADOS DO ADRIANO SILVA */}
              {metodoPagamento === 'pix' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* QR Code e Titular */}
                  <div className="md:col-span-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-2.5">
                    {pixQrCodeUrl ? (
                      <div className="p-2 bg-white rounded-xl shadow-md">
                        <img src={pixQrCodeUrl} alt="QR Code PIX" className="w-36 h-36 mx-auto rounded" />
                      </div>
                    ) : (
                      <div className="w-36 h-36 bg-slate-800 rounded-xl flex items-center justify-center">
                        <QrCode className="w-12 h-12 text-slate-600 animate-pulse" />
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Favorecido / Titular</span>
                      <strong className="text-xs text-white font-black">{titularOficial}</strong>
                      <span className="text-[10px] text-emerald-400 block mt-0.5">Salvador - BA</span>
                    </div>
                  </div>

                  {/* Chaves Oficiais e Copia e Cola */}
                  <div className="md:col-span-8 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Chave E-mail */}
                      <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span className="flex items-center gap-1 font-bold">
                            <Mail className="w-3.5 h-3.5 text-emerald-400" />
                            Chave PIX (E-mail):
                          </span>
                          <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            Oficial
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-emerald-300 font-bold break-all bg-slate-950 p-1.5 rounded border border-slate-800">
                          {chavePixEmailOficial}
                        </div>
                        <button
                          type="button"
                          onClick={handleCopiarEmail}
                          className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          {copiadoEmail ? <Check className="w-3 h-3 text-emerald-200" /> : <Copy className="w-3 h-3" />}
                          <span>{copiadoEmail ? 'E-mail Copiado!' : 'Copiar E-mail PIX'}</span>
                        </button>
                      </div>

                      {/* Chave Telefone */}
                      <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span className="flex items-center gap-1 font-bold">
                            <Phone className="w-3.5 h-3.5 text-sky-400" />
                            Chave PIX (Telefone):
                          </span>
                          <span className="text-[9px] text-sky-400 font-bold bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-500/30">
                            WhatsApp
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-sky-300 font-bold break-all bg-slate-950 p-1.5 rounded border border-slate-800">
                          (71) 99936-8282
                        </div>
                        <button
                          type="button"
                          onClick={handleCopiarTelefone}
                          className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          {copiadoTelefone ? <Check className="w-3 h-3 text-sky-200" /> : <Copy className="w-3 h-3" />}
                          <span>{copiadoTelefone ? 'Telefone Copiado!' : 'Copiar Telefone PIX'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Código PIX Copia e Cola EMV */}
                    <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="flex items-center gap-1 font-bold">
                          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                          Código PIX Copia e Cola (Valor: R$ {faturaAtual.valor.toFixed(2)}):
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-emerald-300 break-all select-all bg-slate-950 p-2 rounded border border-slate-800 max-h-14 overflow-y-auto">
                        {faturaAtual.pixCopiaECola}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopiarPix}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiado ? '✓ Código PIX Copiado!' : 'Copiar Código PIX Copia e Cola'}</span>
                        </button>
                        <a
                          href={`https://wa.me/5571999368282?text=${encodeURIComponent(`Olá Adriano Silva! Acabei de gerar a fatura #${faturaAtual.id} de R$ ${faturaAtual.valor.toFixed(2)} da empresa ${activeTenant.nomeFantasia}. Segue o comprovante de pagamento via PIX para liberação do sistema!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold text-xs flex items-center gap-1.5 transition"
                          title="Enviar comprovante via WhatsApp para 71 99936-8282"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WhatsApp Comprovante</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: CARTÃO DE CRÉDITO COM CHECKOUT */}
              {metodoPagamento === 'cartao' && (
                <form onSubmit={handlePagarComCartao} className="space-y-3">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-sky-400" />
                        Dados do Cartão de Crédito
                      </span>
                      <span className="text-[10px] text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                        Ambiente Seguro Criptografado SSL
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Número do Cartão
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="0000 0000 0000 0000"
                          value={cartaoNumero}
                          onChange={(e) => setCartaoNumero(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Nome Impresso no Cartão
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="EX: ADRIANO SILVA"
                          value={cartaoNome}
                          onChange={(e) => setCartaoNome(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Validade (MM/AA)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="12/28"
                          maxLength={5}
                          value={cartaoValidade}
                          onChange={(e) => setCartaoValidade(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-sky-500 text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          CVV (Segurança)
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="•••"
                          maxLength={4}
                          value={cartaoCVV}
                          onChange={(e) => setCartaoCVV(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-sky-500 text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Parcelamento
                        </label>
                        <select
                          value={cartaoParcelas}
                          onChange={(e) => setCartaoParcelas(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                        >
                          <option value="1">1x de R$ {faturaAtual.valor.toFixed(2)} (à vista)</option>
                          <option value="2">2x de R$ {(faturaAtual.valor / 2).toFixed(2)} sem juros</option>
                          <option value="3">3x de R$ {(faturaAtual.valor / 3).toFixed(2)} sem juros</option>
                          <option value="6">6x de R$ {(faturaAtual.valor / 6).toFixed(2)} sem juros</option>
                          <option value="12">12x de R$ {(faturaAtual.valor / 12).toFixed(2)} sem juros</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">
                      Total: <strong className="text-white">R$ {faturaAtual.valor.toFixed(2)}</strong> em{' '}
                      <strong className="text-sky-400">{cartaoParcelas}x</strong> de R${' '}
                      {(faturaAtual.valor / parseInt(cartaoParcelas, 10)).toFixed(2)}
                    </span>
                    <button
                      type="submit"
                      disabled={processando}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-sky-900/30 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{processando ? 'Processando Cartão...' : 'Confirmar Pagamento com Cartão'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Ação de Simulação e Confirmação de Pagamento para Teste Real */}
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-slate-400 text-[11px] text-center sm:text-left">
                  <span>Ao confirmar o pagamento, o banco de dados do cliente é desbloqueado e estendido por 30 dias.</span>
                </div>
                <button
                  type="button"
                  disabled={processando}
                  onClick={handleConfirmarPagamentoSimulado}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-900/30 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>{processando ? 'Validando...' : 'Simular Confirmação e Desbloqueio'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Barra de Ferramentas de Auditoria e Teste do Prazo de 5 Dias */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-700" />
                Auditoria de Segurança da Regra de Inadimplência
              </span>
              <p className="text-[11px] text-slate-500">
                A tolerância legal permite 5 dias de atraso. No 6º dia, o sistema entra em modo somente leitura até a quitação.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimularInadimplencia}
                className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs transition cursor-pointer"
                title="Testar o bloqueio de 5 dias agora"
              >
                Simular Inadimplência (&gt;5 dias)
              </button>
              <button
                type="button"
                onClick={handleRestabelecerAdimplencia}
                className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs transition cursor-pointer"
                title="Restabelecer adimplência"
              >
                Restabelecer 30 Dias
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
