if (process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash')
const session = require('express-session');
const initializePassport = require('./passport-config');
const { body, validationResult } = require('express-validator');

initializePassport(
     passport, 
     email => customers.find(user => user.email === email),
     id => customers.find(user => user.id === id)
);

const customers = [];

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
app.use(express.urlencoded({extended: false}));
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())


// forgot password functionalsity.
app.get('/update/password', (req, res) =>{
    res.render('PasswordUpdate')
})

app.post('/update/password/action',[
    body("email").notEmpty().isEmail().withMessage("Input Email for Updating your Password."),
    body("password").notEmpty().isLength({min: 4, max: 14}).withMessage("Input a new Pass word that is 4-14 digits long")
], (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect('/update/password')
    }else{
        console.log('Got body:', req.body)
        res.send('not impemented yet')
    }
})

// admin functionality begins here.
app.get('/form', (req, res) =>{
    res.render('form');
});

app.post('/formaction', [
                        body("fName").notEmpty().withMessage("Must have a First Name."), 
                        body("lName").notEmpty().withMessage("Must have a Last Name."), 
                        body("ID").notEmpty().isLength({ min: 7, max: 7 }).withMessage("Your school's ID's are 7 digits Long."), 
                        body("Email").notEmpty().isEmail().withMessage("You must input a proper email address."), 
                        body("password").notEmpty().isLength({ min: 4, max: 14 }).withMessage("You must have password that is 4-14 characters in length."), body("Role").notEmpty().withMessage("you must have a role."), 
                        body("Dept").notEmpty().withMessage("You must have a department.")
                        ], async (req,res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect('/form')
    }else{
        console.log('Got body:', req.body)
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        var str = "INSERT INTO `users` (`firstName`, `lastName`, `schoolID`, `email`, `password`, `staffRole`, `department`, `previousLeader`, `active`) VALUES ('" + req.body.fName + "', '" + req.body.lName + "', '" + req.body.ID + "', '" + req.body.Email + "', '" + hashedPassword + "', '" + req.body.Role + "', '" + req.body.Dept + "', '0', '1')";
        console.log(str);
        con.query(str);
        res.redirect('/adminLogin')
    }
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

app.post('/form/delete/action',[
    body("ID").notEmpty().isNumeric().withMessage("something went wrong with the application ID was not found.")

], (req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect('/form/delete')
    }else{
        console.log('Got body:', req.body)
        var str = "DELETE FROM `users` WHERE (`internalID` = '" + req.body.ID + "')";
        console.log(str);
        con.query(str);
        res.redirect('/adminPage')
    }
})

app.get('/reports', checkAuthenticated, (req,res) => {
    res.render('Reports')
})

app.get('/GenerateMeetings', checkAuthenticated, (req, res) => {
    console.log('Got body:', req.body)
    res.send('Generate Meetings Page')
});

app.get('/adminLogin', (req, res) => {
    res.render('adminLogin');
    con.query('SELECT internalID, EMAIL, PASSWORD FROM users', (err,rows) => {
        
        if(err) throw err;
        console.log('Data received from Db:');
        //console.log(rows);
        for(let i = 0; i < (rows.length); i++){
            const user = {email: rows[i].EMAIL, password: rows[i].PASSWORD, id: rows[i].internalID};
            //console.log(user);
            customers.push(user); 
        }
        //console.log(customers);
    });
});

app.get('/adminPage', checkAuthenticated, (req, res) => {
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
app.post('/customerLogin', passport.authenticate('local', {
    successRedirect: '/customerPage',
    failureRedirect: '/adminLogin',
    failureFlash: true
}));
    
app.post('/customer/delete', (req,res) => {
        console.log('Got body:', req.user)
        var str = "DELETE FROM `users` WHERE (`internalID` = '" + req.user.id + "')";
        console.log(str);
        con.query(str);
        res.redirect('/adminLogin')
})

app.get('/customer/update', (req,res) =>{
        console.log('Got user:', req.user)
        con.query('SELECT * FROM users WHERE internalID = ' + req.user.id, (err,rows) => {
            console.log('Data received from Db:');
            console.log(rows);
            res.render('customerUpdate', {"data": rows})
        })
})

app.post('/customer/update/action',[
    body("fName").notEmpty().withMessage("You must input a First Name."),
    body("lName").notEmpty().withMessage("You must have a Last Name."),
    body("schoolID").notEmpty().isNumeric().isLength({min:7, max:7}).withMessage("School IDs are 7 digits long."),
    body("Role").notEmpty().withMessage("You must have a Role Selected."),
    body("Dept").notEmpty().withMessage("You must have a Department Selected.")
], (req,res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        for(let i = 0;i < errors.array().length;i++){
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect('/customer/update')
    }else{
        console.log('Got user:', req.user)
        var str = "UPDATE `users` SET `firstName` = '" + req.body.fName + "', `lastName` = '" + req.body.lName + "', `schoolID` = '" + req.body.schoolID + "', `staffRole` = '" + req.body.Role + "', `department` = '"+ req.body.Dept +"', `active` = '1' WHERE (`internalID` = '" + req.body.ID + "')";
        con.query(str);
        res.redirect("/customerPage");
    }
})

app.get('/feedback', checkAuthenticated, (req, res) =>{
    res.render('feedback');
});

app.post('/feedback/Insert',[
    body("feedback").notEmpty().withMessage("Feedback on your meeting would be very helpful.")
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("this is interesting: ", errors.array()[0])
        req.flash('err', errors.array()[0].msg)
        res.redirect('/feedback')
    }else{
        console.log('Got body:', req.user)
        res.send("This forms functinality has yet to be implemented.")
    }
});

app.get('/inactiveToggle', (req, res) =>{
    con.query('SELECT * FROM users', (err,rows) => {
        if(err) throw err;
        var act = -1;
        for(let i = 0; i < rows.length; i++){
            if(rows[i].internalID == req.user.id){
                if(Number(rows[i].active) == 1){
                    console.log(Number(rows[i].active))
                    act = 0;
                }else{
                    console.log(Number(rows[i].active))
                    act = 1;
                }
            }
        }
        console.log('act:', act)
        if (act === 1){
            req.flash('inactive', 'you now are inactive')
            var str = "UPDATE `users` SET `active` = '" + act + "' WHERE (`internalID` = '" + req.user.id + "')";
            con.query(str);
            res.redirect('/customerPage')
        }else{
            req.flash('active', 'you now are active')
            var str = "UPDATE `users` SET `active` = '" + act + "' WHERE (`internalID` = '" + req.user.id + "')";
            con.query(str);
            res.redirect('/customerPage')
        }
        
    })
})

app.get('/customerPage', checkAuthenticated, (req, res) =>{
    res.render('customerPage');
});

function checkAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return next();
    }
    res.redirect('adminLogin')
}

app.listen(3000);