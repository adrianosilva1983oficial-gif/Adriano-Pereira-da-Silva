export type PerfilUsuario = 
  | 'CADASTRISTA_CAMPO' 
  | 'VALIDADOR_AUDITOR' 
  | 'SUPERVISOR_GERAL' 
  | 'ADMIN_CONTRATO';

export type StatusFuncionario = 'ATIVO' | 'INATIVO' | 'FERIAS' | 'BLOQUEADO';

export interface DireitosUsoSistema {
  // Coleta em Campo
  podeColetarCampo: boolean;
  podeNavegarGPS: boolean;
  podeDemarcarCartografia: boolean;
  podeEditarRascunho: boolean;
  podeColetarFotosEAssinatura: boolean;

  // Rotas, Planilhas Excel e Programação
  podeVerRotasOS: boolean;
  podeUploadPlanilhaExcel: boolean;
  podeReordenarProgramacao: boolean;
  podeAtribuirOSParaEquipe: boolean;
  podeRegistrarImpedimento: boolean;

  // Validação & Auditoria
  podeValidarEmbasa: boolean;
  podeAprovarReprovarCenso: boolean;
  podeTransmitirEmbasa: boolean;

  // Supervisão, Produtividade, Ouvidoria & Negociação
  podeVerRelatorioProdutividade: boolean;
  podeAcessarSupervisaoGeral: boolean;
  podeGerenciarOuvidoria: boolean;
  podeRealizarNegociacao: boolean;

  // Administração & Direitos
  podeConfigurarContrato: boolean;
  podeGerenciarFuncionarios: boolean;
  podeConfigurarDireitosUso: boolean;
  podeExportarDados: boolean;
  podeGerarAPK: boolean;
}

// Mantido para compatibilidade reversa
export type PermissoesPerfil = DireitosUsoSistema;

export interface UsuarioSistema {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  telefone?: string;
  cpf?: string;
  perfil: PerfilUsuario;
  cargo: string;
  setorId?: string;
  equipe: string;
  matriculaFuncional: string;
  avatarUrl?: string;
  zonaAtuacao?: string;
  bairrosPermitidos?: string[];
  status: StatusFuncionario;
  dataAdmissao?: string;
  observacoes?: string;
  permissoesPersonalizadas?: Partial<DireitosUsoSistema>;
  criadoEm?: number;
  atualizadoEm?: number;
}

export const DIREITOS_PADRAO_POR_PERFIL: Record<PerfilUsuario, DireitosUsoSistema> = {
  CADASTRISTA_CAMPO: {
    podeColetarCampo: true,
    podeNavegarGPS: true,
    podeDemarcarCartografia: true,
    podeEditarRascunho: true,
    podeColetarFotosEAssinatura: true,

    podeVerRotasOS: true,
    podeUploadPlanilhaExcel: false,
    podeReordenarProgramacao: false,
    podeAtribuirOSParaEquipe: false,
    podeRegistrarImpedimento: true,

    podeValidarEmbasa: false,
    podeAprovarReprovarCenso: false,
    podeTransmitirEmbasa: false,

    podeVerRelatorioProdutividade: true,
    podeAcessarSupervisaoGeral: false,
    podeGerenciarOuvidoria: false,
    podeRealizarNegociacao: false,

    podeConfigurarContrato: false,
    podeGerenciarFuncionarios: false,
    podeConfigurarDireitosUso: false,
    podeExportarDados: false,
    podeGerarAPK: true,
  },
  VALIDADOR_AUDITOR: {
    podeColetarCampo: false,
    podeNavegarGPS: false,
    podeDemarcarCartografia: false,
    podeEditarRascunho: false,
    podeColetarFotosEAssinatura: false,

    podeVerRotasOS: true,
    podeUploadPlanilhaExcel: true,
    podeReordenarProgramacao: false,
    podeAtribuirOSParaEquipe: false,
    podeRegistrarImpedimento: false,

    podeValidarEmbasa: true,
    podeAprovarReprovarCenso: true,
    podeTransmitirEmbasa: true,

    podeVerRelatorioProdutividade: true,
    podeAcessarSupervisaoGeral: true,
    podeGerenciarOuvidoria: true,
    podeRealizarNegociacao: false,

    podeConfigurarContrato: false,
    podeGerenciarFuncionarios: false,
    podeConfigurarDireitosUso: false,
    podeExportarDados: true,
    podeGerarAPK: false,
  },
  SUPERVISOR_GERAL: {
    podeColetarCampo: true,
    podeNavegarGPS: true,
    podeDemarcarCartografia: true,
    podeEditarRascunho: true,
    podeColetarFotosEAssinatura: true,

    podeVerRotasOS: true,
    podeUploadPlanilhaExcel: true,
    podeReordenarProgramacao: true,
    podeAtribuirOSParaEquipe: true,
    podeRegistrarImpedimento: true,

    podeValidarEmbasa: true,
    podeAprovarReprovarCenso: true,
    podeTransmitirEmbasa: true,

    podeVerRelatorioProdutividade: true,
    podeAcessarSupervisaoGeral: true,
    podeGerenciarOuvidoria: true,
    podeRealizarNegociacao: true,

    podeConfigurarContrato: true,
    podeGerenciarFuncionarios: true,
    podeConfigurarDireitosUso: false,
    podeExportarDados: true,
    podeGerarAPK: true,
  },
  ADMIN_CONTRATO: {
    podeColetarCampo: true,
    podeNavegarGPS: true,
    podeDemarcarCartografia: true,
    podeEditarRascunho: true,
    podeColetarFotosEAssinatura: true,

    podeVerRotasOS: true,
    podeUploadPlanilhaExcel: true,
    podeReordenarProgramacao: true,
    podeAtribuirOSParaEquipe: true,
    podeRegistrarImpedimento: true,

    podeValidarEmbasa: true,
    podeAprovarReprovarCenso: true,
    podeTransmitirEmbasa: true,

    podeVerRelatorioProdutividade: true,
    podeAcessarSupervisaoGeral: true,
    podeGerenciarOuvidoria: true,
    podeRealizarNegociacao: true,

    podeConfigurarContrato: true,
    podeGerenciarFuncionarios: true,
    podeConfigurarDireitosUso: true,
    podeExportarDados: true,
    podeGerarAPK: true,
  },
};

