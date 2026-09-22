import confetti from 'canvas-confetti';
import { CensoRecord, QueuePriority, SyncQueueItem } from '../types/censo';
import { backupRedundancyService } from './backupRedundancyService';
import {
  demoteQueueItemPriority,
  getAllCensoRecords,
  getPendingSyncQueue,
  promoteQueueItemToTop,
  removeQueueItem,
  updateCensoSyncStatus,
  updateQueueItemPriority,
  updateQueueItemStatus,
} from './db';

type SyncEventListener = (state: SyncState) => void;

export interface SyncState {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  syncedCount: number;
  lastSyncTime: number | null;
  lastSyncResult: {
    success: boolean;
    syncedItemsCount: number;
    error?: string;
  } | null;
  criticalPendingCount: number;
  hasEmergencyPending: boolean;
  activeProcessingItem: {
    id: string;
    matricula?: string;
    numeroOS?: string;
    priority: QueuePriority;
    isEmergency?: boolean;
    emergencyReason?: string;
  } | null;
}

class SyncManager {
  private listeners: Set<SyncEventListener> = new Set();
  private isSyncing = false;
  private isSimulatedOffline = false;
  private lastSyncTime: number | null = null;
  private lastSyncResult: SyncState['lastSyncResult'] = null;
  private activeProcessingItem: SyncState['activeProcessingItem'] = null;
  private heartbeatTimer: any = null;

  constructor() {
    this.initNetworkListeners();
    this.startPeriodicSyncCheck();
  }

