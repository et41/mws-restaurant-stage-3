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

let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []
console.log('main.js');

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  console.log('load');
  fetchNeighborhoods();
  fetchCuisines();


});


/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
    console.log('fetchNeighborhoods');

  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    console.log('fillNeighborhoodsHTML');

  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

initMap = () => {
  console.log('in init map');
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });

  addMarkersToMap();
}
/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  console.log('fetchCuisines');
  updateRestaurants();

  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
    console.log('fillCuisinesHTML');

  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

let selectedRestaurants = {};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
    console.log('updateRestaurants');

  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");

    var content = this.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  });
}
var elementCollapsable = document.getElementById('collapsible');

elementCollapsable.addEventListener('click', () => {
  initMap();
});


/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  console.log('addMarkersToMap');

  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  console.log('resetRestaurants');

  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';
  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  console.log('fillRestaurantsHTML');
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}


let idIntersectingElement;
var io = new IntersectionObserver(entries => {
  console.log('iointersect');

  entries.forEach(entry => {
    if(entry.isIntersecting) {
      //console.log('intersecting',entry.target.id,entry);
      let idStr = entry.target.childNodes[0].id;
      let idNumber = idStr.replace( /^\D+/g, '');
      idNumber = Number(idNumber);
      idIntersectingElement = idNumber;
      console.log('load image from intersect:',res.restaurants[idNumber-1])
      loadImage(res.restaurants[idNumber-1],idStr);
      io.unobserve(entry.target);
    }
  });
});



console.log('mainRestaurants.js');
/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant,callback) => {
  console.log('createRestaurantHTML',restaurant);

  const li = document.createElement('li');
  io.observe(li);
  let image = document.createElement('img');
  image.className = 'restaurant-img';
  //add id to images
  image.id = 'image' + restaurant.id;
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);
  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  const fav = document.createElement('span');
  fav.id = 'fav' + restaurant.id;
  fav.className='fa fa-star';
  //fav.innerHTML = 'favorite';
  li.append(fav);

  loadImage = (restaurant, idStr) => {
  console.log('loadImage,restaurant,idStr', restaurant,idStr);
  image = document.getElementById(idStr);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  //add srcset and sizes to make responsive images.
  image.srcset =  `images/${restaurant.id}-400small.jpg 480w,images/${restaurant.id}-600medium.jpg 600w`;
  image.sizes =  "(max-width: 600px) 60vw,(min-width: 601px) 50vw";

  }

  // add alt tag to images.
  image.alt = "showing restaurant is " + restaurant.name + " and cuisine type is " + restaurant.cuisine_type;

  return li
}

/**
 * Update restaurants when selected.
 */
updateSelectedRestaurants = () => {
    console.log('updateSelectedRestaurants');

  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      afterUpdate(restaurants);
    }
  })
}

afterUpdate = (x) => {
console.log('afterUpdate');

 x.forEach(a => {
  let restaurant = a;
  image = document.getElementById('image'+a.id);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  // add alt tag to images.
  image.alt = "showing restaurant is " + restaurant.name + " and cuisine type is " + restaurant.cuisine_type;
  //add srcset and sizes to make responsive images.
  image.srcset =  `images/${restaurant.id}-400small.jpg 480w,images/${restaurant.id}-600medium.jpg 600w`;
  image.sizes =  "(max-width: 600px) 60vw,(min-width: 601px) 50vw";
 });
}

/**
 * Add and remove favorite restaurants.
 */
addFavorite = (id) => {

  fetch(`http://localhost:1337/restaurants/${id}/`,
   {

    method: 'PUT',
    body: JSON.stringify({"is_favorite":true}),
    headers:{
      'Content-Type': 'application/json'
    }

  }).then(res => {
    console.log('response status:', res);
    return res.json();

  }).then(response => {
    console.log('response status:', response.is_favorite);

  });
}

removeFavorite = (id) => {

  fetch(`http://localhost:1337/restaurants/${id}/`,
   {

    method: 'PUT',
    body: JSON.stringify({"is_favorite":false}),
    headers:{
      'Content-Type': 'application/json'
    }

  }).then(res => {
    console.log('response status:', res);
    return res.json();

  }).then(response => {
    console.log('response status:', response.is_favorite);

  });
}



window.addEventListener('click', (e) => {

  let clickedElementID = e.target.id ;
  let clickedTarget = e.target;
  let clickedElementIDNumber = clickedElementID.replace( /^\D+/g, '');


  if (clickedElementID.includes('fav') && !clickedTarget.classList.contains('checked') ) {

    console.log('clicked', e);

    addFavorite(clickedElementIDNumber);

    clickedTarget.classList.toggle('checked');


  }

  else if (clickedElementID.includes('fav') && clickedTarget.classList.contains('checked')) {

    removeFavorite(clickedElementIDNumber);

    clickedTarget.classList.toggle('checked');

  }


});


