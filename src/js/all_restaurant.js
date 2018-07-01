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

let restaurant;
var map;

/**
 * Fetch reviews by id.
 */
fetchReviews = (id) => {//http://localhost:1337/reviews/?restaurant_id=<restaurant_id>
  return fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`).then(response => {
      return response.json();
      }).then(response => {
      return response;
  });
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
      console.log('restaurant in DBHelper.fetchRestaurantById', restaurant);
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
fillReviewsHTML = (reviews) => {

  let id = getParameterByName('id');

  fetchReviews(id).then(reviews => {

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
});

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
  const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
  ];

  let d =review.createdAt;


  var dt = new Date(d);
  date_data = `${dt.getMonth()} ${monthNames[dt.getMonth()]}, ${dt.getFullYear()} `

  const date = document.createElement('p');


  date.innerHTML = date_data;
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

/**
 * Add review window
 */
addReview = () => {

  let rev = document.getElementById('form');
  rev.style.top = "18vh";
  rev.style.left = "10vw";

  let main = document.getElementById('maincontent');
  main.style.opacity = "0.5";

  let breadcrumb = document.getElementById('breadcrumb');
  breadcrumb.style.opacity = "0.5";

}
/**
 * Get input values: Username, Rating, Review.
 */
let inputUsername = document.getElementById('Username');

let inputRating = document.getElementById('Rating');

let inputReview = document.getElementById('Review');

let username;

let rating;

let review;

inputUsername.addEventListener('keyup', (e) => {
  username = inputUsername.value;
  if(e.which == 13) {
    inputRating.focus();
    e.preventDefault() ;
  }
  console.log('Username', username);
});

inputRating.addEventListener('keyup', (e) => {
  rating = inputRating.value
  if(e.which == 13) {
    inputReview.focus();
  }
  console.log('rating', rating);
});

inputReview.addEventListener('keyup', () => {
  review = inputReview.value
  console.log('review', review);
});

let lastID;

fetch(`http://localhost:1337/reviews`).then(response => {
  return response.json();
  }).then(response => {
  lastID = response[response.length-1].id;


});
// "date": "October 26, 2016",1504095567183 09 26 2016
sendReview = () => {
;
  console.log('in send review',username, rating, review);
  data =  {
    //"id": lastID,
    "restaurant_id": getParameterByName('id'),
    "name":username,
    "date" : Date.now(),
    "createdAt": Date.now(),
    "updatedAt": Date.now(),
    "rating": rating,
    "comments": review
  };
  fetch(`http://localhost:1337/reviews`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers:{
      'Content-Type': 'application/json'
    }
  }).then(res => res.json())
  .catch(error => console.error('Error:', error))
  .then(response =>
   console.log('Success:', response));

}


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
