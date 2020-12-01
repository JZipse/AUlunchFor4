const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
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

app.post('/formaction', async (req,res) =>{
    
    console.log('Got body:', req.body)
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    var str = "INSERT INTO `users` (`firstName`, `lastName`, `schoolID`, `email`, `password`, `role`, `department`, `previousLeader`, `active`) VALUES ('" + req.body.fName + "', '" + req.body.lName + "', '" + req.body.ID + "', '" + req.body.Email + "', '" + hashedPassword + "', '" + req.body.Role + "', '" + req.body.Dept + "', '0', '1')";
    console.log(str);
    con.query(str);
    res.redirect('/adminLogin')
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
app.post('/customerLogin', async (req, res) => {
    con.query('SELECT EMAIL, PASSWORD FROM users', (err,rows) => {
        console.log(req.body.pass)
        let customers = [];
        if(err) throw err;
        console.log('Data received from Db:');
        //console.log(rows);
        for(let i = 0; i < (rows.length); i++){
            const user = {email: rows[i].EMAIL, password: rows[i].PASSWORD}
            console.log(user);
            customers.push(user); 
        }
        const cusLog = customers.find(email => email.email = req.body.user)
        if(cusLog == null){
            console.log('No account with that email')
        }
        try {
            if(bcrypt.compare(req.body.pass, cusLog.password)){
                res.render('customerPage')
            } else {
                res.send('Failed');
            }
        } catch {
            res.status(500).send();
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