initIDB=(()=>("indexedDB"in window||console.log("This browser doesnt support idb"),idb.open("restaurant-app",2,function(e){switch(e.oldVersion){case 0:console.log("Creating the restaurants object store"),e.createObjectStore("restaurants",{keyPath:"id"});case 1:console.log("Creating the reviews object store"),e.createObjectStore("reviews",{keyPath:"id"});case 2:console.log("Creating restaurant id index"),e.transaction.objectStore("reviews").createIndex("restaurant_id","restaurant_id")}})));let restaurants,neighborhoods,cuisines,res={};console.log("db helper");class DBHelper{static fetchRestaurants(e){console.log("FETCH RESTAURANT!!!!"),initIDB().then(function(t){t&&t.transaction("restaurants","readwrite").objectStore("restaurants").getAll().then(s=>{if(s.length>0){console.log("get data from db!!",s),res.restaurants=s;const t=res.restaurants;e(null,t)}else console.log("get data from server!!"),fetch("http://localhost:1337/restaurants").then(e=>e.json()).then(s=>{res.restaurants=s;const n=res.restaurants;console.log("rrestaurant in fetch event : ",n);var a=t.transaction("restaurants","readwrite").objectStore("restaurants");n.forEach(e=>{console.log("Adding item",e),a.put(e)}),a.getAll().then(t=>{console.log("data",t),e(null,n)})}).catch(t=>{e(t,null)})})})}static fetchReviews(e,t){initIDB().then(s=>{if(console.log("initDB fetchReviews",s,e),!s)return;var n=s.transaction("reviews","readwrite").objectStore("reviews").index("restaurant_id");let a=Number(e);n.getAll(a).then(n=>{if(console.log("get data from fetchdb before i!!",n.restaurant_id),!(n.length>0))return console.log("get data from server!!"),fetch(`http://localhost:1337/reviews/?restaurant_id=${e}`).then(e=>e.json()).then(e=>{console.log("response in fetch reviews by id",e);var n=s.transaction("reviews","readwrite").objectStore("reviews");e.forEach(e=>{n.put(e)}),self.restaurant.reviews=e,t(null,self.restaurant.reviews)});n.filter(e=>{if(console.log("e.restaurant_id",e.restaurant_id),e.restaurant_id==a)return e}),console.log("get data from fetchdb!!",n),self.restaurant.reviews=n,t(null,self.restaurant.reviews)})})}static mapMarkerForRestaurant(e,t){return new google.maps.Marker({position:e.latlng,title:e.name,url:DBHelper.urlForRestaurant(e),map:t,animation:google.maps.Animation.DROP})}static fetchRestaurantById(e,t){DBHelper.fetchRestaurants((s,n)=>{if(s)t(s,null);else{const s=n.find(t=>t.id==e);s?t(null,s):t("Restaurant does not exist",null)}})}static fetchRestaurantByCuisine(e,t){DBHelper.fetchRestaurants((s,n)=>{if(s)t(s,null);else{const s=n.filter(t=>t.cuisine_type==e);t(null,s)}})}static fetchRestaurantByNeighborhood(e,t){DBHelper.fetchRestaurants((s,n)=>{if(s)t(s,null);else{const s=n.filter(t=>t.neighborhood==e);t(null,s)}})}static fetchRestaurantByCuisineAndNeighborhood(e,t,s){DBHelper.fetchRestaurants((n,a)=>{if(n)s(n,null);else{let n=a;"all"!=e&&(n=n.filter(t=>t.cuisine_type==e)),"all"!=t&&(n=n.filter(e=>e.neighborhood==t)),s(null,n)}})}static fetchNeighborhoods(e){DBHelper.fetchRestaurants((t,s)=>{if(t)e(t,null);else{const t=s.map((e,t)=>s[t].neighborhood),n=t.filter((e,s)=>t.indexOf(e)==s);e(null,n)}})}static fetchCuisines(e){DBHelper.fetchRestaurants((t,s)=>{if(t)e(t,null);else{const t=s.map((e,t)=>s[t].cuisine_type),n=t.filter((e,s)=>t.indexOf(e)==s);e(null,n)}})}static urlForRestaurant(e){return`./restaurant.html?id=${e.id}`}static imageUrlForRestaurant(e){return console.log("restaurant in image url",e),`/img/${e.photograph}`}}var map;"serviceWorker"in navigator||console.log("Service worker not supported"),navigator.serviceWorker.register("/sw.js").then(function(e){}).catch(function(e){console.log("Registration failed:",e)});var markers=[];console.log("main.js"),document.addEventListener("DOMContentLoaded",e=>{console.log("load"),fetchNeighborhoods(),fetchCuisines()}),fetchNeighborhoods=(()=>{console.log("fetchNeighborhoods"),DBHelper.fetchNeighborhoods((e,t)=>{e?console.error(e):(self.neighborhoods=t,fillNeighborhoodsHTML())})}),fillNeighborhoodsHTML=((e=self.neighborhoods)=>{console.log("fillNeighborhoodsHTML");const t=document.getElementById("neighborhoods-select");e.forEach(e=>{const s=document.createElement("option");s.innerHTML=e,s.value=e,t.append(s)})}),initMap=(()=>{console.log("in init map");self.map=new google.maps.Map(document.getElementById("map"),{zoom:12,center:{lat:40.722216,lng:-73.987501},scrollwheel:!1}),addMarkersToMap()}),fetchCuisines=(()=>{console.log("fetchCuisines"),updateRestaurants(),DBHelper.fetchCuisines((e,t)=>{e?console.error(e):(self.cuisines=t,fillCuisinesHTML())})}),fillCuisinesHTML=((e=self.cuisines)=>{console.log("fillCuisinesHTML");const t=document.getElementById("cuisines-select");e.forEach(e=>{const s=document.createElement("option");s.innerHTML=e,s.value=e,t.append(s)})});let selectedRestaurants={};updateRestaurants=(()=>{console.log("updateRestaurants");const e=document.getElementById("cuisines-select"),t=document.getElementById("neighborhoods-select"),s=e.selectedIndex,n=t.selectedIndex,a=e[s].value,o=t[n].value;DBHelper.fetchRestaurantByCuisineAndNeighborhood(a,o,(e,t)=>{e?console.error(e):(resetRestaurants(t),fillRestaurantsHTML())})});var i,coll=document.getElementsByClassName("collapsible");for(i=0;i<coll.length;i++)coll[i].addEventListener("click",function(){this.classList.toggle("active");var e=this.nextElementSibling;"block"===e.style.display?e.style.display="none":e.style.display="block"});var elementCollapsable=document.getElementById("collapsible");let idIntersectingElement;elementCollapsable.addEventListener("click",()=>{initMap()}),addMarkersToMap=((e=self.restaurants)=>{console.log("addMarkersToMap"),e.forEach(e=>{const t=DBHelper.mapMarkerForRestaurant(e,self.map);google.maps.event.addListener(t,"click",()=>{window.location.href=t.url}),self.markers.push(t)})}),resetRestaurants=(e=>{console.log("resetRestaurants"),self.restaurants=[],document.getElementById("restaurants-list").innerHTML="",self.markers.forEach(e=>e.setMap(null)),self.markers=[],self.restaurants=e}),fillRestaurantsHTML=((e=self.restaurants)=>{console.log("fillRestaurantsHTML");const t=document.getElementById("restaurants-list");e.forEach(e=>{t.append(createRestaurantHTML(e))}),addMarkersToMap()});var io=new IntersectionObserver(e=>{console.log("iointersect"),e.forEach(e=>{if(e.isIntersecting){let t=e.target.childNodes[0].id,s=t.replace(/^\D+/g,"");s=Number(s),idIntersectingElement=s,console.log("load image from intersect:",res.restaurants[s-1]),loadImage(res.restaurants[s-1],t),io.unobserve(e.target)}})});console.log("mainRestaurants.js"),createRestaurantHTML=((e,t)=>{console.log("createRestaurantHTML",e);const s=document.createElement("li");io.observe(s);let n=document.createElement("img");n.className="restaurant-img",n.id="image"+e.id,s.append(n);const a=document.createElement("h2");a.innerHTML=e.name,s.append(a);const o=document.createElement("p");o.innerHTML=e.neighborhood,s.append(o);const r=document.createElement("p");r.innerHTML=e.address,s.append(r);const l=document.createElement("a");l.innerHTML="View Details",l.href=DBHelper.urlForRestaurant(e),s.append(l);const i=document.createElement("button"),c=document.createElement("span"),d=document.createElement("p");return d.id="info"+e.id,c.id="fav"+e.id,DBHelper.controlFav(e.id).then(t=>{console.log("response after control fav response",t,e.is_favorite),1==t?(console.log("in iffffff",e.id),d.innerHTML="Your Favorite",d.className="checked",c.className="fa fa-star checked"):(console.log("in elseeeeee",e.id),d.innerHTML="Mark as Favorite",d.className="",c.className="fa fa-star")}),i.append(c),c.append(d),s.append(c),loadImage=((e,t)=>{console.log("loadImage,restaurant,idStr",e,t),(n=document.getElementById(t)).src=DBHelper.imageUrlForRestaurant(e),n.srcset=`images/${e.id}-400small.jpg 480w,images/${e.id}-600medium.jpg 600w`,n.sizes="(max-width: 600px) 60vw,(min-width: 601px) 50vw"}),n.alt="showing restaurant is "+e.name+" and cuisine type is "+e.cuisine_type,s}),updateSelectedRestaurants=(()=>{console.log("updateSelectedRestaurants");const e=document.getElementById("cuisines-select"),t=document.getElementById("neighborhoods-select"),s=e.selectedIndex,n=t.selectedIndex,a=e[s].value,o=t[n].value;DBHelper.fetchRestaurantByCuisineAndNeighborhood(a,o,(e,t)=>{e?console.error(e):(resetRestaurants(t),fillRestaurantsHTML(),afterUpdate(t))})}),afterUpdate=(e=>{console.log("afterUpdate"),e.forEach(e=>{let t=e;image=document.getElementById("image"+e.id),image.src=DBHelper.imageUrlForRestaurant(t),image.alt="showing restaurant is "+t.name+" and cuisine type is "+t.cuisine_type,image.srcset=`images/${t.id}-400small.jpg 480w,images/${t.id}-600medium.jpg 600w`,image.sizes="(max-width: 600px) 60vw,(min-width: 601px) 50vw"})}),addFavorite=(e=>{fetch(`http://localhost:1337/restaurants/${e}/`,{method:"PUT",body:JSON.stringify({is_favorite:!0}),headers:{"Content-Type":"application/json"}}).then(e=>(console.log("response status:",e),e.json())).then(e=>{console.log("response status:",e.is_favorite)})}),removeFavorite=(e=>{fetch(`http://localhost:1337/restaurants/${e}/`,{method:"PUT",body:JSON.stringify({is_favorite:!1}),headers:{"Content-Type":"application/json"}}).then(e=>(console.log("response status:",e),e.json())).then(e=>{console.log("response status:",e.is_favorite)})}),window.addEventListener("click",e=>{let t=e.target.id,s=e.target,n=t.replace(/^\D+/g,"");if(t.includes("fav")&&!s.classList.contains("checked")){console.log("clicked",e),addFavorite(n),s.classList.toggle("checked");let t=document.getElementById("info"+n);t.innerHTML="Your Favorite",t.style.color="#c22c2c"}else if(t.includes("fav")&&s.classList.contains("checked")){removeFavorite(n),s.classList.toggle("checked");let e=document.getElementById("info"+n);e.innerHTML="Mark as Favorite",e.style.color="#cd9292"}});