// Alias para compatibilidade
export const PERMISSOES_POR_PERFIL = DIREITOS_PADRAO_POR_PERFIL;

export const USUARIOS_PREDEFINIDOS: UsuarioSistema[] = [
  {
    id: 'user-cadastrista-1',
    nome: 'Adelmo Ribeiro',
    email: 'adelmo.ribeiro@consorcior7.com.br',
    senha: '123',
    telefone: '(71) 98842-1049',
    perfil: 'CADASTRISTA_CAMPO',
    cargo: 'Cadastrista Técnico Pleno',
    setorId: 'setor-operacao',
    equipe: 'Equipe 01 - Frente Cabula',
    matriculaFuncional: 'CAD-0418',
    zonaAtuacao: 'ZA 23 / ZA 25',
    status: 'ATIVO',
    dataAdmissao: '2024-03-15',
  },
  {
    id: 'user-cadastrista-2',
    nome: 'Carlos Santos',
    email: 'carlos.santos@consorcior7.com.br',
    senha: '123',
    telefone: '(71) 98711-3094',
    perfil: 'CADASTRISTA_CAMPO',
    cargo: 'Cadastrista Técnico Júnior',
    setorId: 'setor-operacao',
    equipe: 'Equipe 02 - Frente Arenoso',
    matriculaFuncional: 'CAD-0520',
    zonaAtuacao: 'ZA 23 / ZA 26',
    status: 'ATIVO',
    dataAdmissao: '2024-06-01',
  },
  {
    id: 'user-cadastrista-3',
    nome: 'Joana Prado',
    email: 'joana.prado@consorcior7.com.br',
    senha: '123',
    telefone: '(71) 99120-4589',
    perfil: 'CADASTRISTA_CAMPO',
    cargo: 'Cadastrista Técnica Pleno',
    setorId: 'setor-operacao',
    equipe: 'Equipe 03 - Frente Pernambués',
    matriculaFuncional: 'CAD-0633',
    zonaAtuacao: 'ZA 25 / ZA 27',
    status: 'ATIVO',
    dataAdmissao: '2024-02-10',
  },
  {
    id: 'user-validador-1',
    nome: 'Engª. Mariana Costa',
    email: 'mariana.costa@consorcior7.com.br',
    senha: '123',
    telefone: '(71) 99344-0192',
    perfil: 'VALIDADOR_AUDITOR',
    cargo: 'Auditora Técnica de Saneamento',
    setorId: 'setor-validacao',
    equipe: 'Mesa Técnica de Validação Pré-EMBASA',
    matriculaFuncional: 'AUD-0104',
    status: 'ATIVO',
    dataAdmissao: '2023-11-20',
  },
  {
    id: 'user-supervisor-1',
    nome: 'Roberto Mendes',
    email: 'roberto.mendes@consorcior7.com.br',
    senha: '123',
    telefone: '(71) 99981-8840',
    perfil: 'SUPERVISOR_GERAL',
    cargo: 'Supervisor Operacional de Campo',
    setorId: 'setor-supervisao',
    equipe: 'Supervisão Geral de Operações R7',
    matriculaFuncional: 'SUP-0021',
    status: 'ATIVO',
    dataAdmissao: '2023-08-01',
  },
  {
    id: 'user-admin-1',
    nome: 'Coord. Adriano Silva',
    email: 'adrianosilva1983oficial@gmail.com',
    senha: '123',
    telefone: '(71) 99233-7711',
    perfil: 'ADMIN_CONTRATO',
    cargo: 'Coordenador Geral do Contrato Embasa R7',
    setorId: 'setor-diretoria',
    equipe: 'Gestão Contratual EMBASA R7',
    matriculaFuncional: 'ADM-0001',
    status: 'ATIVO',
    dataAdmissao: '2023-01-10',
  },
];
