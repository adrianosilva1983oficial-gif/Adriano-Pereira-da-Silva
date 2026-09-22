import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Wifi,
  WifiOff,
  Droplets,
  ArrowUp,
  ArrowDown,
  Clock,
  ShieldCheck,
  FileText,
  MapPin,
  Send,
  AlertOctagon,
  HelpCircle,
} from 'lucide-react';
import { syncManager, SyncState } from '../services/syncManager';
import { SyncQueueItem, QueuePriority } from '../types/censo';

interface FilaSincronizacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemPriorizado?: () => void;
}

export const FilaSincronizacaoModal: React.FC<FilaSincronizacaoModalProps> = ({
  isOpen,
  onClose,
  onItemPriorizado,
}) => {
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [syncState, setSyncState] = useState<SyncState>(syncManager.getInitialState());
  const [carregando, setCarregando] = useState(false);
  const [motivoEmergencia, setMotivoEmergencia] = useState('');
  const [itemSelecionadoParaEmergencia, setItemSelecionadoParaEmergencia] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const carregarFila = async () => {
    setCarregando(true);
    try {
      const itens = await syncManager.getPendingQueue();
      setQueue(itens);
    } catch (e) {
      console.error('Erro ao carregar fila:', e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarFila();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = syncManager.subscribe((state) => {
      setSyncState(state);
      carregarFila();
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handlePromoverCritica = async (itemId: string, razaoCustom?: string) => {
    const razao = razaoCustom || 'Emergência de vazamento com risco - priorizado pelo colaborador';
    await syncManager.prioritizeItem(itemId, razao);
    setFeedback('🚨 Ordem promovida para 1º LUGAR com Prioridade CRÍTICA Máxima!');
    setTimeout(() => setFeedback(null), 3500);
    carregarFila();
    if (onItemPriorizado) onItemPriorizado();
  };

  const handleNormalizar = async (itemId: string) => {
    await syncManager.deprioritizeItem(itemId);
    setFeedback('Prioridade normalizada com sucesso.');
    setTimeout(() => setFeedback(null), 3000);
    carregarFila();
  };

  const handleConfirmarEmergenciaManual = async () => {
    if (!itemSelecionadoParaEmergencia) return;
    await handlePromoverCritica(itemSelecionadoParaEmergencia, motivoEmergencia || 'Vazamento grave de água identificado em campo');
    setItemSelecionadoParaEmergencia(null);
    setMotivoEmergencia('');
  };

  const handleDispararSync = async () => {
    if (!syncState.isOnline) {
      setFeedback('⚠️ Dispositivo offline. As ordens críticas subirão em 1º lugar assim que houver sinal.');
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    await syncManager.triggerAutomaticSync('Disparo manual pela Fila de Sincronização');
    setFeedback('⚡ Sincronização iniciada! Transmitindo emergências prioritárias primeiro.');
    setTimeout(() => setFeedback(null), 4000);
  };

  const criticalCount = queue.filter(
    (i) => i.priority === 'CRITICA' || i.isEmergency
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header do Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  Fila de Sincronização & Prioridades
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Outbox Prioritária
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ordens de serviço críticas e emergências de vazamento transmitem em 1º lugar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Status da Conexão & Resumo de Emergências */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {syncState.isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-bold">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                Conectado (Online)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30 font-bold">
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Modo Offline (Zero Perda de Dados)
              </span>
            )}

            {criticalCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/40 font-bold animate-pulse">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                {criticalCount} Emergência(s) Crítica(s) no Topo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                Fila em Ordem Regular
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={carregarFila}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${carregando ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={handleDispararSync}
              disabled={syncState.isSyncing || queue.length === 0}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                syncState.isSyncing
                  ? 'bg-sky-900/60 text-sky-300 border border-sky-600/40'
                  : queue.length === 0
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
              }`}
            >
              {syncState.isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Enviar Fila Agora
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback visual temporário */}
        {feedback && (
          <div className="p-2.5 bg-sky-950/90 border-b border-sky-500/30 text-sky-200 text-xs font-bold flex items-center justify-between px-4 animate-in slide-in-from-top-2">
            <span>{feedback}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Indicador de item em processamento ativo */}
        {syncState.activeProcessingItem && (
          <div className="p-3 bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-b border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
              <div>
                <span className="font-extrabold text-white">Transmissão em Andamento: </span>
                <span>
                  Matrícula {syncState.activeProcessingItem.matricula || syncState.activeProcessingItem.id}
                  {syncState.activeProcessingItem.isEmergency ? ' (🚨 EMERGÊNCIA PRIORITÁRIA)' : ''}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 text-[10px] font-mono font-bold">
              FAZENDO UPLOAD
            </span>
          </div>
        )}

        {/* Explicação da Regra de Prioridade */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            <strong>Regra de Transmissão Automática:</strong> O <code className="text-sky-300 font-mono">syncManager</code> executa a fila em ordem estrita de prioridade (Posição #1 sobe primeiro). Vazamentos na rede externa e cavaletes são classificados automaticamente como <strong>CRÍTICA</strong>.
          </span>
        </div>

        {/* Lista das Ordens Enfileiradas */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {queue.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/60 flex items-center justify-center text-emerald-400 mb-3 border border-slate-700">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="font-extrabold text-sm text-slate-200">
                Fila de Sincronização Vazia
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Todas as ordens de serviço, censos e vistorias de campo estão 100% sincronizadas com os servidores da concessionária.
              </p>
            </div>
          ) : (
            queue.map((item, index) => {
              const isCritica = item.priority === 'CRITICA' || item.isEmergency;
              const isAlta = item.priority === 'ALTA';
              const posicao = index + 1;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                    isCritica
                      ? 'bg-rose-950/30 border-rose-600/50 shadow-lg shadow-rose-950/20'
                      : isAlta
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-800/60 border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Indicador de Posição na Fila & Detalhes */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isCritica
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 animate-pulse'
                            : isAlta
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        #{posicao}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-extrabold text-sm text-white">
                            Matrícula: {item.matriculaEmbasa || (item.payload && item.payload.matriculaEmbasa) || 'S/N'}
                          </span>

                          {item.numeroOS && (
                            <span className="text-[11px] font-mono text-slate-400">
                              • {item.numeroOS}
                            </span>
                          )}

                          {isCritica && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              Prioridade Crítica (1º Lugar)
                            </span>
                          )}

                          {isAlta && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase">
                              Alta Prioridade
                            </span>
                          )}

                          {!isCritica && !isAlta && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold uppercase">
                              Normal
                            </span>
                          )}

                          {item.tipoVazamento && item.tipoVazamento !== 'NENHUM' && (
                            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold flex items-center gap-1">
                              <Droplets className="w-3 h-3 text-sky-400" />
                              Vazamento: {item.tipoVazamento}
                            </span>
                          )}
                        </div>

                        {/* Motivo da Emergência ou Descrição */}
                        {item.emergencyReason ? (
                          <p className="text-xs text-rose-300 font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            {item.emergencyReason}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400">
                            Censo cadastral e inspeção de campo regular
                          </p>
                        )}

                        {/* Endereço / Localização */}
                        {(item.logradouro || item.bairro) && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>
                              {item.logradouro} {item.bairro ? `— ${item.bairro}` : ''}
                            </span>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>
                            Enfileirado às {new Date(item.queuedAt).toLocaleTimeString('pt-BR')} • Tentativas: {item.attempts}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação do Colaborador de Campo */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {!isCritica ? (
                        <button
                          type="button"
                          onClick={() => {
                            setItemSelecionadoParaEmergencia(item.id);
                            setMotivoEmergencia('Emergência de vazamento com grande perda d’água');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
                          title="Eleva esta ordem para o topo da fila como emergência crítica"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Subir em 1º Lugar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleNormalizar(item.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                          title="Retorna para prioridade normal"
                        >
                          Normalizar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Secundário: Confirmar Motivo de Emergência de Vazamento */}
        {itemSelecionadoParaEmergencia && (
          <div className="p-4 bg-rose-950/90 border-t border-rose-500/40 text-rose-100 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
            <div className="space-y-1 w-full sm:w-auto">
              <span className="font-extrabold text-xs text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Declarar Emergência de Campo (Prioridade Máxima)
              </span>
              <input
                type="text"
                value={motivoEmergencia}
                onChange={(e) => setMotivoEmergencia(e.target.value)}
                placeholder="Ex: Vazamento no cavalete com desperdício intenso ou risco"
                className="w-full sm:w-96 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg border border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setItemSelecionadoParaEmergencia(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEmergenciaManual}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                Confirmar Prioridade #1
              </button>
            </div>
          </div>
        )}

        {/* Footer do Modal */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Persistência Atômica IndexedDB • Zero perda em quedas de sinal</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
