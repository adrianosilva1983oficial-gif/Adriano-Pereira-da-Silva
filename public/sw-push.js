/**
 * AquaSane Pro - Service Worker Push Notification Handler
 * Suporta Notificações Push em Segundo Plano (Background Push) para equipes de campo
 * e alertas urgentes emitidos pela central de supervisão PGCSA / EMBASA.
 */

// Listener para eventos de PUSH recebidos pela rede ou acionados pelo navegador
self.addEventListener('push', (event) => {
  console.log('[SW Push] Evento de Push recebido:', event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const titulo = data.title || data.titulo || '🚨 ALERTA URGENTE DE SUPERVISÃO';
  const corpo = data.body || data.mensagem || 'Chamado prioritário da coordenação para sua equipe de campo.';
  const icone = data.icon || '/pwa-192x192.png';
  const badge = data.badge || '/pwa-192x192.png';
  const tag = data.tag || `aquasane-urgente-${data.id || Date.now()}`;
  const urlDestino = data.url || data.link || '/';
  const nivelUrgencia = data.nivelUrgencia || 'CRITICA';
  const equipeDestino = data.equipeDestino || 'TODAS';
  const remetente = data.remetente || 'Supervisão Central EMBASA / UML Cabula';
  const tipo = data.tipo || 'GERAL';

  const notificationOptions = {
    body: corpo,
    icon: icone,
    badge: badge,
    tag: tag,
    renotify: true,
    requireInteraction: true, // Mantém a notificação na tela/lockscreen até o técnico interagir
    silent: false,
    vibrate: [300, 100, 300, 100, 400], // Pulso tático de emergência para técnicos em campo
    timestamp: Date.now(),
    data: {
      url: urlDestino,
      id: data.id || `push-${Date.now()}`,
      tipo: tipo,
      nivelUrgencia: nivelUrgencia,
      equipeDestino: equipeDestino,
      remetente: remetente,
      matriculaVinculada: data.matriculaVinculada,
      timestamp: Date.now(),
    },
    actions: [
      {
        action: 'abrir_alerta',
        title: '📲 Ver no App',
      },
      {
        action: 'confirmar_ciente',
        title: '✅ Estou Ciente',
      },
    ],
  };

  event.waitUntil(
    Promise.all([
      // Exibe a notificação nativa no sistema operacional / Android
      self.registration.showNotification(titulo, notificationOptions),
      // Propaga mensagem para qualquer aba ou janela aberta do app (foreground)
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PUSH_ALERTA_RECEBIDO',
            alerta: {
              id: data.id || `push-${Date.now()}`,
              titulo: titulo,
              mensagem: corpo,
              tipo: tipo,
              nivelUrgencia: nivelUrgencia,
              equipeDestino: equipeDestino,
              remetente: remetente,
              matriculaVinculada: data.matriculaVinculada,
              dataHora: new Date().toISOString(),
            },
          });
        });
      }),
    ])
  );
});

// Listener para clique na notificação ou nas ações interativas
self.addEventListener('notificationclick', (event) => {
  console.log('[SW Push] Notificação clicada:', event.action, event.notification);
  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;
  const targetUrl = notificationData.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se houver uma janela do app já aberta, foca nela e envia o evento de clique
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'PUSH_NOTIFICATION_ACTION',
            action: action || 'abrir_alerta',
            alerta: notificationData,
          });
          return;
        }
      }

      // Se o app estava fechado em segundo plano, abre a janela no link de destino
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Listener para mensagens enviadas pela aplicação para o Service Worker
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Disparo direto de notificação pelo Service Worker (usado pela supervisão e simulações locais)
  if (event.data.type === 'DISPARAR_ALERTA_PUSH_SW') {
    const payload = event.data.payload || {};
    const titulo = payload.titulo || '🚨 ALERTA URGENTE DE SUPERVISÃO';
    const corpo = payload.mensagem || 'Chamado prioritário da coordenação para sua equipe de campo.';
    const options = {
      body: corpo,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.id || `aquasane-urgente-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 400],
      data: payload,
      actions: [
        { action: 'abrir_alerta', title: '📲 Ver no App' },
        { action: 'confirmar_ciente', title: '✅ Estou Ciente' },
      ],
    };

    self.registration.showNotification(titulo, options);
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
