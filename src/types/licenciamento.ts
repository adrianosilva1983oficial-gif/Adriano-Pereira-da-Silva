export type StatusLicenca = 'ATIVO' | 'PENDENTE' | 'BLOQUEADO' | 'EXPIRADO';

export interface PlanoAquaSane {
  id: 'STARTER' | 'PRO' | 'ENTERPRISE' | 'CUSTOM';
  nome: string;
  badge?: string;
  valorMensal: number;
  limiteAparelhos: number;
  maxOSPorMes: number | 'ILIMITADO';
  descricao: string;
  recursos: string[];
}

export interface RegistroPagamento {
  id: string;
  tenantId: string;
  tenantNome: string;
  planoId: string;
  planoNome: string;
  valor: number;
  dataGeracao: number;
  dataVencimento: number;
  dataPagamento?: number;
  status: 'PAGO' | 'AGUARDANDO_PAGAMENTO' | 'ATRASADO' | 'CANCELADO';
  metodo: 'PIX' | 'BOLETO' | 'CARTAO';
  pixCopiaECola: string;
  linkPagamento: string;
}

export interface LicencaDispositivo {
  deviceId: string; // Identificador único de hardware/navegador (ex: CEL-7B4F-8201)
  imeiAparelho?: string; // IMEI único do aparelho celular (15 dígitos)
  modeloAparelho: string; // Ex: Samsung Galaxy A54, Motorola G84, iPhone 13
  empresaId: string; // ID da empresa prestadora contratante
  empresaNome: string; // Nome fantasia da prestadora
  cadastristaNome?: string; // Nome do colaborador em campo
  dataSolicitacao: number;
  dataAtivacao?: number;
  dataExpiracao?: number;
  status: StatusLicenca;
  chaveLiberacao?: string; // Chave gerada pelo Adriano Silva
  valorLicenca?: number; // R$ 99,00 por celular
  tipoLicenca?: 'LICENCA_UNICA_IMEI' | 'MENSAL';
  ipUltimoAcesso?: string;
  totalCensosRealizados?: number;
}

export interface EmpresaPrestadora {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  tipoServico: 'AGUA_ESGOTO' | 'MANUTENCAO_REDES' | 'RECADASTRRAMENTO' | 'CORTE_RELIGACAO';
  contratoNumero: string;
  limiteAparelhos: number;
  aparelhosAtivos: number;
  status: 'ATIVO' | 'SUSPENSO' | 'INADIMPLENTE';
  dataInicioContrato: number;
  dataFimContrato: number;
  contatoResponsavel: string;
  telefoneContato: string;
  emailContato: string;
  valorMensalPorAparelho: number; // Estipulado R$ 99,00 por celular / licença única por IMEI
}

export interface MasterLicenciamentoConfig {
  masterEmail: string; // adrianosilva1983oficial@gmail.com
  masterNome: string; // Adriano Silva
  masterChaveSecreta: string; // Chave mestre de desbloqueio
  versaoAppComercial: string;
}
