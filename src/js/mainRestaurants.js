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


