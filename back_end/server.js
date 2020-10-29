const express = require('express');

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


app.listen(3000);