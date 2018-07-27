/**
 * IndexedDB.
 */
initIDB = () => {
  if(!('indexedDB' in window)) {
     console.log('This browser doesnt support idb');
  }
  return idb.open('restaurant-app', 3, function(upgradeDb) {
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
      case 3:
        console.log('Creating the reviews object store');
        upgradeDb.createObjectStore('reviews_offline', {keyPath: 'id'});
      }

  });
}

/**
 * Common database helper functions.
 */
let res = {};
class DBHelper {

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

  initIDB().then(function(db) {
  if(!db) return;
  var tx = db.transaction('restaurants', 'readwrite');
  var store = tx.objectStore('restaurants');
  store.getAll().then(items => {

    if(items.length > 0) {
      res.restaurants = items;
      const restaurants = res.restaurants;
      //console.log('ressss:',items);
      callback(null, restaurants);
    }else {
      fetch(`http://localhost:1337/restaurants`).then(response => {
      return response.json();
      }).then(response => {

      res.restaurants = response;
      const restaurants = res.restaurants;
      var tx = db.transaction('restaurants', 'readwrite');
      var store = tx.objectStore('restaurants');
      restaurants.forEach((item) => {
        store.put(item);
      })
      store.getAll().then(data => {
        callback(null, restaurants);
      })
    }).catch(error => {
      callback(error, null);
    });
    }
  })
});

  }

   /**
   * Fetch reviews by id.
   */
  static fetchReviews(id, callback)  {//http://localhost:1337/reviews/?restaurant_id=<restaurant_id>
    console.log('fetch Reviews',id);
   initIDB().then(db =>  {

    if(!db) return;

    let num = Number(id);
    var tx = db.transaction('reviews', 'readwrite');
    var store = tx.objectStore('reviews');
    var index = store.index('restaurant_id');

    index.getAll(num).then(items => {

      console.log('items',items);
      if(items.length > 0 ) {

        items.restaurant_id = Number(items.restaurant_id);
        self.restaurant.reviews = items;
        callback(null, self.restaurant.reviews);

      }else {

        return fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`).then(response => {

           return response.json();

            }).then(response => {
              console.log('response',response);
              //response.restaurant_id = Number(response.restaurant_id);
              console.log('aftr response',response);

              var tx_review = db.transaction('reviews', 'readwrite');
              var store_review = tx_review.objectStore('reviews');

              response.forEach((item) => {
                item.restaurant_id = Number(item.restaurant_id);
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

static controlFav(id )  {
  return fetch(`http://localhost:1337/restaurants/${id}/`,
   {

    method: 'GET',
    headers:{
      'Content-Type': 'application/json'
    }

  }).then(res => {
    console.log('response status:', res);
    return res.json();

  }).then(response => {
    console.log('response status:', response.is_favorite);
    return response.is_favorite;
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
    return (`/img/${restaurant.photograph}`);
  }

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
window.addEventListener('load', (event) => {
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
let selectedRestaurants = {};
const cSelect = document.getElementById('cuisines-select');
const nSelect = document.getElementById('neighborhoods-select');
/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  console.log('uppppp');
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

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  //  console.log('fillNeighborhoodsHTML');

  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

initMap = () => {
 // console.log('in init map');

  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });

//  addMarkersToMap();
}
/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
//  console.log('fetchCuisines');
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
 //   console.log('fillCuisinesHTML');

  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
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
  addMarkersToMap();
});


/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
 // console.log('addMarkersToMap');

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
//  console.log('resetRestaurants');

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
 // console.log('fillRestaurantsHTML');
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 *Implement Intersect Feature
 */
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




/**
 * change restaurant border if it is a favorite
 */
changeFavRestaurantBorder = (is_fav, listNumber) => {

  //let favRestaurant = document.querySelectorAll('#restaurants-list li');
  let favRestaurant = document.getElementById('restaurant'+listNumber);
  //console.log('favRestaurant,is_fav,listNumber', favRestaurant,is_fav,listNumber);
  if(is_fav) {
  ///  console.log('fav', favRestaurant);
    //favRestaurant[listNumber].style.borderColor = '#c22c2c';
    favRestaurant.style.borderColor = '#c22c2c';
  } else {
   // console.log('else', favRestaurant);

    //favRestaurant[listNumber].style.borderColor = '#ccc';
    favRestaurant.style.borderColor = '#ccc';

  }
}

/**
 * get fav status
 */
getRestaurantfavStatus = (id) => {
  console.log('getRestaurantfavStatus');
  return fetch(`http://localhost:1337/restaurants/${id}`).then(response => {
    return response.json();
  }).then(restaurant => {
  //  console.log('getRestaurantfavStatus',restaurant);
    return restaurant.is_favorite;
  });
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant,callback) => {
  //console.log('createRestaurantHTML',restaurant);

  const li = document.createElement('li');
  li.id = 'restaurant' + restaurant.id;
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
  const fav = document.createElement('button');
  /*const favNote = document.createElement('span');
  favNote.innerHTML = 'FAV';
  console.log('fav inner html');
  li.append(favNote);*/
 // const but = document.createElement('button');

  fav.id = 'fav' + restaurant.id;
  fav.innerHTML =' ☆';
  // control favorite status of restaurant
  getRestaurantfavStatus(restaurant.id).then(status => {
    if(status){
      li.style.borderColor = '#c22c2c';

      // fav.className='fa fa-star checked';
      fav.className='checked';
    } else {
      li.style.borderColor = '#ccc';
      //fav.className='fa fa-star';
      fav.className='';
    }
  });
  li.append(fav);
  image.alt = "showing restaurant is " + restaurant.name + " and cuisine type is " + restaurant.cuisine_type;

  loadImage = (restaurant, idStr) => {
 // console.log('loadImage,restaurant,idStr', restaurant,idStr);
  image = document.getElementById(idStr);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  //add srcset and sizes to make responsive images.
  image.srcset =  `images/${restaurant.id}-300small_low.jpg 480w,images/${restaurant.id}-600medium.jpg 600w`;
  image.sizes =  "(max-width: 600px) 20vw,(min-width: 601px) 50vw";

  }

  // add alt tag to images.

  return li
}

/**
 * Update restaurants when selected.
 */
updateSelectedRestaurants = () => {
    console.log('uppppp2222');

 /* const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');*/
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
//console.log('afterUpdate',x);

 x.forEach(a => {
  let status = restaurant.is_favorite;
      if(status){
      li.style.borderColor = '#c22c2c';

      // fav.className='fa fa-star checked';
      fav.className='checked';
    } else {
      li.style.borderColor = '#ccc';
      //fav.className='fa fa-star';
      fav.className='';
    }
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
 * Add favorite restaurants.
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
   // console.log('response status:', res);
    return res.json();

  }).then(response => {
   // console.log('response status:', response.is_favorite);

  });
}

/**
 * Remove favorite restaurants.
 */
removeFavorite = (id) => {

  fetch(`http://localhost:1337/restaurants/${id}/`,
   {

    method: 'PUT',
    body: JSON.stringify({"is_favorite":false}),
    headers:{
      'Content-Type': 'application/json'
    }

  }).then(res => {
   // console.log('response status:', res);
    return res.json();

  }).then(response => {

   // console.log('response status:', response.is_favorite);



  });

}

let restaurantsList = document.getElementById('restaurants-list');

restaurantsList.addEventListener('click', (e) => {
  //console.log('click', e);
  let clickedElementID = e.target.id ;
  let clickedTarget = e.target;
  let clickedElementIDNumber = clickedElementID.replace( /^\D+/g, '');


  if (clickedElementID.includes('fav') && !clickedTarget.classList.contains('checked') ) {

   // console.log('clicked', e);

    addFavorite(clickedElementIDNumber);

    clickedTarget.classList.toggle('checked');

    changeFavRestaurantBorder(true, clickedElementIDNumber);

  }

  else if (clickedElementID.includes('fav') && clickedTarget.classList.contains('checked')) {

    removeFavorite(clickedElementIDNumber);

    clickedTarget.classList.toggle('checked');

    changeFavRestaurantBorder(false, clickedElementIDNumber);

  }


});

/*

restaurantsList.addEventListener('onfocus', event => {

});
*/