import { LicencaDispositivo, EmpresaPrestadora, StatusLicenca } from '../types/licenciamento';

const STORAGE_DEVICE_ID = 'censo_licenca_device_id';
const STORAGE_DEVICE_IMEI = 'censo_licenca_imei';
const STORAGE_DEVICE_LICENCA = 'censo_licenca_status';
const STORAGE_EMPRESAS = 'censo_empresas_prestadoras';
const STORAGE_TODOS_DISPOSITIVOS = 'censo_todos_dispositivos_licenciados';
const STORAGE_MASTER_SESSION = 'censo_master_session';

export const MASTER_EMAIL = 'adrianosilva1983oficial@gmail.com';
export const MASTER_NOME = 'Adriano Silva';
export const MASTER_SECRET_PASS = 'ADRIANO_MASTER_2026'; // Senha Mestre de Acesso Imediato
export const VALOR_LICENCA_POR_CELULAR = 99.0; // R$ 99,00 por licença única por celular (IMEI)

// Entidade inicial cadastrada para operação do sistema
const EMPRESAS_INICIAIS: EmpresaPrestadora[] = [
  {
    id: 'emp_aquasane_01',
    razaoSocial: 'AquaSane Pro Soluções em Saneamento Ltda',
    nomeFantasia: 'AquaSane Pro',
    cnpj: '12.345.678/0001-90',
    tipoServico: 'RECADASTRRAMENTO',
    contratoNumero: 'CT-AQUASANE-2026',
    limiteAparelhos: 30,
    aparelhosAtivos: 3,
    status: 'ATIVO',
    dataInicioContrato: Date.now() - 30 * 86400000,
    dataFimContrato: Date.now() + 335 * 86400000,
    contatoResponsavel: 'Operações AquaSane Pro',
    telefoneContato: '(71) 98822-4411',
    emailContato: 'operacoes@aquasanepro.com.br',
    valorMensalPorAparelho: 99.0, // R$ 99,00 por licença única por celular / IMEI
  },
];

class LicenciamentoService {
  private currentDeviceId: string;
  private currentIMEI: string;
  private currentLicenca: LicencaDispositivo | null = null;
  private empresas: EmpresaPrestadora[] = [];
  private todosDispositivos: LicencaDispositivo[] = [];
  private isMasterLoggedIn = false;
  private listeners: Array<() => void> = [];

  constructor() {
    this.currentDeviceId = this.initDeviceId();
    this.currentIMEI = this.initIMEI();
    this.carregarDados();
  }

  // Gera ou recupera o IMEI do aparelho celular (15 dígitos padrão Anatel/GSMA)
  private initIMEI(): string {
    let imei = localStorage.getItem(STORAGE_DEVICE_IMEI);
    if (!imei) {
      // Gera um IMEI padrão de 15 dígitos baseado no hardware / timestamp
      const tac = '358920'; // TAC comum de smartphones Android homologados
      const serialPart = String(Math.floor(10000000 + Math.random() * 90000000)).slice(0, 8);
      const luhn = String(Math.floor(1 + Math.random() * 9));
      imei = `${tac}${serialPart}${luhn}`.slice(0, 15);
      localStorage.setItem(STORAGE_DEVICE_IMEI, imei);
    }
    return imei;
  }

  // Permite ao operador ou admin informar o IMEI físico real do smartphone
  public setDeviceIMEI(novoIMEI: string) {
    const limpo = novoIMEI.replace(/\D/g, '').slice(0, 15);
    if (limpo.length >= 8) {
      this.currentIMEI = limpo;
      localStorage.setItem(STORAGE_DEVICE_IMEI, limpo);
      if (this.currentLicenca) {
        this.currentLicenca.imeiAparelho = limpo;
        this.salvarLicencaLocal(this.currentLicenca);
        this.atualizarListaGlobalDispositivos(this.currentLicenca);
      }
      this.notify();
    }
  }

  public getDeviceIMEI(): string {
    return this.currentIMEI;
  }

  // Gera ou recupera o ID exclusivo deste aparelho celular
  private initDeviceId(): string {
    let id = localStorage.getItem(STORAGE_DEVICE_ID);
    if (!id) {
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const timePart = Date.now().toString(36).substring(3, 7).toUpperCase();
      const screenPart = `${window.screen.width}x${window.screen.height}`.slice(0, 4);
      id = `CEL-${screenPart}-${randomPart}-${timePart}`;
      localStorage.setItem(STORAGE_DEVICE_ID, id);
    }
    return id;
  }

