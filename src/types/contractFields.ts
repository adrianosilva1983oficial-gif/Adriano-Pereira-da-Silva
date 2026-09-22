/**
 * Definições e Tipos para Campos Contratuais do Censo de Saneamento
 * Permite inserção, exclusão e customização dinâmica de campos de acordo com o contrato da empresa contratante.
 */

export type ContractFieldSection =
  | 'DADOS_CADASTRAIS'
  | 'LOGRADOURO_ENDERECO'
  | 'CLIENTE_CONSUMIDOR'
  | 'LIGACAO_AGUA'
  | 'HIDROMETRIA'
  | 'HISTORICO_FATURAMENTO'
  | 'IMOVEL'
  | 'PERSONALIZADOS';

export type ContractFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export interface ContractFieldDefinition {
  id: string;
  key: string; // Código contratual em maiúsculas (ex: MATRICULA, ZONA_FATU, NUM_HIDR)
  label: string; // Rótulo amigável (ex: Matrícula da Ligação)
  section: ContractFieldSection;
  type: ContractFieldType;
  required: boolean;
  enabled: boolean; // Se ativo no formulário e relatórios do contrato
  isCoreContract: boolean; // Verdadeiro se pertence ao padrão dos 38 campos oficiais
  options?: string[]; // Opções no caso de campos tipo 'select'
  placeholder?: string;
  description?: string; // Dica ou instrução de preenchimento
  defaultValue?: any;
  order: number;
}

export interface ContractPreset {
  id: string;
  name: string;
  description: string;
  activeKeys: string[];
}
