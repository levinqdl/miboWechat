'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

var _sign2 = require('./public/js/sign');

var _sign3 = _interopRequireDefault(_sign2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ACCESS_TOKEN = null;
var JSAPI_TICKET = null;
var APPID = 'wx8bd2b906b5ca9515';
var SECRET = 'e99675d28f11a45d76a77e70dd9e196e';
var DOMAIN = 'movie.mizhibo.tv';
var BASE_URL = 'http://' + DOMAIN;
var pgConfig = {
  user: 'postgres',
  database: 'testdb',
  BASE_URL: '127.0.0.1',
  port: 5432,
  max: 10,
  idleTimeoutMills: 30000
};
var pgPool = new _pg2.default.Pool(pgConfig);
var pgClient = new _pg2.default.Client('postgres://postgres@127.0.0.1/testdb');
function pgCon(querys) {
  pgPool.connect(function (err, client, done) {
    if (err) {
      return console.error('error fetching client from pool', err);
    }
    querys(client, done);
  });
}

_request2.default.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + APPID + '&secret=' + SECRET, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    body = JSON.parse(body);
    console.log('access_token:' + body.access_token);
    ACCESS_TOKEN = body.access_token;
    //get jsapi_ticket
    _request2.default.get('https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + ACCESS_TOKEN + '&type=jsapi', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        body = JSON.parse(body);
        JSAPI_TICKET = body.ticket;
      }
    });
  }
});

var app = (0, _express2.default)();
app.use(_express2.default.static(__dirname + '/public'));
app.set('views', './views');
app.set('view engine', 'pug');

app.get('/', function (req, res) {
  var openid = req.query.openid;

  pgCon(function (client, done) {
    client.query('SELECT * FROM dates WHERE openid = $1', [openid], function (err, result) {
      if (err) return console.error('error running query', err);
      if (result.rows.length > 0) {
        done();
        var _result$rows$ = result.rows[0],
            nickname = _result$rows$.nickname,
            avatar = _result$rows$.avatar;

        res.render('result', { nickname: nickname, avatar: avatar });
      } else {
        client.query('SELECT * FROM share_user WHERE openid = $1', [openid], function (err, result) {
          done();
          if (err) return console.error('error running query', err);
          if (result.rows.length > 0) {
            res.render('self');
          } else {
            var timestamp = Math.floor(new Date().getTime() / 1000);
            var protocol = req.protocol,
                hostname = req.hostname,
                originalUrl = req.originalUrl;

            var url = protocol + '://' + hostname + originalUrl;
            console.log(url);
            console.log(JSAPI_TICKET);

            var _sign = (0, _sign3.default)(JSAPI_TICKET, url),
                noncestr = _sign.noncestr,
                signature = _sign.signature;

            res.render('index', { title: 'Hey', openid: openid, appId: APPID, timestamp: timestamp, noncestr: noncestr, signature: signature });
          }
        });
      }
    });
  });
});

app.get('/share', function (req, res) {
  var _req$query = req.query,
      active = _req$query.active,
      openid = _req$query.openid;

  res.render('share', { active: active, baseURL: BASE_URL, openid: openid, appId: APPID, redirect_uri: encodeURIComponent(BASE_URL) });
});

app.get('/follow', function (req, res) {
  var code = req.query.code;

  _request2.default.get('https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + APPID + '&secret=' + SECRET + '&code=' + code + '&grant_type=authorization_code', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      (function () {
        var _JSON$parse = JSON.parse(body),
            follower = _JSON$parse.openid,
            access_token = _JSON$parse.access_token;

        var openid = req.query.openid;

        if (openid !== follower) {
          pgCon(function (client, done) {
            client.query('SELECT * FROM dates WHERE openid = $1', [openid], function (err, result) {
              if (err) {
                return console.error('error running query', err);
              }
              if (result.rows.length === 0) {
                _request2.default.get('https://api.weixin.qq.com/sns/userinfo?access_token=' + access_token + '&openid=' + follower + '&lang=zh_CN', function (error, response, body) {
                  if (!error && response.statusCode == 200) {
                    var _JSON$parse2 = JSON.parse(body),
                        nickname = _JSON$parse2.nickname,
                        avatar = _JSON$parse2.headimgurl;

                    client.query('INSERT INTO dates (openid, follower, time, nickname, avatar) VALUES ($1, $2, $3, $4, $5)', [openid, follower, new Date(), nickname, avatar], function (err, result) {
                      done();
                      if (err) {
                        return console.error('error running query', err);
                      }
                      res.render('success', {
                        appId: APPID,
                        redirect_uri: encodeURIComponent(BASE_URL)
                      });
                    });
                  }
                });
              } else {
                done();
                var f = result.rows[0].follower;

                if (f === follower) {
                  res.render('success', {
                    appId: APPID,
                    redirect_uri: encodeURIComponent(BASE_URL)
                  });
                } else {
                  res.render('fail', {
                    appId: APPID,
                    redirect_uri: encodeURIComponent(BASE_URL)
                  });
                }
              }
            });
          });
        } else {
          res.render('self');
        }
      })();
    } else {
      console.log('error');
    }
  });
});

app.get('/shareSuccess', function (req, res) {
  var _req$query2 = req.query,
      openid = _req$query2.openid,
      active = _req$query2.active;

  pgCon(function (client, done) {
    client.query('SELECT * FROM share_user WHERE openid = $1', [openid], function (err, result) {
      if (err) {
        return console.error('error running query', err);
      }
      if (result.rows.length === 0) {
        client.query('INSERT INTO share_user (openid, time, active ) VALUES ($1, $2, $3)', [openid, new Date(), active], function (err, result) {
          done();
          if (err) {
            return console.error('error running query', err);
          }
        });
      } else {
        done();
      }
    });
    res.render('share_success');
  });
});

app.get('/result', function (req, res) {
  res.render('result', { nickname: 'abc', avatar: '/img/boy.png' });
});

app.get('/success', function (req, res) {
  res.render('success');
});

app.get('/fail', function (req, res) {
  res.render('fail');
});

app.get('/mibo/wechat', function (req, res) {
  console.log(req.query);
  var echostr = req.query.echostr;

  res.send(echostr);
});

app.get('/mibo/createMenu', function (req, res) {
  console.log('create menu');
  _request2.default.post('https://api.weixin.qq.com/cgi-bin/menu/create?access_token=' + ACCESS_TOKEN, { json: {
      "button": [{
        "name": "菜单",
        "sub_button": [{
          "type": "view",
          "name": "双11",
          "url": 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + APPID + '&redirect_uri=http%3A%2F%2F' + DOMAIN + '%2Fmibo%2Foauth2&response_type=code&scope=snsapi_base&state=1#wechat_redirect'
        }]
      }]
    } }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
    } else if (error) {
      console.log(error);
    } else {
      console.log(response.statusCode);
    }
  });
});

app.get('/mibo/oauth2', function (req, res) {
  console.log('oauth2');
  var code = req.query.code;

  _request2.default.get('https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + APPID + '&secret=' + SECRET + '&code=' + code + '&grant_type=authorization_code', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var _JSON$parse3 = JSON.parse(body),
          openid = _JSON$parse3.openid;

      console.log(openid);
      res.redirect(BASE_URL + '?openid=' + openid);
    } else {
      console.log('error');
    }
  });
});

app.listen(3000, function () {
  console.log('app listening on port 3000!');
});