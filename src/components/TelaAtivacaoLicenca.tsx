import React, { useState } from 'react';
import {
  Smartphone,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  Copy,
  MessageCircle,
  Building2,
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import {
  licenciamentoService,
  MASTER_EMAIL,
  MASTER_NOME,
} from '../services/licenciamentoService';

interface TelaAtivacaoLicencaProps {
  onDispositivoAtivado: () => void;
  onAbrirPainelMaster: () => void;
}

export const TelaAtivacaoLicenca: React.FC<TelaAtivacaoLicencaProps> = ({
  onDispositivoAtivado,
  onAbrirPainelMaster,
}) => {
  const deviceId = licenciamentoService.getDeviceId();
  const currentIMEI = licenciamentoService.getDeviceIMEI();
  const licencaAtual = licenciamentoService.getLicencaAtual();
  const empresas = licenciamentoService.getEmpresas();

  const [imeiInput, setImeiInput] = useState(licencaAtual?.imeiAparelho || currentIMEI);
  const [chaveDigitada, setChaveDigitada] = useState('');
  const [empresaSelecionada, setEmpresaSelecionada] = useState(
    licencaAtual?.empresaId || empresas[0]?.id || ''
  );
  const [nomeOperador, setNomeOperador] = useState(licencaAtual?.cadastristaNome || '');
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [copiadoIMEI, setCopiadoIMEI] = useState(false);

  // Master Login rápido
  const [mostraMasterLogin, setMostraMasterLogin] = useState(false);
  const [senhaMaster, setSenhaMaster] = useState('');

  const handleCopiarId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleCopiarIMEI = () => {
    navigator.clipboard.writeText(imeiInput);
    setCopiadoIMEI(true);
    setTimeout(() => setCopiadoIMEI(false), 3000);
  };

  const handleAtivar = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);

    if (!chaveDigitada.trim()) {
      setMensagemErro('Por favor, informe a Chave de Liberação fornecida pelo administrador.');
      return;
    }

    const resultado = licenciamentoService.ativarPorChave(
      chaveDigitada,
      empresaSelecionada,
      nomeOperador,
      imeiInput
    );

    if (resultado.success) {
      setMensagemSucesso(resultado.message);
      setTimeout(() => {
        onDispositivoAtivado();
      }, 1200);
    } else {
      setMensagemErro(resultado.message);
    }
  };

  const handleMasterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (licenciamentoService.loginMaster(senhaMaster)) {
      onAbrirPainelMaster();
    } else {
      setMensagemErro('Senha Mestre incorreta. Acesso restrito a Adriano Silva.');
    }
  };

  const empresaAtualObj = empresas.find((e) => e.id === empresaSelecionada) || empresas[0];

  const textoWhatsApp = encodeURIComponent(
    `Olá ${MASTER_NOME} (${MASTER_EMAIL}), solicito a liberação de Licença Única no valor de R$ 99,00 para este aparelho celular.\n\n` +
      `📱 IMEI do Aparelho Celular: ${imeiInput || currentIMEI}\n` +
      `🆔 ID do Aparelho: ${deviceId}\n` +
      `💵 Valor da Licença: R$ 99,00 (Licença Única vinculada ao IMEI)\n` +
      `🏢 Empresa Prestadora: ${empresaAtualObj?.nomeFantasia || 'Prestadora de Saneamento'}\n` +
      `👤 Operador/Cadastrista: ${nomeOperador || 'A definir'}`
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-slate-800/90 rounded-3xl border border-slate-700 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Cabeçalho de Proteção */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
            <Smartphone className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Licença Única • R$ 99,00 por Celular (IMEI)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Aparelho Pendente de Ativação
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            O sistema opera com <strong>licença única por aparelho celular vinculado ao IMEI</strong> no valor fixo de <strong>R$ 99,00</strong>.
          </p>
        </div>

        {/* Caixa com IMEI e ID Único deste Smartphone */}
        <div className="space-y-3 mb-5">
          {/* Campo de IMEI */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-emerald-500/40">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-400">
                IMEI do Aparelho (15 Dígitos):
              </span>
              {copiadoIMEI && <span className="text-emerald-400 text-[10px] font-bold">IMEI Copiado!</span>}
            </div>
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={imeiInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 15);
                  setImeiInput(val);
                  licenciamentoService.setDeviceIMEI(val);
                }}
                maxLength={15}
                placeholder="IMEI (15 dígitos)"
                className="font-mono text-base font-black text-emerald-300 tracking-wider bg-transparent border-none focus:outline-none w-full"
              />
              <button
                type="button"
                onClick={handleCopiarIMEI}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer shrink-0"
                title="Copiar IMEI"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Licença única intransferível vinculada a este IMEI físico (R$ 99,00).
            </span>
          </div>

          {/* ID Interno */}
          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-0.5">
              <span className="font-semibold uppercase tracking-wider text-[9px]">ID do Hardware:</span>
              {copiado && <span className="text-sky-400 text-[9px] font-bold">Copiado!</span>}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-sky-400 tracking-wider truncate">
                {deviceId}
              </span>
              <button
                type="button"
                onClick={handleCopiarId}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="Copiar ID do Aparelho"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {mensagemErro && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{mensagemErro}</span>
          </div>
        )}

        {mensagemSucesso && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        {/* Formulário de Ativação com a Chave */}
        <form onSubmit={handleAtivar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Empresa Prestadora Contratante
            </label>
            <div className="relative">
              <select
                value={empresaSelecionada}
                onChange={(e) => setEmpresaSelecionada(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-sky-500 transition"
              >
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nomeFantasia} ({emp.contratoNumero})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Colaborador / Cadastrista Responsável
            </label>
            <input
              type="text"
              placeholder="Ex: Adelmo Ribeiro ou Equipe 01"
              value={nomeOperador}
              onChange={(e) => setNomeOperador(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Chave de Liberação do Aparelho (16 Dígitos)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: LIB-XXXX-XXXX"
                value={chaveDigitada}
                onChange={(e) => setChaveDigitada(e.target.value.toUpperCase())}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white font-mono uppercase tracking-wider focus:outline-hidden focus:border-sky-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 active:scale-98 transition cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Ativar Licença Deste Celular</span>
          </button>
        </form>

        {/* Botão de Solicitação Direta via WhatsApp ao Adriano Silva */}
        <div className="mt-5 pt-5 border-t border-slate-700/60 flex flex-col gap-2.5">
          <a
            href={`https://wa.me/?text=${textoWhatsApp}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Solicitar Chave via WhatsApp ao Master</span>
          </a>

          <div className="text-[11px] text-center text-slate-400">
            Administrador Master:{' '}
            <strong className="text-slate-200">{MASTER_NOME}</strong> ({MASTER_EMAIL})
          </div>
        </div>

        {/* Atalho de Acesso Master Direto para Adriano Silva */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          {!mostraMasterLogin ? (
            <button
              type="button"
              onClick={() => setMostraMasterLogin(true)}
              className="text-[11px] text-slate-500 hover:text-sky-400 transition cursor-pointer"
            >
              🔒 Sou o Proprietário / Administrador Master
            </button>
          ) : (
            <form onSubmit={handleMasterLogin} className="mt-2 space-y-2">
              <input
                type="password"
                placeholder="Senha Master de Administrador"
                value={senhaMaster}
                onChange={(e) => setSenhaMaster(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  Entrar no Painel Master
                </button>
                <button
                  type="button"
                  onClick={() => setMostraMasterLogin(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
