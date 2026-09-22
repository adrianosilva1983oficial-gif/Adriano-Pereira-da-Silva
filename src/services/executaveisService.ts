import JSZip from 'jszip';
import { generateAndroidAPKPackage, generateAppleMobileConfigString, generateStandaloneInstallerHtmlString } from './apkPackageService';

export interface ExecutavelInfo {
  id: 'master' | 'cliente' | 'mobile';
  titulo: 'Web Master' | 'Web Cliente (ERP & Planilhas)' | 'Aplicativo Mobile';
  subtitulo: string;
  publico: string;
  arquivoPrincipal: string;
  tipoArquivo: string;
  descricao: string;
  itensInclusos: string[];
}

export const LISTA_EXECUTAVEIS: ExecutavelInfo[] = [
  {
    id: 'master',
    titulo: 'Web Master',
    subtitulo: 'Painel de Controle Restrito (Adriano Silva)',
    publico: 'Uso Restrito Meu (Proprietário / Super Admin)',
    arquivoPrincipal: 'Instalador_AquaSane_WebMaster.bat',
    tipoArquivo: 'Instalador Desktop Windows (.bat / .zip) + Desktop Standalone',
    descricao: 'Gestão global de clientes e bases, liberação de licenças por IMEI, gerador PIX de vendas online, banco de dados global e auditoria master.',
    itensInclusos: [
      'Instalador Desktop Windows (cria atalho na Área de Trabalho em janela nativa)',
      'Acesso restrito ao Painel Master de Licenças e Dispositivos Celulares',
      'Gerenciador Multi-Tenant de Clientes & Empresas Contratantes',
      'Gerador de Links de Pagamento PIX Oficial (adrianosilva1983oficial@gmail.com)',
      'Gerenciador de Banco de Dados Global com Particionamento Isolado',
      'Auditoria de Faturamento e Trava de Inadimplência (> 5 dias)',
    ],
  },
  {
    id: 'cliente',
    titulo: 'Web Cliente (ERP & Planilhas)',
    subtitulo: 'Portal de Gestão Operacional, ERP, Planilhas & Relatórios',
    publico: 'Empresas Contratantes, Coordenadores, Gestores e Engenheiros',
    arquivoPrincipal: 'Instalador_AquaSane_WebCliente_ERP.bat',
    tipoArquivo: 'Instalador Desktop Windows (.bat / .zip) para Estações de Trabalho',
    descricao: 'Inserção de dados do sistema ERP (empresa, setores, cargos, viaturas, equipes), importação de planilhas de 111k a 1.5M matrículas e relatórios executivos.',
    itensInclusos: [
      'Instalador Desktop Windows para computadores da empresa contratante',
      'Módulo ERP Completo: Cadastro da Empresa, Setores, Cargos, Viaturas e Equipes',
      'Motor de Importação de Planilhas Excel/CSV (111.000 a 1.500.000 matrículas)',
      'Programador de Rotas Porta a Porta por Ordem Estrita da Planilha',
      'Central de Relatórios Gerenciais (Produtividade dos Cadastristas e Supervisão)',
      'Validação Prévia de Dados para Envio à Concessionária (Embasa)',
      'Mapa Cartográfico GIS com Localização das Ligações e Hidrômetros',
      'Módulo de Negociação Comercial de Débitos e Ouvidoria de Obras',
    ],
  },
  {
    id: 'mobile',
    titulo: 'Aplicativo Mobile',
    subtitulo: 'App de Coleta em Campo 100% Offline para Cadastristas',
    publico: 'Cadastristas e Fiscais de Campo Porta a Porta (Android & iOS)',
    arquivoPrincipal: 'AquaSane_Mobile_Campo.apk',
    tipoArquivo: 'Pacote APK Android + Instalador 2 Cliques + iOS Profile',
    descricao: 'Aplicativo móvel de alta performance para execução de ordens de serviço, fotos em HD com geolocalização e funcionamento 100% offline.',
    itensInclusos: [
      'Arquivo APK direto instalável no Android (AquaSane_Mobile_Campo.apk)',
      'Instalador Instantâneo de 2 Cliques (WebAPK autônomo offline)',
      'Perfil de Configuração Apple iOS (.mobileconfig) para iPhone/iPad',
      'Roteirizador de O.S. com sequenciamento estrito porta a porta',
      'Formulário ágil de Censo com fotos do hidrômetro e fachada',
      'Banco de dados local persistente (IndexedDB) para operação sem 4G',
      'Validação de segurança e bloqueio por IMEI/chave de ativação',
    ],
  },
];

