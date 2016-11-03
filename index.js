import express from 'express';
import request from 'request';
import pg from 'pg';
import sign from './public/js/sign';

let ACCESS_TOKEN = null;
let JSAPI_TICKET = null;
let APPID = 'wx8bd2b906b5ca9515';
const SECRET = 'e99675d28f11a45d76a77e70dd9e196e';
const HOST = 'http://movie.mizhibo.tv'
let pgClient = new pg.Client('postgres://postgres@104.194.91.162:5432/testdb');

request.get(
  `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`,
  (error, response, body)=>{
    if ( !error && response.statusCode == 200 ){
      body = JSON.parse(body);
      console.log('access_token:'+body.access_token);
      ACCESS_TOKEN = body.access_token;
      //get jsapi_ticket
      request.get(
        `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${ACCESS_TOKEN}&type=jsapi`,
        (error, response, body)=>{
          if ( !error && response.statusCode == 200 ){
            body = JSON.parse(body);
            JSAPI_TICKET = body.ticket;
          }
        }
      )
    }
  }
)

let app = express();
app.use(express.static(__dirname+'/public'));
app.set('views', './views');
app.set('view engine', 'pug');

app.get('/', (req, res)=>{
  let {openid} = req.query;
  let timestamp = Math.floor(new Date().getTime()/1000);
  let {protocol, hostname, originalUrl} = req;
  let url = `${protocol}://${hostname}${originalUrl}`
  console.log(url);
  console.log(JSAPI_TICKET);
  let {noncestr, signature} = sign(JSAPI_TICKET, url);
  res.render('index', {title:'Hey',openid, appId:APPID, timestamp, noncestr, signature});
});

app.get('/share', (req, res)=>{
  res.render('share');
})

app.get('/shareSuccess', (req, res)=>{
  let {openid, active} = req.query;
  client.connect(function (err) {
    if (err) throw err;
    client.query(
      'INSERT INTO share_user (openid, time, active ) VALUES ($1, $2, $3)',
      [openid, new Date(), active],
      function (err, result) {
        if (err) throw err;

        // just print the result to the console
        console.log(result.rows[0]); // outputs: { name: 'brianc' }

        // disconnect the client
        client.end(function (err) {
          if (err) throw err;
        }
      )
    })
  })
  res.render('share_success');
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
  console.log(`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APPID}&redirect_uri=http%3A%2F%2Fmovie.mizhibo.tv%2Fmibo%2Foauth2&response_type=code&scope=snsapi_base&state=1#wechat_redirect`);
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
              "url":`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APPID}&redirect_uri=http%3A%2F%2Fmovie.mizhibo.tv%2Fmibo%2Foauth2&response_type=code&scope=snsapi_base&state=1#wechat_redirect`
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

app.get('/mibo/oauth2', (req, res)=>{
  console.log('oauth2');
  let {code} = req.query;
  request.get(
    `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APPID}&secret=${SECRET}&code=${code}&grant_type=authorization_code`,
    (error, response, body)=>{
      if ( !error && response.statusCode == 200) {
        let {openid} = JSON.parse(body);
        console.log(openid);
        res.redirect(`${HOST}?openid=${openid}`);
      } else {
        console.log('error');
      }
    }
  )
})

app.listen(3000, ()=>{
  console.log('app listening on port 3000!');
});
