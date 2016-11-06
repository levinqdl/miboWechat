var HOST = 'http://movie.mizhibo.tv';
function activeX(){
  var active = document.getElementsByClassName("active")[0];
  for ( var i = 0; i < items.length; i++ ){
    if ( items[i] == active ){
      return i;
    }
  }
}
wx.ready(function(){
  wx.onMenuShareTimeline({
    title:'咪直播双11',
    link:HOST+'/share?openid='+openid+'&active='+activeX(),
    success: function() {
      window.location = HOST+'/shareSuccess?openid='+openid+'&active='+activeX();
    }
  });
});
wx.error(function(res){
  console.error(JSON.stringify(res));
});
