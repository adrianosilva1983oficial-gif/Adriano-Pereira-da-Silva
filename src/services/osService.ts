import { OrdemServicoSCIWeb, StatusOS, StatusValidacaoEmbasa, LoteCartografia, FotoRegistroOS, CensoRapidoOS, MotivoImpedimento } from '../types/os';
import { BairroR7, ZonaAbastecimento, CoordenadasGPS } from '../types/censo';
import { BAIRROS_DATA } from '../data/bairrosData';
import { tenantService } from './tenantService';
import { getAllOSFromDB, bulkInsertOS, saveOrdemServicoDB } from './db';

type OSListener = (list: OrdemServicoSCIWeb[]) => void;

class OSService {
  private osList: OrdemServicoSCIWeb[] = [];
  private listeners: OSListener[] = [];
  private isSyncingDB: boolean = false;
  private dbDebounceTimeout: any = null;

  constructor() {
    this.loadFromStorage();

    // Escuta mudanças de tenant/cliente para recarregar o banco local respectivo
    tenantService.subscribe(() => {
      this.loadFromStorage();
    });
  }

  private getStorageKey(): string {
    const tenantId = tenantService.getActiveTenantId() || 'emp_cabula_01';
    return `consorcio_r7_os_sciweb_records_${tenantId}`;
  }

  private async sincronizarComIndexedDB() {
    if (this.isSyncingDB) return;
    this.isSyncingDB = true;
    const tenantId = tenantService.getActiveTenantId() || 'emp_cabula_01';

    try {
      const doDB = await getAllOSFromDB(tenantId);
      if (doDB && doDB.length > 0) {
        // Se o IndexedDB tiver mais registros ou registros atualizados, atualiza a memória
        if (doDB.length >= this.osList.length || this.osList.length === 0) {
          this.osList = doDB;
          this.notify();
        }
      } else if (this.osList.length > 0) {
        // Se o IndexedDB estiver vazio mas a memória tiver dados, popula o IndexedDB
        await bulkInsertOS(this.osList, tenantId);
      }
    } catch (err) {
      console.warn('Consorcio R7: Falha não bloqueante ao sincronizar com IndexedDB:', err);
    } finally {
      this.isSyncingDB = false;
    }
  }