/**
 * Gera o script instalador em lote (.bat) para Windows Desktop.
 * Cria um atalho direto na Área de Trabalho e no Menu Iniciar do Windows
 * que executa a aplicação em modo janela nativa (app standalone), sem barra de endereços.
 */
function gerarScriptInstaladorWindowsBat(urlDestino: string, nomeApp: string, descricaoApp: string): string {
  return `@echo off
chcp 65001 > nul
title Instalador ${nomeApp} - Desktop
color 0B

echo ======================================================================
echo                AQUASANE PRO - INSTALADOR DESKTOP NATIVO
echo ======================================================================
echo  Aplicacao: ${nomeApp}
echo  Descricao: ${descricaoApp}
echo ======================================================================
echo.
echo [1/3] Verificando navegadores compativeis no Windows...

set BROWSER_CMD=""
set BROWSER_NAME=""

REM Procura Google Chrome
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    set BROWSER_CMD="%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
    set BROWSER_NAME="Google Chrome"
    goto BROWSER_FOUND
)
if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    set BROWSER_CMD="%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
    set BROWSER_NAME="Google Chrome"
    goto BROWSER_FOUND
)
if exist "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" (
    set BROWSER_CMD="%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
    set BROWSER_NAME="Google Chrome"
    goto BROWSER_FOUND
)

REM Procura Microsoft Edge (padrao no Windows 10 e 11)
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set BROWSER_CMD="%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
    set BROWSER_NAME="Microsoft Edge"
    goto BROWSER_FOUND
)
if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set BROWSER_CMD="%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"
    set BROWSER_NAME="Microsoft Edge"
    goto BROWSER_FOUND
)

:BROWSER_FOUND
if %BROWSER_CMD%=="" (
    echo [AVISO] Navegador com suporte a modo janela nao localizado diretamente.
    echo Usando o navegador padrao do Windows...
    start "" "${urlDestino}"
    goto FINALIZAR
)

echo [OK] Motor de execucao localizado: %BROWSER_NAME%
echo.
echo [2/3] Criando atalho nativo na Area de Trabalho do Windows...

set SHORTCUT_PATH=%USERPROFILE%\\Desktop\\${nomeApp}.lnk
set VBS_SCRIPT=%TEMP%\\create_shortcut_%RANDOM%.vbs

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = "%SHORTCUT_PATH%" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = %BROWSER_CMD% >> "%VBS_SCRIPT%"
echo oLink.Arguments = "--app=${urlDestino} --window-size=1366,768" >> "%VBS_SCRIPT%"
echo oLink.Description = "${descricaoApp}" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"

cscript //nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%" > nul 2>&1

echo [OK] Atalho criado na sua Area de Trabalho:
echo      "%SHORTCUT_PATH%"
echo.
echo [3/3] Inicializando ${nomeApp} em modo janela executavel...
start "" %BROWSER_CMD% --app="${urlDestino}" --window-size=1366,768

:FINALIZAR
echo.
echo ======================================================================
echo    INSTALACAO CONCLUIDA COM SUCESSO!
echo    Agora voce pode abrir o sistema com 1 duplo-clique na Area de Trabalho.
echo ======================================================================
echo Pressione qualquer tecla para fechar esta janela...
pause > nul
`;
}

/**
 * Gera um arquivo HTML executável autônomo com interface dedicada para o launcher desktop
 */
