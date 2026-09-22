/**
 * Tipos e Definições do Censo e Atualização Cadastral
 * AquaSane Pro - Sistema Operacional de Campo e Saneamento Universal
 */

export type ZonaAbastecimento = 
  | 'ZA 23' 
  | 'ZA 25' 
  | 'ZA 26' 
  | 'ZA 27' 
  | 'ZA 29' 
  | 'ZA 30' 
  | 'ZA 31' 
  | 'ZA 32';

export type BairroR7 =
  | 'Arenoso'
  | 'Arraial do Retiro'
  | 'Barreiras'
  | 'Cabula'
  | 'Cabula VI'
  | 'Calabetão'
  | 'Centro Administrativo da Bahia (CAB)'
  | 'Curuzu'
  | 'Doron'
  | 'Engomadeira'
  | 'IAPI'
  | 'Jardim Santo Inácio'
  | 'Liberdade'
  | 'Mata Escura'
  | 'Narandiba'
  | 'Nova Sussuarana'
  | 'Novo Horizonte'
  | 'Pernambués'
  | 'Pero Vaz'
  | 'Resgate'
  | 'Saboeiro'
  | 'Santa Mônica'
  | 'São Gonçalo do Retiro'
  | 'Sussuarana'
  | 'Beiru/Tancredo Neves';

export type SituacaoLigacao =
  | 'ATIVA'
  | 'INATIVA'
  | 'CORTADA'
  | 'SUPRIMIDA'
  | 'POTENCIAL'
  | 'FACTIVEL'
  | 'CLANDESTINA_GATO';

export type StatusVisita =
  | 'REALIZADA_COM_CLIENTE'
  | 'CASA_FECHADA'
  | 'MORADOR_AUSENTE'
  | 'MORADOR_IMPEDIU'
  | 'COLETA_EXTERNA_3A_VISITA';

export type TentativaVisita = 1 | 2 | 3;

export type EstadoHidrometro =
  | 'NORMAL'
  | 'PARADO'
  | 'INVERTIDO'
  | 'ILEGIVEL'
  | 'CUPULA_DANIFICADA'
  | 'SEM_HIDROMETRO';

export type EstadoLacre =
  | 'INTACTO'
  | 'VIOLADO'
  | 'SEM_LACRE';

export type TipoAbrigo =
  | 'PADRAO_EMBASA_MURO'
  | 'INTERNO'
  | 'EMBUTIDO'
  | 'CAIXA_CHAO'
  | 'SEM_ABRIGO';

export type TipoVazamento =
  | 'NENHUM'
  | 'CAVALETE'
  | 'REDE_EXTERNA'
  | 'INTERNO_SUSPEITO';

export type TipoImovel =
  | 'CASA'
  | 'APARTAMENTO'
  | 'VILA_CONDOMINIO'
  | 'COMERCIAL'
  | 'MISTO'
  | 'INDUSTRIAL'
  | 'PUBLICO';

export type CondicaoOcupacao =
  | 'PROPRIO'
  | 'ALUGADO'
  | 'CEDIDO'
  | 'OUTRO';

export type EscolaridadeChefe =
  | 'SEM_INSTRUCAO'
  | '1_A_3_ANOS'
  | '4_A_7_ANOS'
  | '8_A_10_ANOS'
  | '11_A_14_ANOS'
  | 'SUPERIOR';

export type FaixaRenda =
  | '0_A_1_SM'
  | '1_A_3_SM'
  | '3_A_5_SM'
  | '5_A_10_SM'
  | 'SUPERIOR_10_SM'
  | 'SEM_RENDIMENTO';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'error';

export interface CoordenadasGPS {
  latitude: number;
  longitude: number;
  precisaoMetros?: number;
  timestamp: number;
}

export interface CensoRecord {
  id: string; // UUID único da coleta
  matriculaEmbasa: string; // Matrícula do cliente / ligação
  numeroOS: string; // Número da OS SCIWeb (ex: OS-2026-XXXX)
  zonaAbastecimento: ZonaAbastecimento;
  bairro: BairroR7;
  logradouro: string;
  numeroPorta: string;
  quadra: string;
  lote: string;
  complemento?: string;
  coordenadas: CoordenadasGPS;

  // Perfil do Cliente e Responsável
  nomeCliente: string;
  cpfCnpj?: string;
  telefoneContato: string;
  sexoResponsavel: 'FEMININO' | 'MASCULINO' | 'OUTRO';
  faixaEtariaResponsavel: string;
  escolaridade: EscolaridadeChefe;
  faixaRenda: FaixaRenda;
  numeroMoradores: number;
  possuiCadUnicoBolsaFamilia: boolean;
  interesseTarifaSocial: boolean;

  // Tipo e Características do Imóvel
  tipoImovel: TipoImovel;
  numeroPavimentos: number;
  condicaoOcupacao: CondicaoOcupacao;
  tipoEsgotamento: 'REDE_PUBLICA' | 'FOSSA' | 'VALA_CEU_ABERTO' | 'DIRETO_RIO';

