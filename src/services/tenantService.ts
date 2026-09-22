import { EmpresaPrestadora, LicencaDispositivo, PlanoAquaSane, RegistroPagamento } from '../types/licenciamento';
import { gerarPixCopiaEColaEMV, PIX_OFICIAL_CONFIG, getBaseAppUrl } from './pixService';

export interface ClienteTenant {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  contratoNumero: string;
  emailAdmin: string;
  senhaAdminInicial: string;
  limiteAparelhos: number;
  dataCriacao: number;
  dataExpiracaoLicenca: number;
  diasValidadeLicenca: number;
  status: 'ATIVO' | 'SUSPENSO' | 'EXPIRADO';
  tokenAtivacao: string;
  bancoLocalInstaladoEm?: number;
  planoId?: 'STARTER' | 'PRO' | 'ENTERPRISE';
  dataVencimentoFatura?: number;
  statusPagamento?: 'EM_DIA' | 'PENDENTE' | 'INADIMPLENTE';
}

const STORAGE_TENANTS_LIST = 'aquasane_master_clientes_tenants';
const STORAGE_ACTIVE_TENANT_ID = 'aquasane_active_tenant_id';
const STORAGE_FATURAS_LIST = 'aquasane_faturas_pagamento';

export const PLANOS_AQUASANE: PlanoAquaSane[] = [
  {
    id: 'STARTER',
    nome: 'AquaSane Starter',
    badge: 'Equipe Inicial',
    valorMensal: 490.0,
    limiteAparelhos: 5,
    maxOSPorMes: 2500,
    descricao: 'Ideal para prestadoras e equipes compactas iniciando recadastramento ou manutenção de redes.',
    recursos: [
      'Até 5 smartphones / coletores de campo',
      'Importação de planilhas Excel e SCIWeb',
      'Roteirização por horário comercial (8h/dia)',
      'Cartografia cadastral e satélite 100% offline',
      'Até 10 fotos probatórias com carimbo GPS',
      'Banco de dados local isolado do cliente',
    ],
  },
  {
    id: 'PRO',
    nome: 'AquaSane Pro Regional',
    badge: 'Mais Recomendado',
    valorMensal: 1290.0,
    limiteAparelhos: 15,
    maxOSPorMes: 10000,
    descricao: 'Projetado para contratos de concessão regional e operações intensivas com múltiplas equipes.',
    recursos: [
      'Até 15 smartphones / coletores de campo',
      'Programação inteligente de metas diárias',
      'Auditoria pré-envio padrão concessionária',
      'Roteirização sequenciada por quadra e lote',
      'Módulo de negociação e Tarifa Social',
      'Suporte prioritário e exportações oficiais',
    ],
  },
  {
    id: 'ENTERPRISE',
    nome: 'AquaSane Enterprise',
    badge: 'Concessões Globais',
    valorMensal: 2490.0,
    limiteAparelhos: 40,
    maxOSPorMes: 'ILIMITADO',
    descricao: 'Estrutura completa para grandes prestadoras, autarquias e consórcios municipais.',
    recursos: [
      'Até 40 smartphones ou coletores homologados',
      'O.S. e censos ilimitados sem teto de volume',
      'Gestão multi-setores, coordenadorias e fiscais',
      'Integrações com sistemas legados (SCIWeb/SAP)',
      'Backup automático local e na nuvem',
      'Treinamento e SLA de suporte técnico 24/7',
    ],
  },
];

const CLIENTES_INICIAIS: ClienteTenant[] = [
  {
    id: 'emp_aquasane_01',
    razaoSocial: 'AquaSane Pro Soluções em Saneamento Ltda',
    nomeFantasia: 'AquaSane Pro',
    cnpj: '12.345.678/0001-90',
    contratoNumero: 'CT-AQUASANE-2026',
    emailAdmin: 'admin@aquasanepro.com.br',
    senhaAdminInicial: 'aquasane123',
    limiteAparelhos: 30,
    dataCriacao: Date.now() - 5 * 86400000,
    dataExpiracaoLicenca: Date.now() + 30 * 86400000, // 30 dias ativos
    dataVencimentoFatura: Date.now() + 30 * 86400000,
    diasValidadeLicenca: 30,
    status: 'ATIVO',
    tokenAtivacao: 'TOKEN_AQUASANE_PRO_30D',
    bancoLocalInstaladoEm: Date.now() - 5 * 86400000,
    planoId: 'PRO',
    statusPagamento: 'EM_DIA',
  },
];

