import React, { useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  ShieldAlert,
  Volume2,
  X,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { AlertaUrgentePush } from '../services/pushNotificationService';

interface ModalAlertaUrgenteRecebidoProps {
  alerta: AlertaUrgentePush;
  nomeTecnico: string;
  tecnicoId: string;
  onConfirmarRecebimento: (alertaId: string) => void;
  onVerOS?: (matricula: string) => void;
  onFechar: () => void;
}

export const ModalAlertaUrgenteRecebido: React.FC<ModalAlertaUrgenteRecebidoProps> = ({
  alerta,
  nomeTecnico,
  tecnicoId,
  onConfirmarRecebimento,
  onVerOS,
  onFechar,
}) => {
  const [confirmando, setConfirmando] = useState(false);
  const [confirmadoSucesso, setConfirmadoSucesso] = useState(
    alerta.confirmadoPor.some((c) => c.tecnicoId === tecnicoId)
  );

  const handleConfirmar = () => {
    setConfirmando(true);
    setTimeout(() => {
      onConfirmarRecebimento(alerta.id);
      setConfirmadoSucesso(true);
      setConfirmando(false);
    }, 400);
  };

  const getTipoBadge = (tipo: AlertaUrgentePush['tipo']) => {
    switch (tipo) {
      case 'MANOBRA_REDE':
        return {
          label: 'Manobra de Rede Hidráulica',
          bg: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
        };
      case 'SEGURANCA_RISCO':
        return {
          label: 'Alerta de Segurança / Risco',
          bg: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
        };
      case 'PRIORIDADE_EMBASA':
        return {
          label: 'Prioridade Contratual EMBASA',
          bg: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
        };
      case 'OS_EMERGENCIAL':
        return {
          label: 'Ordem de Serviço Emergencial',
          bg: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
        };
      default:
        return {
          label: 'Comunicado da Coordenação',
          bg: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
        };
    }
  };

  const badgeInfo = getTipoBadge(alerta.tipo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-rose-500/70 rounded-3xl shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-200">
        {/* Banner Superior com Sirene e Pulso */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 px-5 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs animate-bounce">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-rose-100">
                  Transmissão Push em Segundo Plano
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-85"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              </div>
              <h3 className="text-sm font-black text-white">
                ALERTA URGENTE DA SUPERVISÃO
              </h3>
            </div>
          </div>

          <button
            onClick={onFechar}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
            title="Minimizar Alerta"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Alerta */}
        <div className="p-5 space-y-4">
          {/* Tags de Categoria e Data */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 text-xs">
            <span className={`px-2.5 py-1 rounded-full font-bold border text-[11px] ${badgeInfo.bg}`}>
              {badgeInfo.label}
            </span>

            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{new Date(alerta.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-slate-600">•</span>
              <span>{new Date(alerta.dataHora).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          {/* Título Principal do Alerta */}
          <div>
            <h4 className="text-base sm:text-lg font-black text-rose-300 leading-snug">
              {alerta.titulo}
            </h4>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span>Emitido por:</span>
              <strong className="text-slate-200">{alerta.remetente}</strong>
            </p>
          </div>

          {/* Conteúdo da Mensagem */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-sm text-slate-200 leading-relaxed space-y-2">
            <p className="whitespace-pre-line">{alerta.mensagem}</p>

            {/* Metadados Adicionais */}
            {(alerta.bairro || alerta.matriculaVinculada) && (
              <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                {alerta.bairro && (
                  <span className="flex items-center gap-1 text-sky-300">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    <span>Setor: <strong>{alerta.bairro}</strong></span>
                  </span>
                )}
                {alerta.matriculaVinculada && (
                  <span className="flex items-center gap-1 text-emerald-300 font-mono">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Matrícula: <strong>{alerta.matriculaVinculada}</strong></span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Status de Confirmação do Técnico */}
          <div className="rounded-xl p-3 bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>
                Colaborador em Campo: <strong>{nomeTecnico || 'Técnico de Campo'}</strong>
              </span>
            </div>

            {confirmadoSucesso ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmado à Central</span>
              </span>
            ) : (
              <span className="text-amber-400 font-semibold animate-pulse">
                Confirmação pendente
              </span>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="space-y-2 pt-1">
            {!confirmadoSucesso ? (
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={confirmando}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {confirmando ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                <span>
                  {confirmando
                    ? 'Transmitindo Confirmação...'
                    : '✅ CONFIRMAR RECEBIMENTO (ESTOU CIENTE)'}
                </span>
              </button>
            ) : (
              <div className="py-2 px-3 rounded-2xl bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confirmação registrada e enviada à Supervisão PGCSA/EMBASA</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {alerta.matriculaVinculada && onVerOS && (
                <button
                  type="button"
                  onClick={() => {
                    onFechar();
                    onVerOS(alerta.matriculaVinculada!);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-sky-900/60 hover:bg-sky-800/80 text-sky-200 border border-sky-600/40 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>Ver OS Vinculada</span>
                </button>
              )}

              <button
                type="button"
                onClick={onFechar}
                className={`py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition cursor-pointer ${
                  alerta.matriculaVinculada && onVerOS ? '' : 'col-span-2'
                }`}
              >
                <span>Fechar Notificação</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
