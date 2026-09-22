import { BairroR7, ZonaAbastecimento, CoordenadasGPS } from './censo';

export type StatusOS = 
  | 'ABERTA' 
  | 'EM_DESLOCAMENTO' 
  | 'EXECUTADA' 
  | 'AUSENTE' 
  | 'IMPEDIDA';

export type StatusValidacaoEmbasa = 
  | 'PENDENTE_VALIDACAO' 
  | 'APROVADO_SCIWEB' 
  | 'REJEITADO_CAMPO' 
  | 'TRANSMITIDO_EMBASA';

export type StatusValidacaoConcessionaria = StatusValidacaoEmbasa;

export type MotivoImpedimento = 
  | 'CASA_FECHADA' 
  | 'CAO_BRAVO' 
  | 'AREA_RISCO' 
  | 'RECUSA_MORADOR' 
  | 'LOTE_VAGO' 
  | 'IMOVEL_DEMOLIDO'
  | 'OUTRO';

export interface LoteCartografia {
  vertices: { lat: number; lng: number }[];
  areaM2: number;
  perimetroM: number;
  tipoDesenho: 'GPS_CAMINHAMENTO' | 'DESENHO_MANUAL';
  capturadoEm: number;
  quadra: string;
  lote: string;
}

export type TipoFotoOS =
  | 'FACHADA'
  | 'HIDROMETRO'
  | 'CAVALETE'
  | 'LACRE'
  | 'ABRIGO'
  | 'RAMAL_LIGACAO'
  | 'IRREGULARIDADE'
  | 'LOTE_GERAL'
  | 'DOCUMENTO'
  | 'OUTRA';

export interface FotoRegistroOS {
  id: string;
  tipo: TipoFotoOS;
  rotulo: string; // Ex: "1. Fachada do Imóvel"
  dataUrl: string; // Base64 compactado
  timestamp: number;
  dataHoraFormatada: string;
  coordenadas?: {
    latitude: number;
    longitude: number;
  };
}

export interface CensoRapidoOS {
  situacaoLigacao?: string;
  numeroHidrometroEncontrado?: string;
  leituraAtualM3?: number;
  estadoHidrometro?: string;
  estadoLacre?: string;
  tipoAbrigo?: string;
  tipoVazamento?: string;
  nomeMoradorEntrevistado?: string;
  telefoneContato?: string;
  numeroMoradores?: number;
  possuiBolsaFamilia?: boolean;
  interesseTarifaSocial?: boolean;
  tipoImovel?: string;
  observacoes?: string;
  atualizadoEm?: number;
}

export interface OrdemServicoSCIWeb {
  id: string;
  numeroOS: string; // Ex: OS-2026-10482
  numeroOSSCIWeb: string; // Ex: SCI-OS-889104
  matriculaEmbasa: string; // Ex: 10928471
  bairro: BairroR7;
  logradouro: string;
  numeroPorta: string;
  quadra: string; // Ex: QD-01
  lote: string; // Ex: LT-01
  subLote?: string;
  numeroLoteNumerico: number; // Para ordenação crescente numérica exata (1, 2, 3...)
  zonaAbastecimento: ZonaAbastecimento;
  nomeConsumidorSCIWeb: string;
  hidrometroCadastradoSCIWeb: string;
  categoriaImovel: 'RESIDENCIAL' | 'COMERCIAL' | 'INDUSTRIAL' | 'PUBLICO';
  equipeDesignada: string;
  cadastristaDesignado: string;
  status: StatusOS;
  motivoImpedimento?: MotivoImpedimento;
  observacaoImpedimento?: string;
  tentativasAusente: number;
  dataUltimaTentativa?: number;
  coordenadas: CoordenadasGPS;
  sequenciaRota: number; // 1, 2, 3... sequencial do lote
  origemPlanilha?: string; // Nome da planilha Excel importada (ex: MATRICULAS_EMBASA_CABULA.xlsx)
  linhaPlanilhaOriginal?: number; // Linha exata de origem na planilha (1, 2, 3...)
  ordemProgramada?: number; // Sequência exata de execução programada
  dataProgramacao?: string; // Data da rota de campo (YYYY-MM-DD)
  censoRecordId?: string; // Vincula ao censo executado
  censoDados?: CensoRapidoOS; // Dados do censo salvos na OS
  fotos?: FotoRegistroOS[]; // Até 10 fotos anexadas à OS
  validacaoStatus: StatusValidacaoEmbasa;
  validadoPor?: string;
  validadoEm?: number;
  motivoRejeicao?: string;
  cartografiaLote?: LoteCartografia;
  dataReprogramada?: number;
  foiReprogramada?: boolean;
  motivoReprogramacao?: string;
  consumidorNome?: string; // Alias para nomeConsumidorSCIWeb
  criadoEm: number;
  atualizadoEm: number;
}
