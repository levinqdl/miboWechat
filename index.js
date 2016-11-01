import express from 'express';
import request from 'request';

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
    'https://api.weixin.qq.com/cig-bin/menu/create?access_token=abcdefg',
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