  private loadFromStorage() {
    const key = this.getStorageKey();
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        this.osList = JSON.parse(raw);
      } catch {
        this.initSeedOS();
      }
    } else {
      // Tenta carregar do legado uma vez para não perder dados existentes
      const legado = localStorage.getItem('consorcio_r7_os_sciweb_records');
      if (legado) {
        try {
          this.osList = JSON.parse(legado);
          this.saveToStorage();
        } catch {
          this.initSeedOS();
        }
      } else {
        this.initSeedOS();
      }
    }
    this.notify();

    // Sincroniza em background com o IndexedDB de alta capacidade (suporta +1.500.000 matrículas)
    setTimeout(() => {
      this.sincronizarComIndexedDB();
    }, 50);
  }

  private saveToStorage() {
    const key = this.getStorageKey();
    const tenantId = tenantService.getActiveTenantId() || 'emp_cabula_01';

    // 1) Gravação no LocalStorage com proteção estrita contra QuotaExceededError (máx 500 itens)
    try {
      if (this.osList.length <= 500) {
        localStorage.setItem(key, JSON.stringify(this.osList));
      } else {
        // Guarda apenas uma amostra recente para boot instantâneo da interface sem estourar 5MB
        const miniCache = this.osList.slice(-500);
        localStorage.setItem(key, JSON.stringify(miniCache));
        localStorage.setItem(key + '_totalCount', String(this.osList.length));
      }
    } catch (err) {
      console.warn('Consorcio R7: Aviso de quota de armazenamento no localStorage (usando IndexedDB como primário):', err);
      try {
        const minimalCache = this.osList.slice(-200);
        localStorage.setItem(key, JSON.stringify(minimalCache));
      } catch (fallbackErr) {
        console.error('Falha ao gravar cache mínimo no localStorage:', fallbackErr);
      }
    }

    // 2) Gravação permanente no IndexedDB de alta capacidade (capacidade para +1.500.000 matrículas)
    if (this.dbDebounceTimeout) {
      clearTimeout(this.dbDebounceTimeout);
    }
    this.dbDebounceTimeout = setTimeout(async () => {
      try {
        await bulkInsertOS(this.osList, tenantId);
      } catch (idbErr) {
        console.warn('Erro ao persistir no IndexedDB em background:', idbErr);
      }
    }, 300);

    this.notify();
  }

  private initSeedOS() {
    // Gera 12 OS iniciais espelhando o SCIWeb em lotes crescentes para testar a rota imediatamente
    const seed: OrdemServicoSCIWeb[] = [
      {
        id: 'os-sci-001',
        numeroOS: 'OS-2026-10482',
        numeroOSSCIWeb: 'SCI-OS-889101',
        matriculaEmbasa: '10928471',
        bairro: 'Arenoso',
        logradouro: 'Rua Manoel Rufino',
        numeroPorta: '45',
        quadra: 'QD-02',
        lote: 'LT-01',
        numeroLoteNumerico: 1,
        zonaAbastecimento: 'ZA 23',
        nomeConsumidorSCIWeb: 'Ana Lúcia dos Santos',
        hidrometroCadastradoSCIWeb: 'A23N849120',
        categoriaImovel: 'RESIDENCIAL',
        equipeDesignada: 'Equipe 01 - Frente Cabula',
        cadastristaDesignado: 'Adelmo Ribeiro',
        status: 'EXECUTADA',
        tentativasAusente: 0,
        sequenciaRota: 1,
        censoRecordId: 'censo_sample_1',
        validacaoStatus: 'APROVADO_SCIWEB',
        validadoPor: 'Engª. Mariana Costa',
        validadoEm: Date.now() - 3600000 * 3,
        coordenadas: {
          latitude: -12.952,
          longitude: -38.441,
          precisaoMetros: 3.5,
          timestamp: Date.now() - 3600000 * 5,
        },
        cartografiaLote: {
          quadra: 'QD-02',
          lote: 'LT-01',
          areaM2: 184.5,
          perimetroM: 58.2,
          tipoDesenho: 'GPS_CAMINHAMENTO',
          capturadoEm: Date.now() - 3600000 * 5,
          vertices: [
            { lat: -12.9519, lng: -38.4411 },
            { lat: -12.9519, lng: -38.4409 },
            { lat: -12.9521, lng: -38.4409 },
            { lat: -12.9521, lng: -38.4411 },
          ],
        },
        criadoEm: Date.now() - 86400000,
        atualizadoEm: Date.now() - 3600000 * 3,
      },
      {
        id: 'os-sci-002',
        numeroOS: 'OS-2026-10483',
        numeroOSSCIWeb: 'SCI-OS-889102',
        matriculaEmbasa: '10928472',
        bairro: 'Arenoso',
        logradouro: 'Rua Manoel Rufino',
        numeroPorta: '49',
        quadra: 'QD-02',
        lote: 'LT-02',
        numeroLoteNumerico: 2,
        zonaAbastecimento: 'ZA 23',
        nomeConsumidorSCIWeb: 'Claudio Roberto Nascimento',
        hidrometroCadastradoSCIWeb: 'A21M092182',
        categoriaImovel: 'RESIDENCIAL',
        equipeDesignada: 'Equipe 01 - Frente Cabula',
        cadastristaDesignado: 'Adelmo Ribeiro',
        status: 'ABERTA',
        tentativasAusente: 0,
        sequenciaRota: 2,
        validacaoStatus: 'PENDENTE_VALIDACAO',
        coordenadas: {
          latitude: -12.9522,
          longitude: -38.4413,
          precisaoMetros: 4.0,
          timestamp: Date.now() - 3600000,
        },
        criadoEm: Date.now() - 86400000,
        atualizadoEm: Date.now() - 3600000,
      },
      {
        id: 'os-sci-003',
        numeroOS: 'OS-2026-10484',
        numeroOSSCIWeb: 'SCI-OS-889103',
        matriculaEmbasa: '10928473',
        bairro: 'Arenoso',
        logradouro: 'Rua Manoel Rufino',
        numeroPorta: '53',
        quadra: 'QD-02',
        lote: 'LT-03',
        numeroLoteNumerico: 3,
        zonaAbastecimento: 'ZA 23',
        nomeConsumidorSCIWeb: 'Severina Maria da Conceição',
        hidrometroCadastradoSCIWeb: 'A20T771239',
        categoriaImovel: 'RESIDENCIAL',
        equipeDesignada: 'Equipe 01 - Frente Cabula',
        cadastristaDesignado: 'Adelmo Ribeiro',
        status: 'AUSENTE',
        tentativasAusente: 1,
        dataUltimaTentativa: Date.now() - 7200000,
        sequenciaRota: 3,
        validacaoStatus: 'PENDENTE_VALIDACAO',
        coordenadas: {
          latitude: -12.9525,
          longitude: -38.4416,
          precisaoMetros: 3.8,
          timestamp: Date.now() - 7200000,
        },
        criadoEm: Date.now() - 86400000,
        atualizadoEm: Date.now() - 7200000,
      },
      {
        id: 'os-sci-004',
        numeroOS: 'OS-2026-10485',
        numeroOSSCIWeb: 'SCI-OS-889104',
        matriculaEmbasa: '10928474',
        bairro: 'Arenoso',
        logradouro: 'Rua Manoel Rufino',
        numeroPorta: '57',
        quadra: 'QD-02',
        lote: 'LT-04',
        numeroLoteNumerico: 4,
        zonaAbastecimento: 'ZA 23',
        nomeConsumidorSCIWeb: 'Marcio Barreto de Souza',
        hidrometroCadastradoSCIWeb: 'A22K449012',
        categoriaImovel: 'COMERCIAL',
        equipeDesignada: 'Equipe 01 - Frente Cabula',
        cadastristaDesignado: 'Adelmo Ribeiro',
        status: 'IMPEDIDA',
        motivoImpedimento: 'CAO_BRAVO',
        observacaoImpedimento: 'Cão solto na varanda sem focinheira. Impossível aproximação do hidrômetro.',
        tentativasAusente: 1,
        sequenciaRota: 4,
        validacaoStatus: 'PENDENTE_VALIDACAO',
        coordenadas: {
          latitude: -12.9528,
          longitude: -38.4419,
          precisaoMetros: 4.2,
          timestamp: Date.now() - 10800000,
        },
        criadoEm: Date.now() - 86400000,
        atualizadoEm: Date.now() - 10800000,
      },
      {
        id: 'os-sci-005',
        numeroOS: 'OS-2026-10486',
        numeroOSSCIWeb: 'SCI-OS-889105',
        matriculaEmbasa: '10928475',
        bairro: 'Arenoso',
        logradouro: 'Rua Manoel Rufino',
        numeroPorta: '61',
        quadra: 'QD-02',
        lote: 'LT-05',
        numeroLoteNumerico: 5,
        zonaAbastecimento: 'ZA 23',
        nomeConsumidorSCIWeb: 'Tânia Regina Guimarães',
        hidrometroCadastradoSCIWeb: 'A19P118234',
        categoriaImovel: 'RESIDENCIAL',
        equipeDesignada: 'Equipe 01 - Frente Cabula',
        cadastristaDesignado: 'Adelmo Ribeiro',
        status: 'ABERTA',
        tentativasAusente: 0,
        sequenciaRota: 5,
        validacaoStatus: 'PENDENTE_VALIDACAO',
        coordenadas: {
          latitude: -12.9531,
          longitude: -38.4422,
          precisaoMetros: 3.9,
          timestamp: Date.now() - 86400000,
        },
        criadoEm: Date.now() - 86400000,
        atualizadoEm: Date.now() - 86400000,
      },
      {
        id: 'os-sci-006',
        numeroOS: 'OS-2026-10487',
        numeroOSSCIWeb: 'SCI-OS-889106',
        matriculaEmbasa: '20491823',
        bairro: 'Cabula',
        logradouro: 'Rua Silveira Martins',
        numeroPorta: '312',
        quadra: 'QD-05',
        lote: 'LT-01',
        numeroLoteNumerico: 1,
        zonaAbastecimento: 'ZA 25',
        nomeConsumidorSCIWeb: 'Carlos Alberto Cerqueira',
        hidrometroCadastradoSCIWeb: 'A21N551209',
        categoriaImovel: 'RESIDENCIAL',
        equipeDesignada: 'Equipe 02 - Frente Cabula',
        cadastristaDesignado: 'Carlos Santos',
        status: 'EXECUTADA',
        censoRecordId: 'censo_sample_2',
        tentativasAusente: 0,
        sequenciaRota: 1,
        validacaoStatus: 'PENDENTE_VALIDACAO',
        coordenadas: {
          latitude: -12.956,
          longitude: -38.469,
          precisaoMetros: 4.1,
          timestamp: Date.now() - 3600000 * 2,
        },
        cartografiaLote: {
          quadra: 'QD-05',
          lote: 'LT-01',
          areaM2: 210.0,
          perimetroM: 64.0,
          tipoDesenho: 'DESENHO_MANUAL',
          capturadoEm: Date.now() - 3600000 * 2,
          vertices: [
            { lat: -12.9559, lng: -38.4691 },
            { lat: -12.9559, lng: -38.4688 },
            { lat: -12.9562, lng: -38.4688 },
            { lat: -12.9562, lng: -38.4691 },
          ],
        },
        criadoEm: Date.now() - 86400000,
        atualizadoEm: Date.now() - 3600000 * 2,
      },
      {
        id: 'os-sci-007',
        numeroOS: 'OS-2026-10488',
        numeroOSSCIWeb: 'SCI-OS-889107',
        matriculaEmbasa: '20491824',
        bairro: 'Cabula',
        logradouro: 'Rua Silveira Martins',
        numeroPorta: '316',
        quadra: 'QD-05',
        lote: 'LT-02',
        numeroLoteNumerico: 2,
        zonaAbastecimento: 'ZA 25',
        nomeConsumidorSCIWeb: 'Farmácia & Drogaria Cabula',
        hidrometroCadastradoSCIWeb: 'B22C990142',
        categoriaImovel: 'COMERCIAL',
        equipeDesignada: 'Equipe 02 - Frente Cabula',
        cadastristaDesignado: 'Carlos Santos',
        status: 'ABERTA',
        tentativasAusente: 0,
        sequenciaRota: 2,
        validacaoStatus: 'PENDENTE_VALIDACAO',
        coordenadas: {
          latitude: -12.9563,
          longitude: -38.4693,
          precisaoMetros: 4.5,
          timestamp: Date.now() - 86400000,
        },
        criadoEm: Date.now() - 86400000,
        atualizadoEm: Date.now() - 86400000,
      },
      {
        id: 'os-sci-008',
        numeroOS: 'OS-2026-10489',
        numeroOSSCIWeb: 'SCI-OS-889108',
        matriculaEmbasa: '20491825',
        bairro: 'Cabula',
        logradouro: 'Rua Silveira Martins',
        numeroPorta: '320',
        quadra: 'QD-05',
        lote: 'LT-03',
        numeroLoteNumerico: 3,
        zonaAbastecimento: 'ZA 25',
        nomeConsumidorSCIWeb: 'Luzia Freitas Santana',
        hidrometroCadastradoSCIWeb: 'A24M112344',
        categoriaImovel: 'RESIDENCIAL',
        equipeDesignada: 'Equipe 02 - Frente Cabula',
        cadastristaDesignado: 'Carlos Santos',
        status: 'AUSENTE',
        tentativasAusente: 2,
        dataUltimaTentativa: Date.now() - 3600000,
        sequenciaRota: 3,
        validacaoStatus: 'PENDENTE_VALIDACAO',
        coordenadas: {
          latitude: -12.9566,
          longitude: -38.4696,
          precisaoMetros: 3.7,
          timestamp: Date.now() - 3600000,
        },
        criadoEm: Date.now() - 86400000,
        atualizadoEm: Date.now() - 3600000,
      },
      {
        id: 'os-sci-009',
        numeroOS: 'OS-2026-10490',
        numeroOSSCIWeb: 'SCI-OS-889109',
        matriculaEmbasa: '20491826',
        bairro: 'Cabula',
        logradouro: 'Rua Silveira Martins',
        numeroPorta: '324',
        quadra: 'QD-05',
        lote: 'LT-04',
        numeroLoteNumerico: 4,
        zonaAbastecimento: 'ZA 25',
        nomeConsumidorSCIWeb: 'Padaria e Lanchonete Delícia',
        hidrometroCadastradoSCIWeb: 'B18A776102',
        categoriaImovel: 'COMERCIAL',
        equipeDesignada: 'Equipe 02 - Frente Cabula',
        cadastristaDesignado: 'Carlos Santos',
        status: 'IMPEDIDA',
        motivoImpedimento: 'RECUSA_MORADOR',
        observacaoImpedimento: 'Gerente alegou não ter autorização do proprietário para permitir inspeção.',
        tentativasAusente: 1,
        sequenciaRota: 4,
        validacaoStatus: 'PENDENTE_VALIDACAO',
        coordenadas: {
          latitude: -12.9569,
          longitude: -38.4699,
          precisaoMetros: 4.0,
          timestamp: Date.now() - 5400000,
        },
        criadoEm: Date.now() - 86400000,
        atualizadoEm: Date.now() - 5400000,
      },
      {
        id: 'os-sci-010',
        numeroOS: 'OS-2026-10491',
        numeroOSSCIWeb: 'SCI-OS-889110',
        matriculaEmbasa: '30192841',
        bairro: 'Pernambués',
        logradouro: 'Rua Thomaz Gonzaga',
        numeroPorta: '110',
        quadra: 'QD-01',
        lote: 'LT-01',
        numeroLoteNumerico: 1,
        zonaAbastecimento: 'ZA 26',
        nomeConsumidorSCIWeb: 'Geraldo Magela Pires',
        hidrometroCadastradoSCIWeb: 'A20N991204',
        categoriaImovel: 'RESIDENCIAL',
        equipeDesignada: 'Equipe 03 - Frente Pernambués',
        cadastristaDesignado: 'Joana Prado',
        status: 'EXECUTADA',
        tentativasAusente: 0,
        sequenciaRota: 1,
        validacaoStatus: 'PENDENTE_VALIDACAO',
        coordenadas: {
          latitude: -12.968,
          longitude: -38.467,
          precisaoMetros: 4.8,
          timestamp: Date.now() - 3600000,
        },
        criadoEm: Date.now() - 86400000,
        atualizadoEm: Date.now() - 3600000,
      },
      {
        id: 'os-sci-011',
        numeroOS: 'OS-2026-10492',
        numeroOSSCIWeb: 'SCI-OS-889111',
        matriculaEmbasa: '30192842',
        bairro: 'Pernambués',
        logradouro: 'Rua Thomaz Gonzaga',
        numeroPorta: '114',
        quadra: 'QD-01',
        lote: 'LT-02',
        numeroLoteNumerico: 2,
        zonaAbastecimento: 'ZA 26',
        nomeConsumidorSCIWeb: 'Beatriz Vasconcelos',
        hidrometroCadastradoSCIWeb: 'A22H339182',
        categoriaImovel: 'RESIDENCIAL',
        equipeDesignada: 'Equipe 03 - Frente Pernambués',
        cadastristaDesignado: 'Joana Prado',
        status: 'ABERTA',
        tentativasAusente: 0,
        sequenciaRota: 2,
        validacaoStatus: 'PENDENTE_VALIDACAO',
        coordenadas: {
          latitude: -12.9683,
          longitude: -38.4673,
          precisaoMetros: 4.2,
          timestamp: Date.now() - 86400000,
        },
        criadoEm: Date.now() - 86400000,
        atualizadoEm: Date.now() - 86400000,
      },
      {
        id: 'os-sci-012',
        numeroOS: 'OS-2026-10493',
        numeroOSSCIWeb: 'SCI-OS-889112',
        matriculaEmbasa: '30192843',
        bairro: 'Pernambués',
        logradouro: 'Rua Thomaz Gonzaga',
        numeroPorta: '118',
        quadra: 'QD-01',
        lote: 'LT-03',
        numeroLoteNumerico: 3,
        zonaAbastecimento: 'ZA 26',
        nomeConsumidorSCIWeb: 'Antônio Ferreira Lima',
        hidrometroCadastradoSCIWeb: 'B19K339101',
        categoriaImovel: 'RESIDENCIAL',
        equipeDesignada: 'Equipe 03 - Frente Pernambués',
        cadastristaDesignado: 'Joana Prado',
        status: 'ABERTA',
        tentativasAusente: 0,
        sequenciaRota: 3,
        validacaoStatus: 'PENDENTE_VALIDACAO',
        coordenadas: {
          latitude: -12.9685,
          longitude: -38.4678,
          precisaoMetros: 5.1,
          timestamp: Date.now() - 86400000,
        },
        criadoEm: Date.now() - 86400000,
        atualizadoEm: Date.now() - 86400000,
      },
    ];

    this.osList = seed;
    this.saveToStorage();
  }

  public getAllOS(): OrdemServicoSCIWeb[] {
    // Retorna ordenado por Bairro, Quadra e Lote Crescente
    return [...this.osList].sort((a, b) => {
      if (a.bairro !== b.bairro) return a.bairro.localeCompare(b.bairro);
      if (a.quadra !== b.quadra) return a.quadra.localeCompare(b.quadra);
      return a.numeroLoteNumerico - b.numeroLoteNumerico;
    });
  }

  public getOSByCadastrista(cadastristaNome: string): OrdemServicoSCIWeb[] {
    return this.getAllOS().filter((os) =>
      os.cadastristaDesignado.toLowerCase().includes(cadastristaNome.toLowerCase()) ||
      cadastristaNome.toLowerCase().includes(os.cadastristaDesignado.toLowerCase())
    );
  }

  public getOSById(id: string): OrdemServicoSCIWeb | undefined {
    return this.osList.find((os) => os.id === id);
  }

  public getOSByMatricula(matricula: string): OrdemServicoSCIWeb | undefined {
    return this.osList.find((os) => os.matriculaEmbasa === matricula.trim());
  }

  public updateOSStatus(
    id: string,
    status: StatusOS,
    extra?: {
      motivoImpedimento?: OrdemServicoSCIWeb['motivoImpedimento'];
      observacaoImpedimento?: string;
      cartografiaLote?: LoteCartografia;
      censoRecordId?: string;
    }
  ): void {
    const idx = this.osList.findIndex((o) => o.id === id);
    if (idx >= 0) {
      const current = this.osList[idx];
      const updated: OrdemServicoSCIWeb = {
        ...current,
        status,
        atualizadoEm: Date.now(),
        ...(extra?.motivoImpedimento && { motivoImpedimento: extra.motivoImpedimento }),
        ...(extra?.observacaoImpedimento && { observacaoImpedimento: extra.observacaoImpedimento }),
        ...(extra?.cartografiaLote && { cartografiaLote: extra.cartografiaLote }),
        ...(extra?.censoRecordId && { censoRecordId: extra.censoRecordId }),
      };

      if (status === 'AUSENTE') {
        updated.tentativasAusente = (current.tentativasAusente || 0) + 1;
        updated.dataUltimaTentativa = Date.now();
      }

      this.osList[idx] = updated;
      this.saveToStorage();
    }
  }

  public vincularCartografia(osId: string, cartografia: LoteCartografia): void {
    const idx = this.osList.findIndex((o) => o.id === osId);
    if (idx >= 0) {
      this.osList[idx].cartografiaLote = cartografia;
      this.osList[idx].atualizadoEm = Date.now();
      this.saveToStorage();
    }
  }

  public atualizarOS(osAtualizada: OrdemServicoSCIWeb): void {
    const idx = this.osList.findIndex((o) => o.id === osAtualizada.id);
    if (idx >= 0) {
      this.osList[idx] = {
        ...osAtualizada,
        atualizadoEm: Date.now(),
      };
    } else {
      this.osList.push(osAtualizada);
    }
    this.saveToStorage();
  }

  public importarOSLote(lote: OrdemServicoSCIWeb[]): void {
    const mapa = new Map(this.osList.map((o) => [o.id, o]));
    for (const os of lote) {
      mapa.set(os.id, os);
    }
    this.osList = Array.from(mapa.values());
    this.saveToStorage();
  }

  public async importarOSLoteAsync(
    lote: OrdemServicoSCIWeb[],
    onProgress?: (processados: number, total: number, pct: number) => void
  ): Promise<{ inseridos: number; total: number }> {
    const tenantId = tenantService.getActiveTenantId() || 'emp_cabula_01';
    const mapa = new Map(this.osList.map((o) => [o.id, o]));
    for (const os of lote) {
      mapa.set(os.id, os);
    }
    this.osList = Array.from(mapa.values());

    // Salva diretamente no IndexedDB com particionamento em chunks
    const res = await bulkInsertOS(lote, tenantId, onProgress);

    // Atualiza o mini cache de boot do localStorage
    this.saveToStorage();
    return { inseridos: res.inseridos, total: this.osList.length };
  }

  public validarOS(
    id: string,
    aprovado: boolean,
    auditorNome: string,
    motivoRejeicao?: string
  ): void {
    const idx = this.osList.findIndex((o) => o.id === id);
    if (idx >= 0) {
      this.osList[idx] = {
        ...this.osList[idx],
        validacaoStatus: aprovado ? 'APROVADO_SCIWEB' : 'REJEITADO_CAMPO',
        validadoPor: auditorNome,
        validadoEm: Date.now(),
        motivoRejeicao: aprovado ? undefined : motivoRejeicao || 'Necessário reinspeção em campo.',
        atualizadoEm: Date.now(),
      };
      this.saveToStorage();
    }
  }

  public transmitirLoteParaEmbasa(ids: string[]): { sucessoCount: number; protocoloLote: string } {
    const protocolo = `SCIWEB-LOTE-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    let count = 0;

    this.osList = this.osList.map((os) => {
      if (ids.includes(os.id) && os.validacaoStatus === 'APROVADO_SCIWEB') {
        count++;
        return {
          ...os,
          validacaoStatus: 'TRANSMITIDO_EMBASA',
          atualizadoEm: Date.now(),
        };
      }
      return os;
    });

    this.saveToStorage();
    return { sucessoCount: count, protocoloLote: protocolo };
  }

  public createOS(dados: Partial<OrdemServicoSCIWeb>): OrdemServicoSCIWeb {
    const novaOS: OrdemServicoSCIWeb = {
      id: dados.id || `os_sci_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      numeroOS: dados.numeroOS || `OS-ROTA-${Date.now()}`,
      numeroOSSCIWeb: dados.numeroOSSCIWeb || `SCI-OS-${Math.floor(100000 + Math.random() * 900000)}`,
      matriculaEmbasa: dados.matriculaEmbasa || String(Math.floor(10000000 + Math.random() * 90000000)),
      bairro: dados.bairro || 'Cabula',
      logradouro: dados.logradouro || 'Rua sem denominação',
      numeroPorta: dados.numeroPorta || 'S/N',
      quadra: dados.quadra || 'QD-01',
      lote: dados.lote || 'LT-01',
      subLote: dados.subLote,
      numeroLoteNumerico: dados.numeroLoteNumerico || 1,
      zonaAbastecimento: dados.zonaAbastecimento || 'ZA 23',
      nomeConsumidorSCIWeb: dados.nomeConsumidorSCIWeb || 'Consumidor Comercial',
      hidrometroCadastradoSCIWeb: dados.hidrometroCadastradoSCIWeb || 'PENDENTE',
      categoriaImovel: dados.categoriaImovel || 'RESIDENCIAL',
      equipeDesignada: dados.equipeDesignada || 'Equipe 01 - Frente Cabula',
      cadastristaDesignado: dados.cadastristaDesignado || 'Adelmo Ribeiro',
      status: dados.status || 'ABERTA',
      tentativasAusente: dados.tentativasAusente || 0,
      sequenciaRota: dados.sequenciaRota || this.osList.length + 1,
      ordemProgramada: dados.ordemProgramada || dados.sequenciaRota || this.osList.length + 1,
      origemPlanilha: dados.origemPlanilha,
      linhaPlanilhaOriginal: dados.linhaPlanilhaOriginal,
      dataProgramacao: dados.dataProgramacao,
      validacaoStatus: dados.validacaoStatus || 'PENDENTE_VALIDACAO',
      coordenadas: dados.coordenadas || {
        latitude: -12.952,
        longitude: -38.441,
        precisaoMetros: 4.0,
        timestamp: Date.now(),
      },
      criadoEm: Date.now(),
      atualizadoEm: Date.now(),
    };

    this.osList.push(novaOS);
    this.saveToStorage();
    return novaOS;
  }

  /**
   * Programa centenas ou milhares de OS em lote com alta performance:
   * Realiza deduplicação por hash map O(1), atualiza em memória e salva/notifica UMA ÚNICA VEZ.
   * Evita travamentos de CPU, loops síncronos e estouro de memória no navegador.
   */
  public programarLoteOS(
    loteOS: Partial<OrdemServicoSCIWeb>[],
    sobrescreverExistentes: boolean = false
  ): { inseridas: number; atualizadas: number } {
    let inseridas = 0;
    let atualizadas = 0;

    const mapaMatriculas = new Map<string, number>();
    for (let i = 0; i < this.osList.length; i++) {
      const mat = this.osList[i].matriculaEmbasa?.trim();
      if (mat) {
        mapaMatriculas.set(mat, i);
      }
    }

    const novasParaAdicionar: OrdemServicoSCIWeb[] = [];
    const agora = Date.now();

    for (let i = 0; i < loteOS.length; i++) {
      const item = loteOS[i];
      const mat = item.matriculaEmbasa ? item.matriculaEmbasa.trim() : '';
      const existingIdx = mat ? mapaMatriculas.get(mat) : undefined;

      if (existingIdx !== undefined && sobrescreverExistentes) {
        this.osList[existingIdx] = {
          ...this.osList[existingIdx],
          ...item,
          atualizadoEm: agora,
        };
        atualizadas++;
      } else if (existingIdx === undefined) {
        const seq = item.sequenciaRota || (this.osList.length + novasParaAdicionar.length + 1);
        const nova: OrdemServicoSCIWeb = {
          id: item.id || `os_sci_${agora}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          numeroOS: item.numeroOS || `OS-ROTA-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`,
          numeroOSSCIWeb: item.numeroOSSCIWeb || `SCI-PLN-${mat || seq}`,
          matriculaEmbasa: mat || `MAT-${agora}-${i + 1}`,
          bairro: item.bairro || 'Cabula',
          logradouro: item.logradouro || 'Logradouro não informado',
          numeroPorta: item.numeroPorta || 'S/N',
          quadra: item.quadra || 'QD-01',
          lote: item.lote || `LT-${String(seq).padStart(2, '0')}`,
          subLote: item.subLote,
          numeroLoteNumerico: item.numeroLoteNumerico || seq,
          zonaAbastecimento: item.zonaAbastecimento || 'ZA 23',
          nomeConsumidorSCIWeb: item.nomeConsumidorSCIWeb || `Consumidor Titular ${mat}`,
          hidrometroCadastradoSCIWeb: item.hidrometroCadastradoSCIWeb || 'PENDENTE',
          categoriaImovel: item.categoriaImovel || 'RESIDENCIAL',
          equipeDesignada: item.equipeDesignada || 'Equipe 01 - Frente Cabula',
          cadastristaDesignado: item.cadastristaDesignado || 'Adelmo Ribeiro',
          status: item.status || 'ABERTA',
          tentativasAusente: 0,
          sequenciaRota: seq,
          ordemProgramada: item.ordemProgramada || seq,
          origemPlanilha: item.origemPlanilha,
          linhaPlanilhaOriginal: item.linhaPlanilhaOriginal,
          dataProgramacao: item.dataProgramacao,
          validacaoStatus: 'PENDENTE_VALIDACAO',
          coordenadas: item.coordenadas || {
            latitude: -12.9525 + ((i * 0.0001) % 0.01),
            longitude: -38.4415 + ((i * 0.0001) % 0.01),
            precisaoMetros: 3.8,
            timestamp: agora,
          },
          criadoEm: agora,
          atualizadoEm: agora,
        };

        novasParaAdicionar.push(nova);
        if (mat) {
          mapaMatriculas.set(mat, this.osList.length + novasParaAdicionar.length - 1);
        }
        inseridas++;
      }
    }

    if (novasParaAdicionar.length > 0) {
      this.osList.push(...novasParaAdicionar);
    }

    // Salva no storage e dispara evento React uma única vez
    this.saveToStorage();
    return { inseridas, atualizadas };
  }

  /**
   * Versão assíncrona para lotes massivos (+111.000 e até 1.500.000 matrículas):
   * Processa em fatias temporais com liberação periódica do Event Loop e persistência direta no IndexedDB,
   * garantindo zero travamento da UI e zero perda de dados.
   */
  public async programarLoteOSAsync(
    loteOS: Partial<OrdemServicoSCIWeb>[],
    sobrescreverExistentes: boolean = false,
    onProgress?: (processados: number, total: number, percentual: number) => void
  ): Promise<{ inseridas: number; atualizadas: number; total: number }> {
    let inseridas = 0;
    let atualizadas = 0;
    const totalItens = loteOS.length;

    const mapaMatriculas = new Map<string, number>();
    for (let i = 0; i < this.osList.length; i++) {
      const mat = this.osList[i].matriculaEmbasa?.trim();
      if (mat) {
        mapaMatriculas.set(mat, i);
      }
    }

    const novasParaAdicionar: OrdemServicoSCIWeb[] = [];
    const agora = Date.now();
    const CHUNK_PROCESSAMENTO = 5000;

    for (let i = 0; i < totalItens; i++) {
      const item = loteOS[i];
      const mat = item.matriculaEmbasa ? item.matriculaEmbasa.trim() : '';
      const existingIdx = mat ? mapaMatriculas.get(mat) : undefined;

      if (existingIdx !== undefined && sobrescreverExistentes) {
        this.osList[existingIdx] = {
          ...this.osList[existingIdx],
          ...item,
          atualizadoEm: agora,
        };
        atualizadas++;
      } else if (existingIdx === undefined) {
        const seq = item.sequenciaRota || (this.osList.length + novasParaAdicionar.length + 1);
        const nova: OrdemServicoSCIWeb = {
          id: item.id || `os_sci_${agora}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          numeroOS: item.numeroOS || `OS-ROTA-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`,
          numeroOSSCIWeb: item.numeroOSSCIWeb || `SCI-PLN-${mat || seq}`,
          matriculaEmbasa: mat || `MAT-${agora}-${i + 1}`,
          bairro: item.bairro || 'Cabula',
          logradouro: item.logradouro || 'Logradouro não informado',
          numeroPorta: item.numeroPorta || 'S/N',
          quadra: item.quadra || 'QD-01',
          lote: item.lote || `LT-${String(seq).padStart(2, '0')}`,
          subLote: item.subLote,
          numeroLoteNumerico: item.numeroLoteNumerico || seq,
          zonaAbastecimento: item.zonaAbastecimento || 'ZA 23',
          nomeConsumidorSCIWeb: item.nomeConsumidorSCIWeb || `Consumidor Titular ${mat}`,
          hidrometroCadastradoSCIWeb: item.hidrometroCadastradoSCIWeb || 'PENDENTE',
          categoriaImovel: item.categoriaImovel || 'RESIDENCIAL',
          equipeDesignada: item.equipeDesignada || 'Equipe 01 - Frente Cabula',
          cadastristaDesignado: item.cadastristaDesignado || 'Adelmo Ribeiro',
          status: item.status || 'ABERTA',
          tentativasAusente: 0,
          sequenciaRota: seq,
          ordemProgramada: item.ordemProgramada || seq,
          origemPlanilha: item.origemPlanilha,
          linhaPlanilhaOriginal: item.linhaPlanilhaOriginal,
          dataProgramacao: item.dataProgramacao,
          validacaoStatus: 'PENDENTE_VALIDACAO',
          coordenadas: item.coordenadas || {
            latitude: -12.9525 + ((i * 0.0001) % 0.01),
            longitude: -38.4415 + ((i * 0.0001) % 0.01),
            precisaoMetros: 3.8,
            timestamp: agora,
          },
          criadoEm: agora,
          atualizadoEm: agora,
        };

        novasParaAdicionar.push(nova);
        if (mat) {
          mapaMatriculas.set(mat, this.osList.length + novasParaAdicionar.length - 1);
        }
        inseridas++;
      }

      // Desafoga a CPU e atualiza progresso a cada lote de 5.000 registros
      if (i > 0 && i % CHUNK_PROCESSAMENTO === 0) {
        if (onProgress) {
          const pct = Math.min(Math.round((i / totalItens) * 50), 50); // Primeira metade: conversão
          onProgress(i, totalItens, pct);
        }
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    if (novasParaAdicionar.length > 0) {
      this.osList.push(...novasParaAdicionar);
    }

    // Persistência massiva direta no IndexedDB
    const tenantId = tenantService.getActiveTenantId() || 'emp_cabula_01';
    await bulkInsertOS(novasParaAdicionar.length > 0 ? novasParaAdicionar : this.osList, tenantId, (proc, tot, pct) => {
      if (onProgress) {
        // Segunda metade: gravação em disco
        const pctGeral = 50 + Math.round((pct / 100) * 50);
        onProgress(proc, tot, Math.min(pctGeral, 100));
      }
    });

    this.saveToStorage();
    return { inseridas, atualizadas, total: this.osList.length };
  }

  public updateOS(id: string, dados: Partial<OrdemServicoSCIWeb>): OrdemServicoSCIWeb | undefined {
    const idx = this.osList.findIndex((o) => o.id === id);
    if (idx >= 0) {
      this.osList[idx] = {
        ...this.osList[idx],
        ...dados,
        atualizadoEm: Date.now(),
      };
      this.saveToStorage();
      return this.osList[idx];
    }
    return undefined;
  }

  public reordenarProgramacao(novasSequencias: { id: string; novaOrdem: number }[]): void {
    const mapaOrdens = new Map<string, number>();
    novasSequencias.forEach((item) => mapaOrdens.set(item.id, item.novaOrdem));

    this.osList = this.osList.map((os) => {
      if (mapaOrdens.has(os.id)) {
        const novaOrdem = mapaOrdens.get(os.id)!;
        return {
          ...os,
          sequenciaRota: novaOrdem,
          ordemProgramada: novaOrdem,
          atualizadoEm: Date.now(),
        };
      }
      return os;
    });

    this.saveToStorage();
  }

  /**
   * Reprogramação automática de matrículas não executadas:
   * "caso o colaborador cadastrista não executar a matrícula, automaticamente
   * programe novamente ela na ordem de lotes para o outro dia"
   */
  public reprogramarOSNaoExecutadasParaProximoDia(
    cadastristaNome?: string,
    dataExecucaoPretendida?: string
  ): { reprogramadas: number; novaData: string } {
    const amanha = new Date(Date.now() + 86400000);
    const amanhaStr = dataExecucaoPretendida || amanha.toISOString().slice(0, 10);

    let count = 0;

    // Filtra OSs que ainda NÃO foram executadas (ABERTA, AUSENTE, IMPEDIDA)
    this.osList.forEach((os) => {
      const matchCadastrista =
        !cadastristaNome ||
        (os.cadastristaDesignado &&
          os.cadastristaDesignado.toLowerCase().trim() === cadastristaNome.toLowerCase().trim());

      const naoExecutada = os.status !== 'EXECUTADA';
      
      if (matchCadastrista && naoExecutada) {
        // Atualiza para o outro dia
        os.dataProgramacao = amanhaStr;
        os.foiReprogramada = true;
        os.dataReprogramada = Date.now();
        os.motivoReprogramacao = 'Não executada na data prevista - reprogramada automaticamente na ordem de lotes para o outro dia';
        os.atualizadoEm = Date.now();
        count++;
      }
    });

    if (count > 0) {
      // Reordena rigorosamente na ordem de lotes (quadra, número do lote crescente)
      this.reorganizarOrdemDeLotes(cadastristaNome);
      this.saveToStorage();
    }

    return { reprogramadas: count, novaData: amanhaStr };
  }

  /**
   * Garante a ordenação rigorosa das OSs por lotes crescentes por quadra e lote
   */
  public reorganizarOrdemDeLotes(cadastristaNome?: string) {
    const doCadastrista: OrdemServicoSCIWeb[] = [];
    const outras: OrdemServicoSCIWeb[] = [];

    this.osList.forEach((os) => {
      const match =
        !cadastristaNome ||
        (os.cadastristaDesignado &&
          os.cadastristaDesignado.toLowerCase().trim() === cadastristaNome.toLowerCase().trim());

      if (match) {
        doCadastrista.push(os);
      } else {
        outras.push(os);
      }
    });

    // Ordena doCadastrista por Bairro -> Quadra -> Lote Numérico
    doCadastrista.sort((a, b) => {
      const qA = a.quadra || '';
      const qB = b.quadra || '';
      if (qA !== qB) return qA.localeCompare(qB);

      const lA = a.numeroLoteNumerico || parseInt((a.lote || '').replace(/\D/g, '')) || 0;
      const lB = b.numeroLoteNumerico || parseInt((b.lote || '').replace(/\D/g, '')) || 0;
      return lA - lB;
    });

    // Atribui nova sequência de rota estrita
    doCadastrista.forEach((os, idx) => {
      os.sequenciaRota = idx + 1;
      os.ordemProgramada = idx + 1;
    });

    this.osList = [...outras, ...doCadastrista];
    this.saveToStorage();
  }

  /**
   * Programa e distribui automaticamente as OS importadas entre os cadastristas
   * com base na capacidade de atendimento dentro do HORÁRIO COMERCIAL (8h de trabalho / ~25 censos por dia).
   * Agrupa por logradouro/quadra para evitar deslocamento desnecessário e ordena sequencialmente.
   */
  public programarOSHorarioComercial(
    cadastristas: { nome: string; equipe?: string }[],
    matriculasPorDia: number = 25
  ): { totalProgramadas: number; distribuicao: { cadastrista: string; count: number }[] } {
    if (cadastristas.length === 0) return { totalProgramadas: 0, distribuicao: [] };

    // Filtra OS abertas ou pendentes de atendimento
    const osPendentes = this.osList.filter((o) => o.status === 'ABERTA' || o.status === 'EM_DESLOCAMENTO');

    // Ordena de forma inteligente: primeiro por Bairro, depois Logradouro, depois Quadra e Lote
    osPendentes.sort((a, b) => {
      if (a.bairro !== b.bairro) return a.bairro.localeCompare(b.bairro);
      if (a.logradouro !== b.logradouro) return a.logradouro.localeCompare(b.logradouro);
      if (a.quadra !== b.quadra) return a.quadra.localeCompare(b.quadra);
      return (a.numeroLoteNumerico || 0) - (b.numeroLoteNumerico || 0);
    });

    const mapaAtualizacao = new Map<string, { cadastrista: string; equipe: string; sequencia: number }>();
    const contadores = cadastristas.map((c) => ({ cadastrista: c.nome, equipe: c.equipe || 'Equipe Campo', count: 0 }));

    let cadastristaIndex = 0;
    let blocoCount = 0;

    for (let i = 0; i < osPendentes.length; i++) {
      const cad = cadastristas[cadastristaIndex];
      const seqParaCadastrista = contadores[cadastristaIndex].count + 1;

      mapaAtualizacao.set(osPendentes[i].id, {
        cadastrista: cad.nome,
        equipe: cad.equipe || 'Equipe Geral',
        sequencia: seqParaCadastrista,
      });

      contadores[cadastristaIndex].count++;
      blocoCount++;

      // Quando preenche a cota do horário comercial (ex: 25 matrículas), passa para o próximo cadastrista
      if (blocoCount >= matriculasPorDia && cadastristas.length > 1) {
        cadastristaIndex = (cadastristaIndex + 1) % cadastristas.length;
        blocoCount = 0;
      }
    }

    const agora = Date.now();
    this.osList = this.osList.map((os) => {
      if (mapaAtualizacao.has(os.id)) {
        const info = mapaAtualizacao.get(os.id)!;
        return {
          ...os,
          cadastristaDesignado: info.cadastrista,
          equipeDesignada: info.equipe,
          sequenciaRota: info.sequencia,
          ordemProgramada: info.sequencia,
          atualizadoEm: agora,
        };
      }
      return os;
    });

    this.saveToStorage();

    return {
      totalProgramadas: mapaAtualizacao.size,
      distribuicao: contadores.map((c) => ({ cadastrista: c.cadastrista, count: c.count })),
    };
  }

  /**
   * Programa as OS de acordo com a quantidade exata digitada pelo programador para cada cadastrista.
   */
  public programarOSManualPorQuantidade(
    distribuicoes: { cadastrista: string; equipe?: string; quantidade: number }[]
  ): { totalProgramadas: number; distribuicao: { cadastrista: string; count: number }[] } {
    const osPendentes = this.osList.filter((o) => o.status === 'ABERTA' || o.status === 'EM_DESLOCAMENTO');

    // Ordena por bairro, logradouro e lote
    osPendentes.sort((a, b) => {
      if (a.bairro !== b.bairro) return a.bairro.localeCompare(b.bairro);
      if (a.logradouro !== b.logradouro) return a.logradouro.localeCompare(b.logradouro);
      return (a.numeroLoteNumerico || 0) - (b.numeroLoteNumerico || 0);
    });

    const mapaAtualizacao = new Map<string, { cadastrista: string; equipe: string; sequencia: number }>();
    let offsetOS = 0;
    const resultadoDistribuicao: { cadastrista: string; count: number }[] = [];

    for (const dist of distribuicoes) {
      const qtdDesejada = Math.min(dist.quantidade, osPendentes.length - offsetOS);
      let atribuidas = 0;

      for (let j = 0; j < qtdDesejada; j++) {
        const idx = offsetOS + j;
        if (idx < osPendentes.length) {
          const osItem = osPendentes[idx];
          mapaAtualizacao.set(osItem.id, {
            cadastrista: dist.cadastrista,
            equipe: dist.equipe || 'Equipe Campo',
            sequencia: j + 1,
          });
          atribuidas++;
        }
      }

      offsetOS += atribuidas;
      resultadoDistribuicao.push({ cadastrista: dist.cadastrista, count: atribuidas });

      if (offsetOS >= osPendentes.length) break;
    }

    const agora = Date.now();
    this.osList = this.osList.map((os) => {
      if (mapaAtualizacao.has(os.id)) {
        const info = mapaAtualizacao.get(os.id)!;
        return {
          ...os,
          cadastristaDesignado: info.cadastrista,
          equipeDesignada: info.equipe,
          sequenciaRota: info.sequencia,
          ordemProgramada: info.sequencia,
          atualizadoEm: agora,
        };
      }
      return os;
    });

    this.saveToStorage();

    return {
      totalProgramadas: mapaAtualizacao.size,
      distribuicao: resultadoDistribuicao,
    };
  }

  /**
   * Gerador automático de OS espelhando o SCIWeb da EMBASA por ordem de lotes crescentes
   */
  public gerarLoteOSSCIWeb(
    bairro: BairroR7,
    quadra: string,
    quantidadeLotes: number,
    logradouroBase: string,
    equipe: string,
    cadastrista: string
  ): OrdemServicoSCIWeb[] {
    const novasOS: OrdemServicoSCIWeb[] = [];
    const infoBairro = BAIRROS_DATA[bairro];
    const baseLat = infoBairro?.coordenadasCentro.lat || -12.952;
    const baseLng = infoBairro?.coordenadasCentro.lng || -38.45;
    const za = (infoBairro?.zonas?.[0] || 'ZA 23') as ZonaAbastecimento;

    // Acha o maior lote já existente na quadra
    const osNaQuadra = this.osList.filter((o) => o.bairro === bairro && o.quadra === quadra);
    const startLoteNum = osNaQuadra.reduce((max, cur) => Math.max(max, cur.numeroLoteNumerico), 0) + 1;

    for (let i = 0; i < quantidadeLotes; i++) {
      const loteNum = startLoteNum + i;
      const loteCode = `LT-${String(loteNum).padStart(2, '0')}`;
      const numeroPorta = String(10 + loteNum * 4);
      const matriculaGerada = String(Math.floor(10000000 + Math.random() * 90000000));
      const osNumero = `OS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const sciOSNumero = `SCI-OS-${Math.floor(800000 + Math.random() * 199999)}`;

      const nova: OrdemServicoSCIWeb = {
        id: `os-gen-${Date.now()}-${loteNum}`,
        numeroOS: osNumero,
        numeroOSSCIWeb: sciOSNumero,
        matriculaEmbasa: matriculaGerada,
        bairro,
        logradouro: logradouroBase,
        numeroPorta,
        quadra,
        lote: loteCode,
        numeroLoteNumerico: loteNum,
        zonaAbastecimento: za,
        nomeConsumidorSCIWeb: `Consumidor Cadastrado Lote ${loteNum}`,
        hidrometroCadastradoSCIWeb: `A25N${Math.floor(100000 + Math.random() * 900000)}`,
        categoriaImovel: 'RESIDENCIAL',
        equipeDesignada: equipe,
        cadastristaDesignado: cadastrista,
        status: 'ABERTA',
        tentativasAusente: 0,
        sequenciaRota: loteNum,
        validacaoStatus: 'PENDENTE_VALIDACAO',
        coordenadas: {
          latitude: baseLat + (i * 0.0003),
          longitude: baseLng + (i * 0.0003),
          precisaoMetros: 3.5,
          timestamp: Date.now(),
        },
        criadoEm: Date.now(),
        atualizadoEm: Date.now(),
      };

      novasOS.push(nova);
    }

    this.osList.push(...novasOS);
    this.saveToStorage();
    return novasOS;
  }

  // Importação e Migração em Massa diretamente do SCIWeb da EMBASA
  public importarOrdensDoSCIWeb(
    ordensMigradas: Array<{
      numeroOS: string;
      numeroOSSCIWeb: string;
      matriculaEmbasa: string;
      bairro: BairroR7;
      logradouro: string;
      numeroPorta: string;
      quadra: string;
      lote: string;
      subLote?: string;
      numeroLoteNumerico: number;
      zonaAbastecimento: ZonaAbastecimento;
      nomeConsumidorSCIWeb: string;
      hidrometroCadastradoSCIWeb: string;
      categoriaImovel: 'RESIDENCIAL' | 'COMERCIAL' | 'INDUSTRIAL' | 'PUBLICO';
      equipeDesignada: string;
      cadastristaDesignado: string;
      coordenadas: CoordenadasGPS;
    }>
  ): { inseridas: number; atualizadas: number } {
    let inseridas = 0;
    let atualizadas = 0;

    ordensMigradas.forEach((item) => {
      const idx = this.osList.findIndex(
        (o) => o.matriculaEmbasa === item.matriculaEmbasa || o.numeroOSSCIWeb === item.numeroOSSCIWeb
      );

      if (idx >= 0) {
        // Atualiza dados preservando status se já estiver executada
        const existente = this.osList[idx];
        this.osList[idx] = {
          ...existente,
          ...item,
          status: existente.status !== 'ABERTA' ? existente.status : 'ABERTA',
          atualizadoEm: Date.now(),
        };
        atualizadas++;
      } else {
        const novaOS: OrdemServicoSCIWeb = {
          id: `os_sci_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          numeroOS: item.numeroOS,
          numeroOSSCIWeb: item.numeroOSSCIWeb,
          matriculaEmbasa: item.matriculaEmbasa,
          bairro: item.bairro,
          logradouro: item.logradouro,
          numeroPorta: item.numeroPorta,
          quadra: item.quadra,
          lote: item.lote,
          subLote: item.subLote,
          numeroLoteNumerico: item.numeroLoteNumerico,
          zonaAbastecimento: item.zonaAbastecimento,
          nomeConsumidorSCIWeb: item.nomeConsumidorSCIWeb,
          hidrometroCadastradoSCIWeb: item.hidrometroCadastradoSCIWeb,
          categoriaImovel: item.categoriaImovel,
          equipeDesignada: item.equipeDesignada,
          cadastristaDesignado: item.cadastristaDesignado,
          status: 'ABERTA',
          tentativasAusente: 0,
          sequenciaRota: item.numeroLoteNumerico,
          validacaoStatus: 'PENDENTE_VALIDACAO',
          coordenadas: item.coordenadas,
          criadoEm: Date.now(),
          atualizadoEm: Date.now(),
        };
        this.osList.push(novaOS);
        inseridas++;
      }
    });

    this.saveToStorage();
    return { inseridas, atualizadas };
  }

  public criarOSAvulsa(dados: {
    matriculaEmbasa: string;
    nomeConsumidorSCIWeb: string;
    logradouro: string;
    numeroPorta: string;
    quadra: string;
    lote: string;
    bairro: BairroR7;
    hidrometroCadastradoSCIWeb: string;
    cadastristaDesignado: string;
    equipeDesignada: string;
    status?: StatusOS;
  }): OrdemServicoSCIWeb {
    const coordsBairro = BAIRROS_DATA[dados.bairro] || BAIRROS_DATA['Cabula'];
    const maxSeq = this.osList.reduce((max, os) => Math.max(max, os.sequenciaRota || 0), 0);
    const numLote = parseInt(dados.lote.replace(/\D/g, ''), 10) || (maxSeq + 1);
    const zona = coordsBairro?.zonas?.[0] || 'ZA 23';
    const lat = coordsBairro?.coordenadasCentro?.lat || -12.956;
    const lng = coordsBairro?.coordenadasCentro?.lng || -38.469;

    const novaOS: OrdemServicoSCIWeb = {
      id: `os_manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      numeroOS: `OS-MANUAL-${Math.floor(10000 + Math.random() * 90000)}`,
      numeroOSSCIWeb: `SCI-MANUAL-${dados.matriculaEmbasa}`,
      matriculaEmbasa: dados.matriculaEmbasa,
      bairro: dados.bairro,
      logradouro: dados.logradouro,
      numeroPorta: dados.numeroPorta,
      quadra: dados.quadra,
      lote: dados.lote,
      numeroLoteNumerico: numLote,
      zonaAbastecimento: zona,
      nomeConsumidorSCIWeb: dados.nomeConsumidorSCIWeb,
      hidrometroCadastradoSCIWeb: dados.hidrometroCadastradoSCIWeb,
      categoriaImovel: 'RESIDENCIAL',
      equipeDesignada: dados.equipeDesignada,
      cadastristaDesignado: dados.cadastristaDesignado,
      status: dados.status || 'ABERTA',
      tentativasAusente: 0,
      sequenciaRota: maxSeq + 1,
      validacaoStatus: 'PENDENTE_VALIDACAO',
      coordenadas: {
        latitude: lat + (Math.random() - 0.5) * 0.003,
        longitude: lng + (Math.random() - 0.5) * 0.003,
        precisaoMetros: 3.5,
        timestamp: Date.now(),
      },
      criadoEm: Date.now(),
      atualizadoEm: Date.now(),
    };

    this.osList.push(novaOS);
    this.saveToStorage();
    return novaOS;
  }

  public salvarFotosOS(osId: string, fotos: FotoRegistroOS[]): boolean {
    const idx = this.osList.findIndex((o) => o.id === osId);
    if (idx >= 0) {
      // Limita estritamente a até 10 fotos conforme requisito de campo
      const fotosTratadas = (fotos || []).slice(0, 10);
      this.osList[idx] = {
        ...this.osList[idx],
        fotos: fotosTratadas,
        atualizadoEm: Date.now(),
      };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public salvarCartografiaOS(osId: string, cartografia: LoteCartografia): boolean {
    const idx = this.osList.findIndex((o) => o.id === osId);
    if (idx >= 0) {
      this.osList[idx] = {
        ...this.osList[idx],
        cartografiaLote: cartografia,
        atualizadoEm: Date.now(),
      };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public salvarCensoOS(osId: string, censo: CensoRapidoOS, marcarExecutada: boolean = true): boolean {
    const idx = this.osList.findIndex((o) => o.id === osId);
    if (idx >= 0) {
      this.osList[idx] = {
        ...this.osList[idx],
        censoDados: censo,
        status: marcarExecutada ? 'EXECUTADA' : this.osList[idx].status,
        atualizadoEm: Date.now(),
      };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public atualizarStatusOS(id: string, status: StatusOS): boolean {
    const os = this.osList.find((o) => o.id === id);
    if (os) {
      os.status = status;
      os.atualizadoEm = Date.now();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public registrarImpedimento(id: string, motivo?: MotivoImpedimento, obs?: string): boolean {
    const os = this.osList.find((o) => o.id === id);
    if (os) {
      os.status = 'IMPEDIDA';
      os.motivoImpedimento = motivo;
      os.observacaoImpedimento = obs;
      os.atualizadoEm = Date.now();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public subscribe(listener: OSListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.getAllOS()));
  }
}

export const osService = new OSService();
