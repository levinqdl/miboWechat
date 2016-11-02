var HOST = 'http://104.194.91.162:3000';
wx.ready(function(){
  submit.addEventListener('click', function(event){
    event.preventDefault();
    wx.onMenuShareAppMessage({
      title:'咪直播双11',
      desc:'不做单身狗',
      link:HOST+'/share?openid='+openid,
      success: function() {
        window.location = HOST+'/shareSuccess?openid='+openid;
      }
    })
  })
})
