if (process.env.NODE_ENV !== 'production') {
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

initializePassport(
    passport,
    email => customers.find(user => user.email === email),
    id => customers.find(user => user.id === id)
);

const customers = [];
const meeting = [];

const con = mysql.createConnection({
    host: "45.55.136.114",
    user: "lunch44F2020",
    password: "luncht1me",
    database: "lunch44F2020"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

const app = express();
app.set('view engine', 'pug');
app.set('views', '../views');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())






// admin functionality begins here
app.get('/form', (req, res) => {
    res.render('form');
});

app.post('/formaction', async (req, res) => {

    console.log('Got body:', req.body)
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    var str = "INSERT INTO `users` (`firstName`, `lastName`, `schoolID`, `email`, `password`, `staffRole`, `department`, `previousLeader`, `active`) VALUES ('" + req.body.fName + "', '" + req.body.lName + "', '" + req.body.ID + "', '" + req.body.Email + "', '" + hashedPassword + "', '" + req.body.Role + "', '" + req.body.Dept + "', '0', '1')";
    console.log(str);
    con.query(str);
    res.redirect('/adminLogin')
})

app.get('/form/delete', (req, res) => {
    con.query('SELECT * FROM users', (err, rows) => {
        if (err) throw err;

        console.log(rows.password);

        console.log('Data received from Db:');
        console.log(rows);

        res.render('DeleteUser', { "users": rows });
    });
})

app.post('/form/delete/action', (req, res) => {
    console.log('Got body:', req.body)
    var str = "DELETE FROM `users` WHERE (`internalID` = '" + req.body.ID + "')";
    console.log(str);
    con.query(str);
    res.redirect('/adminPage')
})

app.get('/reports', checkAuthenticated, (req, res) => {
    res.render('Reports')
})

app.get('/generateMeetings', (req, res) => {
    res.render('generateMeetings')
});

app.post('/newMeeting', async (req, res) => {
    var meeting = [];
    con.query("SELECT count(*) AS count FROM lunch44F2020.users", function (err, results) {
        var remain = results[0].count % 4;
        var loops;
        if (results[0].count < 3) {
            console.log("Not Enough Users For Meeting")
        } else {
            if (remain == 1) {
                loops = 5;
            } else if (remain == 2) {
                loops = 4;
            } else if (remain == 3) {
                if (results[0].count > 3) {
                    loops = 4;
                } else {
                    loops = 3;
                }
            } else {
                loops = 4;
            }
        }

        console.log("Loop:" + loops);
        console.log(remain);
        console.log(results[0].count);
    })
    // con.query("SELECT internalID FROM users WHERE active = 1 ORDER BY RAND() LIMIT 4;", function (err, result, fields) {
    //     if (err) throw err;
    //console.log(result[0].internalID);
    //     meeting.push(result[0].internalID);
    //     meeting.push(result[1].internalID);
    //     meeting.push(result[2].internalID);
    //     meeting.push(result[3].internalID);
    //     for (i = 0; i <= 3; i++) {
    //         con.query("UPDATE users SET active = 0 WHERE (`internalID` = '" + result[i].internalID + "')");
    //     }

    //     con.query("INSERT INTO `meetings`(`meetDate`, `member1`, `member2`, `member3`, `member4`) VALUES('" + null + "', '" + meeting[0] + "', '" + meeting[1] + "', '" + meeting[2] + "', '" + meeting[3] + "')");
    // });
    res.redirect('/generateMeetings')
});

app.get('/adminLogin', (req, res) => {
    res.render('adminLogin');
    con.query('SELECT internalID, EMAIL, PASSWORD FROM users', (err, rows) => {

        if (err) throw err;
        console.log('Data received from Db:');
        //console.log(rows);
        for (let i = 0; i < (rows.length); i++) {
            const user = { email: rows[i].EMAIL, password: rows[i].PASSWORD, id: rows[i].internalID };
            //console.log(user);
            customers.push(user);
        }
        //console.log(customers);
    });
});

app.get('/adminPage', (req, res) => {
    res.render('adminPage');

});

app.post('/adminLogin', (req, res) => {
    //console.log('Got Body:', req.body);

    const adminUser = "user";
    const adminPass = "pass";
    if (req.body.user == adminUser && req.body.pass == adminPass) {
        res.redirect('/adminPage');
    } else {
        res.send("Wrong Username or Passord for Admin");
    }
});


// Customer functionality begins here.


app.post('/customerLogin', passport.authenticate('local', {
    successRedirect: '/customerPage',
    failureRedirect: '/adminLogin',
    failureFlash: true
}));

app.post('/customer/delete', (req, res) => {
    console.log('Got body:', req.body)
    var str = "DELETE FROM `users` WHERE (`internalID` = '" + req.body.ID + "')";
    console.log(str);
    con.query(str);
    res.redirect('/adminLogin')
})

app.post('/customer/update', (req, res) => {
    console.log('Got user:', req.user)
    con.query('SELECT * FROM users WHERE internalID = ' + req.user.id, (err, rows) => {
        console.log('Data received from Db:');
        console.log(rows);
        res.render('customerUpdate', { "data": rows })
    })
})

app.post('/customer/update/action', (req, res) => {
    console.log('Got body:', req.body)
    var str = "UPDATE `users` SET `firstName` = '" + req.body.fName + "', `lastName` = '" + req.body.lName + "', `schoolID` = '" + req.body.schoolID + "', `email` = '" + req.body.Email + "', `password` = '" + req.body.password + "', `staffRole` = '" + req.body.Role + "', `department` = '" + req.body.Dept + "', `active` = '1' WHERE (`internalID` = '" + req.body.ID + "')";
    con.query(str);
    res.redirect("/customerPage");

})

app.get('/feedback', checkAuthenticated, (req, res) => {
    res.render('feedback');
});

app.post('/feedback/Insert', (req, res) => {
    console.log('Got body:', req.body)
});

app.get('/customerPage', checkAuthenticated, (req, res) => {
    res.render('customerPage');
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('adminLogin')
}

app.listen(3000);