  // Situação Comercial e Hidrometria
  situacaoLigacao: SituacaoLigacao;
  numeroHidrometro: string;
  leituraAtualM3: number;
  estadoHidrometro: EstadoHidrometro;
  estadoLacre: EstadoLacre;
  tipoAbrigo: TipoAbrigo;
  tipoVazamento: TipoVazamento;
  observacaoTecnica?: string;

  // Fluxo de Visita (Seção 11.2)
  tentativaVisita: TentativaVisita;
  statusVisita: StatusVisita;
  diaAlternativoVisita?: boolean; // Final de semana ou feriado

  // Registro Fotográfico Obrigatório (Base64 compactada para garantia offline)
  fotoFachada?: string;
  fotoHidrometro?: string;
  fotoIrregularidade?: string;

  // Negociação e Reclamação
  solicitouNegociacaoDebito?: boolean;
  registrouReclamacao?: boolean;
  tipoReclamacao?: string;
  descricaoReclamacao?: string;

  // Metadados do Cadastrista e Sincronização
  equipeCadastrista: string; // ex: Equipe 04 - Lote A
  nomeCadastrista: string;
  criadoEm: number; // timestamp UTC
  atualizadoEm: number;
  syncStatus: SyncStatus;
  syncAttempts: number;
  syncError?: string;
  syncedAt?: number;
  serverSyncedAt?: number;
  remoteConfirmationId?: string;

  // Sistema de Fila com Prioridade (Emergência de Vazamento / Crítica)
  priority?: QueuePriority;
  isEmergency?: boolean;
  emergencyReason?: string;
  prioritizedAt?: number;

  // Dicionário dinâmico de campos do contrato (MATRICULA, ZONA_FATU, CONS_MED, etc. e customizados)
  contractValues?: Record<string, any>;
}

export type QueuePriority = 'CRITICA' | 'ALTA' | 'NORMAL' | 'BAIXA';

export interface ReclamacaoObra {
  id: string;
  protocolo: string;
  bairro: BairroR7;
  logradouro: string;
  nomeMunicipe: string;
  telefone: string;
  tipoDemanda: 'BURACO_VALA_ABERTA' | 'INTERRUPCAO_AGUA' | 'POEIRA_RUIDO' | 'DANO_IMOVEL' | 'OUTRO';
  descricao: string;
  canalEntrada: 'CAMPO_DIRETO' | 'CALL_CENTER_0800' | 'WHATSAPP_CAMPO' | 'CANTEIRO_OBRA';
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO_48H' | 'FECHADO';
  criadoEm: number;
  prazoResolucao48h: number;
  respostaCliente?: string;
  syncStatus: SyncStatus;
}

export interface ReclamacaoOuvidoria {
  id: string;
  protocolo: string;
  dataHora: number;
  matricula?: string;
  nomeCidadao: string;
  telefone: string;
  bairro: BairroR7;
  endereco: string;
  canalAtendimento: 'EQUIPE_CAMPO' | 'CALL_CENTER_0800' | 'CANTEIRO_OBRAS' | 'WHATSAPP_CAMPO';
  tipoOcorrencia: 'POEIRA' | 'RUIDO' | 'INTERRUPCAO_ABASTECIMENTO' | 'BURACOS_VALAS' | 'DANOS_IMOVEL' | 'ODOR' | 'OUTRO';
  descricao: string;
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'CANCELADO';
  prazoSLA48h: number; // 48 horas conforme item 14.1 do PGCSA
  respostaAoCliente?: string;
  grauSatisfacao?: 'OTIMO' | 'BOM' | 'REGULAR' | 'RUIM';
  syncStatus: SyncStatus;
}

export interface NegociacaoDebito {
  id: string;
  matricula: string;
  nomeCliente: string;
  telefone: string;
  bairro: BairroR7;
  statusLigacao: 'INATIVA' | 'SUPRIMIDA' | 'DEBITO_ATIVO';
  tentativaNegociacao: 1 | 2 | 3;
  tipoTentativa: 'MOTO_NEGOCIADOR' | 'VISITA_SOCIAL' | 'UNIDADE_MOVEL';
  propostaAcordo: string;
  adesaoTarifaSocial: boolean;
  resultado: 'ACORDO_FECHADO' | 'EM_ANALISE' | 'RECUSADO' | 'ENCAMINHADO_ENGENHARIA';
  dataTentativa: number;
  syncStatus: SyncStatus;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'censo' | 'reclamacao' | 'negociacao';
  entityId: string;
  action: 'create' | 'update';
  payload: any;
  queuedAt: number;
  attempts: number;
  status: SyncStatus;
  lastError?: string;
  lastAttemptAt?: number;

  // Sistema de Filas Prioritárias
  priority: QueuePriority;
  isEmergency?: boolean;
  emergencyReason?: string;
  prioritizedAt?: number;
  matriculaEmbasa?: string;
  numeroOS?: string;
  logradouro?: string;
  bairro?: string;
  tipoVazamento?: string;
}
