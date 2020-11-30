const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Base2018",
    database: "aulunch"
});

+con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

const app = express();
app.set('view engine', 'pug');
app.set('views', '../views');
app.use(express.static('public'));

app.get('/form', (req, res) =>{
    res.render('form');
});

app.post('/formaction', (req,res) =>{
    res.redirect('adminPage')
})

app.get('/feedback', (req, res) =>{
    res.render('feedback');
});

app.get('/GenerateMeeting',(req, res) => {
    
});

app.get('/adminLogin', (req, res) => {
    res.render('adminLogin');
});

app.get('/adminPage', (req, res) => {
    res.render('adminPage');
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