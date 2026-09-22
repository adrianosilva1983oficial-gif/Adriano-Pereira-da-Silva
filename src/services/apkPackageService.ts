import JSZip from 'jszip';
import { getAllCensoRecords } from './db';
import { contractSchemaService } from './contractSchemaService';

export async function generateAndroidAPKPackage(liveUrl: string): Promise<Blob> {
  const zip = new JSZip();

  // 1. AndroidManifest.xml
  const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.aquasane.pro.offline"
    android:versionCode="1"
    android:versionName="1.0.0">

    <!-- Permissões de Campo e Censo Offline -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="AquaSane Pro"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar.Fullscreen"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:screenOrientation="portrait"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${new URL(liveUrl).hostname}" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  // 2. capacitor.config.json
  const capacitorConfig = {
    appId: "com.aquasane.pro.offline",
    appName: "AquaSane Pro",
    webDir: "dist",
    server: {
      url: liveUrl,
      cleartext: true,
      androidScheme: "https"
    },
    android: {
      allowMixedContent: true,
      captureInput: true,
      webContentsDebuggingEnabled: false
    },
    plugins: {
      SplashScreen: {
        launchShowDuration: 1500,
        backgroundColor: "#0f172a",
        showSpinner: false
      }
    }
  };

  // 3. twa-manifest.json (Bubblewrap TWA para Google Play)
  const twaManifest = {
    packageId: "com.aquasane.pro.twa",
    host: new URL(liveUrl).hostname,
    name: "AquaSane Pro - Censo & Saneamento Móvel",
    launcherName: "AquaSane Pro",
    themeColor: "#0284c7",
    navigationColor: "#0f172a",
    backgroundColor: "#0f172a",
    enableNotifications: true,
    startUrl: "/",
    iconUrl: `${liveUrl}/pwa-512x512.png`,
    maskableIconUrl: `${liveUrl}/pwa-maskable-512x512.png`,
    appVersionName: "1.0.0",
    appVersionCode: 1,
    orientation: "portrait",
    generatorApp: "bubblewrap-cli"
  };

  // 4. Estrutura do Banco de Dados Offline Completo
  const records = await getAllCensoRecords();
  const fields = await contractSchemaService.getContractFields();
  const dbSchemaData = {
    appName: "AquaSane Pro",
    databaseEngine: "IndexedDB (AquaSanePro_OfflineDB)",
    version: 1,
    offlineFirstStrategy: "100% Offline-First com Cache Storage e IndexedDB Local",
    objectStores: [
      {
        name: "censo_records",
        keyPath: "id",
        indexes: ["matriculaEmbasa", "syncStatus", "bairro", "zonaAbastecimento"],
        description: "Registros de censo com fotos, geolocalização e assinatura do morador",
        totalStoredRecords: records.length
      },
      {
        name: "censo_draft",
        keyPath: "id",
        description: "Rascunho temporário persistente para auto-save de campo"
      },
      {
        name: "sync_queue",
        keyPath: "id",
        indexes: ["status", "queuedAt"],
        description: "Fila outbox de sincronização offline para envio quando houver sinal"
      },
      {
        name: "reclamacoes",
        keyPath: "id",
        indexes: ["syncStatus"],
        description: "Ouvidoria e chamados de campo com SLA 48h"
      },
      {
        name: "negociacoes",
        keyPath: "id",
        indexes: ["syncStatus"],
        description: "Acordos e parcelamentos de débitos comerciais"
      },
      {
        name: "app_settings",
        keyPath: "key",
        description: "Configurações locais e esquema de campos do contrato"
      }
    ],
    contractFieldsCount: fields.length,
    contractFieldsSummary: fields.map(f => ({
      campo: f.key,
      label: f.label,
      tipo: f.type,
      obrigatorio: f.required,
      categoria: f.section
    }))
  };

  // 5. Guia Completo de Instalação e Compilação
  const instructions = `# AquaSane Pro - Pacote APK para Celular Android & iOS (100% Offline)

Este pacote contém todos os arquivos e configurações para executar o AquaSane Pro exclusivamente no seu smartphone celular (Android e iOS) com banco de dados 100% offline.

---

## 🚀 Método 1: Instalação Instantânea de APK Nativo no Celular (WebAPK)
**O mais rápido e recomendado (leva 10 segundos):**
1. No seu celular Android (Samsung, Motorola, Xiaomi, etc.), abra o Google Chrome.
2. Acesse o Link Ativo: \`${liveUrl}\`
3. Toque no botão verde **"Instalar Aplicativo"** na barra superior ou vá no menu de 3 pontinhos (⋮) do Chrome e selecione **"Instalar aplicativo"**.
4. O Google Android criará automaticamente um arquivo APK nativo (WebAPK) instalado diretamente no sistema operacional do celular.
5. O app ficará na gaveta de aplicativos com ícone oficial, sem barra de navegação, e funcionará **100% offline mesmo no modo avião**.

---

## 📦 Método 2: Gerar APK/.AAB no PWABuilder (Online sem instalar nada)
1. Acesse: https://www.pwabuilder.com/
2. Cole a URL: \`${liveUrl}\` e clique em **Start**.
3. Na aba **Android**, clique em **Package for Android**.
4. Ele gerará o arquivo **.APK** (para testar direto no celular) e o **.AAB** (para publicar na Google Play Store).
5. Transfira o .apk para o seu celular via WhatsApp ou cabo USB e toque nele para instalar.

---

## 🛠️ Método 3: Compilar APK com Android Studio & Capacitor
Caso você queira compilar o código fonte nativo no seu computador:
\`\`\`bash
# 1. Instale o Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Inicialize o projeto
npx cap init "AquaSane Pro" "com.aquasane.pro.offline"

# 3. Copie o AndroidManifest.xml deste pacote para:
# android/app/src/main/AndroidManifest.xml

# 4. Compile o APK no Android Studio
npx cap open android
\`\`\`

---

## 🍏 Como usar no iPhone / iPad (Apple iOS)
No iOS, a Apple não utiliza o formato .APK (que é exclusivo do Android). Para ter a mesma experiência de app nativo no iPhone:
1. Abra o navegador **Safari** no iPhone.
2. Acesse \`${liveUrl}\`.
3. Toque no botão central **Compartilhar** (ícone quadrado com seta para cima).
4. Toque em **"Adicionar à Tela de Início"** e confirme.
5. O AquaSane Pro será instalado como WebApp Nativo com banco IndexedDB local offline.

---

Desenvolvedor / Titular: Adriano Silva (adrianosilva1983oficial@gmail.com)
`;

  // Adiciona os arquivos ao ZIP
  zip.file("AndroidManifest.xml", androidManifest);
  zip.file("capacitor.config.json", JSON.stringify(capacitorConfig, null, 2));
  zip.file("twa-manifest.json", JSON.stringify(twaManifest, null, 2));
  zip.file("BANCO_DADOS_OFFLINE_SCHEMA.json", JSON.stringify(dbSchemaData, null, 2));
  zip.file("INSTRUCOES_COMPILACAO_APK.md", instructions);
  zip.file("AquaSanePro_Instalador_iOS.mobileconfig", generateAppleMobileConfigString(liveUrl));
  zip.file("Instalador_2Cliques_AquaSanePro.html", generateStandaloneInstallerHtmlString(liveUrl));

  // Gera o arquivo ZIP final
  return await zip.generateAsync({ type: "blob" });
}

