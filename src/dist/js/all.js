/**
 * Common database helper functions.
 */
let res = {};
console.log('db helper');
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
 /* static get DATABASE_URL() {
    const port = 8000;
    const serverextension = "http://127.0.0.1:8887/";
    //return `http://localhost:${port}/data/restaurants.json`;
    return `http://localhost:${port}/data/restaurants.json`;
  }*/

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(`http://localhost:1337/restaurants`).then(response => {
      return response.json();
    }).then( response => {
      for(let i = 0; i < response.length; i++) {
        response[i].id = i+1;
      }
      res.restaurants = response;
      const restaurants = res.restaurants;
      callback(null, restaurants);
    }).catch(error => {
      callback(error, null);
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
document.addEventListener('DOMContentLoaded', (event) => {
  console.log('load');
  fetchNeighborhoods();
  fetchCuisines();

 // activateMap();
});

window.addEventListener('load', () => {

  addIntersection();

});

/*activateMap = () => {
  let mapId = document.getElementById('map');
  mapId.style.position = 'relative';
  mapId.style.left = 0;
}
*/
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
    zoom: 11,
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

console.log('map.js');
/*document.addEventListener('DOMContentLoaded', () => {
  initMap();
});*/


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

  console.log('intersection.js');
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
      loadImage(res.restaurants[idNumber-1],idStr);
      io.unobserve(entry.target);
    }
    });
  });


addIntersection = () => {
  //console.log('addIntersection');
  let el2 = document.querySelectorAll('#restaurants-list li');
  //console.log('el2:',el2);
  el2.forEach(e => {
    io.observe(e);
  });
}
console.log('mainRestaurants.js');
/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant,callback) => {
  console.log('createRestaurantHTML');

  const li = document.createElement('li');
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
  li.append(more)
  //addIntersection();

  loadImage = (restaurant, idStr) => {

  image = document.getElementById(idStr);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = "showing restaurant is " + restaurant.name + " and cuisine type is " + restaurant.cuisine_type;

  // add alt tag to images.
  //add srcset and sizes to make responsive images.
  image.srcset =  `images/${restaurant.id}-400small.jpg 480w,images/${restaurant.id}-600medium.jpg 600w`;
  image.sizes =  "(max-width: 600px) 60vw,(min-width: 601px) 50vw";

  }

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
