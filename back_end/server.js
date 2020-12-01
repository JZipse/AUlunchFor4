const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { isNull } = require('util');

const con = mysql.createConnection({
    host: "45.55.136.114",
    user: "lunch44F2020",
    password: "luncht1me",
    database: "lunch44F2020"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

const app = express();
app.set('view engine', 'pug');
app.set('views', '../views');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));


// admin functionality begins here
app.get('/form', (req, res) =>{
    res.render('form');
});

app.post('/formaction', (req,res) =>{
    console.log('Got body:', req.body)
    var str = "INSERT INTO `users` (`firstName`, `lastName`, `schoolID`, `email`, `password`, `role`, `department`, `previousLeader`, `active`) VALUES ('" + req.body.fName + "', '" + req.body.lName + "', '" + req.body.ID + "', '" + req.body.Email + "', '" + req.body.password + "', '" + req.body.Role + "', '" + req.body.Dept + "', '0', '1')";
    console.log(str);
    con.query(str);
    res.redirect('/adminPage')
})

app.get('/form/delete', (req, res) => {
    con.query('SELECT * FROM users', (err,rows) => {
        if(err) throw err;

        console.log(rows.password);
      
        console.log('Data received from Db:');
        console.log(rows);

        res.render('DeleteUser', {"users": rows});
    });
})

app.post('/form/delete/action', (req,res) => {
    console.log('Got body:', req.body)
    var str = "DELETE FROM `users` WHERE (`internalID` = '" + req.body.ID + "')";
    console.log(str);
    con.query(str);
    res.redirect('/adminPage')
})

app.get('/GenerateMeetings',(req, res) => {
    console.log('Got body:', req.body)
    res.send('Generate Meetings Page')
});

app.get('/adminLogin', (req, res) => {
    res.render('adminLogin');
});

app.get('/adminPage', (req, res) => {
    res.render('adminPage');
});

app.post('/adminLogin', (req, res) => {
   //console.log('Got Body:', req.body);
 
    const adminUser = "user";
    const adminPass = "pass";
    if (req.body.user == adminUser && req.body.pass == adminPass){
        res.redirect('/adminPage');
    }else{
        res.send("Wrong Username or Passord for Admin");
    }
});



// Customer functionality begins here.
app.post('/customerLogin', (req, res) => {
    con.query('SELECT * FROM users', (err,rows) => {
        var id
        if(err) throw err;
    
        console.log('Data received from Db:');
        console.log(rows);
    
        for(let i = 0; i < (rows.length); i++){
            let user = rows[i].email;
            let pass = rows[i].password;
            if(req.body.user == user && req.body.pass == pass){
                id = rows[i].internalID
                break;
            }
        }
        if(id !== null){
            res.render('customerPage', {'ID': id})
        }else{
            res.send('Wrong user login credentials')
        }
    });
});

app.post('/customer/delete', (req,res) => {
    console.log('Got body:', req.body)
    var str = "DELETE FROM `users` WHERE (`internalID` = '" + req.body.ID + "')";
    console.log(str);
    con.query(str);
    res.redirect('/adminLogin')
})

app.post('/customer/update', (req,res) =>{
    console.log('Got body:', req.body)
    con.query('SELECT * FROM users WHERE internalID = ' + req.body.ID, (err,rows) => {
        console.log('Data received from Db:');
        console.log(rows);
        res.render('customerUpdate', {"data": rows})
    })
})

app.post('/customer/update/action', (req,res) =>{
    console.log('Got body:', req.body)
    var str = "UPDATE `users` SET `firstName` = '" + req.body.fName + "', `lastName` = '" + req.body.lName + "', `schoolID` = '" + req.body.schoolID + "', `email` = '" + req.body.Email + "', `password` = '" + req.body.password + "', `role` = '" + req.body.Role + "', `department` = '"+ req.body.Dept +"', `active` = '1' WHERE (`internalID` = '" + req.body.ID + "')";
    con.query(str);
    res.send("updated");

})

app.get('/feedback', (req, res) =>{
    res.render('feedback');
});

app.post('/feedback/Insert', (req, res) => {
    console.log('Got body:', req.body)
});

app.post('/customerPage', (req, res) =>{
    res.render('customerPage');
});

app.listen(3000);