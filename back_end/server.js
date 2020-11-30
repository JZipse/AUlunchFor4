const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mysql');


const conn = sql.createConnection({
    host: "45.55.136.114",
    user:"lunch44F2020",
    password: "luncht1me",
    database: "lunch44F2020"
});

conn.connect(function(err){
    if(err) throw err;
    console.log("CONNECTED TO DB");
})


const app = express();
app.set('view engine', 'pug');
app.set('views', '../views');
app.use(express.static('public'));

app.get('/form', (req, res) =>{
    res.render('form');
});

app.get('/feedback', (req, res) =>{
    res.render('feedback');
});


app.get('/adminLogin', (req, res) => {
    res.render('adminLogin');
});

app.use(bodyParser.urlencoded({extended:true}));

app.post('/adminLogin', (req, res) => {
   //console.log('Got Body:', req.body);
   const user = "user";
   const pass = "pass";
   if (req.body.user == user && req.body.pass == pass){
       res.send("logging in");
   }
   
});


app.listen(3000);