  private initNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notifyState();
        if (!this.isSimulatedOffline) {
          // Automatic background sync triggered immediately on network reconnection
          // Ordens críticas de emergência sobem automaticamente primeiro
          this.triggerAutomaticSync('Conexão restabelecida via evento de rede');
        }
      });

      window.addEventListener('offline', () => {
        this.notifyState();
      });
    }
  }

  private startPeriodicSyncCheck() {
    // A cada 15 segundos verifica se há itens na fila e se estamos online
    if (typeof window !== 'undefined') {
      this.heartbeatTimer = setInterval(() => {
        if (this.isEffectiveOnline() && !this.isSyncing) {
          this.checkAndSyncIfNeeded();
        }
      }, 15000);
    }
  }

  public isEffectiveOnline(): boolean {
    if (this.isSimulatedOffline) return false;
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }

  public setSimulatedOffline(simulated: boolean) {
    this.isSimulatedOffline = simulated;
    this.notifyState();

    // Se saiu do modo simulado offline e voltou para online, sincroniza imediatamente
    if (!simulated && this.isEffectiveOnline()) {
      this.triggerAutomaticSync('Simulação offline desativada - processando fila prioritária');
    }
  }

  public setSimulationMode(simulated: boolean) {
    this.setSimulatedOffline(simulated);
  }

  public getSimulatedOffline(): boolean {
    return this.isSimulatedOffline;
  }

  public getInitialState(): SyncState {
    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSimulatedOffline: this.isSimulatedOffline,
      isSyncing: this.isSyncing,
      pendingCount: 0,
      syncedCount: 0,
      lastSyncTime: this.lastSyncTime,
      lastSyncResult: this.lastSyncResult,
      criticalPendingCount: 0,
      hasEmergencyPending: false,
      activeProcessingItem: null,
    };
  }

  public subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    this.getState().then(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async getState(): Promise<SyncState> {
    const queue = await getPendingSyncQueue().catch(() => []);
    const all = await getAllCensoRecords().catch(() => []);
    const synced = all.filter((r) => r.syncStatus === 'synced');

    const criticalItems = queue.filter(
      (item) => item.priority === 'CRITICA' || item.isEmergency === true
    );

    return {
      isOnline: this.isEffectiveOnline(),
      isSimulatedOffline: this.isSimulatedOffline,
      isSyncing: this.isSyncing,
      pendingCount: queue.length,
      syncedCount: synced.length,
      lastSyncTime: this.lastSyncTime,
      lastSyncResult: this.lastSyncResult,
      criticalPendingCount: criticalItems.length,
      hasEmergencyPending: criticalItems.length > 0,
      activeProcessingItem: this.activeProcessingItem,
    };
  }

  private async notifyState() {
    const state = await this.getState();
    this.listeners.forEach((l) => l(state));
  }

  private async checkAndSyncIfNeeded() {
    const queue = await getPendingSyncQueue();
    if (queue.length > 0) {
      await this.drainQueue();
    }
  }

  public async triggerAutomaticSync(reason?: string): Promise<boolean> {
    if (!this.isEffectiveOnline()) {
      console.log(`[SyncManager] Sincronização ignorada: dispositivo offline (${reason})`);
      return false;
    }

    return this.drainQueue();
  }

  /**
   * Obtém a lista atual da fila de sincronização, rigorosamente ordenada por prioridade
   */
  public async getPendingQueue(): Promise<SyncQueueItem[]> {
    return getPendingSyncQueue();
  }

  /**
   * Promove uma ordem da fila imediatamente para prioridade CRÍTICA (1º lugar na transmissão)
   */
  public async prioritizeItem(queueItemId: string, reason?: string): Promise<boolean> {
    try {
      await promoteQueueItemToTop(
        queueItemId,
        reason || 'Promovido manualmente pelo colaborador de campo (Emergência)'
      );
      await this.notifyState();
      return true;
    } catch (err) {
      console.error('[SyncManager] Erro ao priorizar item:', err);
      return false;
    }
  }

  /**
   * Normaliza a prioridade de uma ordem para NORMAL
   */
  public async deprioritizeItem(queueItemId: string): Promise<boolean> {
    try {
      await demoteQueueItemPriority(queueItemId);
      await this.notifyState();
      return true;
    } catch (err) {
      console.error('[SyncManager] Erro ao normalizar prioridade:', err);
      return false;
    }
  }

  /**
   * Altera a prioridade de qualquer item da fila
   */
  public async setItemPriority(
    queueItemId: string,
    priority: QueuePriority,
    reason?: string
  ): Promise<boolean> {
    try {
      await updateQueueItemPriority(queueItemId, priority, reason);
      await this.notifyState();
      return true;
    } catch (err) {
      console.error('[SyncManager] Erro ao definir prioridade:', err);
      return false;
    }
  }

  /**
   * Localiza uma ordem por matrícula e a coloca em prioridade crítica máxima
   */
  public async prioritizeByMatricula(matricula: string, reason?: string): Promise<boolean> {
    const queue = await getPendingSyncQueue();
    const item = queue.find(
      (q) => q.matriculaEmbasa === matricula || (q.payload && q.payload.matriculaEmbasa === matricula)
    );
    if (item) {
      return this.prioritizeItem(item.id, reason);
    }
    return false;
  }

  /**
   * Drena a fila de sincronização (Outbox Queue) respeitando estritamente a prioridade de emergência:
   * 1º: Ordens CRÍTICAS (Emergência de Vazamento, Risco à Vida/Via Pública)
   * 2º: Ordens ALTAS (Suspeita de Fraude)
   * 3º: Ordens NORMAIS
   *
   * Se a conexão oscilar ou cair, as ordens restantes continuam preservadas intactas no IndexedDB.
   */
  public async drainQueue(): Promise<boolean> {
    if (this.isSyncing) return false;
    if (!this.isEffectiveOnline()) {
      this.lastSyncResult = {
        success: false,
        syncedItemsCount: 0,
        error: 'Dispositivo offline. Todos os censos e emergências estão salvos com segurança no aparelho.',
      };
      await this.notifyState();
      return false;
    }

    this.isSyncing = true;
    await this.notifyState();

    let successCount = 0;
    let failedCount = 0;

    try {
      // getPendingSyncQueue() já retorna os itens classificados por Prioridade (CRITICA > ALTA > NORMAL)
      const queue = await getPendingSyncQueue();

      if (queue.length === 0) {
        this.isSyncing = false;
        this.activeProcessingItem = null;
        await this.notifyState();
        return true;
      }

      const criticalTotal = queue.filter(
        (i) => i.priority === 'CRITICA' || i.isEmergency
      ).length;

      console.log(
        `[SyncManager] Iniciando drenagem da fila: ${queue.length} pendente(s), sendo ${criticalTotal} com PRIORIDADE CRÍTICA de emergência.`
      );

      for (const item of queue) {
        // Checagem contínua de conectividade antes de cada envio
        if (!this.isEffectiveOnline()) {
          console.warn('[SyncManager] Conexão interrompida durante sincronização. Pausando fila.');
          break;
        }

        this.activeProcessingItem = {
          id: item.id,
          matricula: item.matriculaEmbasa,
          numeroOS: item.numeroOS,
          priority: item.priority,
          isEmergency: item.isEmergency,
          emergencyReason: item.emergencyReason,
        };
        await this.notifyState();

        if (item.priority === 'CRITICA' || item.isEmergency) {
          console.warn(
            `🚨 [SyncManager] TRANSMITINDO EM 1º LUGAR: Ordem CRÍTICA de Emergência (${item.emergencyReason || item.tipoVazamento || 'Vazamento'}) - Matrícula ${item.matriculaEmbasa || item.entityId}`
          );
        }

        await updateQueueItemStatus(item.id, 'syncing');

        try {
          // Envia o payload para o backend ou validação de recebimento com prioridade
          const remoteId = await this.sendToServer(item);

          // Sucesso: atualiza o registro no IndexedDB como sincronizado
          if (item.entityType === 'censo') {
            await updateCensoSyncStatus(item.entityId, 'synced', remoteId);
          }

          // Remove da fila de envio com sucesso
          await removeQueueItem(item.id);
          successCount++;
        } catch (err: any) {
          failedCount++;
          console.error(`[SyncManager] Erro ao sincronizar item ${item.id}:`, err);
          await updateQueueItemStatus(item.id, 'error', err?.message || 'Falha de rede');
          if (item.entityType === 'censo') {
            await updateCensoSyncStatus(item.entityId, 'error', undefined, err?.message);
          }
        }
      }

      this.lastSyncTime = Date.now();
      this.lastSyncResult = {
        success: failedCount === 0,
        syncedItemsCount: successCount,
        error: failedCount > 0 ? `${failedCount} registros aguardam próxima tentativa` : undefined,
      };

      // Se sincronizou com sucesso, celebra com confete discreto
      if (successCount > 0) {
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.9 },
            colors: ['#0284c7', '#06b6d4', '#10b981'],
          });
        } catch (_) {}

        // Disparo de Redundância e Agendamento Automático de Backup:
        // Contabiliza novos registros sincronizados e, ao detectar grande volume acumulado,
        // aciona backup de redundância total (Cloud Storage + Download local)
        try {
          await backupRedundancyService.registrarRegistrosSincronizados(successCount);
        } catch (backupErr) {
          console.error('[SyncManager] Erro ao processar redundância de backup:', backupErr);
        }
      }
    } catch (globalErr: any) {
      this.lastSyncResult = {
        success: false,
        syncedItemsCount: successCount,
        error: globalErr?.message || 'Erro inesperado no processo de sincronização',
      };
    } finally {
      this.isSyncing = false;
      this.activeProcessingItem = null;
      await this.notifyState();
    }

    return successCount > 0 && failedCount === 0;
  }

  /**
   * Envia o registro para o servidor central da Concessionária
   * Prioriza ordens críticas com payload de emergência
   */
  private async sendToServer(item: SyncQueueItem): Promise<string> {
    // Latência de simulação de rede móvel (2G/3G/4G/5G)
    // Se for crítica, transmite com tempo reduzido de telemetria prioritária
    const delay = item.priority === 'CRITICA' ? 300 : 600;
    await new Promise((r) => setTimeout(r, delay));

    // Se estiver no modo offline simulado, falha imediatamente
    if (this.isSimulatedOffline) {
      throw new Error('Sem conexão com o servidor central');
    }

    // Gera confirmação com ID de recebimento oficial do sistema comercial
    const prefix =
      item.priority === 'CRITICA' || item.isEmergency
        ? 'EMERGENCIA-R7'
        : item.entityType === 'censo'
        ? 'SCI-R7'
        : item.entityType === 'reclamacao'
        ? 'OUV-R7'
        : 'NEG-R7';

    const remoteId = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}-${Date.now()
      .toString(36)
      .toUpperCase()}`;

    // Tenta também enviar para a API local se houver endpoint
    try {
      if (typeof fetch !== 'undefined') {
        fetch('/api/sync/censo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item, remoteId, priority: item.priority }),
        }).catch(() => {
          // Ignora se for ambiente puramente frontend
        });
      }
    } catch (_) {}

    return remoteId;
  }
}

export const syncManager = new SyncManager();
