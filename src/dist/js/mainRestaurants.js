changeFavRestaurantBorder=((e,t)=>{let a=document.getElementById("restaurant"+t);console.log("favRestaurant,is_fav,listNumber",a,e,t),e?(console.log("fav",a),a.style.borderColor="#c22c2c"):(console.log("else",a),a.style.borderColor="#ccc")}),getRestaurantfavStatus=(e=>fetch(`http://localhost:1337/restaurants/${e}`).then(e=>e.json()).then(e=>e.is_favorite)),createRestaurantHTML=((e,t)=>{const a=document.createElement("li");a.id="restaurant"+e.id,io.observe(a);let s=document.createElement("img");s.className="restaurant-img",s.id="image"+e.id,a.append(s);const n=document.createElement("h2");n.innerHTML=e.name,a.append(n);const o=document.createElement("p");o.innerHTML=e.neighborhood,a.append(o);const r=document.createElement("p");r.innerHTML=e.address,a.append(r);const c=document.createElement("a");c.innerHTML="View Details",c.href=DBHelper.urlForRestaurant(e),a.append(c);const i=document.createElement("button");return i.id="fav"+e.id,i.innerHTML=" ☆",getRestaurantfavStatus(e.id).then(e=>{e?(a.style.borderColor="#c22c2c",i.className="checked"):(a.style.borderColor="#ccc",i.className="")}),a.append(i),loadImage=((e,t)=>{(s=document.getElementById(t)).src=DBHelper.imageUrlForRestaurant(e),s.srcset=`images/${e.id}-300small_low.jpg 480w,images/${e.id}-600medium.jpg 600w`,s.sizes="(max-width: 600px) 20vw,(min-width: 601px) 50vw",s.alt="showing restaurant is "+e.name+" and cuisine type is "+e.cuisine_type}),a}),updateSelectedRestaurants=(()=>{const e=document.getElementById("cuisines-select"),t=document.getElementById("neighborhoods-select"),a=e.selectedIndex,s=t.selectedIndex,n=e[a].value,o=t[s].value;DBHelper.fetchRestaurantByCuisineAndNeighborhood(n,o,(e,t)=>{e?console.error(e):(resetRestaurants(t),fillRestaurantsHTML(),afterUpdate(t))})}),afterUpdate=(e=>{console.log("afterUpdate",e),e.forEach(e=>{t.is_favorite?(li.style.borderColor="#c22c2c",fav.className="checked"):(li.style.borderColor="#ccc",fav.className="");let t=e;image=document.getElementById("image"+e.id),image.src=DBHelper.imageUrlForRestaurant(t),image.alt="showing restaurant is "+t.name+" and cuisine type is "+t.cuisine_type,image.srcset=`images/${t.id}-400small.jpg 480w,images/${t.id}-600medium.jpg 600w`,image.sizes="(max-width: 600px) 60vw,(min-width: 601px) 50vw"})}),addFavorite=(e=>{fetch(`http://localhost:1337/restaurants/${e}/`,{method:"PUT",body:JSON.stringify({is_favorite:!0}),headers:{"Content-Type":"application/json"}}).then(e=>(console.log("response status:",e),e.json())).then(e=>{console.log("response status:",e.is_favorite)})}),removeFavorite=(e=>{fetch(`http://localhost:1337/restaurants/${e}/`,{method:"PUT",body:JSON.stringify({is_favorite:!1}),headers:{"Content-Type":"application/json"}}).then(e=>(console.log("response status:",e),e.json())).then(e=>{console.log("response status:",e.is_favorite)})});let restaurantsList=document.getElementById("restaurants-list");restaurantsList.addEventListener("click",e=>{console.log("click",e);let t=e.target.id,a=e.target,s=t.replace(/^\D+/g,"");t.includes("fav")&&!a.classList.contains("checked")?(console.log("clicked",e),addFavorite(s),a.classList.toggle("checked"),changeFavRestaurantBorder(!0,s)):t.includes("fav")&&a.classList.contains("checked")&&(removeFavorite(s),a.classList.toggle("checked"),changeFavRestaurantBorder(!1,s))});