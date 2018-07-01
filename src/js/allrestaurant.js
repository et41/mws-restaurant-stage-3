/**
 * IndexedDB.
 */
initIDB = () => {
  if(!('indexedDB' in window)) {
     console.log('This browser doesnt support idb');
  }
  return idb.open('restaurant-app', 1, function(upgradeDb) {
    switch (upgradeDb.oldVersion) {
      case 0:
        console.log('Creating the restaurants object store');
        upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});

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

let restaurant;
var map;


/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  console.log('fetchRestaurantFromURL');
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  console.log('fillRestaurantHTML');
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  // add alt tag to images.
  image.alt = "Showing restaurant is " + restaurant.name + " and cuisine type is " + restaurant.cuisine_type;
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  //add srcset and sizes to make responsive images.
  image.srcset =  `images/${restaurant.id}-400small.jpg 480w,images/${restaurant.id}-600medium.jpg 600w`;
  image.sizes =  "(max-width: 600px) 80vw,(min-width: 601px) 50vw";

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  console.log('fillReviewsHTML');
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  //add tabindex to title
  title.setAttribute('tabindex', '0');
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  console.log('createReviewHTML');
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  //add id to review name.
  name.setAttribute('id', 'name' + review.name);
  //add tabindex
  name.setAttribute('tabindex', '0');
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  //add id to review date.
  date.setAttribute('id', 'date' + review.name);
  //add tabindex
  date.setAttribute('tabindex', '0');
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  //add id to review rating.
  rating.setAttribute('id', 'rating' + review.name);
  //add tabindex
  rating.setAttribute('tabindex', '0');
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  console.log('fillBreadcrumb:');
  const breadcrumb = document.getElementById('breadcrumb-ol');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Manage focus in restaurant container part
 */
document.addEventListener('keyup', (e) => {
  console.log('e review: ' , e);
  let keyonElement = e.srcElement.id;
  const TABKEY = 9;
  if(e.keyCode == TABKEY) {
    if(keyonElement == "restaurant-name"){
    let elResCont = document.getElementById('restaurant-container');
    let elResCont_childs = elResCont.querySelectorAll('p, td');
    elResCont_childs.forEach(el_child => {
      el_child.setAttribute('tabindex', '0');
    });
  }
}
});

addReview = () => {

  let rev = document.getElementById('form');
  rev.style.top = "20vh";
  rev.style.left = "25vw";
  rev.style.right = "20vw";

  let main = document.getElementById('reviews-container');
  main.style.opacity = "0";
}

/*
  position: fixed;
  top: 501px;
  left: 200px;
  right: 100px;
  border: 2px solid;
  z-index: 1000;

*/


let breadcrumbCounter = 0;

/**
 * Initialize Google map, called from HTML.
 */
initMap = () => {

  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 18,
        center: restaurant.latlng,
        scrollwheel: false
      });
      if (breadcrumbCounter == 0) {
		    fillBreadcrumb();
		    breadcrumbCounter++;
      }
      //fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
	console.log('collapsable');
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
      content.style.height = '350px';
    }
  });
}
var elementCollapsable = document.getElementById('collapsible');

elementCollapsable.addEventListener('click', () => {
  initMap();
});
