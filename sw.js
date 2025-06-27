// sw.js

const CACHE_NAME = 'finance-app-cache-v1';
const urlsToCache = [
    // Essenciais para o App Shell
    './', // O próprio diretório, para servir o index.html
    './index.html', // O arquivo HTML principal
    './manifest.json', // O manifesto da aplicação

    // Ícones (você precisará criá-los - veja o Passo 2)
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',

    // Arquivos CSS e JS de CDNs (serão cacheados na primeira visita)
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js'
];

// Evento de Instalação: Salva o App Shell no cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto');
                // Adicionar URLs essenciais que podem falhar, mas não bloquear a instalação
                const essentialRequests = urlsToCache.map(url => new Request(url, { cache: 'reload' }));
                return cache.addAll(essentialRequests).catch(error => {
                    console.warn('Falha ao armazenar em cache alguns recursos essenciais durante a instalação:', error);
                });
            })
    );
});

// Evento Fetch: Intercepta requisições e serve do cache ou da rede
self.addEventListener('fetch', event => {
    // Ignora requisições que não são GET
    if (event.request.method !== 'GET') {
        return;
    }

    // Estratégia: Stale-While-Revalidate
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                // Tenta buscar da rede para atualizar o cache
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    // Se a requisição for bem-sucedida, atualiza o cache
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(error => {
                    console.error('Fetch falhou; o usuário pode estar offline.', error);
                    // Se a busca falhar e não houver cache, você poderia retornar uma página offline genérica aqui.
                });

                // Retorna a resposta do cache imediatamente (se existir), enquanto a busca de rede acontece em segundo plano.
                // Se não houver cache, aguarda a resposta da rede.
                return cachedResponse || fetchPromise;
            });
        })
    );
});

// Evento de Ativação: Limpa caches antigos
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deletando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
