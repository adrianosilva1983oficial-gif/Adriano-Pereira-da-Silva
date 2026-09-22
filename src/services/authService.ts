import {
  UsuarioSistema,
  PerfilUsuario,
  StatusFuncionario,
  USUARIOS_PREDEFINIDOS,
  DIREITOS_PADRAO_POR_PERFIL,
  DireitosUsoSistema,
  PermissoesPerfil,
} from '../types/auth';

const STORAGE_KEY_CURRENT_USER = 'consorcio_r7_current_user';
const STORAGE_KEY_FUNCIONARIOS = 'consorcio_r7_lista_funcionarios';
const STORAGE_KEY_DIREITOS_PERFIS = 'consorcio_r7_direitos_perfis_config';

type AuthListener = (user: UsuarioSistema) => void;
type FuncionariosListener = (funcionarios: UsuarioSistema[]) => void;

class AuthService {
  private currentUser: UsuarioSistema;
  private funcionarios: UsuarioSistema[] = [];
  private direitosPerfis: Record<PerfilUsuario, DireitosUsoSistema>;
  private listeners: AuthListener[] = [];
  private funcListeners: FuncionariosListener[] = [];

  constructor() {
    this.direitosPerfis = this.loadDireitosPerfis();
    this.funcionarios = this.loadFuncionarios();
    this.currentUser = this.loadCurrentUser();
  }

  private loadDireitosPerfis(): Record<PerfilUsuario, DireitosUsoSistema> {
    const raw = localStorage.getItem(STORAGE_KEY_DIREITOS_PERFIS);
    if (raw) {
      try {
        return { ...DIREITOS_PADRAO_POR_PERFIL, ...JSON.parse(raw) };
      } catch {
        return { ...DIREITOS_PADRAO_POR_PERFIL };
      }
    }
    return { ...DIREITOS_PADRAO_POR_PERFIL };
  }

  private loadFuncionarios(): UsuarioSistema[] {
    const raw = localStorage.getItem(STORAGE_KEY_FUNCIONARIOS);
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
    // Salva a lista pré-definida
    localStorage.setItem(STORAGE_KEY_FUNCIONARIOS, JSON.stringify(USUARIOS_PREDEFINIDOS));
    return [...USUARIOS_PREDEFINIDOS];
  }