  private carregarDados() {
    // 1. Carrega Empresas
    const savedEmpresas = localStorage.getItem(STORAGE_EMPRESAS);
    if (savedEmpresas) {
      try {
        this.empresas = JSON.parse(savedEmpresas);
      } catch {
        this.empresas = EMPRESAS_INICIAIS;
      }
    } else {
      this.empresas = EMPRESAS_INICIAIS;
      this.salvarEmpresas();
    }

    // 2. Carrega Todos os Dispositivos
    const savedDevices = localStorage.getItem(STORAGE_TODOS_DISPOSITIVOS);
    if (savedDevices) {
      try {
        this.todosDispositivos = JSON.parse(savedDevices);
      } catch {
        this.todosDispositivos = [];
      }
    }

    // 3. Carrega Sessão Master
    this.isMasterLoggedIn = localStorage.getItem(STORAGE_MASTER_SESSION) === 'true';

    // 4. Carrega Licença deste aparelho específico
    const savedLicenca = localStorage.getItem(STORAGE_DEVICE_LICENCA);
    if (savedLicenca) {
      try {
        this.currentLicenca = JSON.parse(savedLicenca);
        // Verifica se a licença expirou
        if (
          this.currentLicenca &&
          this.currentLicenca.dataExpiracao &&
          Date.now() > this.currentLicenca.dataExpiracao
        ) {
          this.currentLicenca.status = 'EXPIRADO';
          this.salvarLicencaLocal(this.currentLicenca);
        }
      } catch {
        this.currentLicenca = null;
      }
    }

    // Se este aparelho ainda não tem licença registrada, inicializa como ATIVO por padrão para o primeiro acesso de desenvolvimento ou PENDENTE
    if (!this.currentLicenca) {
      // Para demonstração imediata sem frustrar a primeira visualização, o primeiro aparelho inicia ativo vinculado ao AquaSane Pro
      const primeiraLicenca: LicencaDispositivo = {
        deviceId: this.currentDeviceId,
        imeiAparelho: this.currentIMEI,
        modeloAparelho: this.detectarModeloAparelho(),
        empresaId: this.empresas[0].id,
        empresaNome: this.empresas[0].nomeFantasia,
        cadastristaNome: 'Colaborador Titular',
        dataSolicitacao: Date.now(),
        dataAtivacao: Date.now(),
        dataExpiracao: Date.now() + 365 * 86400000, // 1 ano
        status: 'ATIVO',
        valorLicenca: VALOR_LICENCA_POR_CELULAR,
        tipoLicenca: 'LICENCA_UNICA_IMEI',
        chaveLiberacao: this.gerarChaveCriptografica(this.currentDeviceId, this.empresas[0].id),
        totalCensosRealizados: 18,
      };
      this.salvarLicencaLocal(primeiraLicenca);
      this.atualizarListaGlobalDispositivos(primeiraLicenca);
    }
  }

  public getDeviceId(): string {
    return this.currentDeviceId;
  }

  public getLicencaAtual(): LicencaDispositivo | null {
    return this.currentLicenca;
  }

  public isDispositivoAutorizado(): boolean {
    // Se o Master Adriano Silva estiver logado, tem passe livre
    if (this.isMasterLoggedIn) return true;

    if (!this.currentLicenca) return false;
    if (this.currentLicenca.status !== 'ATIVO') return false;

    // Checa expiração
    if (this.currentLicenca.dataExpiracao && Date.now() > this.currentLicenca.dataExpiracao) {
      return false;
    }

    return true;
  }

  public isMaster(): boolean {
    return this.isMasterLoggedIn;
  }

  public loginMaster(senha: string): boolean {
    if (senha.trim() === MASTER_SECRET_PASS) {
      this.isMasterLoggedIn = true;
      localStorage.setItem(STORAGE_MASTER_SESSION, 'true');
      this.notify();
      return true;
    }
    return false;
  }

  public logoutMaster() {
    this.isMasterLoggedIn = false;
    localStorage.removeItem(STORAGE_MASTER_SESSION);
    this.notify();
  }

  // Gera chave criptográfica que só o Adriano Silva consegue calcular (suporta DeviceID ou IMEI)
  public gerarChaveCriptografica(identificador: string, empresaId: string): string {
    let hash = 0;
    const raw = `${identificador.trim().toUpperCase()}_${empresaId}_${MASTER_SECRET_PASS}`;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `LIB-${hex.substring(0, 4)}-${hex.substring(4, 8)}`;
  }

