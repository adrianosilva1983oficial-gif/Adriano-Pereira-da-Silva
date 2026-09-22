import {
  DadosEmpresa,
  SetorEmpresa,
  EquipeCampoERP,
  DADOS_EMPRESA_PADRAO,
  SETORES_PADRAO_EMPRESA,
  EQUIPES_PADRAO_EMPRESA,
} from '../types/empresa';

const STORAGE_KEY_EMPRESA = 'consorcio_r7_erp_dados_empresa';
const STORAGE_KEY_SETORES = 'consorcio_r7_erp_setores';
const STORAGE_KEY_EQUIPES = 'consorcio_r7_erp_equipes';

type EmpresaListener = (dados: DadosEmpresa) => void;
type SetoresListener = (setores: SetorEmpresa[]) => void;
type EquipesListener = (equipes: EquipeCampoERP[]) => void;

class EmpresaService {
  private dadosEmpresa: DadosEmpresa;
  private setores: SetorEmpresa[] = [];
  private equipes: EquipeCampoERP[] = [];

  private empresaListeners: EmpresaListener[] = [];
  private setoresListeners: SetoresListener[] = [];
  private equipesListeners: EquipesListener[] = [];

  constructor() {
    this.dadosEmpresa = this.loadEmpresa();
    this.setores = this.loadSetores();
    this.equipes = this.loadEquipes();
  }

  private loadEmpresa(): DadosEmpresa {
    const raw = localStorage.getItem(STORAGE_KEY_EMPRESA);
    if (raw) {
      try {
        return { ...DADOS_EMPRESA_PADRAO, ...JSON.parse(raw) };
      } catch {
        return { ...DADOS_EMPRESA_PADRAO };
      }
    }
    localStorage.setItem(STORAGE_KEY_EMPRESA, JSON.stringify(DADOS_EMPRESA_PADRAO));
    return { ...DADOS_EMPRESA_PADRAO };
  }

  private loadSetores(): SetorEmpresa[] {
    const raw = localStorage.getItem(STORAGE_KEY_SETORES);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    localStorage.setItem(STORAGE_KEY_SETORES, JSON.stringify(SETORES_PADRAO_EMPRESA));
    return [...SETORES_PADRAO_EMPRESA];
  }

  private loadEquipes(): EquipeCampoERP[] {
    const raw = localStorage.getItem(STORAGE_KEY_EQUIPES);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    localStorage.setItem(STORAGE_KEY_EQUIPES, JSON.stringify(EQUIPES_PADRAO_EMPRESA));
    return [...EQUIPES_PADRAO_EMPRESA];
  }

  // Métodos da Empresa
  public getDadosEmpresa(): DadosEmpresa {
    return { ...this.dadosEmpresa };
  }

  public salvarDadosEmpresa(novosDados: Partial<DadosEmpresa>): DadosEmpresa {
    this.dadosEmpresa = {
      ...this.dadosEmpresa,
      ...novosDados,
      atualizadoEm: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_EMPRESA, JSON.stringify(this.dadosEmpresa));
    this.empresaListeners.forEach((l) => l({ ...this.dadosEmpresa }));
    return { ...this.dadosEmpresa };
  }

  // Métodos dos Setores
  public getAllSetores(): SetorEmpresa[] {
    return [...this.setores];
  }

  public getSetorById(id: string): SetorEmpresa | undefined {
    return this.setores.find((s) => s.id === id);
  }

