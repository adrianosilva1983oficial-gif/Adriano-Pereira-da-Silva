import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Link2,
  Copy,
  Check,
  Send,
  ExternalLink,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  X,
  Building2,
  Sparkles,
  ArrowRight,
  Mail,
  Phone,
  UserCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  PIX_OFICIAL_CONFIG,
  PACOTES_VENDAS_ONLINE,
  gerarLinkVendaOnline,
  gerarTextoWhatsAppVenda,
  OpcaoVendaOnline
} from '../services/pixService';

interface GeradorLinkPixModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteInicial?: string;
}

export const GeradorLinkPixModal: React.FC<GeradorLinkPixModalProps> = ({
  isOpen,
  onClose,
  clienteInicial = '',
}) => {
  const [pacoteAtivo, setPacoteAtivo] = useState<OpcaoVendaOnline>(PACOTES_VENDAS_ONLINE[1]); // Pro por padrão
  const [isCustom, setIsCustom] = useState(false);
  const [customValor, setCustomValor] = useState<number>(1500);
  const [customTitulo, setCustomTitulo] = useState('Licenciamento AquaSane Pro');
  const [clienteNome, setClienteNome] = useState(clienteInicial);

  // Dados gerados
  const [linkGerado, setLinkGerado] = useState('');
  const [pixCopiaECola, setPixCopiaECola] = useState('');
  const [faturaId, setFaturaId] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // Estados de feedback de cópia
  const [copiadoLink, setCopiadoLink] = useState(false);
  const [copiadoPix, setCopiadoPix] = useState(false);
  const [copiadoChave, setCopiadoChave] = useState(false);

  // Recalcula o link e o PIX sempre que mudar o pacote, valor ou cliente
  useEffect(() => {
    const valorAtual = isCustom ? customValor : pacoteAtivo.valor;
    const tituloAtual = isCustom ? customTitulo : pacoteAtivo.titulo;
    const planoId = isCustom ? 'PERSONALIZADO' : pacoteAtivo.planoId;

    const res = gerarLinkVendaOnline({
      planoId,
      valor: valorAtual > 0 ? valorAtual : 100,
      clienteNome,
      titulo: tituloAtual,
    });

    setLinkGerado(res.url);
    setPixCopiaECola(res.pixCopiaECola);
    setFaturaId(res.faturaId);

    // Gera o QR Code visual
    QRCode.toDataURL(res.pixCopiaECola, { width: 260, margin: 1, color: { dark: '#020617', light: '#ffffff' } })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Erro ao gerar QR Code:', err));
  }, [pacoteAtivo, isCustom, customValor, customTitulo, clienteNome]);

  if (!isOpen) return null;

  const valorExibicao = isCustom ? customValor : pacoteAtivo.valor;
  const tituloExibicao = isCustom ? customTitulo : pacoteAtivo.titulo;

  const handleCopiarLink = () => {
    navigator.clipboard.writeText(linkGerado);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 3000);
  };

  const handleCopiarPix = () => {
    navigator.clipboard.writeText(pixCopiaECola);
    setCopiadoPix(true);
    setTimeout(() => setCopiadoPix(false), 3000);
  };

  const handleCopiarChave = () => {
    navigator.clipboard.writeText(PIX_OFICIAL_CONFIG.chave);
    setCopiadoChave(true);
    setTimeout(() => setCopiadoChave(false), 3000);
  };

  const handleCompartilharWhatsApp = () => {
    const texto = gerarTextoWhatsAppVenda({
      clienteNome,
      titulo: tituloExibicao,
      valor: valorExibicao,
      url: linkGerado,
      pixCopiaECola,
      faturaId,
    });
    const waUrl = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-800 shadow-2xl overflow-hidden my-auto text-white flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-sky-950 to-slate-900 border-b border-sky-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">Link de Pagamento PIX Oficial</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Vendas Online 24h
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Chave Oficial: <strong className="text-emerald-300 font-mono">{PIX_OFICIAL_CONFIG.chave}</strong> (Adriano Silva)
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

        {/* Corpo com Abas de Pacotes e Dados do Pagamento */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Seletor de Pacote ou Valor Personalizado */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                1. Selecione o Pacote ou Digite o Valor da Venda:
              </span>
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 transition cursor-pointer"
              >
                {isCustom ? '← Voltar aos Planos Padronizados' : '+ Personalizar Valor e Contrato'}
              </button>
            </div>

            {!isCustom ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PACOTES_VENDAS_ONLINE.map((pacote) => {
                  const isSel = pacoteAtivo.id === pacote.id;
                  return (
                    <div
                      key={pacote.id}
                      onClick={() => setPacoteAtivo(pacote)}
                      className={`relative p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                        isSel
                          ? 'bg-sky-950/60 border-sky-400 shadow-lg shadow-sky-950/50 ring-2 ring-sky-400/20'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {pacote.popular && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                          Mais Vendido
                        </span>
                      )}
                      <div>
                        <span className="text-[10px] text-sky-400 font-mono font-bold block">{pacote.subtitulo}</span>
                        <h4 className="font-black text-sm text-white mt-0.5">{pacote.titulo}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{pacote.descricao}</p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-baseline justify-between">
                        <span className="text-xl font-black text-emerald-400">
                          R$ {pacote.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[11px] font-bold ${isSel ? 'text-sky-300' : 'text-slate-500'}`}>
                          {isSel ? '✓ Ativo' : 'Selecionar'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Formulário Customizado */
              <div className="bg-slate-950 p-4 rounded-2xl border border-sky-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Título do Serviço / Contrato:
                  </label>
                  <input
                    type="text"
                    value={customTitulo}
                    onChange={(e) => setCustomTitulo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-sky-400"
                    placeholder="Ex: Licença AquaSane Pro + Implantação de Campo"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Valor Total (R$):
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="1"
                    value={customValor}
                    onChange={(e) => setCustomValor(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-emerald-400 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dados Opcionais do Cliente */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-bold shrink-0">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Cliente / Empresa (Opcional para personalizar o link):</span>
            </div>
            <input
              type="text"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              placeholder="Ex: Águas de Salvador Engenharia Ltda"
            />
          </div>

          {/* Destaque do Link de Pagamento Gerado */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-4 sm:p-5 rounded-3xl border border-sky-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h4 className="font-black text-sm text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-sky-400" />
                  <span>Link de Pagamento Online Gerado com Sucesso</span>
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                R$ {valorExibicao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Caixa do Link Completo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold">Link de Checkout Direto (Envie para o cliente clicar):</span>
                <span className="text-[10px] text-sky-400">Abre direto no computador ou celular</span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-[11px] font-mono text-sky-200 break-all select-all flex items-center">
                  {linkGerado}
                </div>
                <button
                  type="button"
                  onClick={handleCopiarLink}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition shrink-0"
                >
                  {copiadoLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiadoLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                </button>
                <a
                  href={linkGerado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 border border-slate-700 transition shrink-0"
                  title="Testar a visualização que o cliente terá"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Abrir Checkout</span>
                </a>
              </div>
            </div>

            {/* Grid com QR Code do PIX e Código Copia e Cola */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
              {/* QR Code */}
              <div className="md:col-span-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
                {qrCodeDataUrl ? (
                  <div className="p-2 bg-white rounded-xl shadow-lg">
                    <img src={qrCodeDataUrl} alt="QR Code PIX Oficial" className="w-36 h-36 mx-auto rounded" />
                  </div>
                ) : (
                  <div className="w-36 h-36 bg-slate-800 rounded-xl flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-slate-600 animate-pulse" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Favorecido Oficial</span>
                  <strong className="text-xs text-white font-black">{PIX_OFICIAL_CONFIG.titular}</strong>
                  <span className="text-[10px] text-emerald-400 block font-mono">Salvador - BA</span>
                </div>
              </div>

              {/* Informações da Chave e Copia e Cola */}
              <div className="md:col-span-8 space-y-3">
                {/* Chave E-mail e Telefone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="flex items-center gap-1 font-bold">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        Chave PIX (E-mail):
                      </span>
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        Oficial
                      </span>
                    </div>
                    <div className="font-mono text-xs text-emerald-300 font-black break-all select-all">
                      {PIX_OFICIAL_CONFIG.chave}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopiarChave}
                      className="w-full mt-1 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      {copiadoChave ? <Check className="w-3 h-3 text-emerald-200" /> : <Copy className="w-3 h-3" />}
                      <span>{copiadoChave ? 'Chave Copiada!' : 'Copiar Chave'}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="flex items-center gap-1 font-bold">
                        <Phone className="w-3.5 h-3.5 text-sky-400" />
                        WhatsApp Suporte:
                      </span>
                      <span className="text-[9px] bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded border border-sky-500/30">
                        Bahia
                      </span>
                    </div>
                    <div className="font-mono text-xs text-sky-300 font-black">
                      (71) 99936-8282
                    </div>
                    <a
                      href="https://wa.me/5571999368282"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mt-1 py-1 rounded-lg bg-sky-700 hover:bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition text-center"
                    >
                      <Send className="w-3 h-3" />
                      <span>Abrir WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Código PIX Copia e Cola EMV */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1 font-bold">
                      <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                      Código PIX Copia e Cola (EMV Banco Central):
                    </span>
                    <span className="text-[10px] text-slate-400">Qualquer banco</span>
                  </div>
                  <div className="font-mono text-[10px] text-emerald-300 break-all select-all bg-slate-900 p-2 rounded-lg border border-slate-800 max-h-16 overflow-y-auto">
                    {pixCopiaECola}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopiarPix}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                    >
                      {copiadoPix ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiadoPix ? '✓ Código PIX Copiado!' : 'Copiar Código PIX'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCompartilharWhatsApp}
                      className="flex-1 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Enviar no WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pagamento instantâneo via Banco Central com liberação direta do sistema.</span>
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