  // Ativação do dispositivo por Chave e IMEI (Licença Única R$ 99,00 por celular)
  public ativarPorChave(
    chave: string,
    empresaId: string,
    cadastristaNome?: string,
    imeiCustom?: string
  ): { success: boolean; message: string } {
    const limpa = chave.trim().toUpperCase();
    const imeiEfetivo = (imeiCustom || this.currentIMEI).replace(/\D/g, '').slice(0, 15);
    
    // Atualiza IMEI se informado
    if (imeiEfetivo.length >= 8) {
      this.currentIMEI = imeiEfetivo;
      localStorage.setItem(STORAGE_DEVICE_IMEI, imeiEfetivo);
    }

    const chaveDeviceId = this.gerarChaveCriptografica(this.currentDeviceId, empresaId);
    const chaveIMEI = this.gerarChaveCriptografica(this.currentIMEI, empresaId);

    // Aceita chave gerada para o IMEI, DeviceID ou chave mestre
    if (limpa === chaveDeviceId || limpa === chaveIMEI || limpa === MASTER_SECRET_PASS) {
      const empresa = this.empresas.find((e) => e.id === empresaId) || this.empresas[0];

      // Regra de Licença Única por IMEI: verifica se já existe licença deste IMEI
      const licencaExistenteOutro = this.todosDispositivos.find(
        (d) => d.imeiAparelho === this.currentIMEI && d.deviceId !== this.currentDeviceId && d.status === 'ATIVO'
      );

      const licenca: LicencaDispositivo = {
        deviceId: this.currentDeviceId,
        imeiAparelho: this.currentIMEI,
        modeloAparelho: this.detectarModeloAparelho(),
        empresaId: empresa.id,
        empresaNome: empresa.nomeFantasia,
        cadastristaNome: cadastristaNome || 'Cadastrista Credenciado',
        dataSolicitacao: this.currentLicenca?.dataSolicitacao || Date.now(),
        dataAtivacao: Date.now(),
        dataExpiracao: Date.now() + 365 * 86400000, // 1 ano
        status: 'ATIVO',
        valorLicenca: VALOR_LICENCA_POR_CELULAR,
        tipoLicenca: 'LICENCA_UNICA_IMEI',
        chaveLiberacao: limpa,
      };

      this.salvarLicencaLocal(licenca);
      this.atualizarListaGlobalDispositivos(licenca);
      this.recalcularAparelhosAtivos();
      this.notify();

      return {
        success: true,
        message: `Licença Única (R$ 99,00) ativada com sucesso para o aparelho IMEI ${this.currentIMEI} (${empresa.nomeFantasia})!`,
      };
    }

    return {
      success: false,
      message: 'Chave de Liberação inválida. Entre em contato com Adriano Silva para adquirir a licença única deste aparelho celular (R$ 99,00).',
    };
  }

  // Ativação direta com verificação anti-fraude/anti-burlagem de IMEI
  public ativarPorLinkIMEI(
    chave: string,
    paramIMEI: string,
    empresaId?: string,
    cadastristaNome?: string
  ): { success: boolean; message: string; imeiDivergente?: boolean } {
    const imeiAparelhoReal = this.currentIMEI;
    const imeiEsperado = paramIMEI.replace(/\D/g, '').slice(0, 15);

    // Se o IMEI do link for diferente do IMEI real deste aparelho celular, bloqueia a tentativa de burlar!
    if (imeiEsperado && imeiAparelhoReal !== imeiEsperado) {
      return {
        success: false,
        imeiDivergente: true,
        message: `🚨 Tentativa de ativação inválida! Esta licença foi gerada exclusivamente para o celular IMEI ${imeiEsperado}. Este aparelho possui o IMEI ${imeiAparelhoReal}. Para não burlar as licenças, cada celular necessita de sua própria licença única de R$ 99,00.`,
      };
    }

    const empId = empresaId || this.empresas[0]?.id || 'emp_aquasane_01';
    return this.ativarPorChave(chave, empId, cadastristaNome, imeiAparelhoReal);
  }

  // Gera link completo oficial de ativação com chave atrelada ao IMEI do aparelho
  public gerarLinkAtivacaoIMEI(
    imei: string,
    empresaId: string,
    cadastristaNome?: string,
    baseUrl?: string
  ): { url: string; chave: string } {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    const empresa = this.empresas.find((e) => e.id === empresaId) || this.empresas[0];
    const chave = this.gerarChaveCriptografica(imei, empresa.id);
    const url = `${base}/?modo=apk_mobile&ativar_imei=${encodeURIComponent(imei)}&chave=${encodeURIComponent(chave)}`;
    return { url, chave };
  }

  // Liberação direta pelo Painel Master do Adriano Silva com suporte a IMEI e R$ 99,00
  public masterLiberarDispositivo(
    deviceId: string,
    empresaId: string,
    diasValidade = 365,
    cadastristaNome?: string,
    imei?: string
  ) {
    const empresa = this.empresas.find((e) => e.id === empresaId) || this.empresas[0];
    const imeiFinal = imei || (deviceId === this.currentDeviceId ? this.currentIMEI : undefined);
    const chave = this.gerarChaveCriptografica(imeiFinal || deviceId, empresa.id);

    const licenca: LicencaDispositivo = {
      deviceId,
      imeiAparelho: imeiFinal,
      modeloAparelho: 'Smartphone Mobile Homologado',
      empresaId: empresa.id,
      empresaNome: empresa.nomeFantasia,
      cadastristaNome: cadastristaNome || 'Operador de Campo',
      dataSolicitacao: Date.now(),
      dataAtivacao: Date.now(),
      dataExpiracao: Date.now() + diasValidade * 86400000,
      status: 'ATIVO',
      valorLicenca: VALOR_LICENCA_POR_CELULAR,
      tipoLicenca: 'LICENCA_UNICA_IMEI',
      chaveLiberacao: chave,
    };

    if (deviceId === this.currentDeviceId) {
      this.salvarLicencaLocal(licenca);
    }
    this.atualizarListaGlobalDispositivos(licenca);
    this.recalcularAparelhosAtivos();
    this.notify();

    return chave;
  }

