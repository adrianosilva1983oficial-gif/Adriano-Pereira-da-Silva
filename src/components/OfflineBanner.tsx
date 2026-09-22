import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Zap, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { SyncState } from '../services/syncManager';

interface OfflineBannerProps {
  syncState: SyncState;
  onManualSync: () => void;
  onOpenFila?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  syncState,
  onManualSync,
  onOpenFila,
}) => {
  if (syncState.isSyncing) {
    const isCritica = Boolean(syncState.activeProcessingItem?.isEmergency);
    return (
      <div className={`px-4 py-2 text-xs flex items-center justify-between shadow-md transition-all duration-300 text-white ${
        isCritica ? 'bg-rose-700 animate-pulse' : 'bg-sky-600'
      }`}>
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
            <span className="font-semibold">
              {isCritica ? (
                <>
                  🚨 TRANSMITINDO EM 1º LUGAR: Emergência de Vazamento (Matrícula {syncState.activeProcessingItem?.matricula || 'OS'}) para o SCIWeb / EMBASA...
                </>
              ) : (
                <>
                  Sincronizando {syncState.pendingCount} registro(s) com o SCIWeb / EMBASA...
                </>
              )}
            </span>
          </div>
          {onOpenFila && (
            <button
              onClick={onOpenFila}
              className="px-2.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] cursor-pointer"
            >
              Ver Fila
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!syncState.isOnline) {
    const hasEmergency = syncState.hasEmergencyPending;
    return (
      <div className={`text-slate-950 px-4 py-2 text-xs shadow-md border-b transition-all duration-300 ${
        hasEmergency
          ? 'bg-rose-500 border-rose-600 text-white'
          : 'bg-amber-500 border-amber-600'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
              hasEmergency ? 'bg-rose-950' : 'bg-amber-900'
            }`}>
              <WifiOff className="w-3 h-3" />
            </span>
            <div>
              <span className="font-bold">
                {hasEmergency ? '🚨 Modo Offline — Emergência na Fila' : 'Modo Offline Ativo'}
              </span>
              <span className="hidden md:inline"> — Armazenamento local seguro (IndexedDB).</span>
              <span className={`ml-1 font-semibold ${hasEmergency ? 'text-rose-100' : 'text-slate-950'}`}>
                {syncState.pendingCount > 0 ? (
                  hasEmergency ? (
                    <span>
                      {syncState.criticalPendingCount} emergência(s) de vazamento em <strong>1º LUGAR</strong> aguardando conexão.
                    </span>
                  ) : (
                    `${syncState.pendingCount} censo(s) salvos no aparelho aguardando conexão.`
                  )
                ) : (
                  'Nenhum dado será perdido. Sincronização automática programada para o retorno do sinal.'
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onOpenFila && (
              <button
                type="button"
                onClick={onOpenFila}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  hasEmergency
                    ? 'bg-white text-rose-800 hover:bg-rose-50 shadow-sm'
                    : 'bg-amber-950 text-white hover:bg-amber-900'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Gerenciar Fila Prioritária ({syncState.pendingCount})</span>
              </button>
            )}
            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              hasEmergency ? 'bg-rose-950/60 text-white' : 'bg-amber-100/90 text-amber-900'
            }`}>
              Zero Perda Garantida
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (syncState.pendingCount > 0) {
    const hasEmergency = syncState.hasEmergencyPending;
    return (
      <div className={`text-white px-4 py-1.5 text-xs shadow-sm transition-all duration-300 ${
        hasEmergency ? 'bg-rose-700' : 'bg-emerald-700'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {hasEmergency ? (
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            )}
            <span>
              Conexão ativa! <strong>{syncState.pendingCount}</strong> item(ns) na fila.
              {hasEmergency && (
                <strong className="ml-1 text-amber-200 underline">
                  🚨 {syncState.criticalPendingCount} emergência(s) de vazamento subirão em 1º LUGAR!
                </strong>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenFila && (
              <button
                type="button"
                onClick={onOpenFila}
                className="rounded bg-black/20 hover:bg-black/30 text-white px-2.5 py-1 text-[11px] font-semibold cursor-pointer flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-amber-300" />
                <span>Ver Fila</span>
              </button>
            )}
            <button
              onClick={onManualSync}
              className="rounded bg-white text-slate-900 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-bold shadow-xs cursor-pointer flex items-center gap-1"
            >
              <span>Transmitir Agora</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
