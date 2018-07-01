
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