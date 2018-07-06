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
  //console.log('fetchRestaurantFromURL');
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  console.log('type of id ', parseInt(id,10));
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      //console.log('restaurant in DBHelper.fetchRestaurantById', restaurant);
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
  //console.log('fillRestaurantHTML');
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
  console.log('reviews in fillReviewsHTML 1', reviews);

  DBHelper.fetchReviews(id, (error, reviews) => {
  console.log('reviews in fillReviewsHTML 2', reviews);
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
  //console.log('createReviewHTML');
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
  //console.log('fillBreadcrumb:');
  const breadcrumb = document.getElementById('breadcrumb-ol');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}


/**
 * Manage focus in restaurant container part
 */
document.addEventListener('keyup', (e) => {
 // console.log('e review: ' , e);
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

/*fetch(`http://localhost:1337/reviews`).then(response => {
  return response.json();
  }).then(response => {
  lastID = response[response.length-1].id;


});*/

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

createNewReviewHTML = (review) => {

  console.log('createNewReviewHTML',review);
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
 * Send review to server.
 */
 sendReview = () => {
  console.log('in send review',username, rating, review);
  let id = (getParameterByName('id'));
  id = parseInt(id,10);
  data =  {
    //"id": lastID,
    "restaurant_id": id,
    "name":username,
    "date" : Date.now(),
    "createdAt": Date.now(),
    "updatedAt": Date.now(),
    "rating": rating,
    "comments": review
  };

  fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers:{
      'Content-Type': 'application/json'
    }
  }).then(res => res.json())
  .catch(error => console.error('Error:', error))
  .then(response => {

  console.log('Success:', response.restaurant_id);
  response.restaurant_id = id;
  initIDB().then((db) =>  {
  console.log('in init db after review added');
  if(!db) return;
  var tx = db.transaction('reviews', 'readwrite');
  var store = tx.objectStore('reviews');

  store.put(response);
  });
  closeWindow();
  const container = document.getElementById('reviews-container');

  const ul = document.getElementById('reviews-list');

  ul.appendChild(createNewReviewHTML(response));

  container.appendChild(ul);

  });
}
/*for( let i = 57 ; i < 71 ; i++) {
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