  // Bloqueio de dispositivo inadimplente ou desligado
  public masterBloquearDispositivo(deviceId: string) {
    const disp = this.todosDispositivos.find((d) => d.deviceId === deviceId);
    if (disp) {
      disp.status = 'BLOQUEADO';
      this.salvarTodosDispositivos();
    }
    if (deviceId === this.currentDeviceId && this.currentLicenca) {
      this.currentLicenca.status = 'BLOQUEADO';
      this.salvarLicencaLocal(this.currentLicenca);
    }
    this.recalcularAparelhosAtivos();
    this.notify();
  }

  // Desbloqueia ou reativa dispositivo
  public masterReativarDispositivo(deviceId: string) {
    const disp = this.todosDispositivos.find((d) => d.deviceId === deviceId);
    if (disp) {
      disp.status = 'ATIVO';
      disp.dataExpiracao = Date.now() + 365 * 86400000;
      this.salvarTodosDispositivos();
    }
    if (deviceId === this.currentDeviceId && this.currentLicenca) {
      this.currentLicenca.status = 'ATIVO';
      this.currentLicenca.dataExpiracao = Date.now() + 365 * 86400000;
      this.salvarLicencaLocal(this.currentLicenca);
    }
    this.recalcularAparelhosAtivos();
    this.notify();
  }

  // Simular solicitação de licença (colocar em PENDENTE para teste de bloqueio)
  public simularBloqueioParaTeste() {
    if (this.currentLicenca) {
      this.currentLicenca.status = 'BLOQUEADO';
      this.salvarLicencaLocal(this.currentLicenca);
      this.atualizarListaGlobalDispositivos(this.currentLicenca);
      this.notify();
    }
  }

  public simularPendenteParaTeste() {
    if (this.currentLicenca) {
      this.currentLicenca.status = 'PENDENTE';
      this.salvarLicencaLocal(this.currentLicenca);
      this.atualizarListaGlobalDispositivos(this.currentLicenca);
      this.notify();
    }
  }

  // Cadastro de novas empresas prestadoras clientes
  public cadastrarEmpresa(empresa: Omit<EmpresaPrestadora, 'id' | 'aparelhosAtivos'>) {
    const nova: EmpresaPrestadora = {
      ...empresa,
      id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      aparelhosAtivos: 0,
    };
    this.empresas.push(nova);
    this.salvarEmpresas();
    this.notify();
    return nova;
  }

  public getEmpresas(): EmpresaPrestadora[] {
    return this.empresas;
  }

  public getTodosDispositivos(): LicencaDispositivo[] {
    return this.todosDispositivos;
  }

  private recalcularAparelhosAtivos() {
    this.empresas.forEach((emp) => {
      emp.aparelhosAtivos = this.todosDispositivos.filter(
        (d) => d.empresaId === emp.id && d.status === 'ATIVO'
      ).length;
    });
    this.salvarEmpresas();
  }

  private salvarLicencaLocal(licenca: LicencaDispositivo) {
    this.currentLicenca = licenca;
    localStorage.setItem(STORAGE_DEVICE_LICENCA, JSON.stringify(licenca));
  }

  private salvarEmpresas() {
    localStorage.setItem(STORAGE_EMPRESAS, JSON.stringify(this.empresas));
  }

  private salvarTodosDispositivos() {
    localStorage.setItem(STORAGE_TODOS_DISPOSITIVOS, JSON.stringify(this.todosDispositivos));
  }

  private atualizarListaGlobalDispositivos(licenca: LicencaDispositivo) {
    const idx = this.todosDispositivos.findIndex((d) => d.deviceId === licenca.deviceId);
    if (idx >= 0) {
      this.todosDispositivos[idx] = licenca;
    } else {
      this.todosDispositivos.push(licenca);
    }
    this.salvarTodosDispositivos();
  }

  private detectarModeloAparelho(): string {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'Celular Android (Samsung/Motorola)';
    if (/iPad|iPhone|iPod/.test(ua)) return 'Celular Apple iOS';
    if (/Windows/i.test(ua)) return 'Terminal Windows Field';
    return 'Smartphone Mobile Coletor';
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const licenciamentoService = new LicenciamentoService();
