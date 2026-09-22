import { ContractFieldDefinition, ContractFieldSection } from '../types/contractFields';
import { getDB } from './db';

const STORAGE_KEY = 'embasa_r7_contract_fields_schema';
const SETTING_DB_KEY = 'contract_fields_schema';

/**
 * 38 Campos Oficiais do Contrato Estipulados pela Empresa
 */
export const DEFAULT_CONTRACT_FIELDS: ContractFieldDefinition[] = [
  // 1. DADOS CADASTRAIS
  {
    id: 'field_matricula',
    key: 'MATRICULA',
    label: 'Matrícula da Ligação',
    section: 'DADOS_CADASTRAIS',
    type: 'text',
    required: true,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: 10928471',
    description: 'Código identificador único da ligação no sistema comercial da concessionária.',
    order: 1,
  },
  {
    id: 'field_zona_fatu',
    key: 'ZONA_FATU',
    label: 'Zona de Faturamento',
    section: 'DADOS_CADASTRAIS',
    type: 'select',
    required: true,
    enabled: true,
    isCoreContract: true,
    options: ['ZF-01', 'ZF-02', 'ZF-03', 'ZF-04', 'ZF-05', 'ZF-06', 'ZF-07', 'ZF-08', 'ZF-09', 'ZF-10'],
    defaultValue: 'ZF-03',
    description: 'Zona de faturamento e ciclo de leitura do contrato.',
    order: 2,
  },
  {
    id: 'field_inscricao',
    key: 'INSCRICAO',
    label: 'Inscrição Imobiliária / Cadastral',
    section: 'DADOS_CADASTRAIS',
    type: 'text',
    required: false,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: 025.109.0041-0',
    description: 'Inscrição cadastral municipal ou setorial do imóvel.',
    order: 3,
  },
  {
    id: 'field_matr_princ',
    key: 'MATR_PRINC',
    label: 'Matrícula Principal',
    section: 'DADOS_CADASTRAIS',
    type: 'text',
    required: false,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: 10928000 (se condomínio/subligação)',
    description: 'Matrícula mestre em caso de ramal coletivo, vila ou condomínio.',
    order: 4,
  },

  // 2. LOGRADOURO & ENDEREÇO
  {
    id: 'field_tipo_logra',
    key: 'TIPO_LOGRA',
    label: 'Tipo do Logradouro',
    section: 'LOGRADOURO_ENDERECO',
    type: 'select',
    required: true,
    enabled: true,
    isCoreContract: true,
    options: ['Rua', 'Avenida', 'Travessa', 'Alameda', 'Praça', 'Beco', 'Ladeira', 'Estrada', 'Rodovia', 'Caminho', 'Conjunto', 'Vila', 'Passagem'],
    defaultValue: 'Rua',
    description: 'Classificação oficial do logradouro.',
    order: 5,
  },
  {
    id: 'field_titulo_log',
    key: 'TITULO_LOG',
    label: 'Título do Logradouro',
    section: 'LOGRADOURO_ENDERECO',
    type: 'select',
    required: false,
    enabled: true,
    isCoreContract: true,
    options: ['Sem Título', 'Dr.', 'Prof.', 'Cel.', 'Dom', 'Pe.', 'Mal.', 'Sen.', 'Des.', 'Alm.', 'Ver.', 'Gov.'],
    defaultValue: 'Sem Título',
    description: 'Título honorífico atribuído ao logradouro.',
    order: 6,
  },
  {
    id: 'field_endereco',
    key: 'ENDERECO',
    label: 'Nome do Logradouro / Endereço',
    section: 'LOGRADOURO_ENDERECO',
    type: 'text',
    required: true,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: Silveira Martins',
    description: 'Nome oficial do logradouro sem o tipo/título.',
    order: 7,
  },
  {
    id: 'field_porta',
    key: 'PORTA',
    label: 'Número de Porta',
    section: 'LOGRADOURO_ENDERECO',
    type: 'text',
    required: true,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: 142 ou S/N',
    description: 'Numeração física predial do imóvel.',
    order: 8,
  },
  {
    id: 'field_quadra',
    key: 'QUADRA',
    label: 'Quadra',
    section: 'LOGRADOURO_ENDERECO',
    type: 'text',
    required: false,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: QD-04',
    description: 'Identificação da quadra cartográfica.',
    order: 9,
  },
  {
    id: 'field_lote',
    key: 'LOTE',
    label: 'Lote',
    section: 'LOGRADOURO_ENDERECO',
    type: 'text',
    required: false,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: LT-12',
    description: 'Identificação do loteamento.',
    order: 10,
  },
  {
    id: 'field_slote',
    key: 'SLOTE',
    label: 'Sublote',
    section: 'LOGRADOURO_ENDERECO',
    type: 'text',
    required: false,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: SL-01, Casa B, Fundo',
    description: 'Subdivisão interna de lote.',
    order: 11,
  },
  {
    id: 'field_bairro',
    key: 'BAIRRO',
    label: 'Bairro',
    section: 'LOGRADOURO_ENDERECO',
    type: 'select',
    required: true,
    enabled: true,
    isCoreContract: true,
    options: [
      'Arenoso', 'Arraial do Retiro', 'Barreiras', 'Cabula', 'Cabula VI',
      'Calabetão', 'Centro Administrativo da Bahia (CAB)', 'Curuzu', 'Doron',
      'Engomadeira', 'IAPI', 'Jardim Santo Inácio', 'Liberdade', 'Mata Escura',
      'Narandiba', 'Nova Sussuarana', 'Novo Horizonte', 'Pernambués', 'Pero Vaz',
      'Resgate', 'Saboeiro', 'Santa Mônica', 'São Gonçalo do Retiro',
      'Sussuarana', 'Beiru/Tancredo Neves'
    ],
    defaultValue: 'Cabula',
    description: 'Bairro de atendimento do Sistema R7 Salvador.',
    order: 12,
  },
  {
    id: 'field_cod_lograd',
    key: 'COD_LOGRAD',
    label: 'Código do Logradouro (SCIWeb)',
    section: 'LOGRADOURO_ENDERECO',
    type: 'text',
    required: false,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: LOG-71822',
    description: 'Código alfanumérico do logradouro cadastrado na concessionária.',
    order: 13,
  },

  // 3. CLIENTE & CONSUMIDOR
  {
    id: 'field_nome_cons',
    key: 'NOME_CONS',
    label: 'Nome do Consumidor',
    section: 'CLIENTE_CONSUMIDOR',
    type: 'text',
    required: true,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Nome completo do titular ou morador responsável',
    description: 'Nome civil do titular da ligação ou usuário cadastrado.',
    order: 14,
  },

  // 4. SITUAÇÃO DA LIGAÇÃO & CONSUMO
  {
    id: 'field_sit_agua',
    key: 'SIT_AGUA',
    label: 'Situação da Água',
    section: 'LIGACAO_AGUA',
    type: 'select',
    required: true,
    enabled: true,
    isCoreContract: true,
    options: ['Ligada', 'Cortada', 'Suprimida', 'Factual', 'Inexistente'],
    defaultValue: 'Ligada',
    description: 'Estado atual do fornecimento físico de água.',
    order: 15,
  },
  {
    id: 'field_sit_ligaca',
    key: 'SIT_LIGACA',
    label: 'Situação da Ligação',
    section: 'LIGACAO_AGUA',
    type: 'select',
    required: true,
    enabled: true,
    isCoreContract: true,
    options: ['Ativa', 'Inativa', 'Cortada no Cavalete', 'Cortada no Ramal', 'Suprimida', 'Clandestina (Gato)', 'Factual'],
    defaultValue: 'Ativa',
    description: 'Condição cadastral da ligação na rede pública.',
    order: 16,
  },
  {
    id: 'field_sit_liga_1',
    key: 'SIT_LIGA_1',
    label: 'Situação da Ligação 1 (Secundária)',
    section: 'LIGACAO_AGUA',
    type: 'select',
    required: false,
    enabled: true,
    isCoreContract: true,
    options: ['Sem Segunda Ligação', 'Ligação Regular', 'Ramal Paralelo', 'Poço Artesiano Conjugado', 'Cisterna Coletiva'],
    defaultValue: 'Sem Segunda Ligação',
    description: 'Situação de derivações secundárias ou fontes alternativas.',
    order: 17,
  },
  {
    id: 'field_cons_med',
    key: 'CONS_MED',
    label: 'Consumo Médio (m³)',
    section: 'LIGACAO_AGUA',
    type: 'number',
    required: false,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: 12.5',
    description: 'Média ponderada de consumo mensal em metros cúbicos.',
    order: 18,
  },

  // 5. HIDROMETRIA
  {
    id: 'field_num_hidr',
    key: 'NUM_HIDR',
    label: 'Número do Hidrômetro',
    section: 'HIDROMETRIA',
    type: 'text',
    required: true,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: A24N849120 ou SEM_MEDIDOR',
    description: 'Número de fabricação gravado no mostrador/carcaça.',
    order: 19,
  },
  {
    id: 'field_dt_instal',
    key: 'DT_INSTAL',
    label: 'Data de Instalação do Hidrômetro',
    section: 'HIDROMETRIA',
    type: 'date',
    required: false,
    enabled: true,
    isCoreContract: true,
    description: 'Data em que o hidrômetro atual foi instalado/substituído.',
    order: 20,
  },
  {
    id: 'field_loc_hidr',
    key: 'LOC_HIDR',
    label: 'Localização do Hidrômetro',
    section: 'HIDROMETRIA',
    type: 'select',
    required: true,
    enabled: true,
    isCoreContract: true,
    options: [
      'Padrão Mureta Fachada',
      'Caixa Piso / Passeio Público',
      'Embutido no Muro com Grade',
      'Interno ao Imóvel (Garagem/Quintal)',
      'Sem Caixa / Desprotegido',
      'Cavalete Coletivo'
    ],
    defaultValue: 'Padrão Mureta Fachada',
    description: 'Condição de acesso e localização física do aparelho medidor.',
    order: 21,
  },
  {
    id: 'field_vazao',
    key: 'VAZAO',
    label: 'Vazão Nominal',
    section: 'HIDROMETRIA',
    type: 'select',
    required: false,
    enabled: true,
    isCoreContract: true,
    options: ['Qn 0.75 m³/h', 'Qn 1.5 m³/h', 'Qn 2.5 m³/h', 'Qn 3.5 m³/h', 'Qn 5.0 m³/h', 'Qn 10.0 m³/h', 'Não Identificada'],
    defaultValue: 'Qn 1.5 m³/h',
    description: 'Capacidade nominal de vazão do medidor instalada.',
    order: 22,
  },
  {
    id: 'field_marca',
    key: 'MARCA',
    label: 'Marca do Hidrômetro',
    section: 'HIDROMETRIA',
    type: 'select',
    required: false,
    enabled: true,
    isCoreContract: true,
    options: ['Sensus', 'Itron / Actaris', 'Saga', 'Elster / Honeywell', 'Zenner', 'Lares', 'Fênix', 'Outra', 'Ilegível'],
    defaultValue: 'Itron / Actaris',
    description: 'Fabricante do equipamento de medição.',
    order: 23,
  },
  {
    id: 'field_tipo',
    key: 'TIPO',
    label: 'Tipo do Hidrômetro',
    section: 'HIDROMETRIA',
    type: 'select',
    required: false,
    enabled: true,
    isCoreContract: true,
    options: ['Unijato', 'Multijato', 'Volumétrico', 'Ultrassônico', 'Woltmann', 'Sem Hidrômetro'],
    defaultValue: 'Unijato',
    description: 'Princípio metrológico de funcionamento.',
    order: 24,
  },
  {
    id: 'field_diametro',
    key: 'DIAMETRO',
    label: 'Diâmetro da Ligação',
    section: 'HIDROMETRIA',
    type: 'select',
    required: false,
    enabled: true,
    isCoreContract: true,
    options: ['1/2" (DN 15mm)', '3/4" (DN 20mm)', '1" (DN 25mm)', '1.1/2" (DN 40mm)', '2" (DN 50mm)', 'Maior que 2"'],
    defaultValue: '1/2" (DN 15mm)',
    description: 'Diâmetro nominal da tubulação de entrada.',
    order: 25,
  },

  // 6. HISTÓRICO DE CONSUMO & ANORMALIDADES (Últimos 6 Meses)
  {
    id: 'field_cod_anl1',
    key: 'COD_ANL1',
    label: 'Código Anormalidade Mês 1',
    section: 'HISTORICO_FATURAMENTO',
    type: 'select',
    required: false,
    enabled: true,
    isCoreContract: true,
    options: ['00 - Normal', '01 - Imóvel Fechado', '02 - Hidrômetro Embaçado/Ilegível', '03 - Impedimento de Leitura (Cão/Grade)', '04 - Hidrômetro Parado', '05 - Consumo Acima da Média', '06 - Consumo Zero / Não Faturado', '07 - Lacre Violado'],
    defaultValue: '00 - Normal',
    description: 'Anormalidade registrada no último ciclo de faturamento.',
    order: 26,
  },
  {
    id: 'field_cons1',
    key: 'CONS1',
    label: 'Consumo Mês 1 (m³)',
    section: 'HISTORICO_FATURAMENTO',
    type: 'number',
    required: false,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: 14',
    description: 'Volume faturado no último mês.',
    order: 27,
  },
  {
    id: 'field_cod_anl2',
    key: 'COD_ANL2',
    label: 'Código Anormalidade Mês 2',
    section: 'HISTORICO_FATURAMENTO',
    type: 'select',
    required: false,
    enabled: true,
    isCoreContract: true,
    options: ['00 - Normal', '01 - Imóvel Fechado', '02 - Hidrômetro Embaçado/Ilegível', '03 - Impedimento de Leitura', '04 - Hidrômetro Parado', '05 - Consumo Acima da Média', '06 - Consumo Zero', '07 - Lacre Violado'],
    defaultValue: '00 - Normal',
    description: 'Anormalidade registrada no penúltimo ciclo.',
    order: 28,
  },
  {
    id: 'field_cons2',
    key: 'CONS2',
    label: 'Consumo Mês 2 (m³)',
    section: 'HISTORICO_FATURAMENTO',
    type: 'number',
    required: false,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: 15',
    description: 'Volume faturado 2 meses atrás.',
    order: 29,
  },
  {
    id: 'field_cod_anl3',
    key: 'COD_ANL3',
    label: 'Código Anormalidade Mês 3',
    section: 'HISTORICO_FATURAMENTO',
    type: 'select',
    required: false,
    enabled: true,
    isCoreContract: true,
    options: ['00 - Normal', '01 - Imóvel Fechado', '02 - Hidrômetro Embaçado/Ilegível', '03 - Impedimento de Leitura', '04 - Hidrômetro Parado', '05 - Consumo Acima da Média', '06 - Consumo Zero', '07 - Lacre Violado'],
    defaultValue: '00 - Normal',
    description: 'Anormalidade registrada 3 meses atrás.',
    order: 30,
  },
  {
    id: 'field_cons3',
    key: 'CONS3',
    label: 'Consumo Mês 3 (m³)',
    section: 'HISTORICO_FATURAMENTO',
    type: 'number',
    required: false,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: 12',
    description: 'Volume faturado 3 meses atrás.',
    order: 31,
  },
  {
    id: 'field_cod_anl4',
    key: 'COD_ANL4',
    label: 'Código Anormalidade Mês 4',
    section: 'HISTORICO_FATURAMENTO',
    type: 'select',
    required: false,
    enabled: true,
    isCoreContract: true,
    options: ['00 - Normal', '01 - Imóvel Fechado', '02 - Hidrômetro Embaçado/Ilegível', '03 - Impedimento de Leitura', '04 - Hidrômetro Parado', '05 - Consumo Acima da Média', '06 - Consumo Zero', '07 - Lacre Violado'],
    defaultValue: '00 - Normal',
    description: 'Anormalidade registrada 4 meses atrás.',
    order: 32,
  },
  {
    id: 'field_cons4',
    key: 'CONS4',
    label: 'Consumo Mês 4 (m³)',
    section: 'HISTORICO_FATURAMENTO',
    type: 'number',
    required: false,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: 13',
    description: 'Volume faturado 4 meses atrás.',
    order: 33,
  },
  {
    id: 'field_cod_anl5',
    key: 'COD_ANL5',
    label: 'Código Anormalidade Mês 5',
    section: 'HISTORICO_FATURAMENTO',
    type: 'select',
    required: false,
    enabled: true,
    isCoreContract: true,
    options: ['00 - Normal', '01 - Imóvel Fechado', '02 - Hidrômetro Embaçado/Ilegível', '03 - Impedimento de Leitura', '04 - Hidrômetro Parado', '05 - Consumo Acima da Média', '06 - Consumo Zero', '07 - Lacre Violado'],
    defaultValue: '00 - Normal',
    description: 'Anormalidade registrada 5 meses atrás.',
    order: 34,
  },
  {
    id: 'field_cons5',
    key: 'CONS5',
    label: 'Consumo Mês 5 (m³)',
    section: 'HISTORICO_FATURAMENTO',
    type: 'number',
    required: false,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: 16',
    description: 'Volume faturado 5 meses atrás.',
    order: 35,
  },
  {
    id: 'field_cod_anl6',
    key: 'COD_ANL6',
    label: 'Código Anormalidade Mês 6',
    section: 'HISTORICO_FATURAMENTO',
    type: 'select',
    required: false,
    enabled: true,
    isCoreContract: true,
    options: ['00 - Normal', '01 - Imóvel Fechado', '02 - Hidrômetro Embaçado/Ilegível', '03 - Impedimento de Leitura', '04 - Hidrômetro Parado', '05 - Consumo Acima da Média', '06 - Consumo Zero', '07 - Lacre Violado'],
    defaultValue: '00 - Normal',
    description: 'Anormalidade registrada 6 meses atrás.',
    order: 36,
  },
  {
    id: 'field_cons6',
    key: 'CONS6',
    label: 'Consumo Mês 6 (m³)',
    section: 'HISTORICO_FATURAMENTO',
    type: 'number',
    required: false,
    enabled: true,
    isCoreContract: true,
    placeholder: 'Ex: 14',
    description: 'Volume faturado 6 meses atrás.',
    order: 37,
  },

  // 7. CARACTERIZAÇÃO DO IMÓVEL
  {
    id: 'field_sitimovel',
    key: 'SITIMOVEL',
    label: 'Situação do Imóvel',
    section: 'IMOVEL',
    type: 'select',
    required: true,
    enabled: true,
    isCoreContract: true,
    options: [
      'Residencial Normal',
      'Residencial Tarifa Social',
      'Comercial Pequeno Porte',
      'Comercial Médio/Grande',
      'Industrial',
      'Público / Institucional',
      'Misto (Comércio no térreo + Residência)',
      'Vago / Desocupado',
      'Em Construção / Reforma',
      'Demolido / Terreno Limpo'
    ],
    defaultValue: 'Residencial Normal',
    description: 'Classificação do perfil de ocupação e uso do imóvel.',
    order: 38,
  },
];

