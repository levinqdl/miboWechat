import express from 'express';

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

app.listen(3000, ()=>{
  console.log('app listening on port 3000!');
});