type TenantListener = (activeTenant: ClienteTenant | null) => void;

class TenantService {
  private tenants: ClienteTenant[] = [];
  private activeTenantId: string;
  private listeners: TenantListener[] = [];

  private faturas: RegistroPagamento[] = [];

  constructor() {
    this.tenants = this.carregarTenants();
    this.faturas = this.carregarFaturas();
    this.activeTenantId = this.detectarEInicializarTenant();
  }

  private carregarFaturas(): RegistroPagamento[] {
    const raw = localStorage.getItem(STORAGE_FATURAS_LIST);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [];
  }

  private salvarFaturas() {
    localStorage.setItem(STORAGE_FATURAS_LIST, JSON.stringify(this.faturas));
  }

  private carregarTenants(): ClienteTenant[] {
    const raw = localStorage.getItem(STORAGE_TENANTS_LIST);
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
    localStorage.setItem(STORAGE_TENANTS_LIST, JSON.stringify(CLIENTES_INICIAIS));
    return [...CLIENTES_INICIAIS];
  }

  private salvarTenants() {
    localStorage.setItem(STORAGE_TENANTS_LIST, JSON.stringify(this.tenants));
  }

  /**
   * Detecta se o usuário entrou através de um link próprio do cliente (URL param ?cliente=...)
   * ou se já existe um tenant ativo configurado.
   */
  private detectarEInicializarTenant(): string {
    if (typeof window === 'undefined') return 'emp_cabula_01';

    const params = new URLSearchParams(window.location.search);
    const clienteParam = params.get('cliente') || params.get('tenant') || params.get('c');
    const tokenParam = params.get('token') || params.get('t');
    const nomeParam = params.get('nome');

    // Se veio um cliente na URL, verifica ou auto-configura o banco local
    if (clienteParam) {
      let tenantExistente = this.tenants.find((t) => t.id === clienteParam);

      if (!tenantExistente && nomeParam) {
        // Auto-instalação de novo cliente a partir do link próprio fornecido por Adriano Silva
        const novoCliente: ClienteTenant = {
          id: clienteParam,
          razaoSocial: decodeURIComponent(nomeParam),
          nomeFantasia: decodeURIComponent(nomeParam),
          cnpj: params.get('cnpj') || '00.000.000/0001-00',
          contratoNumero: params.get('contrato') || `CT-${Math.floor(100000 + Math.random() * 900000)}`,
          emailAdmin: params.get('email') || `admin@${clienteParam}.com.br`,
          senhaAdminInicial: params.get('senha') || '123456',
          limiteAparelhos: Number(params.get('limite') || 20),
          dataCriacao: Date.now(),
          dataExpiracaoLicenca: Date.now() + 30 * 86400000, // 30 dias padrão
          diasValidadeLicenca: 30,
          status: 'ATIVO',
          tokenAtivacao: tokenParam || `TOKEN_${clienteParam.toUpperCase()}`,
          bancoLocalInstaladoEm: Date.now(),
        };

        this.tenants.push(novoCliente);
        this.salvarTenants();
        tenantExistente = novoCliente;
      }

      if (tenantExistente) {
        localStorage.setItem(STORAGE_ACTIVE_TENANT_ID, tenantExistente.id);
        return tenantExistente.id;
      }
    }

    // Caso não tenha na URL, busca o último ativo salvo
    const salvo = localStorage.getItem(STORAGE_ACTIVE_TENANT_ID);
    if (salvo && this.tenants.some((t) => t.id === salvo)) {
      return salvo;
    }

    // Default
    const defaultId = this.tenants[0]?.id || 'emp_cabula_01';
    localStorage.setItem(STORAGE_ACTIVE_TENANT_ID, defaultId);
    return defaultId;
  }