export const SECTION_NAMES: Record<ContractFieldSection, string> = {
  DADOS_CADASTRAIS: '1. Dados Cadastrais da Ligação',
  LOGRADOURO_ENDERECO: '2. Logradouro e Localização',
  CLIENTE_CONSUMIDOR: '3. Consumidor e Usuário',
  LIGACAO_AGUA: '4. Situação da Água e Consumo',
  HIDROMETRIA: '5. Hidrometria e Medição',
  HISTORICO_FATURAMENTO: '6. Histórico de Consumo (6 Meses)',
  IMOVEL: '7. Caracterização do Imóvel',
  PERSONALIZADOS: '8. Campos Personalizados do Contrato',
};

type SchemaListener = (fields: ContractFieldDefinition[]) => void;
const schemaListeners = new Set<SchemaListener>();

class ContractSchemaService {
  private cachedFields: ContractFieldDefinition[] | null = null;

  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('aquasane_schema_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'SCHEMA_UPDATED' && Array.isArray(event.data.fields)) {
            this.cachedFields = this.sanitizeFieldList(event.data.fields);
            this.notifyListeners();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel não suportado:', e);
      }
    }

    // Auto-import de schema via parâmetro de URL (para links compartilhados por WhatsApp / QR Code)
    if (typeof window !== 'undefined') {
      this.checkUrlSchemaImport();
    }
  }

  private async checkUrlSchemaImport() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const schemaParam = urlParams.get('import_schema') || urlParams.get('schema_sync');
      if (schemaParam) {
        const success = await this.importSchemaFromBase64(schemaParam);
        if (success) {
          // Limpa a URL sem recarregar a página
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
          console.log('Schema do censo importado automaticamente via URL!');
        }
      }
    } catch (e) {
      console.warn('Falha ao checar URL para importação de schema:', e);
    }
  }

  /**
   * Obtém os campos do contrato salvos no IndexedDB ou LocalStorage,
   * garantindo os 38 campos originais por padrão.
   */
  public async getContractFields(): Promise<ContractFieldDefinition[]> {
    if (this.cachedFields) {
      return [...this.cachedFields];
    }

    try {
      // 1. Tenta carregar do IndexedDB
      const db = await getDB();
      const tx = db.transaction('app_settings', 'readonly');
      const store = tx.objectStore('app_settings');
      const req = store.get(SETTING_DB_KEY);

      const dbResult = await new Promise<{ key: string; value: ContractFieldDefinition[] } | undefined>((resolve) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(undefined);
      });

      if (dbResult && Array.isArray(dbResult.value) && dbResult.value.length > 0) {
        this.cachedFields = this.sanitizeFieldList(dbResult.value);
        return [...this.cachedFields];
      }
    } catch (e) {
      console.warn('Falha ao ler campos do IndexedDB, tentando LocalStorage:', e);
    }

    // 2. Fallback LocalStorage
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cachedFields = this.sanitizeFieldList(parsed);
          return [...this.cachedFields];
        }
      }
    } catch (e) {
      console.warn('Falha ao ler do LocalStorage:', e);
    }

    // 3. Fallback inicial padrão com os 38 campos
    this.cachedFields = [...DEFAULT_CONTRACT_FIELDS];
    await this.saveContractFields(this.cachedFields);
    return [...this.cachedFields];
  }

  /**
   * Salva a lista de campos no IndexedDB e LocalStorage e notifica componentes
   */
  public async saveContractFields(fields: ContractFieldDefinition[]): Promise<void> {
    const sanitized = this.sanitizeFieldList(fields);
    this.cachedFields = sanitized;

    // Salva no LocalStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch (e) {
      console.warn('Erro ao salvar campos no LocalStorage:', e);
    }

    // Salva no IndexedDB
    try {
      const db = await getDB();
      const tx = db.transaction('app_settings', 'readwrite');
      const store = tx.objectStore('app_settings');
      store.put({ key: SETTING_DB_KEY, value: sanitized });
    } catch (e) {
      console.warn('Erro ao salvar campos no IndexedDB:', e);
    }

    // Notifica ouvintes locais
    this.notifyListeners();

    // Notifica outras abas / instâncias abertas no mesmo aparelho (BroadcastChannel)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'SCHEMA_UPDATED', fields: sanitized });
      } catch (e) {
        console.warn('Erro ao postar mensagem no BroadcastChannel:', e);
      }
    }
  }

  /**
   * Insere um novo campo no contrato
   */
  public async addField(fieldData: Omit<ContractFieldDefinition, 'id' | 'order'>): Promise<ContractFieldDefinition> {
    const current = await this.getContractFields();
    const cleanKey = fieldData.key.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    // Valida se a chave já existe
    const exists = current.some((f) => f.key === cleanKey);
    if (exists) {
      throw new Error(`Já existe um campo com a chave contratual "${cleanKey}".`);
    }

    const newField: ContractFieldDefinition = {
      ...fieldData,
      id: `field_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      key: cleanKey,
      order: current.length + 1,
      isCoreContract: false,
    };

    const updated = [...current, newField];
    await this.saveContractFields(updated);
    return newField;
  }

  /**
   * Atualiza um campo existente
   */
  public async updateField(idOrKey: string, updates: Partial<ContractFieldDefinition>): Promise<void> {
    const current = await this.getContractFields();
    const updated = current.map((f) => {
      if (f.id === idOrKey || f.key === idOrKey) {
        return { ...f, ...updates };
      }
      return f;
    });
    await this.saveContractFields(updated);
  }

  /**
   * Exclui ou desativa um campo do contrato.
   * Se for um campo customizado, é removido permanentemente.
   * Se for um campo oficial da empresa (core), é desativado/excluído do censo.
   */
  public async deleteOrExcludeField(idOrKey: string, hardDeleteCustom: boolean = true): Promise<void> {
    const current = await this.getContractFields();
    const target = current.find((f) => f.id === idOrKey || f.key === idOrKey);
    if (!target) return;

    if (!target.isCoreContract && hardDeleteCustom) {
      // Remove do array
      const filtered = current.filter((f) => f.id !== target.id);
      await this.saveContractFields(filtered);
    } else {
      // Desativa/Exclui do censo
      const modified = current.map((f) => (f.id === target.id ? { ...f, enabled: false } : f));
      await this.saveContractFields(modified);
    }
  }

  /**
   * Alterna a inclusão/exclusão de um campo no contrato
   */
  public async toggleFieldEnabled(idOrKey: string, enabled: boolean): Promise<void> {
    const current = await this.getContractFields();
    const updated = current.map((f) => {
      if (f.id === idOrKey || f.key === idOrKey) {
        return { ...f, enabled };
      }
      return f;
    });
    await this.saveContractFields(updated);
  }

  /**
   * Restaura o modelo padrão estipulado pela empresa com os 38 campos oficiais
   */
  public async resetToDefaultContract(): Promise<void> {
    this.cachedFields = [...DEFAULT_CONTRACT_FIELDS];
    await this.saveContractFields(this.cachedFields);
  }

  /**
   * Aplica um preset ou conjunto de chaves ativas
   */
  public async applyActiveKeys(activeKeys: string[]): Promise<void> {
    const current = await this.getContractFields();
    const set = new Set(activeKeys);
    const updated = current.map((f) => ({
      ...f,
      enabled: set.has(f.key),
    }));
    await this.saveContractFields(updated);
  }

  /**
   * Assina mudanças de schema
   */
  public subscribe(listener: SchemaListener): () => void {
    schemaListeners.add(listener);
    return () => {
      schemaListeners.delete(listener);
    };
  }

  private notifyListeners() {
    if (!this.cachedFields) return;
    const copy = [...this.cachedFields];
    schemaListeners.forEach((l) => {
      try {
        l(copy);
      } catch (e) {
        console.error('Erro em listener do schema:', e);
      }
    });
  }

  /**
   * Garante integridade e ordena campos
   */
  private sanitizeFieldList(list: ContractFieldDefinition[]): ContractFieldDefinition[] {
    // Garante que todos os campos tenham os atributos mínimos
    return list.map((item, index) => ({
      ...item,
      key: item.key.toUpperCase(),
      order: item.order || index + 1,
      enabled: item.enabled ?? true,
      required: item.required ?? false,
      isCoreContract: item.isCoreContract ?? false,
      section: item.section || 'PERSONALIZADOS',
      type: item.type || 'text',
    }));
  }

  /**
   * Retorna apenas os campos ativos/habilitados no momento
   */
  public async getActiveFields(): Promise<ContractFieldDefinition[]> {
    const all = await this.getContractFields();
    return all.filter((f) => f.enabled);
  }

  /**
   * Verifica de forma síncrona/rápida se um campo está ativo no cache atual
   */
  public isFieldEnabled(key: string): boolean {
    const cleanKey = key.toUpperCase();
    if (!this.cachedFields) {
      // Se ainda não carregou cache, verifica nos padrões
      const foundDefault = DEFAULT_CONTRACT_FIELDS.find((f) => f.key === cleanKey);
      return foundDefault ? foundDefault.enabled : true;
    }
    const found = this.cachedFields.find((f) => f.key === cleanKey);
    return found ? found.enabled : false;
  }

  /**
   * Retorna os metadados de um campo
   */
  public getField(key: string): ContractFieldDefinition | undefined {
    const cleanKey = key.toUpperCase();
    const source = this.cachedFields || DEFAULT_CONTRACT_FIELDS;
    return source.find((f) => f.key === cleanKey);
  }

  /**
   * Exporta a configuração atual de campos codificada em Base64 para sincronização via QR Code / URL
   */
  public exportSchemaAsBase64(): string {
    const source = this.cachedFields || DEFAULT_CONTRACT_FIELDS;
    const json = JSON.stringify(source);
    try {
      return btoa(encodeURIComponent(json));
    } catch {
      return '';
    }
  }

  /**
   * Importa a configuração de campos a partir de uma string Base64 (vinda de QR Code ou URL)
   */
  public async importSchemaFromBase64(base64: string): Promise<boolean> {
    try {
      const json = decodeURIComponent(atob(base64.trim()));
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        await this.saveContractFields(parsed);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Erro ao decodificar schema Base64:', err);
      return false;
    }
  }

  /**
   * Gera a URL completa para sincronização direta do celular do operador
   */
  public generateSyncUrl(): string {
    const token = this.exportSchemaAsBase64();
    if (!token) return window.location.href;
    const base = window.location.origin + window.location.pathname;
    return `${base}?import_schema=${token}`;
  }
}

export const contractSchemaService = new ContractSchemaService();

/**
 * Função utilitária para mapear valores entre o CensoRecord legado e o dicionário de contrato
 */
export function populateContractValuesFromRecord(record: any, fields: ContractFieldDefinition[]): Record<string, any> {
  const values: Record<string, any> = { ...(record.contractValues || {}) };

  // Mapeamentos automáticos para os campos oficiais
  if (!values['MATRICULA'] && record.matriculaEmbasa) values['MATRICULA'] = record.matriculaEmbasa;
  if (!values['NOME_CONS'] && record.nomeCliente) values['NOME_CONS'] = record.nomeCliente;
  if (!values['ENDERECO'] && record.logradouro) values['ENDERECO'] = record.logradouro;
  if (!values['PORTA'] && record.numeroPorta) values['PORTA'] = record.numeroPorta;
  if (!values['QUADRA'] && record.quadra) values['QUADRA'] = record.quadra;
  if (!values['LOTE'] && record.lote) values['LOTE'] = record.lote;
  if (!values['BAIRRO'] && record.bairro) values['BAIRRO'] = record.bairro;
  if (!values['NUM_HIDR'] && record.numeroHidrometro) values['NUM_HIDR'] = record.numeroHidrometro;
  if (!values['SIT_AGUA']) values['SIT_AGUA'] = record.situacaoLigacao === 'ATIVA' ? 'Ligada' : 'Cortada';
  if (!values['SIT_LIGACA']) values['SIT_LIGACA'] = record.situacaoLigacao === 'ATIVA' ? 'Ativa' : 'Inativa';
  if (!values['CONS_MED'] && record.leituraAtualM3) values['CONS_MED'] = Math.round(record.leituraAtualM3 / 10);
  if (!values['SITIMOVEL']) values['SITIMOVEL'] = record.tipoImovel === 'COMERCIAL' ? 'Comercial Pequeno Porte' : 'Residencial Normal';
  if (!values['ZONA_FATU']) values['ZONA_FATU'] = 'ZF-03';
  if (!values['TIPO_LOGRA']) values['TIPO_LOGRA'] = 'Rua';
  if (!values['TITULO_LOG']) values['TITULO_LOG'] = 'Sem Título';
  if (!values['LOC_HIDR']) values['LOC_HIDR'] = 'Padrão Mureta Fachada';
  if (!values['MARCA']) values['MARCA'] = 'Itron / Actaris';
  if (!values['TIPO']) values['TIPO'] = 'Unijato';
  if (!values['DIAMETRO']) values['DIAMETRO'] = '1/2" (DN 15mm)';
  if (!values['VAZAO']) values['VAZAO'] = 'Qn 1.5 m³/h';

  // Preenche padrões para campos vazios
  for (const field of fields) {
    if (values[field.key] === undefined && field.defaultValue !== undefined) {
      values[field.key] = field.defaultValue;
    }
  }

  return values;
}