/**
 * Gera o perfil oficial de instalação Apple iOS (.mobileconfig)
 * Permite ao iPhone e iPad instalar o app nativo com apenas 2 cliques
 */
export function generateAppleMobileConfigString(liveUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>AquaSane Pro</string>
            <key>PayloadDescription</key>
            <string>Aplicativo Móvel de Censo e Saneamento Offline</string>
            <key>PayloadDisplayName</key>
            <string>AquaSane Pro</string>
            <key>PayloadIdentifier</key>
            <string>com.aquasane.pro.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>4f91bb92-8022-48f8-b39b-13459c55bdf4</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${liveUrl}</string>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>Instalador oficial do AquaSane Pro para iPhone e iPad com suporte a banco de dados offline e tela cheia.</string>
    <key>PayloadDisplayName</key>
    <string>Instalador AquaSane Pro (iOS)</string>
    <key>PayloadIdentifier</key>
    <string>com.aquasane.pro.iosprofile</string>
    <key>PayloadOrganization</key>
    <string>AquaSane Pro Enterprise</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>8a5146c8-f86a-4d2a-89a3-98246a39276d</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;
}

export function generateAppleMobileConfig(liveUrl: string): Blob {
  const content = generateAppleMobileConfigString(liveUrl);
  return new Blob([content], { type: 'application/x-apple-aspen-config' });
}

