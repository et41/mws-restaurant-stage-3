/**
 * IndexedDB.
 */
initIDB = () => {
  if(!('indexedDB' in window)) {
     console.log('This browser doesnt support idb');
  }
  return idb.open('restaurant-app', 2, function(upgradeDb) {
    switch (upgradeDb.oldVersion) {
      case 0:
        console.log('Creating the restaurants object store');
        upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
      case 1:
        console.log('Creating the reviews object store');
        upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
      case 2:
        console.log('Creating restaurant id index');
        var store = upgradeDb.transaction.objectStore('reviews');
        store.createIndex('restaurant_id', 'restaurant_id');
      }
  });
}
/**
 * Common database helper functions.
 */
let res = {};
console.log('db helper');
class DBHelper {

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
  console.log('FETCH RESTAURANT!!!!');

  initIDB().then(function(db) {
  if(!db) return;
  var tx = db.transaction('restaurants', 'readwrite');
  var store = tx.objectStore('restaurants');
  store.getAll().then(items => {

    if(items.length > 0) {
      console.log('get data from db!!',items);
      res.restaurants = items;
      const restaurants = res.restaurants;
      //console.log('ressss:',items);
      callback(null, restaurants);
    }else {
      console.log('get data from server!!');
      fetch(`http://localhost:1337/restaurants`).then(response => {
      return response.json();
      }).then(response => {

      res.restaurants = response;
      const restaurants = res.restaurants;
      console.log('rrestaurant in fetch event : ', restaurants);
      var tx = db.transaction('restaurants', 'readwrite');
      var store = tx.objectStore('restaurants');
      restaurants.forEach((item) => {
        console.log('Adding item', item);
        store.put(item);
      })
      store.getAll().then(data => {
        console.log('data',data);
        callback(null, restaurants);
      })
    }).catch(error => {
      callback(error, null);
    });
    }
  })
});


  }
/*return dbPromise.then(function(db) {
  var tx = db.transaction('products', 'readonly');
  var store = tx.objectStore('products');
  var index = store.index('name');
  return index.get(key);
});*/
static fetchReviews(id, callback)  {//http://localhost:1337/reviews/?restaurant_id=<restaurant_id>

initIDB().then(db =>  {

  console.log('initDB fetchReviews',db,id);

  if(!db) return;

  var tx = db.transaction('reviews', 'readwrite');
  var store = tx.objectStore('reviews');
  var index = store.index('restaurant_id');
  //console.log('index......', index.get(key));

  let num = Number(id);
  index.getAll(num).then(items => {
    console.log('get data from fetchdb before i!!',items.restaurant_id);

    if(items.length > 0 ) {
     items.filter((e) => {
      console.log('e.restaurant_id',e.restaurant_id);
        if(e.restaurant_id == num) {
          return e;
        }
      });
      console.log('get data from fetchdb!!',items);
      self.restaurant.reviews = items;
      callback(null, self.restaurant.reviews);

    }else {

      console.log('get data from server!!');
      return fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`).then(response => {

         return response.json();

          }).then(response => {
            console.log('response in fetch reviews by id', response );
            var tx_review = db.transaction('reviews', 'readwrite');
            var store_review = tx_review.objectStore('reviews');

            response.forEach((item) => {
            //console.log('Adding item', item);
              store_review.put(item);

            });

            self.restaurant.reviews = response;
            callback(null, self.restaurant.reviews);
          });

    }


  });


  });
}
  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    console.log('restaurant in image url', restaurant);
    return (`/img/${restaurant.photograph}`);
  }


  /*
    "reviews": [{
        "name": "Steve",
        "date": "October 26, 2016",
        "rating": 4,
        "comments": "Mission Chinese Food has grown up from its scrappy Orchard Street days into a big, two story restaurant equipped with a pizza oven, a prime rib cart, and a much broader menu. Yes, it still has all the hits — the kung pao pastrami, the thrice cooked bacon —but chef/proprietor Danny Bowien and executive chef Angela Dimayuga have also added a raw bar, two generous family-style set menus, and showstoppers like duck baked in clay. And you can still get a lot of food without breaking the bank."
      },
      {
        "name": "Morgan",
        "date": "October 26, 2016",
        "rating": 4,
        "comments": "This place is a blast. Must orders: GREEN TEA NOODS, sounds gross (to me at least) but these were incredible!, Kung pao pastrami (but you already knew that), beef tartare was a fun appetizer that we decided to try, the spicy ma po tofu SUPER spicy but delicous, egg rolls and scallion pancake i could have passed on... I wish we would have gone with a larger group, so much more I would have liked to try!"
      },
      {
        "name": "Jason",
        "date": "October 26, 2016",
        "rating": 3,
        "comments": "I was VERY excited to come here after seeing and hearing so many good things about this place. Having read much, I knew going into it that it was not going to be authentic Chinese. The place was edgy, had a punk rock throwback attitude, and generally delivered the desired atmosphere. Things went downhill from there though. The food was okay at best and the best qualities were easily overshadowed by what I believe to be poor decisions by the kitchen staff."
      }
    ]
  }



  */

}

/**
 * Service worker registeration.
 */
if (!('serviceWorker' in navigator)) {
  console.log('Service worker not supported');
}
navigator.serviceWorker.register('/sw.js').then(function(reg) {
 // console.log('Registered', reg);
}).catch(function(error) {
  console.log('Registration failed:', error);
});
