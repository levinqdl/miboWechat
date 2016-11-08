import express from 'express';
import request from 'request';
import pg from 'pg';
import sign from './public/js/sign';

let ACCESS_TOKEN = null;
let JSAPI_TICKET = null;
let APPID = 'wx8bd2b906b5ca9515';
const SECRET = 'e99675d28f11a45d76a77e70dd9e196e';
const TEMPLATE_ID = '96L21k4prSq3vvfnMfIAxYlZQCDqGxVYVV2MJzMidek';
const DOMAIN = 'movie.mizhibo.tv';
const BASE_URL = `http://${DOMAIN}`;
let pgConfig = {
  user: 'postgres',
  database: 'testdb',
  BASE_URL: '127.0.0.1',
  port: 5432,
  max: 10,
  idleTimeoutMills: 30000,
};
let pgPool = new pg.Pool(pgConfig);
let pgClient = new pg.Client('postgres://postgres@127.0.0.1/testdb');
function pgCon(querys) {
  pgPool.connect((err, client, done)=>{
    if ( err ) {return console.error('error fetching client from pool', err);}
    querys(client, done);
  })
}

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
  pgCon((client, done)=>{
    client.query('SELECT * FROM dates WHERE openid = $1', [openid], (err, result)=>{
      if ( err ) return console.error('error running query', err);
      if ( result.rows.length > 0 ){
        done();
        let {nickname, avatar} = result.rows[0];
        res.render('result', {nickname, avatar});
      } else {
        client.query('SELECT * FROM share_user WHERE openid = $1', [openid], (err, result)=>{
          done();
          if ( err ) return console.error('error running query', err);
          if ( result.rows.length > 0 ){
            res.render('self');
          } else {
            let timestamp = Math.floor(new Date().getTime()/1000);
            let {protocol, hostname, originalUrl} = req;
            let url = `${protocol}://${hostname}${originalUrl}`;
            console.log(url);
            console.log(JSAPI_TICKET);
            let {noncestr, signature} = sign(JSAPI_TICKET, url);
            res.render('index', {title:'Hey',openid, appId:APPID, timestamp, noncestr, signature});
          }
        })
      }
    })
  })
});

app.get('/share', (req, res)=>{
  let {active, openid} = req.query;
  res.render('share', {active, baseURL:BASE_URL, openid, appId:APPID, redirect_uri:encodeURIComponent(BASE_URL)});
})

app.get('/follow', (req, res)=>{
  let {code} = req.query;
  request.get(
    `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APPID}&secret=${SECRET}&code=${code}&grant_type=authorization_code`,
    (error, response, body)=>{
      if ( !error && response.statusCode == 200) {
        let {openid:follower, access_token} = JSON.parse(body);
        let {openid} = req.query;
        if ( openid !== follower ){
          pgCon((client, done)=>{
            client.query('SELECT * FROM dates WHERE openid = $1', [openid], (err, result)=>{
              if (err) {return console.error('error running query', err);}
              if ( result.rows.length === 0 ){
                request.get(
                  `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${follower}&lang=zh_CN`,
                  (error, response, body)=>{
                    if ( !error && response.statusCode == 200) {
                      let {nickname, headimgurl:avatar} = JSON.parse(body);
                      client.query('INSERT INTO dates (openid, follower, time, nickname, avatar) VALUES ($1, $2, $3, $4, $5)', [openid, follower, new Date(), nickname, avatar], (err, result)=>{
                        done();
                        if ( err ) {return console.error('error running query', err);}
                        request.post(
                          `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${ACCESS_TOKEN}`
                          {
                            "touser":openid,
                            "template_id":TEMPLATE_ID,
                            "url":`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APPID}&redirect_uri=http%3A%2F%2F${DOMAIN}%2Fmibo%2Foauth2&response_type=code&scope=snsapi_base&state=1#wechat_redirect`,
                            "topcolor":"#FFFFFF",
                            "data":{
                              "first": {
                                "value":"恭喜你，离脱单更进一步啦",
                                "color":"#000000"
                              },
                              "keyword1":{
                                "value":"你脱TA，我买单",
                                "color":"#000000"
                              },
                              "keyword2":{
                                "value":"11月11日 11点11分",
                                "color":"#000000"
                              },
                              "keyword3":{
                                "value":"四季汉庭任你选",
                                "color":"#000000"
                              },
                              "remark":{
                                "value":"感谢您的参与，点击查看活动详情",
                                "color":"#000000"
                              }
                            }
                          },
                          (error, response, body)=>{
                            if ( error ){
                              console.error(error);
                            }
                          }
                        )
                        res.render('success', {
                          appId:APPID,
                          redirect_uri:encodeURIComponent(BASE_URL)
                        });
                      });
                    }
                  });
              } else {
                done();
                let {follower: f} = result.rows[0];
                if ( f === follower ){
                  res.render('success', {
                    appId:APPID,
                    redirect_uri:encodeURIComponent(BASE_URL)
                  })
                } else {
                  res.render('fail', {
                    appId:APPID,
                    redirect_uri:encodeURIComponent(BASE_URL)
                  });
                }
              }
            })
          })
        } else{
          res.render('self');
        }
      }else {
        console.log('error');
      }
  })
})

app.get('/shareSuccess', (req, res)=>{
  let {openid, active} = req.query;
  pgCon((client, done)=>{
    client.query('SELECT * FROM share_user WHERE openid = $1', [openid], function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      if ( result.rows.length === 0 ){
        client.query('INSERT INTO share_user (openid, time, active ) VALUES ($1, $2, $3)', [openid, new Date(), active], (err, result)=>{
          done();
          if (err) {
            return console.error('error running query', err);
          }
        })
      } else {
        done();
      }
    })
    res.render('share_success');
  });
});

app.get('/result', (req, res)=>{
  res.render('result', {nickname:'abc', avatar:'/img/boy.png'});
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
              "url":`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APPID}&redirect_uri=http%3A%2F%2F${DOMAIN}%2Fmibo%2Foauth2&response_type=code&scope=snsapi_base&state=1#wechat_redirect`
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
        res.redirect(`${BASE_URL}?openid=${openid}`);
      } else {
        console.log('error');
      }
    }
  )
})

app.listen(3000, ()=>{
  console.log('app listening on port 3000!');
});
