
self.addEventListener('install', (event) => {
 event.waitUntil(
   caches.open('restaurant').then((cache) => {
     return cache.addAll([
       '/',
       '/index.html',
      // '/restaurant.html',
       '/css/main-aux.css',
       '/css/main.css',
       '/css/restaurant.css',
       'dist/js/uglify_restaurant.js',
        'dist/js/uglify.js',

       /*'dist/js/restaurant_info.js',
       'dist/js/dbhelper.js',*/
       //'/restaurants',
       '/images/'
     ]).then(() => {
      console.log('All Files are cached');
      return self.skipWaiting();
     }).catch((error) => {
      console.log('Failed to cache', error);
     })
   })
 );
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
});


self.addEventListener('fetch', (event) => {
  console.log('event in sw', event.request.url);
  if(event.request.method != 'POST' && event.request.method != 'PUT'
    && !event.request.url.includes('/reviews')  && !event.request.url.includes('/restaurants') && !event.request.url.includes('/browser-sync')) {
  event.respondWith(
    caches.open('/restaurant').then((cache) => {
      return cache.match(event.request).then((response) => {
        //  console.log('cache match', response);
        return response || fetch(event.request).then((response) => {
          console.log('fetch to cache', response);
         // if(!response.url.includes('/restaurant') ) {
         //   console.log('in if fetch to cache', response);
            cache.put(event.request, response.clone());
            return response;
         // }else {
         //   return response;
        //  }
        });
      });
    })
  );
}
else {
  console.log('it is a POST method');
}
});

