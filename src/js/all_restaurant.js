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

let restaurant;
var map;

/**
 * Fetch reviews by id.
 */

/*fetchReviews = (id) => {//http://localhost:1337/reviews/?restaurant_id=<restaurant_id>

  return fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`).then(response => {
      return response.json();
      }).then(response => {
        console.log('response in normal fetchReviews:',response);
      return response;
  });

}*/


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
fillReviewsHTML = (reviews, callback) => {

  let id = getParameterByName('id');

  DBHelper.fetchReviews(id, (error, reviews) => {

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
    review.restaurant_id = Number(review.restaurant_id);
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
  });

}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  console.log('createReviewHTML', review);
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  //add id to review name.
  name.setAttribute('id', 'name' + review.name);
  //add tabindex
  name.setAttribute('tabindex', '0');
  li.appendChild(name);

  //adjust time.
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
  const breadcrumb = document.getElementById('breadcrumb-ol');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}


/**
 * Manage focus in restaurant container part
 */
document.addEventListener('keyup', (e) => {
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
 * Close review window
 */
closeWindow = () => {

  let rev = document.getElementById('form');
  rev.style.left = "-100%";

  let main = document.getElementById('maincontent');
  main.style.opacity = "1";

  let breadcrumb = document.getElementById('breadcrumb');
  breadcrumb.style.opacity = "1";

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

/**
 * Add new review to page.
 */
createNewReviewHTML = (review) => {

  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  //add id to review name.
  name.setAttribute('id', 'name' + review.name);
  //add tabindex
  name.setAttribute('tabindex', '0');
  li.appendChild(name);

  //review date
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
 * Handle offline review.
 */
let OfflineReviewAdded = false;
let lastid = 0;

offlineReview = (data) => {
  initIDB().then((db) =>  {
          if(!db) return;

    var tx_id = db.transaction('reviews', 'readwrite');
    var store_id = tx_id.objectStore('reviews');
    var index = store_id.index('restaurant_id');
    let id = getParameterByName('id');
    id = parseInt(id,10);
        //choose id for offline review. prevent same or lesser ids of present reviews.

    index.getAll(id).then(items => {
      let length = items.length;
      let lastid = items[length-1].id;
      console.log('lastid', lastid);
      console.log('in init db offline',data,lastid);
      //add id to data(new review)
      data.id = lastid+1;


      return lastid;
    }).then((lastid) => {
    console.log('data after lastid promise', lastid, data);
    var tx_offline = db.transaction('reviews_offline', 'readwrite');
    var store_offline = tx_offline.objectStore('reviews_offline');

    store_offline.add(data);
    //store offline review into the array.
    //offlineReviews.push(data);
  }).then(rq => {
    console.log('rq',rq);

    OfflineReviewAdded = true;

  }).catch(error => console.log(error));
});
}

/**
 * Send review to server and idb.
 */
 sendReview = () => {

  let id = (getParameterByName('id'));
  id = parseInt(id,10);


  data =  {
    //"id": lastID,
    restaurant_id: id,
    name:username,
    date : Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    rating: rating,
    comments: review
    };

  fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`, {

    method: 'POST',
    body: JSON.stringify(data),
    headers:{
      'Content-Type': 'application/json'
    }

  }).then(res => {
    let status = res.status;
    console.log('response status:', res);
    return res.json();

  })
    .catch((error) => {
      console.error('Error in offline event:', error);
    })

    .then(response => {

      console.log('Success:', response);
      //check online status
      if(navigator.onLine) {
        console.log('onLine');
        //turn string to number for proper storage.
        response.restaurant_id = id;


        //add new review to db.
        initIDB().then((db) =>  {

        console.log('in init db after review added online');

        if(!db) return;

        var tx = db.transaction('reviews', 'readwrite');
        var store = tx.objectStore('reviews');

        store.put(response);

        });
        closeWindow();

        //add new review to page
        const container = document.getElementById('reviews-container');

        const ul = document.getElementById('reviews-list');

        ul.appendChild(createNewReviewHTML(response));

        container.appendChild(ul);

      }
      else {
        console.log('offline');
        //offline review send to the db.
        offlineReview(data);

        closeWindow();
        //add new review to page
        const container = document.getElementById('reviews-container');

        const ul = document.getElementById('reviews-list');

        ul.appendChild(createNewReviewHTML(data));

        container.appendChild(ul);

      }

  });
}
let offlineReviews = [];

window.addEventListener('online', (e) => {

  if(OfflineReviewAdded) {
    let id = getParameterByName('id');
    id = parseInt(id,10);

    initIDB().then((db) => {
    let num = Number(id);

      if(!db) return;
        var tx = db.transaction('reviews_offline', 'readwrite');
        var store = tx.objectStore('reviews_offline');
        return store.openCursor();
      }).then(show = (cursor) => {
        if (!cursor) {return;}
        let item = cursor.value;
        offlineReviews.push(item);
        console.log('cursor',cursor);
        fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`, {

        method: 'POST',
        body: JSON.stringify(item),
        headers:{
        'Content-Type': 'application/json'
        }
      });
        return cursor.continue().then(show);

      }).then(res => {

        //add new review to db.
        initIDB().then((db) =>  {
        if(!db) return;
        console.log('in init db after review added online');
                console.log(offlineReviews);

        offlineReviews.forEach(e =>  {
          console.log('item',e);
          var tx = db.transaction('reviews', 'readwrite');
          var store = tx.objectStore('reviews');

          store.add(e);
        });

        offlineReviews = [];

        });

        });
      OfflineReviewAdded = false;
  }

});
//delete review
/*
for( let i =72 ; i <73; i++) {
 //let i=71;
 fetch(`http://localhost:1337/reviews/${i}`, {
  method: 'DELETE',
  headers:{
    'Content-Type': 'application/json'
  }
}).then(res => {
  console.log('DELETE');
  return    res.json();

})
.catch(error => console.error('Error:', error));
}

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