  public getActiveTenant(): ClienteTenant {
    const found = this.tenants.find((t) => t.id === this.activeTenantId);
    if (found) return found;
    return this.tenants[0] || CLIENTES_INICIAIS[0];
  }

  public getActiveTenantId(): string {
    return this.activeTenantId;
  }

  public getAllTenants(): ClienteTenant[] {
    return [...this.tenants];
  }

  public setActiveTenant(tenantId: string): void {
    const match = this.tenants.find((t) => t.id === tenantId);
    if (match) {
      this.activeTenantId = match.id;
      localStorage.setItem(STORAGE_ACTIVE_TENANT_ID, match.id);
      this.notify();
    }
  }

  /**
   * Cria um novo cliente com licença de 30 dias e gera o Link Próprio de Ativação
   */
  public criarNovoCliente(dados: {
    nomeFantasia: string;
    razaoSocial?: string;
    cnpj?: string;
    contratoNumero?: string;
    emailAdmin: string;
    senhaAdminInicial?: string;
    limiteAparelhos?: number;
    diasValidadeLicenca?: number;
  }): { cliente: ClienteTenant; linkProprio: string } {
    const slug = dados.nomeFantasia
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 16);

    const id = `emp_${slug}_${Math.floor(10 + Math.random() * 90)}`;
    const dias = dados.diasValidadeLicenca || 30;

    const novo: ClienteTenant = {
      id,
      razaoSocial: dados.razaoSocial || dados.nomeFantasia,
      nomeFantasia: dados.nomeFantasia,
      cnpj: dados.cnpj || '00.000.000/0001-00',
      contratoNumero: dados.contratoNumero || `CT-${Math.floor(100000 + Math.random() * 900000)}`,
      emailAdmin: dados.emailAdmin,
      senhaAdminInicial: dados.senhaAdminInicial || 'senha123',
      limiteAparelhos: dados.limiteAparelhos || 20,
      dataCriacao: Date.now(),
      dataExpiracaoLicenca: Date.now() + dias * 86400000,
      diasValidadeLicenca: dias,
      status: 'ATIVO',
      tokenAtivacao: `AUTOCONF_${id.toUpperCase()}_${Date.now()}`,
      bancoLocalInstaladoEm: Date.now(),
    };

    this.tenants.push(novo);
    this.salvarTenants();

    const linkProprio = this.gerarLinkProprio(novo);
    this.notify();

