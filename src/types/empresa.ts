export interface DadosEmpresa {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  numeroContrato: string;
  orgaoContratante: string;
  telefone: string;
  whatsapp: string;
  emailCorporativo: string;
  logradouroSede: string;
  numeroSede: string;
  complementoSede?: string;
  bairroSede: string;
  cidadeSede: string;
  ufSede: string;
  cepSede: string;
  responsavelLegal: string;
  cargoResponsavel: string;
  cpfResponsavel?: string;
  logotipoUrl?: string;
  site?: string;
  atualizadoEm?: number;
}

export interface SetorEmpresa {
  id: string;
  codigo: string; // Ex: SET-OPE, SET-VAL, SET-CAD
  nome: string;
  descricao: string;
  responsavelNome: string;
  responsavelCargo: string;
  emailOuRamal?: string;
  corTag: string; // ex: 'emerald', 'sky', 'indigo', 'amber', 'purple'
  ativo: boolean;
  criadoEm?: number;
}

export interface EquipeCampoERP {
  id: string;
  nome: string;
  setorId: string;
  supervisorResponsavel: string;
  veiculoIdentificacao?: string;
  zonaAtuacaoPrincipal: string;
  bairrosBase: string[];
  metaDiariaCenso: number;
  ativo: boolean;
  criadoEm?: number;
}

export const DADOS_EMPRESA_PADRAO: DadosEmpresa = {
  id: 'empresa-aquasane-principal',
  razaoSocial: 'AquaSane Pro Soluções & Tecnologia em Saneamento Ltda',
  nomeFantasia: 'AquaSane Pro',
  cnpj: '12.345.678/0001-90',
  inscricaoEstadual: '142.908.771',
  numeroContrato: 'Contrato Operacional nº CT-AQUASANE-2026',
  orgaoContratante: 'Concessionária / Prestadora de Saneamento',
  telefone: '(71) 3288-4100',
  whatsapp: '(71) 99233-7711',
  emailCorporativo: 'contato@aquasanepro.com.br',
  logradouroSede: 'Av. Tancredo Neves',
  numeroSede: '1632',
  complementoSede: 'Torre Norte, Sala 1402 - Ed. Salvador Trade Center',
  bairroSede: 'Caminho das Árvores',
  cidadeSede: 'Salvador',
  ufSede: 'BA',
  cepSede: '41820-020',
  responsavelLegal: 'Adriano Silva',
  cargoResponsavel: 'Diretor Geral de Operações de Saneamento',
  cpfResponsavel: '741.852.963-00',
  site: 'https://aquasanepro.com.br',
  atualizadoEm: Date.now(),
};

