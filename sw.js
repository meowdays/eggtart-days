const CACHE_NAME = 'eggtart-days-v3';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './assets/logo.webp', './icons/icon-192.png', './icons/icon-512.png', './icons/favicon-32.png', './icons/favicon-48.png', './icons/favicon.ico'];
self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    // Wait until the user taps the in-app update button before activating a new release.
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('eggtart-days-') && key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if(event.data && event.data.type==='SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=='GET' || url.origin!==self.location.origin) return;
  // HTML: network-first so new app code is picked up; cached copy is an offline fallback.
  if(request.mode==='navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      try{
        const fresh=await fetch(request,{cache:'no-store'});
        if(fresh && fresh.ok) cache.put(request,fresh.clone());
        return fresh;
      }catch(error){return (await cache.match(request)) || (await cache.match('./index.html'));}
    })());
    return;
  }
  // Versioned static assets: cache-first, with network fallback.
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    const response=await fetch(request);
    if(response && response.ok){const cache=await caches.open(CACHE_NAME);cache.put(request,response.clone());}
    return response;
  })());
});
