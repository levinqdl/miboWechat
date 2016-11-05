var HOST = 'http://movie.mizhibo.tv';
wx.ready(function(){
  wx.hideMenuItems({
    menuList:["menuItem:share:appMessage"]
  });
  wx.showMenuItems({
    menuList:["menuItem:share:timeline"]
  });
  wx.onMenuShareTimeline({
    title:'咪直播双11',
    link:HOST+'/share?openid='+openid+'&active='+i,
    success: function() {
      var active = document.getElementsByClassName("active")[0];
      for ( var i = 0; i < items.length; i++ ){
        if ( items[i] == active ){
          window.location = HOST+'/shareSuccess?openid='+openid+'&active='+i;
          break;
        }
      }
    }
  });
});
wx.error(function(res){
  alert(JSON.stringify(res));
});
submit.addEventListener('click', function() {
  wx.showOptionMenu({});
});