export const SETORES_PADRAO_EMPRESA: SetorEmpresa[] = [
  {
    id: 'setor-operacao',
    codigo: 'SET-OPE',
    nome: 'Operações & Vistoria de Campo',
    descricao: 'Equipes de rua responsáveis pelo censo cadastral porta a porta, coleta fotográfica e GPS dos imóveis.',
    responsavelNome: 'Roberto Mendes',
    responsavelCargo: 'Supervisor Geral de Operações',
    emailOuRamal: 'operacao.campo@consorcior7.com.br',
    corTag: 'emerald',
    ativo: true,
    criadoEm: Date.now() - 86400000 * 30,
  },
  {
    id: 'setor-validacao',
    codigo: 'SET-VAL',
    nome: 'Mesa Técnica de Validação Pré-EMBASA',
    descricao: 'Auditoria dos 38 campos contratuais, conferência de hidrômetros e aprovação técnica antes do envio ao SCIWeb.',
    responsavelNome: 'Engª. Mariana Costa',
    responsavelCargo: 'Auditora Técnica de Saneamento',
    emailOuRamal: 'validacao.tecnica@consorcior7.com.br',
    corTag: 'sky',
    ativo: true,
    criadoEm: Date.now() - 86400000 * 30,
  },
  {
    id: 'setor-supervisao',
    codigo: 'SET-SUP',
    nome: 'Supervisão Geral, SLA & Metas',
    descricao: 'Controle de cumprimento de metas diárias, SLA de 48h das ordens de serviço e rendimento por cadastrista.',
    responsavelNome: 'Roberto Mendes',
    responsavelCargo: 'Supervisor Chefe',
    emailOuRamal: 'supervisao@consorcior7.com.br',
    corTag: 'amber',
    ativo: true,
    criadoEm: Date.now() - 86400000 * 30,
  },
  {
    id: 'setor-cadastro',
    codigo: 'SET-CAD',
    nome: 'Programação de Rotas & Importação Excel',
    descricao: 'Equipe responsável pelo upload de planilhas de corte/ligação/censo e distribuição das OS para as equipes.',
    responsavelNome: 'Adelmo Ribeiro',
    responsavelCargo: 'Programador de Rotas Comerciais',
    emailOuRamal: 'programacao.rotas@consorcior7.com.br',
    corTag: 'indigo',
    ativo: true,
    criadoEm: Date.now() - 86400000 * 30,
  },
  {
    id: 'setor-diretoria',
    codigo: 'SET-DIR',
    nome: 'Diretoria & Coordenação Geral do Contrato',
    descricao: 'Gestão administrativa, relacionamento com a fiscalização EMBASA, faturamento e segurança da informação.',
    responsavelNome: 'Coord. Adriano Silva',
    responsavelCargo: 'Coordenador Geral',
    emailOuRamal: 'adrianosilva1983oficial@gmail.com',
    corTag: 'purple',
    ativo: true,
    criadoEm: Date.now() - 86400000 * 30,
  },
  {
    id: 'setor-rh',
    codigo: 'SET-ADM',
    nome: 'Administração & Recursos Humanos',
    descricao: 'Gestão de pessoal, admissões, entrega de fardamentos, EPIs e controle de ponto da equipe.',
    responsavelNome: 'Juliana Fagundes',
    responsavelCargo: 'Analista de RH Pleno',
    emailOuRamal: 'rh@consorcior7.com.br',
    corTag: 'slate',
    ativo: true,
    criadoEm: Date.now() - 86400000 * 30,
  },
];

export const EQUIPES_PADRAO_EMPRESA: EquipeCampoERP[] = [
  {
    id: 'equipe-01',
    nome: 'Equipe 01 - Frente Cabula',
    setorId: 'setor-operacao',
    supervisorResponsavel: 'Roberto Mendes',
    veiculoIdentificacao: 'Fiat Strada - Placa PKL-4109',
    zonaAtuacaoPrincipal: 'ZA 23',
    bairrosBase: ['Cabula', 'Resgate', 'Saboeiro'],
    metaDiariaCenso: 40,
    ativo: true,
    criadoEm: Date.now() - 86400000 * 30,
  },
  {
    id: 'equipe-02',
    nome: 'Equipe 02 - Frente Arenoso',
    setorId: 'setor-operacao',
    supervisorResponsavel: 'Roberto Mendes',
    veiculoIdentificacao: 'Renault Kangoo - Placa RZY-8812',
    zonaAtuacaoPrincipal: 'ZA 23',
    bairrosBase: ['Arenoso', 'Tancredo Neves'],
    metaDiariaCenso: 40,
    ativo: true,
    criadoEm: Date.now() - 86400000 * 30,
  },
  {
    id: 'equipe-03',
    nome: 'Equipe 03 - Frente Pernambués',
    setorId: 'setor-operacao',
    supervisorResponsavel: 'Roberto Mendes',
    veiculoIdentificacao: 'Chevrolet Montana - Placa PLF-9021',
    zonaAtuacaoPrincipal: 'ZA 25',
    bairrosBase: ['Pernambués', 'Saramandaia'],
    metaDiariaCenso: 40,
    ativo: true,
    criadoEm: Date.now() - 86400000 * 30,
  },
];
