import express from 'express';
import request from 'request';

let ACCESS_TOKEN = null;

request.get(
  'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxa53e261b6bca3b5f&secret=2a24efaf136d5109b33daab6c0f3985d',
  (error, response, body)=>{
    if ( !error && response.statusCode == 200 ){
      console.log(body);
      body = JSON.parse(body);
      console.log('access_token:'+body.access_token);
      ACCESS_TOKEN = body.access_token;
    }
  }
)

let app = express();
app.use(express.static(__dirname+'/public'));
app.set('views', './views');
app.set('view engine', 'pug');

app.get('/', (req, res)=>{
  res.render('index', {title:'Hey',message:'hello world'});
});

app.get('/share', (req, res)=>{
  res.render('share');
})

app.get('/success', (req, res)=>{
  res.render('success');
})

app.get('/fail', (req, res)=>{
  res.render('fail');
})

app.get('/mibo/wechat', (req, res)=>{
  console.log(req.query);
  let {echostr} = req.query;
  res.send(echostr);
})

app.get('/mibo/createMenu', (req, res)=>{
  console.log('create menu');
  request.post(
    'https://api.weixin.qq.com/cgi-bin/menu/create?access_token='+ACCESS_TOKEN,
    {json:{
      "button":[
        {
          "name":"菜单",
          "sub_button":[
            {
              "type":"view",
              "name":"双11",
              "url":"http://104.194.91.162:3000"
            },
          ]
        }
      ]
    }},
    (error, response, body)=>{
      if (!error && response.statusCode == 200) {
        console.log(body)
      }else if (error){
        console.log(error);
      }else {
        console.log(response.statusCode);
      }
    }
  );
})

app.listen(3000, ()=>{
  console.log('app listening on port 3000!');
});
