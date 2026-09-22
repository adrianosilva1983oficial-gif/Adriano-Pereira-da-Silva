/**
 * Serviço Oficial de Geração de PIX e Links de Pagamento para Vendas Online
 * Chave Oficial do Titular: adrianosilva1983oficial@gmail.com
 * Favorecido: ADRIANO SILVA
 * Cidade: SALVADOR - BA
 */

export interface PixConfig {
  chave: string;
  titular: string;
  cidade: string;
  telefoneWhatsapp: string;
}

export const PIX_OFICIAL_CONFIG: PixConfig = {
  chave: 'adrianosilva1983oficial@gmail.com',
  titular: 'ADRIANO SILVA',
  cidade: 'SALVADOR',
  telefoneWhatsapp: '5571999368282',
};

/**
 * Calcula o checksum CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF)
 * Padrão exigido pelo Banco Central do Brasil para BR Code / PIX EMV
 */
export function calcularCRC16(payloadSemCRC: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payloadSemCRC.length; i++) {
    crc ^= payloadSemCRC.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Monta um campo TLV (Tag-Length-Value) no formato EMV
 */
function formatTLV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Remove acentos e caracteres especiais para compatibilidade estrita EMV
 */
function sanitizarTextoEMV(texto: string, maxLen: number): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .trim()
    .slice(0, maxLen);
}

/**
 * Gera o Código PIX Copia e Cola no padrão oficial do Banco Central (BR Code EMV)
 */
export function gerarPixCopiaEColaEMV(params: {
  chave?: string;
  titular?: string;
  cidade?: string;
  valor?: number;
  txid?: string;
  descricao?: string;
}): string {
  const chave = (params.chave || PIX_OFICIAL_CONFIG.chave).trim();
  const titular = sanitizarTextoEMV(params.titular || PIX_OFICIAL_CONFIG.titular, 25);
  const cidade = sanitizarTextoEMV(params.cidade || PIX_OFICIAL_CONFIG.cidade, 15);
  const valor = params.valor && params.valor > 0 ? params.valor.toFixed(2) : undefined;
  const txid = sanitizarTextoEMV(params.txid || 'AQUASANEPRO', 25) || '***';

  // 00 - Payload Format Indicator (01)
  let payload = formatTLV('00', '01');

  // 26 - Merchant Account Information (GUI + Chave + Descrição opcional)
  let sub26 = formatTLV('00', 'br.gov.bcb.pix');
  sub26 += formatTLV('01', chave);
  if (params.descricao) {
    const desc = sanitizarTextoEMV(params.descricao, 30);
    if (desc) sub26 += formatTLV('02', desc);
  }
  payload += formatTLV('26', sub26);

  // 52 - Merchant Category Code (0000)
  payload += formatTLV('52', '0000');

  // 53 - Transaction Currency (986 = BRL Real Brasileiro)
  payload += formatTLV('53', '986');

  // 54 - Transaction Amount (opcional se for valor aberto)
  if (valor) {
    payload += formatTLV('54', valor);
  }

  // 58 - Country Code (BR)
  payload += formatTLV('58', 'BR');

  // 59 - Merchant Name
  payload += formatTLV('59', titular);

  // 60 - Merchant City
  payload += formatTLV('60', cidade);

  // 62 - Additional Data Field Template (TxID / Referência da Fatura)
  const sub62 = formatTLV('05', txid);
  payload += formatTLV('62', sub62);

  // 63 - CRC16 (Tag 63, tamanho 04)
  const payloadParaCRC = `${payload}6304`;
  const crcCalculado = calcularCRC16(payloadParaCRC);

  return `${payloadParaCRC}${crcCalculado}`;
}

/**
 * Obtém a URL base atual do sistema para os links de pagamento
 */
export function getBaseAppUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
  }
  return 'https://ais-dev-ngtjzalhi77e43bxamfamp-530667778944.us-west2.run.app';
}

export interface OpcaoVendaOnline {
  id: string;
  planoId: 'STARTER' | 'PRO' | 'ENTERPRISE' | 'PERSONALIZADO';
  titulo: string;
  subtitulo: string;
  valor: number;
  descricao: string;
  limiteAparelhos?: number;
  popular?: boolean;
}