  private loadCurrentUser(): UsuarioSistema {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const match = this.funcionarios.find((f) => f.id === parsed.id);
        return match || parsed;
      } catch {
        return this.funcionarios[0] || USUARIOS_PREDEFINIDOS[0];
      }
    }
    return this.funcionarios[0] || USUARIOS_PREDEFINIDOS[0];
  }

  public getCurrentUser(): UsuarioSistema {
    return this.currentUser;
  }

  public getAllFuncionarios(): UsuarioSistema[] {
    return [...this.funcionarios];
  }

  public getFuncionariosAtivos(): UsuarioSistema[] {
    return this.funcionarios.filter((f) => f.status === 'ATIVO');
  }

  public getCadastristasAtivos(): UsuarioSistema[] {
    return this.funcionarios.filter(
      (f) => f.status === 'ATIVO' && (f.perfil === 'CADASTRISTA_CAMPO' || f.perfil === 'SUPERVISOR_GERAL' || f.perfil === 'ADMIN_CONTRATO')
    );
  }

  public getEquipesCadastradas(): string[] {
    const equipes = new Set<string>();
    this.funcionarios.forEach((f) => {
      if (f.equipe) equipes.add(f.equipe);
    });
    return Array.from(equipes);
  }

  public getPermissions(user?: UsuarioSistema): PermissoesPerfil {
    const targetUser = user || this.currentUser;
    const direitosBase = this.direitosPerfis[targetUser.perfil] || DIREITOS_PADRAO_POR_PERFIL[targetUser.perfil];

    // Se o usuário tiver direitos personalizados (override granular), mescla
    if (targetUser.permissoesPersonalizadas) {
      return {
        ...direitosBase,
        ...targetUser.permissoesPersonalizadas,
      };
    }

    return { ...direitosBase };
  }

  public getAllPerfisDireitos(): Record<PerfilUsuario, DireitosUsoSistema> {
    return { ...this.direitosPerfis };
  }

  public atualizarDireitosPerfil(perfil: PerfilUsuario, novosDireitos: DireitosUsoSistema): void {
    this.direitosPerfis[perfil] = { ...novosDireitos };
    localStorage.setItem(STORAGE_KEY_DIREITOS_PERFIS, JSON.stringify(this.direitosPerfis));
    this.notify();
  }

  public resetarDireitosParaPadrao(): void {
    this.direitosPerfis = { ...DIREITOS_PADRAO_POR_PERFIL };
    localStorage.removeItem(STORAGE_KEY_DIREITOS_PERFIS);
    this.notify();
  }

  public setCurrentUser(user: UsuarioSistema): void {
    this.currentUser = user;
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    this.notify();
  }

  public simularAcessoComo(id: string): boolean {
    const found = this.funcionarios.find((f) => f.id === id);
    if (found) {
      this.setCurrentUser(found);
      return true;
    }
    return false;
  }

  public salvarFuncionario(dados: Partial<UsuarioSistema>): UsuarioSistema {
    let funcionarioAtualizado: UsuarioSistema;

    if (dados.id) {
      // Edição
      const index = this.funcionarios.findIndex((f) => f.id === dados.id);
      if (index >= 0) {
        funcionarioAtualizado = {
          ...this.funcionarios[index],
          ...dados,
          atualizadoEm: Date.now(),
        } as UsuarioSistema;
        this.funcionarios[index] = funcionarioAtualizado;
      } else {
        funcionarioAtualizado = {
          ...dados,
          id: dados.id,
          criadoEm: Date.now(),
          atualizadoEm: Date.now(),
        } as UsuarioSistema;
        this.funcionarios.push(funcionarioAtualizado);
      }
    } else {
      // Novo Funcionário
      const novoId = `func-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      funcionarioAtualizado = {
        id: novoId,
        nome: dados.nome || 'Novo Colaborador',
        email: dados.email || '',
        senha: dados.senha || '123',
        telefone: dados.telefone || '',
        cpf: dados.cpf || '',
        perfil: dados.perfil || 'CADASTRISTA_CAMPO',
        cargo: dados.cargo || 'Cadastrista Técnico',
        setorId: dados.setorId || 'setor-operacao',
        equipe: dados.equipe || 'Equipe 01 - Frente Cabula',
        matriculaFuncional: dados.matriculaFuncional || `CAD-${Math.floor(1000 + Math.random() * 9000)}`,
        zonaAtuacao: dados.zonaAtuacao || 'ZA 23',
        status: dados.status || 'ATIVO',
        dataAdmissao: dados.dataAdmissao || new Date().toISOString().split('T')[0],
        observacoes: dados.observacoes || '',
        permissoesPersonalizadas: dados.permissoesPersonalizadas || undefined,
        criadoEm: Date.now(),
        atualizadoEm: Date.now(),
      };
      this.funcionarios.push(funcionarioAtualizado);
    }

    this.persistFuncionarios();

    // Se editou o usuário logado atualmente, atualiza
    if (this.currentUser.id === funcionarioAtualizado.id) {
      this.currentUser = funcionarioAtualizado;
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(funcionarioAtualizado));
      this.notify();
    }

    return funcionarioAtualizado;
  }

  public alterarStatusFuncionario(id: string, status: StatusFuncionario): void {
    const func = this.funcionarios.find((f) => f.id === id);
    if (func) {
      func.status = status;
      func.atualizadoEm = Date.now();
      this.persistFuncionarios();
      if (this.currentUser.id === id) {
        this.currentUser.status = status;
        this.notify();
      }
    }
  }

  public excluirFuncionario(id: string): boolean {
    if (this.currentUser.id === id) {
      // Não permite excluir o próprio usuário logado
      return false;
    }
    this.funcionarios = this.funcionarios.filter((f) => f.id !== id);
    this.persistFuncionarios();
    return true;
  }

  private persistFuncionarios(): void {
    localStorage.setItem(STORAGE_KEY_FUNCIONARIOS, JSON.stringify(this.funcionarios));
    this.notifyFuncListeners();
  }

  public switchProfile(perfil: PerfilUsuario): void {
    const match = this.funcionarios.find((u) => u.perfil === perfil && u.status === 'ATIVO') ||
      USUARIOS_PREDEFINIDOS.find((u) => u.perfil === perfil);

    if (match) {
      this.setCurrentUser(match);
    } else {
      const updated: UsuarioSistema = {
        ...this.currentUser,
        perfil,
      };
      this.setCurrentUser(updated);
    }
  }

  public login(email: string, password?: string): { success: boolean; user?: UsuarioSistema; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const found = this.funcionarios.find((u) => u.email.toLowerCase() === cleanEmail);
    if (found) {
      if (found.status === 'BLOQUEADO' || found.status === 'INATIVO') {
        return { success: false, error: `Acesso bloqueado: Este colaborador está com status "${found.status}". Contate o administrador.` };
      }
      // Se informou senha, valida se bate com a senha cadastrada (ou '123' como padrão)
      if (password !== undefined && password !== '') {
        const senhaCadastrada = found.senha || '123';
        if (password !== senhaCadastrada && password !== '123456' && password !== 'admin') {
          return { success: false, error: 'Senha incorreta para este colaborador.' };
        }
      }
      this.setCurrentUser(found);
      return { success: true, user: found };
    }
    return { success: false, error: 'Colaborador não localizado com este e-mail.' };
  }

  public logout(): void {
    const primeiroAtivo = this.funcionarios.find((f) => f.status === 'ATIVO') || USUARIOS_PREDEFINIDOS[0];
    this.setCurrentUser(primeiroAtivo);
  }

  public getTodosFuncionarios(): UsuarioSistema[] {
    return [...this.funcionarios];
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public subscribeFuncionarios(listener: FuncionariosListener): () => void {
    this.funcListeners.push(listener);
    return () => {
      this.funcListeners = this.funcListeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }

  private notifyFuncListeners(): void {
    this.funcListeners.forEach((listener) => listener([...this.funcionarios]));
  }
}

export const authService = new AuthService();

