var HOST = 'http://movie.mizhibo.tv';
wx.ready(function(){
  submit.addEventListener('click', function(event){
    event.preventDefault();
    wx.onMenuShareTimeline({
      title:'咪直播双11',
      desc:'不做单身狗',
      link:HOST+'/share?openid='+openid,
      success: function() {
        var active = document.getElementsByClassName("active")[0];
        for ( var i = 0; i < items.length; i++ ){
          if ( items[i] == active ){
            window.location = HOST+'/shareSuccess?openid='+openid+'&active='+i;
            break;
          }
        }
      }
    })
  })
})
wx.error(function(res){
  alert(JSON.stringify(res));
});
