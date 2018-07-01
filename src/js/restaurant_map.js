
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