  public salvarSetor(dados: Partial<SetorEmpresa>): SetorEmpresa {
    let setorSalvo: SetorEmpresa;

    if (dados.id) {
      const idx = this.setores.findIndex((s) => s.id === dados.id);
      if (idx >= 0) {
        setorSalvo = {
          ...this.setores[idx],
          ...dados,
        } as SetorEmpresa;
        this.setores[idx] = setorSalvo;
      } else {
        setorSalvo = {
          id: dados.id,
          codigo: dados.codigo || `SET-${Math.floor(10 + Math.random() * 90)}`,
          nome: dados.nome || 'Novo Setor',
          descricao: dados.descricao || '',
          responsavelNome: dados.responsavelNome || 'A Definir',
          responsavelCargo: dados.responsavelCargo || 'Responsável Técnico',
          emailOuRamal: dados.emailOuRamal || '',
          corTag: dados.corTag || 'sky',
          ativo: dados.ativo !== undefined ? dados.ativo : true,
          criadoEm: Date.now(),
        };
        this.setores.push(setorSalvo);
      }
    } else {
      const novoId = `setor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setorSalvo = {
        id: novoId,
        codigo: dados.codigo || `SET-${Math.floor(100 + Math.random() * 900)}`,
        nome: dados.nome || 'Novo Setor',
        descricao: dados.descricao || '',
        responsavelNome: dados.responsavelNome || 'A Definir',
        responsavelCargo: dados.responsavelCargo || 'Responsável de Setor',
        emailOuRamal: dados.emailOuRamal || '',
        corTag: dados.corTag || 'emerald',
        ativo: dados.ativo !== undefined ? dados.ativo : true,
        criadoEm: Date.now(),
      };
      this.setores.push(setorSalvo);
    }

    localStorage.setItem(STORAGE_KEY_SETORES, JSON.stringify(this.setores));
    this.setoresListeners.forEach((l) => l([...this.setores]));
    return setorSalvo;
  }

  public excluirSetor(id: string): boolean {
    this.setores = this.setores.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY_SETORES, JSON.stringify(this.setores));
    this.setoresListeners.forEach((l) => l([...this.setores]));
    return true;
  }

  // Métodos das Equipes
  public getAllEquipes(): EquipeCampoERP[] {
    return [...this.equipes];
  }

  public salvarEquipe(dados: Partial<EquipeCampoERP>): EquipeCampoERP {
    let equipeSalva: EquipeCampoERP;

    if (dados.id) {
      const idx = this.equipes.findIndex((e) => e.id === dados.id);
      if (idx >= 0) {
        equipeSalva = {
          ...this.equipes[idx],
          ...dados,
        } as EquipeCampoERP;
        this.equipes[idx] = equipeSalva;
      } else {
        equipeSalva = {
          id: dados.id,
          nome: dados.nome || 'Nova Equipe',
          setorId: dados.setorId || 'setor-operacao',
          supervisorResponsavel: dados.supervisorResponsavel || 'Supervisor Geral',
          veiculoIdentificacao: dados.veiculoIdentificacao || '',
          zonaAtuacaoPrincipal: dados.zonaAtuacaoPrincipal || 'ZA 23',
          bairrosBase: dados.bairrosBase || ['Cabula'],
          metaDiariaCenso: dados.metaDiariaCenso || 40,
          ativo: dados.ativo !== undefined ? dados.ativo : true,
          criadoEm: Date.now(),
        };
        this.equipes.push(equipeSalva);
      }
    } else {
      const novoId = `equipe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      equipeSalva = {
        id: novoId,
        nome: dados.nome || 'Nova Equipe',
        setorId: dados.setorId || 'setor-operacao',
        supervisorResponsavel: dados.supervisorResponsavel || 'Supervisor Geral',
        veiculoIdentificacao: dados.veiculoIdentificacao || '',
        zonaAtuacaoPrincipal: dados.zonaAtuacaoPrincipal || 'ZA 23',
        bairrosBase: dados.bairrosBase || ['Cabula'],
        metaDiariaCenso: dados.metaDiariaCenso || 40,
        ativo: dados.ativo !== undefined ? dados.ativo : true,
        criadoEm: Date.now(),
      };
      this.equipes.push(equipeSalva);
    }

    localStorage.setItem(STORAGE_KEY_EQUIPES, JSON.stringify(this.equipes));
    this.equipesListeners.forEach((l) => l([...this.equipes]));
    return equipeSalva;
  }

  public excluirEquipe(id: string): boolean {
    this.equipes = this.equipes.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEY_EQUIPES, JSON.stringify(this.equipes));
    this.equipesListeners.forEach((l) => l([...this.equipes]));
    return true;
  }

  // Subscrições
  public subscribeEmpresa(l: EmpresaListener): () => void {
    this.empresaListeners.push(l);
    return () => {
      this.empresaListeners = this.empresaListeners.filter((x) => x !== l);
    };
  }

  public subscribeSetores(l: SetoresListener): () => void {
    this.setoresListeners.push(l);
    return () => {
      this.setoresListeners = this.setoresListeners.filter((x) => x !== l);
    };
  }

  public subscribeEquipes(l: EquipesListener): () => void {
    this.equipesListeners.push(l);
    return () => {
      this.equipesListeners = this.equipesListeners.filter((x) => x !== l);
    };
  }
}

export const empresaService = new EmpresaService();
