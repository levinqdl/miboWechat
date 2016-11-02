var submit = document.getElementById('submit');
var loop = function( arr, func) {
  for ( i = 0; i < arr.length; i++)
    func(arr[i], i);
}
var items = document.getElementsByClassName('item');

var handler = function(index) {
  loop(items, function(elem, i) {
    if (i === index ){
      elem.className = 'item active';
    } else {
      elem.className = 'item';
    }
  })
}
loop(items, function(elem, index) {
  elem.addEventListener('click', handler.bind(this, index));
})
