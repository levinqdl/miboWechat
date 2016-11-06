var HOST = 'http://movie.mizhibo.tv';

var items = document.getElementsByClassName('item');
function activeX(){
  var active = document.getElementsByClassName("active")[0];
  for ( var i = 0; i < items.length; i++ ){
    if ( items[i] == active ){
      return i;
    }
  }
}
var option = {
  title:'咪直播双11',
  imgUrl:HOST+'/img/mibo.jpeg',
  link: null,
  success: function() {
    window.location = HOST+'/shareSuccess?openid='+openid+'&active='+activeX();
  }
};
var handler = function(index) {
  loop(items, function(elem, i) {
    if (i === index ){
      elem.className = 'item active';
      option.link = HOST+'/share?openid='+openid+'&active='+activeX();
    } else {
      elem.className = 'item';
    }
  })
}
var loop = function( arr, func) {
  for ( i = 0; i < arr.length; i++)
    func(arr[i], i);
}
loop(items, function(elem, index) {
  elem.addEventListener('click', handler.bind(this, index));
})

wx.onMenuShareTimeline(option);
wx.error(function(res){
  console.error(JSON.stringify(res));
});
