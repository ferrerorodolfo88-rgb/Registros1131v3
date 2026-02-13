// Service Worker para Inspección 1131 con Firebase
const CACHE_NAME = 'insp1131-firebase-v5.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Instalación
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Caché abierta');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('❌ Error al abrir caché:', err);
      })
  );
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', event => {
  console.log('🔧 Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch - Estrategia Network First para Firebase, Cache First para assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Network First para Firebase y API calls
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('firebaseio') || 
      url.hostname.includes('googleapis')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          return response;
        })
        .catch(() => {
          // Si falla la red, mostrar mensaje offline
          return new Response(
            JSON.stringify({ error: 'Sin conexión a Firebase' }),
            { 
              headers: { 'Content-Type': 'application/json' },
              status: 503
            }
          );
        })
    );
    return;
  }

  // Cache First para todo lo demás
  event.respondWith(
    caches.match(request)
      .then(response => {
        // Cache hit - devolver respuesta
        if (response) {
          return response;
        }
        
        return fetch(request).then(response => {
          // Verificar si recibimos una respuesta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clonar la respuesta
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // Si falla todo, mostrar página offline
        return new Response(
          `<!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sin conexión - Inspección 1131</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #004582, #003366);
                color: white;
                text-align: center;
                padding: 20px;
              }
              .container {
                max-width: 400px;
              }
              h1 {
                font-size: 48px;
                margin-bottom: 20px;
              }
              p {
                font-size: 18px;
                margin-bottom: 30px;
                opacity: 0.9;
              }
              button {
                background: white;
                color: #004582;
                border: none;
                padding: 15px 30px;
                font-size: 16px;
                font-weight: bold;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s;
              }
              button:hover {
                transform: scale(1.05);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>📡</h1>
              <h2>Sin conexión</h2>
              <p>No se puede acceder a la aplicación sin conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.</p>
              <button onclick="location.reload()">Reintentar</button>
            </div>
          </body>
          </html>`,
          { 
            headers: { 'Content-Type': 'text/html' },
            status: 503
          }
        );
      })
  );
});

// Mensaje de sincronización de fondo (opcional para futuras mejoras)
self.addEventListener('sync', event => {
  console.log('🔄 Background Sync:', event.tag);
  if (event.tag === 'sync-registros') {
    event.waitUntil(syncRegistros());
  }
});

async function syncRegistros() {
  // Placeholder para sincronización futura
  console.log('📤 Sincronizando registros con Firebase...');
  return Promise.resolve();
}

console.log('✅ Service Worker cargado - Inspección 1131 Firebase v5.0');