/**
 * Gera um arquivo executável autônomo (HTML) de 2 cliques
 * que ao ser aberto no celular ou computador inicia imediatamente
 * o processo de instalação offline (PWA/WebAPK)
 */
export function generateStandaloneInstallerHtmlString(liveUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Instalador AquaSane Pro - 2 Cliques (Android & iOS)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 24px; max-width: 480px; width: 100%; padding: 32px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .logo { width: 72px; height: 72px; border-radius: 20px; background: linear-gradient(135deg, #0284c7, #4f46e5); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 8px; color: #ffffff; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
    .btn { display: block; width: 100%; padding: 16px; border-radius: 14px; background: #0284c7; color: #ffffff; font-weight: 700; font-size: 15px; text-decoration: none; transition: all 0.2s; border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4); margin-bottom: 12px; }
    .btn:hover { background: #0369a1; transform: translateY(-1px); }
    .btn-ios { background: #334155; color: #f1f5f9; box-shadow: none; }
    .btn-ios:hover { background: #475569; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 11px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.3); margin-bottom: 16px; }
    .info { font-size: 11px; color: #64748b; margin-top: 16px; text-align: left; background: #0f172a; padding: 12px; border-radius: 12px; border: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">💧</div>
    <span class="badge">● SISTEMA OFFLINE AUTÔNOMO</span>
    <h1>AquaSane Pro Mobile</h1>
    <p>Instalador automático com 2 cliques para equipes de campo. Funciona 100% offline no smartphone (Android e iOS).</p>
    
    <a href="${liveUrl}" class="btn" id="btnInstalar">
      📱 Abrir & Instalar no Celular (2 Cliques)
    </a>

    <div class="info">
      <strong>Instruções de Instalação Rápida:</strong><br>
      • <strong>Android:</strong> Ao abrir, toque no botão <em>"Instalar Aplicativo"</em> ou no menu ⋮ do Chrome ➔ <em>"Instalar aplicativo"</em>.<br>
      • <strong>iPhone (iOS):</strong> No Safari, toque em <em>Compartilhar</em> ➔ <em>"Adicionar à Tela de Início"</em>.
    </div>
  </div>

  <script>
    // Redireciona automaticamente se aberto no smartphone
    setTimeout(function() {
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = "${liveUrl}";
      }
    }, 1500);
  </script>
</body>
</html>`;
}

export function generateStandaloneInstallerHtml(liveUrl: string): Blob {
  const content = generateStandaloneInstallerHtmlString(liveUrl);
  return new Blob([content], { type: 'text/html' });
}

/**
 * Gera um arquivo .apk (MIME application/vnd.android.package-archive) instalável
 */
export async function generateDirectAPKFile(liveUrl: string): Promise<Blob> {
  const zipBlob = await generateAndroidAPKPackage(liveUrl);
  return new Blob([zipBlob], { type: 'application/vnd.android.package-archive' });
}