export const PACOTES_VENDAS_ONLINE: OpcaoVendaOnline[] = [
  {
    id: 'starter',
    planoId: 'STARTER',
    titulo: 'AquaSane Starter',
    subtitulo: 'Equipe Inicial (Até 5 Coletores)',
    valor: 490.0,
    descricao: 'Ideal para prestadoras e equipes compactas iniciando recadastramento ou manutenção.',
    limiteAparelhos: 5,
  },
  {
    id: 'pro',
    planoId: 'PRO',
    titulo: 'AquaSane Pro Regional',
    subtitulo: 'Mais Vendido (Até 15 Coletores)',
    valor: 1290.0,
    descricao: 'Pacote mais vendido para contratos de saneamento com roteirização e fotos em alta escala.',
    limiteAparelhos: 15,
    popular: true,
  },
  {
    id: 'enterprise',
    planoId: 'ENTERPRISE',
    titulo: 'AquaSane Enterprise Operacional',
    subtitulo: 'Grande Porte (Até 50 Coletores)',
    valor: 2890.0,
    descricao: 'Infraestrutura completa para consórcios com múltiplos contratos, sincronização e suporte prioritário.',
    limiteAparelhos: 50,
  },
];

/**
 * Gera o link de pagamento direto para vendas online
 */
export function gerarLinkVendaOnline(params: {
  planoId: 'STARTER' | 'PRO' | 'ENTERPRISE' | 'PERSONALIZADO';
  valor: number;
  clienteNome?: string;
  titulo?: string;
  faturaId?: string;
}): {
  url: string;
  faturaId: string;
  pixCopiaECola: string;
  chavePix: string;
  titular: string;
} {
  const baseUrl = getBaseAppUrl();
  const faturaId =
    params.faturaId || `FAT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const chavePix = PIX_OFICIAL_CONFIG.chave;
  const titular = PIX_OFICIAL_CONFIG.titular;

  const searchParams = new URLSearchParams({
    checkout: 'true',
    fatura: faturaId,
    plano: params.planoId,
    valor: params.valor.toFixed(2),
    chave: chavePix,
  });

  if (params.clienteNome && params.clienteNome.trim()) {
    searchParams.set('cliente', params.clienteNome.trim());
  }

  if (params.titulo && params.titulo.trim()) {
    searchParams.set('titulo', params.titulo.trim());
  }

  const url = `${baseUrl}/?${searchParams.toString()}`;

  const pixCopiaECola = gerarPixCopiaEColaEMV({
    chave: chavePix,
    titular,
    cidade: PIX_OFICIAL_CONFIG.cidade,
    valor: params.valor,
    txid: faturaId.replace(/[^A-Za-z0-9]/g, '').slice(0, 25),
    descricao: (params.titulo || 'AquaSane Pro').slice(0, 20),
  });

  return {
    url,
    faturaId,
    pixCopiaECola,
    chavePix,
    titular,
  };
}

/**
 * Gera mensagem formatada para envio no WhatsApp do cliente
 */
export function gerarTextoWhatsAppVenda(dados: {
  clienteNome?: string;
  titulo: string;
  valor: number;
  url: string;
  pixCopiaECola: string;
  faturaId: string;
}): string {
  const nome = dados.clienteNome ? `Olá, ${dados.clienteNome}!` : 'Olá!';
  return (
    `${nome}\n\n` +
    `Segue o *Link de Pagamento Oficial via PIX* para contratação do *${dados.titulo}*:\n\n` +
    `💰 *Valor:* R$ ${dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
    `📄 *Fatura:* #${dados.faturaId}\n` +
    `👤 *Favorecido:* ${PIX_OFICIAL_CONFIG.titular}\n` +
    `🔑 *Chave PIX (E-mail Oficial):* ${PIX_OFICIAL_CONFIG.chave}\n\n` +
    `🔗 *Clique para acessar a tela de pagamento e QR Code:* \n${dados.url}\n\n` +
    `📲 *Ou copie o código PIX Copia e Cola abaixo:*\n` +
    `\`${dados.pixCopiaECola}\`\n\n` +
    `Após o pagamento, envie o comprovante para este WhatsApp para ativação imediata do seu sistema!`
  );
}