function gerarLauncherHtmlStandalone(urlDestino: string, titulo: string, badge: string, descricao: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo} - AquaSane Pro</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background: #090d16; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 28px; max-width: 520px; width: 100%; padding: 40px; text-align: center; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.6); }
    .logo { width: 80px; height: 80px; border-radius: 22px; background: linear-gradient(135deg, #0284c7, #4338ca); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 38px; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.4); }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 999px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 11px; font-weight: 800; border: 1px solid rgba(56, 189, 248, 0.3); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    h1 { font-size: 24px; font-weight: 900; margin-bottom: 8px; color: #ffffff; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 18px; border-radius: 16px; background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; font-weight: 800; font-size: 16px; text-decoration: none; transition: all 0.2s; border: none; cursor: pointer; box-shadow: 0 6px 20px rgba(2, 132, 199, 0.4); margin-bottom: 14px; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(2, 132, 199, 0.5); }
    .info { font-size: 12px; color: #64748b; margin-top: 20px; text-align: left; background: #090d16; padding: 16px; border-radius: 16px; border: 1px solid #1e293b; line-height: 1.5; }
    .info strong { color: #cbd5e1; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">⚡</div>
    <span class="badge">${badge}</span>
    <h1>${titulo}</h1>
    <p>${descricao}</p>
    
    <a href="${urlDestino}" class="btn" id="btnAbrir">
      <span>🚀 Abrir Aplicativo Agora</span>
    </a>

    <div class="info">
      <strong>💡 Dica de Instalação:</strong><br>
      Para transformar em um aplicativo nativo no computador ou celular, clique no ícone de <strong>Instalar</strong> na barra superior do navegador após abrir. O sistema funcionará com janela exclusiva e banco de dados offline.
    </div>
  </div>

  <script>
    // Se o usuário clicar, redireciona instantaneamente
    document.getElementById('btnAbrir').addEventListener('click', function(e) {
      window.location.href = "${urlDestino}";
    });
  </script>
</body>
</html>`;
}

/**
 * 1. GERA PACOTE EXECUTÁVEL DO WEB MASTER (Uso Restrito - Adriano Silva)
 */
export async function downloadExecutavelWebMaster(baseUrl: string): Promise<void> {
  const urlMaster = `${baseUrl}/?versao=master`;
  const batScript = gerarScriptInstaladorWindowsBat(
    urlMaster,
    'AquaSane Pro - Web Master',
    'Painel de Controle Restrito - Adriano Silva'
  );
  const launcherHtml = gerarLauncherHtmlStandalone(
    urlMaster,
    'AquaSane Pro — Web Master',
    'Módulo Master Restrito',
    'Painel restrito de controle global, licenciamento de aparelhos, gerador de pagamentos PIX e gestão multi-tenant de clientes.'
  );

  const zip = new JSZip();
  zip.file('Instalar_AquaSane_WebMaster.bat', batScript);
  zip.file('AquaSane_WebMaster_Launcher.html', launcherHtml);
  zip.file(
    'LEIAME_INSTRUCOES_MASTER.txt',
    `=====================================================================
AQUASANE PRO - MODULO WEB MASTER (USO RESTRITO)
Titular / Super Admin: Adriano Silva (adrianosilva1983oficial@gmail.com)
=====================================================================

COMO INSTALAR NO WINDOWS:
1. Extraia este arquivo ZIP em qualquer pasta do seu computador.
2. De um duplo-clique no arquivo: "Instalar_AquaSane_WebMaster.bat"
3. O instalador criara automaticamente um atalho na sua Area de Trabalho 
   ("AquaSane Pro - Web Master.lnk") e abrira o sistema em modo janela nativa.

FUNCIONALIDADES DO WEB MASTER:
- Gestao de Clientes, Contratos e Empresas Contratantes
- Liberacao e Controle de Dispositivos Celulares por IMEI / Chave
- Gerador de Links de Pagamento PIX Oficial para Vendas Online
- Banco de Dados Global com particionamento isolado
- Gestao de Inadimplencia com Bloqueio Automatico apos 5 dias

Link Direto de Acesso:
${urlMaster}
`
  );

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'Instalador_AquaSane_WebMaster_Setup.zip';
  a.click();
  URL.revokeObjectURL(downloadUrl);
}

/**
 * 2. GERA PACOTE EXECUTÁVEL DO WEB CLIENTE (ERP, Planilhas & Relatórios)
 */
export async function downloadExecutavelWebCliente(baseUrl: string): Promise<void> {
  const urlCliente = `${baseUrl}/?versao=cliente`;
  const batScript = gerarScriptInstaladorWindowsBat(
    urlCliente,
    'AquaSane Pro - Web Cliente ERP',
    'Portal de Gestao Operacional, Planilhas e Relatorios'
  );
  const launcherHtml = gerarLauncherHtmlStandalone(
    urlCliente,
    'AquaSane Pro — Web Cliente ERP',
    'Módulo Cliente & ERP',
    'Portal para gestão operacional, cadastro de setores, equipes e viaturas, upload de planilhas de 111k a 1.5M matrículas e relatórios executivos.'
  );

  const zip = new JSZip();
  zip.file('Instalar_AquaSane_WebCliente_ERP.bat', batScript);
  zip.file('AquaSane_WebCliente_ERP_Launcher.html', launcherHtml);
  zip.file(
    'GUIA_INSTALACAO_CLIENTE_ERP.txt',
    `=====================================================================
AQUASANE PRO - MODULO WEB CLIENTE (GESTAO ERP, PLANILHAS & RELATORIOS)
Ambiente Operacional das Concessionarias e Prestadoras de Servico
=====================================================================

COMO INSTALAR NAS ESTACOES DE TRABALHO DA EMPRESA:
1. Extraia o conteudo deste arquivo ZIP no computador de escritorio.
2. Execute o arquivo: "Instalar_AquaSane_WebCliente_ERP.bat"
3. O atalho "AquaSane Pro - Web Cliente ERP" sera criado na Area de Trabalho 
   e o sistema sera iniciado em janela independente.

FUNCIONALIDADES DO WEB CLIENTE:
- Sistema ERP: Cadastro da Empresa, Setores, Cargos, Viaturas e Equipes
- Importacao Massiva de Planilhas Excel/CSV (111.000 a 1.500.000 matriculas)
- Sequenciador de Rotas Porta a Porta por Ordem Estrita da Planilha
- Relatorios Gerenciais de Produtividade dos Cadastristas e Supervisao
- Validacao Previa de Dados antes do Envio a Concessionaria (Embasa)
- Mapa Cartografico GIS e Negociacoes Comerciais

Link Direto de Acesso:
${urlCliente}
`
  );

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'Instalador_AquaSane_WebCliente_ERP_Setup.zip';
  a.click();
  URL.revokeObjectURL(downloadUrl);
}

/**
 * 3. GERA PACOTE EXECUTÁVEL DO APLICATIVO MOBILE (Campo / Cadastristas)
 */
export async function downloadExecutavelMobile(baseUrl: string): Promise<void> {
  const urlMobile = `${baseUrl}/?versao=mobile`;
  
  // Gera pacote APK completo
  const zip = await generateAndroidAPKPackage(urlMobile);
  const downloadUrl = URL.createObjectURL(zip);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'AquaSane_Mobile_Campo_APK_Setup.zip';
  a.click();
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Download direto do arquivo .bat individual para instalação direta sem extrair ZIP
 */
export function downloadBatDireto(id: 'master' | 'cliente', baseUrl: string): void {
  const url = `${baseUrl}/?versao=${id}`;
  const titulo = id === 'master' ? 'AquaSane Pro - Web Master' : 'AquaSane Pro - Web Cliente ERP';
  const desc = id === 'master' ? 'Painel de Controle Restrito - Adriano Silva' : 'Portal de Gestao Operacional e ERP';
  const batContent = gerarScriptInstaladorWindowsBat(url, titulo, desc);
  const blob = new Blob([batContent], { type: 'application/x-bat' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = id === 'master' ? 'Instalar_AquaSane_WebMaster.bat' : 'Instalar_AquaSane_WebCliente_ERP.bat';
  a.click();
  URL.revokeObjectURL(downloadUrl);
}