    return { cliente: novo, linkProprio };
  }

  /**
   * Gera o link oficial do Sistema Web - Cliente
   */
  public gerarLinkSistemaWeb(cliente: ClienteTenant): string {
    const baseUrl =
      typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
        ? window.location.origin
        : 'https://ais-dev-ngtjzalhi77e43bxamfamp-530667778944.us-west2.run.app';

    const params = new URLSearchParams({
      cliente: cliente.id,
      modo: 'web_cliente',
      nome: encodeURIComponent(cliente.nomeFantasia),
      token: cliente.tokenAtivacao,
      email: cliente.emailAdmin,
    });

    return `${baseUrl}/?${params.toString()}`;
  }

  /**
   * Gera o link direto para o cliente baixar e instalar o APK Mobile
   */
  public gerarLinkAPKMobile(cliente: ClienteTenant): string {
    const baseUrl =
      typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
        ? window.location.origin
        : 'https://ais-dev-ngtjzalhi77e43bxamfamp-530667778944.us-west2.run.app';

    const params = new URLSearchParams({
      cliente: cliente.id,
      modo: 'apk_mobile',
      download: 'apk',
      token: cliente.tokenAtivacao,
    });

    return `${baseUrl}/?${params.toString()}#download-apk`;
  }

  /**
   * Mensagem oficial formatada com os dois links requisitados
   */
  public gerarMensagemCompartilhamentoCliente(cliente: ClienteTenant): string {
    const linkWeb = this.gerarLinkSistemaWeb(cliente);
    const linkApk = this.gerarLinkAPKMobile(cliente);

    return `*AQUASANE PRO - LIBERAÇÃO DE AMBIENTE EXCLUSIVO*
Empresa: *${cliente.nomeFantasia}*
Contrato: ${cliente.contratoNumero}

Seguem os links oficiais para acesso e download do sistema:

💻 *Link Sistema Web - Cliente:*
${linkWeb}

📲 *Link APK Mobile - Cliente (Para baixar e instalar no celular):*
${linkApk}

🔑 *Credenciais Iniciais do Administrador:*
• E-mail: ${cliente.emailAdmin}
• Senha Padrão: ${cliente.senhaAdminInicial}
• Aparelhos Autorizados: até ${cliente.limiteAparelhos} celulares
• Banco de Dados: Local Isolado (IndexedDB AquaSaneDB_${cliente.id})

Suporte e Central Master:
Adriano Silva • adrianosilva1983oficial@gmail.com`;
  }

  /**
   * Gera o link próprio de acesso exclusivo do cliente
   */
  public gerarLinkProprio(cliente: ClienteTenant): string {
    return this.gerarLinkSistemaWeb(cliente);
  }

  /**
   * Verifica se a licença do cliente está válida (30 dias)
   */
  public isLicencaValida(clienteId?: string): { valida: boolean; diasRestantes: number; motivo?: string } {
    const c = clienteId ? this.tenants.find((t) => t.id === clienteId) : this.getActiveTenant();
    if (!c) {
      return { valida: false, diasRestantes: 0, motivo: 'Cliente não cadastrado no sistema.' };
    }

    const agora = Date.now();
    const diffMs = c.dataExpiracaoLicenca - agora;
    const diasRestantes = Math.max(0, Math.ceil(diffMs / 86400000));

    if (c.status !== 'ATIVO') {
      return { valida: false, diasRestantes, motivo: 'Licença suspensa pelo administrador.' };
    }

    if (diffMs <= 0) {
      return { valida: false, diasRestantes: 0, motivo: 'Licença de 30 dias expirada. Solicite renovação.' };
    }

    return { valida: true, diasRestantes };
  }

  /**
   * Verifica detalhadamente a situação de adimplência e aplica a regra dos 5 dias de tolerância
   */
  public verificarStatusFinanceiroELicenca(clienteId?: string): {
    valida: boolean;
    emDia: boolean;
    diasRestantes: number;
    diasAtraso: number;
    toleranciaRestante: number;
    modoSomenteLeitura: boolean;
    bloqueadoPorInadimplencia: boolean;
    statusPagamento: 'EM_DIA' | 'PENDENTE' | 'INADIMPLENTE';
    motivo: string;
    faturaPendente?: RegistroPagamento | null;
  } {
    const c = clienteId ? this.tenants.find((t) => t.id === clienteId) : this.getActiveTenant();
    if (!c) {
      return {
        valida: false,
        emDia: false,
        diasRestantes: 0,
        diasAtraso: 0,
        toleranciaRestante: 0,
        modoSomenteLeitura: true,
        bloqueadoPorInadimplencia: true,
        statusPagamento: 'INADIMPLENTE',
        motivo: 'Cliente não localizado no banco de dados.',
      };
    }

    const agora = Date.now();
    const dataVencimento = c.dataVencimentoFatura || c.dataExpiracaoLicenca;
    const diffMs = dataVencimento - agora;

    const faturaPendente = this.faturas.find(
      (f) => f.tenantId === c.id && f.status === 'AGUARDANDO_PAGAMENTO'
    ) || null;

    if (diffMs >= 0) {
      const diasRestantes = Math.ceil(diffMs / 86400000);
      return {
        valida: true,
        emDia: true,
        diasRestantes,
        diasAtraso: 0,
        toleranciaRestante: 5,
        modoSomenteLeitura: false,
        bloqueadoPorInadimplencia: false,
        statusPagamento: 'EM_DIA',
        motivo: `Licença ativa. Restam ${diasRestantes} dias para o próximo ciclo de faturamento.`,
        faturaPendente,
      };
    }

    // Passou do vencimento
    const diasAtraso = Math.floor(Math.abs(diffMs) / 86400000) + 1;

    // Regra estrita: Tolerância de até 5 dias
    if (diasAtraso <= 5) {
      const toleranciaRestante = 5 - diasAtraso;
      return {
        valida: true,
        emDia: false,
        diasRestantes: 0,
        diasAtraso,
        toleranciaRestante,
        modoSomenteLeitura: false,
        bloqueadoPorInadimplencia: false,
        statusPagamento: 'PENDENTE',
        motivo: `Fatura vencida há ${diasAtraso} dia(s). Tolerância ativa: ${toleranciaRestante} dia(s) restante(s) antes do bloqueio do sistema.`,
        faturaPendente,
      };
    }

    // Mais de 5 dias de atraso: Bloqueia o uso e só permite visualizações
    return {
      valida: false,
      emDia: false,
      diasRestantes: 0,
      diasAtraso,
      toleranciaRestante: 0,
      modoSomenteLeitura: true,
      bloqueadoPorInadimplencia: true,
      statusPagamento: 'INADIMPLENTE',
      motivo: `Acesso restrito: Fatura em atraso há ${diasAtraso} dias (tolerância de 5 dias excedida). O sistema está em MODO SOMENTE LEITURA até a quitação da licença.`,
      faturaPendente,
    };
  }

  /**
   * Gera uma nova fatura com Link de Pagamento e Código Pix Copia-e-Cola
   */
  public gerarFaturaELinkPagamento(
    planoId: 'STARTER' | 'PRO' | 'ENTERPRISE',
    clienteId?: string,
    dadosContratante?: { nomeFantasia: string; emailAdmin: string; cnpj?: string; limiteAparelhos?: number }
  ): { fatura: RegistroPagamento; linkPagamento: string } {
    let tenant = clienteId ? this.tenants.find((t) => t.id === clienteId) : this.getActiveTenant();

    if (!tenant && dadosContratante) {
      // Cria cliente provisório caso seja contratação nova
      const res = this.criarNovoCliente({
        nomeFantasia: dadosContratante.nomeFantasia,
        emailAdmin: dadosContratante.emailAdmin,
        cnpj: dadosContratante.cnpj,
        limiteAparelhos: dadosContratante.limiteAparelhos,
      });
      tenant = res.cliente;
    }

    const tenantAtivo = tenant || this.getActiveTenant();
    const plano = PLANOS_AQUASANE.find((p) => p.id === planoId) || PLANOS_AQUASANE[1];

    const faturaId = `FAT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const agora = Date.now();

    // Código PIX formatado no padrão oficial BCB EMV com chave oficial Adriano Silva
    const pixChave = PIX_OFICIAL_CONFIG.chave;
    const pixTitular = PIX_OFICIAL_CONFIG.titular;
    const pixCopiaECola = gerarPixCopiaEColaEMV({
      chave: pixChave,
      titular: pixTitular,
      cidade: PIX_OFICIAL_CONFIG.cidade,
      valor: plano.valorMensal,
      txid: faturaId.replace(/[^A-Za-z0-9]/g, '').slice(0, 25),
      descricao: plano.nome.slice(0, 20),
    });

    const baseUrl = getBaseAppUrl();

    const linkPagamento = `${baseUrl}/?checkout=true&fatura=${faturaId}&plano=${plano.id}&cliente=${tenantAtivo.id}&valor=${plano.valorMensal}&chave=${pixChave}`;

    const novaFatura: RegistroPagamento = {
      id: faturaId,
      tenantId: tenantAtivo.id,
      tenantNome: tenantAtivo.nomeFantasia,
      planoId: plano.id,
      planoNome: plano.nome,
      valor: plano.valorMensal,
      dataGeracao: agora,
      dataVencimento: agora + 3 * 86400000, // Vence em 3 dias
      status: 'AGUARDANDO_PAGAMENTO',
      metodo: 'PIX',
      pixCopiaECola,
      linkPagamento,
    };

    this.faturas.unshift(novaFatura);
    this.salvarFaturas();

    return { fatura: novaFatura, linkPagamento };
  }

  /**
   * Confirma o pagamento, estende a validade por 30 dias e reativa o sistema
   */
  public confirmarPagamentoFatura(faturaId: string): { sucesso: boolean; mensagem: string; tenant?: ClienteTenant } {
    const fatura = this.faturas.find((f) => f.id === faturaId);
    if (!fatura) {
      return { sucesso: false, mensagem: 'Fatura não encontrada.' };
    }

    fatura.status = 'PAGO';
    fatura.dataPagamento = Date.now();
    this.salvarFaturas();

    const tenant = this.tenants.find((t) => t.id === fatura.tenantId);
    if (tenant) {
      // Estende a validade a partir de agora + 30 dias
      const baseTempo = Math.max(Date.now(), tenant.dataExpiracaoLicenca || Date.now());
      tenant.dataExpiracaoLicenca = baseTempo + 30 * 86400000;
      tenant.dataVencimentoFatura = tenant.dataExpiracaoLicenca;
      tenant.status = 'ATIVO';
      tenant.statusPagamento = 'EM_DIA';
      tenant.planoId = fatura.planoId as any;

      this.salvarTenants();
      this.notify();

      return {
        sucesso: true,
        mensagem: `Pagamento de R$ ${fatura.valor.toFixed(2)} confirmado! Licença do cliente ${tenant.nomeFantasia} renovada com sucesso por 30 dias.`,
        tenant,
      };
    }

    return { sucesso: true, mensagem: 'Pagamento confirmado com sucesso!' };
  }

  public getFaturas(): RegistroPagamento[] {
    return [...this.faturas];
  }

  /**
   * Simula a regra de inadimplência para testes instantâneos
   */
  public simularInadimplencia(clienteId?: string, diasAtraso: number = 6): void {
    const tenant = clienteId ? this.tenants.find((t) => t.id === clienteId) : this.getActiveTenant();
    if (tenant) {
      tenant.dataExpiracaoLicenca = Date.now() - diasAtraso * 86400000;
      tenant.dataVencimentoFatura = tenant.dataExpiracaoLicenca;
      tenant.statusPagamento = diasAtraso > 5 ? 'INADIMPLENTE' : 'PENDENTE';
      this.salvarTenants();
      this.notify();
    }
  }

  public simularRegularizacao(clienteId?: string): void {
    const tenant = clienteId ? this.tenants.find((t) => t.id === clienteId) : this.getActiveTenant();
    if (tenant) {
      tenant.dataExpiracaoLicenca = Date.now() + 30 * 86400000;
      tenant.dataVencimentoFatura = tenant.dataExpiracaoLicenca;
      tenant.statusPagamento = 'EM_DIA';
      tenant.status = 'ATIVO';
      this.salvarTenants();
      this.notify();
    }
  }

  public renovarLicenca(clienteId: string, diasExtras: number = 30): void {
    const idx = this.tenants.findIndex((t) => t.id === clienteId);
    if (idx >= 0) {
      const base = Math.max(Date.now(), this.tenants[idx].dataExpiracaoLicenca);
      this.tenants[idx].dataExpiracaoLicenca = base + diasExtras * 86400000;
      this.tenants[idx].status = 'ATIVO';
      this.salvarTenants();
      this.notify();
    }
  }

  public subscribe(listener: TenantListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const active = this.getActiveTenant();
    this.listeners.forEach((l) => l(active));
  }
}

export const tenantService = new TenantService();
