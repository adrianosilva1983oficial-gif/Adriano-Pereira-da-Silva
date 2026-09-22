import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cloud,
  HardDrive,
  Download,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCheck2,
  Database,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Lock,
  X,
  Layers,
  ArrowDownToLine,
  Activity
} from 'lucide-react';
import {
  backupRedundancyService,
  BackupSnapshot,
  BackupConfig,
  RedundancyState,
  IntervaloAgendado
} from '../services/backupRedundancyService';

interface CentralBackupRedundanciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDadosRestaurados?: () => void;
}

export const CentralBackupRedundanciaModal: React.FC<CentralBackupRedundanciaModalProps> = ({
  isOpen,
  onClose,
  onDadosRestaurados,
}) => {
  const [redundancyState, setRedundancyState] = useState<RedundancyState>(
    backupRedundancyService.getState()
  );
  const [activeTab, setActiveTab] = useState<'painel' | 'configuracoes' | 'historico'>('painel');
  const [feedbackMensagem, setFeedbackMensagem] = useState<{
    tipo: 'sucesso' | 'info' | 'erro';
    texto: string;
  } | null>(null);
  const [isExecutandoManual, setIsExecutandoManual] = useState(false);
  const [snapshotSelecionado, setSnapshotSelecionado] = useState<BackupSnapshot | null>(null);
  const [modalRestaurarAberto, setModalRestaurarAberto] = useState(false);
  const [resultadoValidacao, setResultadoValidacao] = useState<{
    snapshotId: string;
    integro: boolean;
    detalhes: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = backupRedundancyService.subscribe((state) => {
      setRedundancyState(state);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const { config, registrosSincronizadosDesdeUltimoBackup, snapshots, isProcessandoBackup } =
    redundancyState;

  const progressoPercentual = Math.min(
    100,
    Math.round((registrosSincronizadosDesdeUltimoBackup / config.triggerVolumeThreshold) * 100)
  );

  const handleExecutarBackupManual = async () => {
    setIsExecutandoManual(true);
    setFeedbackMensagem({
      tipo: 'info',
      texto: 'Gerando snapshot e disparando redundância (Cloud Storage + Download Local)...',
    });

    try {
      const snap = await backupRedundancyService.executarBackupRedundancia('MANUAL');
      if (snap) {
        setFeedbackMensagem({
          tipo: 'sucesso',
          texto: `✅ Backup de redundância gerado com sucesso! ${snap.totalCensos} censos e ${snap.totalOrdensServico} OSs protegidos (${snap.tamanhoFormatado}).`,
        });
      } else {
        setFeedbackMensagem({
          tipo: 'erro',
          texto: 'Não foi possível completar o backup. Verifique os dados.',
        });
      }
    } catch (err: any) {
      setFeedbackMensagem({
        tipo: 'erro',
        texto: `Erro ao gerar backup: ${err?.message || 'Falha de gravação'}`,
      });
    } finally {
      setIsExecutandoManual(false);
      setTimeout(() => setFeedbackMensagem(null), 6000);
    }
  };

  const handleSimularSincronizacaoEmMassa = async () => {
    setFeedbackMensagem({
      tipo: 'info',
      texto: 'Simulando lote de novos censos sincronizados para testar o gatilho de grande volume...',
    });

    // Simula a sincronização do lote que atinge o limiar
    await backupRedundancyService.registrarRegistrosSincronizados(config.triggerVolumeThreshold);

    setFeedbackMensagem({
      tipo: 'sucesso',
      texto: `🧪 Lote de ${config.triggerVolumeThreshold} registros sincronizados simulado! O motor detectou o grande volume e executou a redundância total automaticamente.`,
    });
    setTimeout(() => setFeedbackMensagem(null), 6000);
  };

  const handleSalvarConfig = (parcial: Partial<BackupConfig>) => {
    backupRedundancyService.atualizarConfig(parcial);
    setFeedbackMensagem({
      tipo: 'sucesso',
      texto: 'Configurações de redundância atualizadas com sucesso!',
    });
    setTimeout(() => setFeedbackMensagem(null), 3000);
  };

  const handleValidarIntegridade = async (snap: BackupSnapshot) => {
    const res = await backupRedundancyService.validarIntegridadeSnapshot(snap);
    setResultadoValidacao({
      snapshotId: snap.id,
      integro: res.integro,
      detalhes: res.detalhes,
    });
  };

  const handleConfirmarRestauracao = async () => {
    if (!snapshotSelecionado) return;

    setFeedbackMensagem({
      tipo: 'info',
      texto: 'Restaurando registros cadastrais a partir do backup...',
    });

    const res = await backupRedundancyService.restaurarSnapshot(snapshotSelecionado);
    setModalRestaurarAberto(false);

    if (res.sucesso) {
      setFeedbackMensagem({
        tipo: 'sucesso',
        texto: `🎉 Restauração concluída com sucesso! ${res.censosRestaurados} censos e ${res.osRestauradas} ordens de serviço recarregados no banco local.`,
      });
      if (onDadosRestaurados) {
        onDadosRestaurados();
      }
    } else {
      setFeedbackMensagem({
        tipo: 'erro',
        texto: `Falha na restauração: ${res.erro}`,
      });
    }
    setTimeout(() => setFeedbackMensagem(null), 7000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-sky-950 to-slate-950 p-4 sm:p-5 border-b border-sky-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-400 shadow-inner">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                  Central de Redundância e Backup Automático
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PGCSA / EMBASA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Disparo automático por grande volume sincronizado (Cloud Storage + Download Local)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Fechar Central de Backup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Bar */}
        {feedbackMensagem && (
          <div
            className={`px-4 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
              feedbackMensagem.tipo === 'sucesso'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : feedbackMensagem.tipo === 'info'
                ? 'bg-sky-950/80 border-sky-500/40 text-sky-200'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            }`}
          >
            <span>{feedbackMensagem.texto}</span>
            <button
              type="button"
              onClick={() => setFeedbackMensagem(null)}
              className="text-xs underline hover:text-white ml-3"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 bg-slate-950 border-b border-slate-800 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('painel')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'painel'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Monitoramento & Gatilhos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('configuracoes')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'configuracoes'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Configurações & Destinos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'historico'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Snapshots de Redundância ({snapshots.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: PAINEL DE MONITORAMENTO */}
          {activeTab === 'painel' && (
            <div className="space-y-6">
              {/* Card Destaque: Gatilho de Grande Volume */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 border border-sky-500/30 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-100">
                        Monitor de Volume Sincronizado (Disparo Automático)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Rastreia o fluxo de cadastros concluídos e aciona backup com redundância dupla
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 border ${
                        config.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          config.enabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                        }`}
                      />
                      {config.enabled ? 'Agendador de Volume ATIVO' : 'Agendador DESATIVADO'}
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso do Volume */}
                <div className="space-y-2 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      Acumulado desde o último backup:
                    </span>
                    <span className="text-sky-300 font-mono text-sm">
                      {registrosSincronizadosDesdeUltimoBackup} / {config.triggerVolumeThreshold}{' '}
                      registros ({progressoPercentual}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progressoPercentual >= 100
                          ? 'bg-emerald-500'
                          : progressoPercentual >= 60
                          ? 'bg-amber-500'
                          : 'bg-sky-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(4, progressoPercentual))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      Gatilho dispara automaticamente ao sincronizar +
                      {Math.max(0, config.triggerVolumeThreshold - registrosSincronizadosDesdeUltimoBackup)}{' '}
                      registro(s)
                    </span>
                    <button
                      type="button"
                      onClick={() => backupRedundancyService.resetarContadorSincronizados()}
                      className="text-slate-400 hover:text-amber-300 text-[10px] underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Zerar contador
                    </button>
                  </div>
                </div>

                {/* Destinos de Redundância Ativos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-slate-200">Destino 1: Cloud Storage</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]">
                        {config.destinations.cloudStorage ? config.cloudBucketName : 'Desativado'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-slate-200">Destino 2: Download Local</div>
                      <div className="text-[11px] text-slate-400">
                        {config.destinations.downloadLocal
                          ? 'Download automático .json com Checksum SHA-256'
                          : 'Desativado'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações Rápidas de Execução e Teste */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExecutarBackupManual}
                  disabled={isExecutandoManual || isProcessandoBackup}
                  className="p-4 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isExecutandoManual || isProcessandoBackup
                      ? 'Processando Redundância...'
                      : '⚡ Executar Backup Imediato Agora'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSimularSincronizacaoEmMassa}
                  className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer hover:border-amber-500/50"
                  title="Simula a sincronização automática de novos registros para validar o disparo de redundância"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>🧪 Testar Gatilho por Grande Volume (+{config.triggerVolumeThreshold})</span>
                </button>
              </div>

              {/* Resumo do Último Snapshot */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    Último Backup Realizado
                  </h4>
                  {redundancyState.ultimoSnapshot && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {redundancyState.ultimoSnapshot.dataHora}
                    </span>
                  )}
                </div>

                {redundancyState.ultimoSnapshot ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Motivo</span>
                      <span className="font-bold text-sky-300">
                        {redundancyState.ultimoSnapshot.motivoGatilho === 'VOLUME_THRESHOLD'
                          ? 'Grande Volume'
                          : redundancyState.ultimoSnapshot.motivoGatilho}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Tamanho</span>
                      <span className="font-bold text-emerald-300">
                        {redundancyState.ultimoSnapshot.tamanhoFormatado}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Censos / OSs</span>
                      <span className="font-bold text-slate-200">
                        {redundancyState.ultimoSnapshot.totalCensos} /{' '}
                        {redundancyState.ultimoSnapshot.totalOrdensServico}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Redundância</span>
                      <span className="font-bold text-slate-200">
                        {redundancyState.ultimoSnapshot.destinosExecutados.join(' + ')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    Nenhum backup gerado nesta sessão ainda. Clique em "Executar Backup Imediato Agora"
                    ou aguarde a sincronização de novos cadastros de campo.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CONFIGURAÇÕES & DESTINOS */}
          {activeTab === 'configuracoes' && (
            <div className="space-y-5">
              {/* Toggle Master */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-100">
                    Ativar Redundância Automática de Dados
                  </h4>
                  <p className="text-xs text-slate-400">
                    Dispara snapshots seguros sempre que o limiar de cadastros ou horário for atingido
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => handleSalvarConfig({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>

              {/* Limiar de Volume */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div>
                  <h4 className="font-bold text-xs text-slate-200">
                    Limiar de Grande Volume para Disparo Automático
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Quantidade de novos cadastros sincronizados que aciona a geração automática do backup
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[3, 5, 10, 25, 50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSalvarConfig({ triggerVolumeThreshold: val })}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                        config.triggerVolumeThreshold === val
                          ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-sm font-black">{val} registros</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {val === 3 ? 'Teste Rápido' : val === 5 ? 'Recomendado' : 'Operação Média'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destinos */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-xs text-slate-200">
                  Canais de Redundância (Destinos Simultâneos)
                </h4>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                    <input
                      type="checkbox"
                      checked={config.destinations.cloudStorage}
                      onChange={(e) =>
                        handleSalvarConfig({
                          destinations: {
                            ...config.destinations,
                            cloudStorage: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded-md accent-sky-500 text-sky-600"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Cloud className="w-3.5 h-3.5 text-sky-400" />
                        Cloud Storage (Armazenamento em Nuvem Seguro com Redundância Geográfica)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Bucket seguro versionado com integridade SHA-256 (PGCSA / EMBASA)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                    <input
                      type="checkbox"
                      checked={config.destinations.downloadLocal}
                      onChange={(e) =>
                        handleSalvarConfig({
                          destinations: {
                            ...config.destinations,
                            downloadLocal: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded-md accent-sky-500 text-sky-600"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                        Download Local Automático (Arquivo Físico no Dispositivo)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Dispara o salvamento silencioso de arquivo .json estruturado no aparelho
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Agendamento Temporal Complementar */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-xs text-slate-200">
                  Agendamento Temporal Adicional
                </h4>

                <select
                  value={config.scheduledInterval}
                  onChange={(e) =>
                    handleSalvarConfig({ scheduledInterval: e.target.value as IntervaloAgendado })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white"
                >
                  <option value="immediate_volume">
                    Apenas por Volume (Recomendado para Saneamento de Campo)
                  </option>
                  <option value="30_min">A cada 30 minutos</option>
                  <option value="1_hour">A cada 1 hora</option>
                  <option value="6_hours">A cada 6 horas</option>
                  <option value="shift_end">Ao final do turno (18:00h)</option>
                  <option value="disabled">Desativar agendamento temporal</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 3: HISTÓRICO DE SNAPSHOTS DE REDUNDÂNCIA */}
          {activeTab === 'historico' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Snapshots protegidos em cofre de redundância local e nuvem
                </span>
                <span className="font-mono text-sky-300 font-bold">
                  {snapshots.length} de {config.retentionLimit} máximos
                </span>
              </div>

              {snapshots.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs space-y-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <Database className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>Nenhum snapshot arquivado no histórico de redundância.</p>
                  <button
                    type="button"
                    onClick={handleExecutarBackupManual}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
                  >
                    Gerar Primeiro Snapshot
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                              snap.motivoGatilho === 'VOLUME_THRESHOLD'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : snap.motivoGatilho === 'SCHEDULED_TIMER'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            }`}
                          >
                            {snap.motivoGatilho === 'VOLUME_THRESHOLD'
                              ? `Grande Volume (+${snap.volumeSincronizadoGatilho})`
                              : snap.motivoGatilho}
                          </span>
                          <span className="text-xs font-bold text-slate-200 font-mono">
                            {snap.dataHora}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {snap.tamanhoFormatado}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {snap.totalCensos} censos / {snap.totalOrdensServico} OS
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded-lg border border-slate-850 flex items-center justify-between">
                        <span className="truncate">
                          SHA-256: {snap.checksumSHA256.slice(0, 32)}...
                        </span>
                        <span className="text-sky-400 font-bold ml-2 shrink-0">
                          {snap.destinosExecutados.join(' & ')}
                        </span>
                      </div>

                      {/* Botões de Ação do Snapshot */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-850 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => backupRedundancyService.baixarSnapshotManual(snap)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5 text-sky-400" />
                          <span>Baixar Arquivo (.json)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleValidarIntegridade(snap)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Validar Integridade</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSnapshotSelecionado(snap);
                            setModalRestaurarAberto(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition cursor-pointer ml-auto"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurar Banco</span>
                        </button>
                      </div>

                      {/* Exibição da validação de integridade */}
                      {resultadoValidacao?.snapshotId === snap.id && (
                        <div
                          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                            resultadoValidacao.integro
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{resultadoValidacao.detalhes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Conformidade PGCSA/EMBASA com Redundância Geográfica & SLA 99.99%</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Modal Confirmação de Restauração */}
      {modalRestaurarAberto && snapshotSelecionado && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-black text-base">Restaurar Banco a Partir de Snapshot?</h3>
            </div>

            <p className="text-xs text-slate-300">
              Você está prestes a restaurar a base com o backup de{' '}
              <strong className="text-white">{snapshotSelecionado.dataHora}</strong> contendo{' '}
              <strong className="text-white">{snapshotSelecionado.totalCensos} censo(s)</strong> e{' '}
              <strong className="text-white">
                {snapshotSelecionado.totalOrdensServico} ordens de serviço
              </strong>
              .
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              Os registros existentes serão atualizados ou preservados caso já constem na base.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalRestaurarAberto(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRestauracao}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md"
              >
                Confirmar Restauração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
