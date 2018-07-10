
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


