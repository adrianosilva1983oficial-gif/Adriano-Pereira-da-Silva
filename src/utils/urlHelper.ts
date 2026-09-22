/**
 * Utilitário Central de Resolução de URLs para AquaSane Pro
 * 
 * Garante que os links e QR Codes gerados funcionem de forma 100% confiável:
 * 1. Usa o domínio ativo atual (window.location.origin) que está no ar e respondendo
 * 2. Disponibiliza o link compartilhado (ais-pre-) caso o usuário utilize o botão Share
 * 3. Garante que os links para Android usem '?modo=apk_mobile' sem disparar downloads
 *    automáticos que são bloqueados pelo Chrome no Android
 */

export const DEV_RUN_ORIGIN = 'https://ais-dev-ngtjzalhi77e43bxamfamp-530667778944.us-west2.run.app';
export const SHARED_RUN_ORIGIN = 'https://ais-pre-ngtjzalhi77e43bxamfamp-530667778944.us-west2.run.app';

/**
 * Retorna a URL base ativa onde a aplicação está de fato rodando e respondendo.
 */
export function getActiveLiveUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
  }
  return DEV_RUN_ORIGIN;
}

/**
 * Retorna a URL pública de compartilhamento (ativada ao clicar em 'Share' no topo do AI Studio).
 */
export function getSharedLiveUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    const origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-');
    }
  }
  return SHARED_RUN_ORIGIN;
}

/**
 * Retorna a URL pública para uso padrão (usa a URL ativa garantindo que nunca dê 404)
 */
export function getPublicLiveUrl(): string {
  return getActiveLiveUrl();
}

/**
 * Link do Sistema Web para o cliente abrir no computador e criar seu login
 */
export function getLinkWebCliente(baseUrl?: string): string {
  const base = baseUrl || getActiveLiveUrl();
  return `${base}/?modo=web&cadastro=cliente`;
}

/**
 * Link do APK Mobile para abrir no celular Android e carregar o sistema móvel fluido
 * SEM disparar download forçado no onload (evita bloqueio no Android Chrome)
 */
export function getLinkApkMobile(baseUrl?: string): string {
  const base = baseUrl || getActiveLiveUrl();
  return `${base}/?modo=apk_mobile`;
}

/**
 * Link com parâmetro voluntário para download do pacote APK
 */
export function getLinkApkDownloadDireto(baseUrl?: string): string {
  const base = baseUrl || getActiveLiveUrl();
  return `${base}/?modo=apk_mobile&download_apk=true`;
}
