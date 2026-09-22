import {
  CensoRecord,
  NegociacaoDebito,
  QueuePriority,
  ReclamacaoOuvidoria,
  SyncQueueItem,
} from '../types/censo';
import { OrdemServicoSCIWeb, LoteCartografia } from '../types/os';
import { tenantService } from './tenantService';

const DB_VERSION = 2;

// Cache de instâncias de IndexedDB para cada cliente/tenant
const dbInstancesMap = new Map<string, IDBDatabase>();

export function getTenantDBName(tenantId?: string): string {
  const tId = tenantId || tenantService.getActiveTenantId() || 'emp_cabula_01';
  return `AquaSaneDB_${tId}`;
}

export async function getDB(tenantId?: string): Promise<IDBDatabase> {
  const dbName = getTenantDBName(tenantId);
  const existing = dbInstancesMap.get(dbName);
  if (existing) return existing;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Ordens de Serviço & Matrículas (Capacidade para +500.000 registros por cliente)
      if (!db.objectStoreNames.contains('ordens_servico')) {
        const osStore = db.createObjectStore('ordens_servico', { keyPath: 'id' });
        osStore.createIndex('matriculaEmbasa', 'matriculaEmbasa', { unique: false });
        osStore.createIndex('numeroOS', 'numeroOS', { unique: false });
        osStore.createIndex('status', 'status', { unique: false });
        osStore.createIndex('bairro', 'bairro', { unique: false });
        osStore.createIndex('quadra', 'quadra', { unique: false });
        osStore.createIndex('lote', 'lote', { unique: false });
        osStore.createIndex('zonaAbastecimento', 'zonaAbastecimento', { unique: false });
        osStore.createIndex('sequenciaRota', 'sequenciaRota', { unique: false });
        osStore.createIndex('cadastristaDesignado', 'cadastristaDesignado', { unique: false });
        osStore.createIndex('validacaoStatus', 'validacaoStatus', { unique: false });
        osStore.createIndex('atualizadoEm', 'atualizadoEm', { unique: false });
      }

      // 2. Fotos de Alta Resolução / Evidências Cadastrais (Decopladas para consultas rápidas)
      if (!db.objectStoreNames.contains('fotos_censo')) {
        const fotosStore = db.createObjectStore('fotos_censo', { keyPath: 'id' });
        fotosStore.createIndex('matriculaEmbasa', 'matriculaEmbasa', { unique: false });
        fotosStore.createIndex('osId', 'osId', { unique: false });
        fotosStore.createIndex('tipoFoto', 'tipoFoto', { unique: false });
        fotosStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 3. Cartografia Cadastral e Vetores Georreferenciados (Polígonos de quadras e lotes)
      if (!db.objectStoreNames.contains('cartografia_lotes')) {
        const cartoStore = db.createObjectStore('cartografia_lotes', { keyPath: 'id' });
        cartoStore.createIndex('matriculaEmbasa', 'matriculaEmbasa', { unique: false });
        cartoStore.createIndex('osId', 'osId', { unique: false });
        cartoStore.createIndex('quadra', 'quadra', { unique: false });
        cartoStore.createIndex('lote', 'lote', { unique: false });
      }

      // 4. Censo Cadastral Completo
      if (!db.objectStoreNames.contains('censo_records')) {
        const censoStore = db.createObjectStore('censo_records', { keyPath: 'id' });
        censoStore.createIndex('matriculaEmbasa', 'matriculaEmbasa', { unique: false });
        censoStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        censoStore.createIndex('bairro', 'bairro', { unique: false });
        censoStore.createIndex('zonaAbastecimento', 'zonaAbastecimento', { unique: false });
      }

      if (!db.objectStoreNames.contains('censo_draft')) {
        db.createObjectStore('censo_draft', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('sync_queue')) {
        const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('queuedAt', 'queuedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('reclamacoes')) {
        const recStore = db.createObjectStore('reclamacoes', { keyPath: 'id' });
        recStore.createIndex('syncStatus', 'syncStatus', { unique: false });
      }

      if (!db.objectStoreNames.contains('negociacoes')) {
        const negStore = db.createObjectStore('negociacoes', { keyPath: 'id' });
        negStore.createIndex('syncStatus', 'syncStatus', { unique: false });
      }

      if (!db.objectStoreNames.contains('app_settings')) {
        db.createObjectStore('app_settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      dbInstancesMap.set(dbName, db);
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ================= GESTÃO DE PERSISTÊNCIA E QUOTA DE GIGABYTES ================= //

export interface StorageStats {
  quotaBytes: number;
  usageBytes: number;
  quotaGB: number;
  usageMB: number;
  usagePercent: number;
  isPersistent: boolean;
  capacidadeEstimadaMatriculas: number;
  capacidadeEstimadaFotos: number;
  suporta200MilMatriculas: boolean;
  suporta1500MilMatriculas: boolean;
}

/**
 * Solicita ao navegador (Chrome, Edge, Firefox, Safari) persistência irrestrita de dados no disco rígido.
 * Isso impede que o navegador limpe o banco de dados em situações de pouca memória.
 */
export async function solicitarArmazenamentoPersistente(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch (err) {
      console.warn('Não foi possível solicitar armazenamento persistente:', err);
    }
  }
  return false;
}

/**
 * Retorna as estatísticas reais de espaço de armazenamento do disco alocado para o AquaSane Pro
 */
export async function obterEstatisticasArmazenamento(): Promise<StorageStats> {
  let quota = 80 * 1024 * 1024 * 1024; // Padrão: 80GB
  let usage = 0;
  let isPersistent = false;

  if (typeof navigator !== 'undefined' && navigator.storage) {
    try {
      if (navigator.storage.persisted) {
        isPersistent = await navigator.storage.persisted();
      }
      if (navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        if (est.quota) quota = est.quota;
        if (est.usage) usage = est.usage;
      }
    } catch (e) {
      console.warn('Erro ao obter estimativa de armazenamento:', e);
    }
  }

  const quotaGB = Math.round((quota / (1024 * 1024 * 1024)) * 10) / 10;
  const usageMB = Math.round((usage / (1024 * 1024)) * 10) / 10;
  const usagePercent = quota > 0 ? Math.round((usage / quota) * 10000) / 100 : 0;

  // Cada matrícula com dados de censo e cartografia consome ~1.8KB em JSON
  // Cada foto comprimida de hidrômetro em JPEG consome ~150KB
  const espacoDisponivelBytes = Math.max(quota - usage, 0);
  const capacidadeMatriculas = Math.floor(espacoDisponivelBytes / 1800);
  const capacidadeFotos = Math.floor(espacoDisponivelBytes / (150 * 1024));

  return {
    quotaBytes: quota,
    usageBytes: usage,
    quotaGB,
    usageMB,
    usagePercent,
    isPersistent,
    capacidadeEstimadaMatriculas: capacidadeMatriculas,
    capacidadeEstimadaFotos: capacidadeFotos,
    suporta200MilMatriculas: quota >= 400 * 1024 * 1024,
    suporta1500MilMatriculas: quota >= 2 * 1024 * 1024 * 1024, // 2GB armazena tranquilamente 1.5 milhão de matrículas
  };
}

// ================= ORDENS DE SERVIÇO & MATRÍCULAS (ALTA ESCALA +1.500.000) ================= //

export async function saveOrdemServicoDB(os: OrdemServicoSCIWeb, tenantId?: string): Promise<void> {
  const db = await getDB(tenantId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ordens_servico', 'readwrite');
    const store = tx.objectStore('ordens_servico');
    store.put(os);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllOSFromDB(tenantId?: string): Promise<OrdemServicoSCIWeb[]> {
  const db = await getDB(tenantId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ordens_servico', 'readonly');
    const store = tx.objectStore('ordens_servico');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as OrdemServicoSCIWeb[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getOSPagedFromDB(
  offset: number = 0,
  limit: number = 100,
  tenantId?: string
): Promise<{ itens: OrdemServicoSCIWeb[]; total: number }> {
  const db = await getDB(tenantId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ordens_servico', 'readonly');
    const store = tx.objectStore('ordens_servico');
    const countReq = store.count();

    countReq.onsuccess = () => {
      const total = countReq.result;
      if (total === 0) {
        resolve({ itens: [], total: 0 });
        return;
      }

      const itens: OrdemServicoSCIWeb[] = [];
      let cursorOffsetSkipped = false;
      const req = store.openCursor();

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
        if (!cursor) {
          resolve({ itens, total });
          return;
        }

        if (offset > 0 && !cursorOffsetSkipped) {
          cursorOffsetSkipped = true;
          cursor.advance(offset);
          return;
        }

        itens.push(cursor.value);
        if (itens.length < limit) {
          cursor.continue();
        } else {
          resolve({ itens, total });
        }
      };

      req.onerror = () => reject(req.error);
    };

    countReq.onerror = () => reject(countReq.error);
  });
}

export async function getOSByMatriculaDB(matricula: string, tenantId?: string): Promise<OrdemServicoSCIWeb | undefined> {
  const db = await getDB(tenantId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ordens_servico', 'readonly');
    const store = tx.objectStore('ordens_servico');
    const index = store.index('matriculaEmbasa');
    const req = index.get(matricula);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getOSCountFromDB(tenantId?: string): Promise<number> {
  const db = await getDB(tenantId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ordens_servico', 'readonly');
    const store = tx.objectStore('ordens_servico');
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteOrdemServicoDB(id: string, tenantId?: string): Promise<void> {
  const db = await getDB(tenantId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ordens_servico', 'readwrite');
    const store = tx.objectStore('ordens_servico');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllOSFromDB(tenantId?: string): Promise<void> {
  const db = await getDB(tenantId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ordens_servico', 'readwrite');
    const store = tx.objectStore('ordens_servico');
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Inserção em massa ultrarrápida com fatiamento de transações em lotes (chunks) dinâmicos de 3.000 a 5.000 registros.
 * Permite importar 111.000 ou até 1.500.000 matrículas sem travar a interface nem estourar a memória.
 */
export async function bulkInsertOS(
  osArray: OrdemServicoSCIWeb[],
  tenantId?: string,
  onProgress?: (processados: number, total: number, percent: number) => void
): Promise<{ inseridos: number; tempoMs: number }> {
  const inicio = performance.now();
  const db = await getDB(tenantId);
  const CHUNK_SIZE = 3500;
  const total = osArray.length;
  let processados = 0;

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = osArray.slice(i, i + CHUNK_SIZE);

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('ordens_servico', 'readwrite');
      const store = tx.objectStore('ordens_servico');

      for (const item of chunk) {
        store.put(item);
      }

      tx.oncomplete = () => {
        processados += chunk.length;
        if (onProgress) {
          const pct = Math.min(Math.round((processados / total) * 100), 100);
          onProgress(processados, total, pct);
        }
        resolve();
      };

      tx.onerror = () => reject(tx.error);
    });

    // Libera o Event Loop para manter a UI 100% fluida e responsiva durante a importação massiva
    await new Promise((r) => setTimeout(r, 0));
  }

  const fim = performance.now();
  return {
    inseridos: processados,
    tempoMs: Math.round(fim - inicio),
  };
}

// ================= FOTOS E EVIDÊNCIAS DE ALTA RESOLUÇÃO ================= //

export interface FotoStorageItem {
  id: string;
  matriculaEmbasa: string;
  osId: string;
  tipoFoto: string;
  dataUrl: string;
  timestamp: number;
  tamanhoBytes?: number;
}

export async function salvarFotoHD(foto: FotoStorageItem, tenantId?: string): Promise<void> {
  const db = await getDB(tenantId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('fotos_censo', 'readwrite');
    const store = tx.objectStore('fotos_censo');
    store.put(foto);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFotosPorMatricula(matricula: string, tenantId?: string): Promise<FotoStorageItem[]> {
  const db = await getDB(tenantId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('fotos_censo', 'readonly');
    const store = tx.objectStore('fotos_censo');
    const index = store.index('matriculaEmbasa');
    const req = index.getAll(matricula);
    req.onsuccess = () => resolve(req.result as FotoStorageItem[]);
    req.onerror = () => reject(req.error);
  });
}

// ================= CARTOGRAFIA CADASTRAL GEORREFERENCIADA ================= //

export interface CartografiaStorageItem {
  id: string;
  matriculaEmbasa: string;
  osId: string;
  quadra: string;
  lote: string;
  cartografia: LoteCartografia;
  salvoEm: number;
}

export async function salvarCartografiaLoteDB(
  item: CartografiaStorageItem,
  tenantId?: string
): Promise<void> {
  const db = await getDB(tenantId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cartografia_lotes', 'readwrite');
    const store = tx.objectStore('cartografia_lotes');
    store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCartografiaPorMatriculaDB(
  matricula: string,
  tenantId?: string
): Promise<CartografiaStorageItem | undefined> {
  const db = await getDB(tenantId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cartografia_lotes', 'readonly');
    const store = tx.objectStore('cartografia_lotes');
    const index = store.index('matriculaEmbasa');
    const req = index.get(matricula);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ================= CENSO RECORDS ================= //

export async function saveCensoRecord(record: CensoRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['censo_records', 'sync_queue'], 'readwrite');
    const censoStore = tx.objectStore('censo_records');
    const queueStore = tx.objectStore('sync_queue');

    // 1. Salva o registro final no IndexedDB
    censoStore.put(record);

    // 2. Se o status for pendente, enfileira na Outbox Sync Queue com classificação de prioridade
    if (record.syncStatus === 'pending') {
      const isVazamentoCritico =
        record.tipoVazamento === 'REDE_EXTERNA' || record.tipoVazamento === 'CAVALETE';
      const isVazamentoInterno = record.tipoVazamento === 'INTERNO_SUSPEITO';
      const isFraudeOuViolacao =
        record.situacaoLigacao === 'CLANDESTINA_GATO' || record.estadoLacre === 'VIOLADO';
      const isEmergenciaManual = Boolean(record.isEmergency);

      const priority: QueuePriority =
        record.priority ||
        (isVazamentoCritico || isEmergenciaManual
          ? 'CRITICA'
          : isVazamentoInterno || isFraudeOuViolacao
          ? 'ALTA'
          : 'NORMAL');

      const isEmergency = priority === 'CRITICA' || isVazamentoCritico || isEmergenciaManual;

      const emergencyReason =
        record.emergencyReason ||
        (record.tipoVazamento === 'REDE_EXTERNA'
          ? 'Emergência de Vazamento na Rede Externa (Perda de Água em Via Pública)'
          : record.tipoVazamento === 'CAVALETE'
          ? 'Emergência de Vazamento no Cavalete/Hidrômetro'
          : isEmergenciaManual
          ? 'Ordem Priorizada pelo Colaborador de Campo'
          : isFraudeOuViolacao
          ? 'Alerta Prioritário: Suspeita de Fraude/Intervenção'
          : undefined);

      const queueItem: SyncQueueItem = {
        id: `queue_${record.id}`,
        entityType: 'censo',
        entityId: record.id,
        action: 'create',
        payload: record,
        queuedAt: Date.now(),
        attempts: 0,
        status: 'pending',
        priority,
        isEmergency,
        emergencyReason,
        prioritizedAt: isEmergency ? Date.now() : undefined,
        matriculaEmbasa: record.matriculaEmbasa,
        numeroOS: record.numeroOS,
        logradouro: record.logradouro,
        bairro: record.bairro,
        tipoVazamento: record.tipoVazamento,
      };
      queueStore.put(queueItem);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllCensoRecords(): Promise<CensoRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('censo_records', 'readonly');
    const store = tx.objectStore('censo_records');
    const request = store.getAll();

    request.onsuccess = () => {
      // Ordena por data decrescente
      const results = (request.result as CensoRecord[]).sort((a, b) => b.atualizadoEm - a.atualizadoEm);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getCensoRecordById(id: string): Promise<CensoRecord | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('censo_records', 'readonly');
    const store = tx.objectStore('censo_records');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateCensoSyncStatus(
  id: string,
  status: CensoRecord['syncStatus'],
  remoteId?: string,
  errorMsg?: string
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('censo_records', 'readwrite');
    const store = tx.objectStore('censo_records');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result as CensoRecord | undefined;
      if (!record) {
        resolve();
        return;
      }
      record.syncStatus = status;
      record.syncAttempts += 1;
      if (status === 'synced') {
        record.syncedAt = Date.now();
        record.remoteConfirmationId = remoteId || `SCI-${Date.now().toString(36).toUpperCase()}`;
        delete record.syncError;
      } else if (errorMsg) {
        record.syncError = errorMsg;
      }
      store.put(record);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteCensoRecord(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['censo_records', 'sync_queue'], 'readwrite');
    tx.objectStore('censo_records').delete(id);
    tx.objectStore('sync_queue').delete(`queue_${id}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ================= AUTO-SAVE DRAFT (ZERO DATA LOSS) ================= //

export async function saveDraftCenso(draft: Partial<CensoRecord>): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('censo_draft', 'readwrite');
    const store = tx.objectStore('censo_draft');
    store.put({ id: 'active_field_draft', ...draft, draftSavedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDraftCenso(): Promise<(Partial<CensoRecord> & { draftSavedAt?: number }) | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('censo_draft', 'readonly');
    const store = tx.objectStore('censo_draft');
    const req = store.get('active_field_draft');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearDraftCenso(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('censo_draft', 'readwrite');
    const store = tx.objectStore('censo_draft');
    store.delete('active_field_draft');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ================= SYNC QUEUE (OUTBOX) COM SISTEMA DE FILA PRIORITÁRIA ================= //

const PESO_PRIORIDADE: Record<QueuePriority, number> = {
  CRITICA: 100,
  ALTA: 50,
  NORMAL: 10,
  BAIXA: 1,
};

export async function getPendingSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result as SyncQueueItem[]).filter(
        (item) => item.status === 'pending' || item.status === 'error'
      );

      // Ordenação rigorosa por prioridade:
      // 1º: CRÍTICA (Emergências de Vazamento, Risco Grave)
      // 2º: ALTA (Suspeitas de Fraude, Interrupção de Abastecimento)
      // 3º: NORMAL (Censos regulares de rota)
      // 4º: BAIXA
      items.sort((a, b) => {
        const pesoA = PESO_PRIORIDADE[a.priority || 'NORMAL'] ?? 10;
        const pesoB = PESO_PRIORIDADE[b.priority || 'NORMAL'] ?? 10;

        if (pesoB !== pesoA) {
          return pesoB - pesoA; // Maior prioridade no topo da fila
        }

        // Se ambos tiverem a mesma prioridade, emergências explícitas vão antes
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;

        // Se houver promoção manual com timestamp
        if (a.prioritizedAt && b.prioritizedAt) {
          return b.prioritizedAt - a.prioritizedAt;
        }
        if (a.prioritizedAt && !b.prioritizedAt) return -1;
        if (!a.prioritizedAt && b.prioritizedAt) return 1;

        // Desempate: ordem de chegada (FIFO)
        return a.queuedAt - b.queuedAt;
      });

      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function updateQueueItemPriority(
  id: string,
  priority: QueuePriority,
  emergencyReason?: string
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result as SyncQueueItem | undefined;
      if (!item) {
        resolve();
        return;
      }
      item.priority = priority;
      item.isEmergency = priority === 'CRITICA';
      if (emergencyReason) {
        item.emergencyReason = emergencyReason;
      }
      item.prioritizedAt = priority === 'CRITICA' || priority === 'ALTA' ? Date.now() : undefined;
      store.put(item);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function promoteQueueItemToTop(id: string, reason?: string): Promise<void> {
  return updateQueueItemPriority(id, 'CRITICA', reason || 'Priorizado pelo colaborador de campo');
}

export async function demoteQueueItemPriority(id: string): Promise<void> {
  return updateQueueItemPriority(id, 'NORMAL');
}

export async function updateQueueItemStatus(
  id: string,
  status: SyncQueueItem['status'],
  lastError?: string
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result as SyncQueueItem | undefined;
      if (!item) {
        resolve();
        return;
      }
      item.status = status;
      item.attempts += 1;
      item.lastAttemptAt = Date.now();
      if (lastError) item.lastError = lastError;
      store.put(item);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeQueueItem(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    tx.objectStore('sync_queue').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ================= RECLAMAÇÕES & OUVIDORIA IN LOCO ================= //

export async function saveReclamacao(item: ReclamacaoOuvidoria): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['reclamacoes', 'sync_queue'], 'readwrite');
    tx.objectStore('reclamacoes').put(item);
    if (item.syncStatus === 'pending') {
      const isUrgente =
        item.tipoOcorrencia === 'BURACOS_VALAS' ||
        item.tipoOcorrencia === 'INTERRUPCAO_ABASTECIMENTO' ||
        item.tipoOcorrencia === 'DANOS_IMOVEL';

      tx.objectStore('sync_queue').put({
        id: `queue_rec_${item.id}`,
        entityType: 'reclamacao',
        entityId: item.id,
        action: 'create',
        payload: item,
        queuedAt: Date.now(),
        attempts: 0,
        status: 'pending',
        priority: isUrgente ? 'ALTA' : 'NORMAL',
        isEmergency: false,
        emergencyReason: isUrgente ? `Reclamação de Obra Urgente (${item.tipoOcorrencia})` : undefined,
        logradouro: item.endereco,
        bairro: item.bairro,
      });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllReclamacoes(): Promise<ReclamacaoOuvidoria[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reclamacoes', 'readonly');
    const req = tx.objectStore('reclamacoes').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ================= NEGOCIAÇÕES DE LIGAÇÃO E TARIFA SOCIAL ================= //

export async function saveNegociacao(item: NegociacaoDebito): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['negociacoes', 'sync_queue'], 'readwrite');
    tx.objectStore('negociacoes').put(item);
    if (item.syncStatus === 'pending') {
      tx.objectStore('sync_queue').put({
        id: `queue_neg_${item.id}`,
        entityType: 'negociacao',
        entityId: item.id,
        action: 'create',
        payload: item,
        queuedAt: Date.now(),
        attempts: 0,
        status: 'pending',
        priority: 'NORMAL',
        isEmergency: false,
        matriculaEmbasa: item.matricula,
        bairro: item.bairro,
      });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllNegociacoes(): Promise<NegociacaoDebito[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('negociacoes', 'readonly');
    const req = tx.objectStore('negociacoes').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ================= APP SETTINGS & SEED DATA ================= //

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction('app_settings', 'readonly');
    const req = tx.objectStore('app_settings').get(key);
    req.onsuccess = () => {
      resolve(req.result ? req.result.value : defaultValue);
    };
    req.onerror = () => resolve(defaultValue);
  });
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('app_settings', 'readwrite');
    tx.objectStore('app_settings').put({ key, value, updated: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Seed Inicial com dados de exemplo de Salvador / R7 para testes imediatos
export async function seedInitialDataIfEmpty(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('censo_records', 'readonly');
  const countReq = tx.objectStore('censo_records').count();

  countReq.onsuccess = async () => {
    if (countReq.result === 0) {
      // Inserir amostras realistas dos bairros do R7
      const initialSamples: CensoRecord[] = [
        {
          id: 'censo-sample-01',
          matriculaEmbasa: '10928374',
          numeroOS: 'OS-2026-04182',
          zonaAbastecimento: 'ZA 26',
          bairro: 'Arenoso',
          logradouro: 'Rua Barão de Mauá',
          numeroPorta: '142',
          quadra: 'QD-08',
          lote: 'LT-15',
          coordenadas: {
            latitude: -12.9438,
            longitude: -38.4482,
            precisaoMetros: 4.2,
            timestamp: Date.now() - 3600000 * 5,
          },
          nomeCliente: 'Maria das Graças Conceição',
          cpfCnpj: '482.910.335-44',
          telefoneContato: '(71) 98712-3456',
          sexoResponsavel: 'FEMININO',
          faixaEtariaResponsavel: '35 a 49 anos',
          escolaridade: '4_A_7_ANOS',
          faixaRenda: '0_A_1_SM',
          numeroMoradores: 4,
          possuiCadUnicoBolsaFamilia: true,
          interesseTarifaSocial: true,
          tipoImovel: 'CASA',
          numeroPavimentos: 1,
          condicaoOcupacao: 'PROPRIO',
          tipoEsgotamento: 'REDE_PUBLICA',
          situacaoLigacao: 'ATIVA',
          numeroHidrometro: 'A22N094812',
          leituraAtualM3: 412,
          estadoHidrometro: 'NORMAL',
          estadoLacre: 'INTACTO',
          tipoAbrigo: 'PADRAO_EMBASA_MURO',
          tipoVazamento: 'NENHUM',
          observacaoTecnica: 'Cavalete acessível em mureta frontal. Hidrômetro em bom estado.',
          tentativaVisita: 1,
          statusVisita: 'REALIZADA_COM_CLIENTE',
          solicitouNegociacaoDebito: false,
          registrouReclamacao: false,
          equipeCadastrista: 'Equipe 02 - Frente Arenoso',
          nomeCadastrista: 'Carlos Santos (Cadastrista I)',
          criadoEm: Date.now() - 3600000 * 5,
          atualizadoEm: Date.now() - 3600000 * 5,
          syncStatus: 'synced',
          syncAttempts: 1,
          syncedAt: Date.now() - 3600000 * 4,
          remoteConfirmationId: 'SCI-90124-OK',
        },
        {
          id: 'censo-sample-02',
          matriculaEmbasa: '20491823',
          numeroOS: 'OS-2026-04183',
          zonaAbastecimento: 'ZA 25',
          bairro: 'Pernambués',
          logradouro: 'Rua Thomaz Gonzaga',
          numeroPorta: '280',
          quadra: 'QD-14',
          lote: 'LT-02',
          coordenadas: {
            latitude: -12.9685,
            longitude: -38.4678,
            precisaoMetros: 5.1,
            timestamp: Date.now() - 3600000 * 2,
          },
          nomeCliente: 'Antônio Ferreira Lima',
          telefoneContato: '(71) 99123-8877',
          sexoResponsavel: 'MASCULINO',
          faixaEtariaResponsavel: '50 a 64 anos',
          escolaridade: '8_A_10_ANOS',
          faixaRenda: '1_A_3_SM',
          numeroMoradores: 3,
          possuiCadUnicoBolsaFamilia: false,
          interesseTarifaSocial: false,
          tipoImovel: 'MISTO',
          numeroPavimentos: 2,
          condicaoOcupacao: 'PROPRIO',
          tipoEsgotamento: 'REDE_PUBLICA',
          situacaoLigacao: 'INATIVA',
          numeroHidrometro: 'B19K339101',
          leituraAtualM3: 885,
          estadoHidrometro: 'PARADO',
          estadoLacre: 'VIOLADO',
          tipoAbrigo: 'INTERNO',
          tipoVazamento: 'CAVALETE',
          observacaoTecnica: 'Vazamento no ramal antes do hidrômetro. Lacre rompido. Solicitou negociação de débito.',
          tentativaVisita: 1,
          statusVisita: 'REALIZADA_COM_CLIENTE',
          solicitouNegociacaoDebito: true,
          registrouReclamacao: true,
          tipoReclamacao: 'Vazamento no cavalete',
          descricaoReclamacao: 'Gotejamento constante no cavalete de entrada gerando poça na calçada.',
          equipeCadastrista: 'Equipe 05 - Frente Pernambués',
          nomeCadastrista: 'Joana Prado (Cadastrista I)',
          criadoEm: Date.now() - 3600000 * 2,
          atualizadoEm: Date.now() - 3600000 * 2,
          syncStatus: 'pending', // Fila offline de exemplo
          syncAttempts: 0,
        },
        {
          id: 'censo-sample-03',
          matriculaEmbasa: '31829472',
          numeroOS: 'OS-2026-04184',
          zonaAbastecimento: 'ZA 26',
          bairro: 'Beiru/Tancredo Neves',
          logradouro: 'Rua São Paulo',
          numeroPorta: '54',
          quadra: 'QD-22',
          lote: 'LT-11',
          coordenadas: {
            latitude: -12.9491,
            longitude: -38.4461,
            precisaoMetros: 3.8,
            timestamp: Date.now() - 3600000,
          },
          nomeCliente: 'Morador Ausente - Tentativa 02',
          telefoneContato: '(71) 98800-0000',
          sexoResponsavel: 'OUTRO',
          faixaEtariaResponsavel: 'Não informado',
          escolaridade: 'SEM_INSTRUCAO',
          faixaRenda: '0_A_1_SM',
          numeroMoradores: 1,
          possuiCadUnicoBolsaFamilia: true,
          interesseTarifaSocial: true,
          tipoImovel: 'CASA',
          numeroPavimentos: 1,
          condicaoOcupacao: 'PROPRIO',
          tipoEsgotamento: 'REDE_PUBLICA',
          situacaoLigacao: 'ATIVA',
          numeroHidrometro: 'C21M774921',
          leituraAtualM3: 219,
          estadoHidrometro: 'NORMAL',
          estadoLacre: 'INTACTO',
          tipoAbrigo: 'PADRAO_EMBASA_MURO',
          tipoVazamento: 'NENHUM',
          observacaoTecnica: '2ª visita sem sucesso (casa fechada). Agendada 3ª visita em dia alternativo (sábado).',
          tentativaVisita: 2,
          statusVisita: 'CASA_FECHADA',
          diaAlternativoVisita: true,
          equipeCadastrista: 'Equipe 01 - Frente Beiru',
          nomeCadastrista: 'Marcos Vinicius (Cadastrista I)',
          criadoEm: Date.now() - 3600000,
          atualizadoEm: Date.now() - 3600000,
          syncStatus: 'pending', // Fila offline
          syncAttempts: 0,
        }
      ];

      for (const item of initialSamples) {
        await saveCensoRecord(item);
      }
    }
  };
}
