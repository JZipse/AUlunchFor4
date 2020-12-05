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
const { body, validationResult } = require('express-validator');
const methodOverride = require('method-override');
const { Console } = require('console');
const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'aulffour@gmail.com',
      pass: 'Aulforfour4'
    }
  });



initializePassport(
    passport,
    email => customers.find(user => user.email === email),
    id => customers.find(user => user.id === id)
);

const customers = [];
const meeting = [];
var gnumMeetings = 0;
var bnumMeetings = 0;

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
app.use(methodOverride('_method'))


// forgot password functionalsity.
app.get('/update/password', (req, res) => {
    res.render('PasswordUpdate')
})

app.post('/update/password/action', [
    body("email").notEmpty().isEmail().withMessage("Input Email for Updating your Password."),
    body("password").notEmpty().isLength({ min: 4, max: 14 }).withMessage("Input a new Pass word that is 4-14 digits long")
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        for (let i = 0; i < errors.array().length; i++) {
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect('/update/password')
    } else {
        console.log('Got body:', req.body)
        con.query('SELECT EMAIL FROM users', async (err, rows) => {
            console.log('data: ', rows)
            var pass;

            if (err) throw err;
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].EMAIL == req.body.email) {
                    pass = req.body.password;
                }
            }

            console.log("pass: ", pass)
            if (pass != null) {
                // having trouble getting this to work.
                console.log('Got body:', pass)
                const hashedPassword = await bcrypt.hash(pass, 10);
                let str = "UPDATE `users` SET password = '" + hashedPassword + "' where `email` = '" + req.body.email + "'";
                console.log(str)
                con.query(str)
                res.redirect('/adminLogin')
                //customers.length = 0;
            } else {
                console.log(pass != null)
                req.flash('noAccount', 'No Account has been made for that Email.')
                res.redirect('/update/password')
            }
        })
    }
})

// admin functionality begins here.
app.get('/form', (req, res) => {
    res.render('form');
});

app.post('/formaction', [
    body("fName").notEmpty().withMessage("Must have a First Name."),
    body("lName").notEmpty().withMessage("Must have a Last Name."),
    body("ID").notEmpty().isLength({ min: 7, max: 7 }).withMessage("Your school's ID's are 7 digits Long."),
    body("Email").notEmpty().isEmail().withMessage("You must input a proper email address."),
    body("password").notEmpty().isLength({ min: 4, max: 14 }).withMessage("You must have password that is 4-14 characters in length."), body("Role").notEmpty().withMessage("you must have a role."),
    body("Dept").notEmpty().withMessage("You must have a department.")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        for (let i = 0; i < errors.array().length; i++) {
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect('/form')
    } else {
        console.log('Got body:', req.body)
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        var str = "INSERT INTO `users` (`firstName`, `lastName`, `schoolID`, `email`, `password`, `staffRole`, `department`, `active`) VALUES ('" + req.body.fName + "', '" + req.body.lName + "', '" + req.body.ID + "', '" + req.body.Email + "', '" + hashedPassword + "', '" + req.body.Role + "', '" + req.body.Dept + "', '1')";
        console.log(str);
        con.query(str);
        res.redirect('/adminLogin')
    }
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

app.post('/form/delete/action', [
    body("ID").notEmpty().isNumeric().withMessage("something went wrong with the application ID was not found.")

], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        for (let i = 0; i < errors.array().length; i++) {
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect('/form/delete')
    } else {
        console.log('Got body:', req.body)
        var str = "DELETE FROM `users` WHERE (`internalID` = '" + req.body.ID + "')";
        console.log(str);
        con.query(str);
        res.redirect('/adminPage')
    }
})


app.post('/reports', checkAuthenticated, (req, res) => {
    
    res.render('reports', {"gnumMeetings" : gnumMeetings, "bnumMeetings": bnumMeetings});
})

app.get('/generateMeetings', checkAuthenticated, (req, res) => {
    con.query("SELECT DATE_FORMAT(meetDate, '%Y-%m-%d') AS meetDate, meetingID, meetingLeader, member2, member3, member4, member5  from meetings", function (err, rows, fields) {
        if (err) throw err
        res.render('generateMeetings', {
            title: 'Meetings',
            items: rows
        })
    });
});

app.post('/newMeeting', async (req, res) => {
   generateMeeting(res,req)
});

app.get('/adminLogin', checkNotAuthenticated, (req, res) => {
    customers.length = 0;
    con.query('SELECT internalID, EMAIL, PASSWORD, ISADMIN FROM users', (err, rows) => {
        if (err) throw err;
        console.log('Data received from Db:');
        for (let i = 0; i < (rows.length); i++) {
            const user = { email: rows[i].EMAIL, password: rows[i].PASSWORD, id: rows[i].internalID, admin: rows[i].ISADMIN };
            customers.push(user);
        }
    });
    setTimeout(function () { res.render('adminLogin') }, 100);
});

app.get('/adminPage', checkAuthenticated, checkRole(1), (req, res) => {
    let gMeetings = "SELECT COUNT(meetDate) AS count from meetings where meetDate != '0000-00-00'"
        con.query(gMeetings, function(err, res) {
        if (err) throw err
        gnumMeetings = res[0].count;
        console.log(gnumMeetings);
    });
    let bMeetings = "SELECT COUNT(meetDate) AS count from meetings where meetDate = '0000-00-00'"
        con.query(bMeetings, function(err, res) {
        if (err) throw err
        bnumMeetings = res[0].count;
        console.log(bnumMeetings);
    });
    res.render('adminPage');
})


app.post('/adminLogin', passport.authenticate('local', {
    successRedirect: '/adminPage',
    failureRedirect: '/adminLogin',
    failureFlash: true
}));

// Customer functionality begins here.
app.post('/customerLogin', passport.authenticate('local', {
    successRedirect: '/customerPage',
    failureRedirect: '/adminLogin',
    failureFlash: true
}));


app.post('/customer/delete', (req, res) => {
    console.log('Got body:', req.user)
    var str = "DELETE FROM `users` WHERE (`internalID` = '" + req.user.id + "')";
    console.log(str);
    con.query(str);


})

app.get('/customer/update', (req, res) => {
    console.log('Got user:', req.user)
    con.query('SELECT * FROM users WHERE internalID = ' + req.user.id, (err, rows) => {
        console.log('Data received from Db:');
        console.log(rows);
        res.render('customerUpdate', { "data": rows })
    })
})

app.post('/customer/update/action', [
    body("fName").notEmpty().withMessage("You must input a First Name."),
    body("lName").notEmpty().withMessage("You must have a Last Name."),
    body("schoolID").notEmpty().isNumeric().isLength({ min: 7, max: 7 }).withMessage("School IDs are 7 digits long."),
    body("Role").notEmpty().withMessage("You must have a Role Selected."),
    body("Dept").notEmpty().withMessage("You must have a Department Selected.")
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        for (let i = 0; i < errors.array().length; i++) {
            console.log("test: ", "param: " + errors.array()[i].param + "msg: " + errors.array()[i].msg)
            req.flash(errors.array()[i].param, errors.array()[i].msg)
        }
        res.redirect('/customer/update')
    } else {
        console.log('Got user:', req.user)
        var str = "UPDATE `users` SET `firstName` = '" + req.body.fName + "', `lastName` = '" + req.body.lName + "', `schoolID` = '" + req.body.schoolID + "', `staffRole` = '" + req.body.Role + "', `department` = '" + req.body.Dept + "', `active` = '1' WHERE (`internalID` = '" + req.body.ID + "')";
        con.query(str);
        res.redirect("/customerPage");
    }
})

app.get('/feedback', checkAuthenticated, (req, res) => {
    var id = req.user.id;
    var mID = "";
    var meetingID = con.query("SELECT meetingID from meetings LEFT OUTER JOIN " +
        "comments ON meetingID = comments.meetID " +
        "WHERE (meetingID IS NULL OR comments.meetID IS NULL) AND (meetingLeader = " + id + " " +
        "OR member2 = " + id + " " +
        "OR member3 = " + id + " " +
        "OR member4 = " + id + " " +
        "OR member5 = " + id + ")" +
        "UNION " +
        "SELECT meetingID from meetings RIGHT OUTER JOIN " +
        "comments ON meetingID = comments.meetID " +
        "WHERE (meetingID IS NULL OR comments.meetID IS NULL) AND (meetingLeader = " + id + " " +
        "OR member2 = " + id + " " +
        "OR member3 = " + id + " " +
        "OR member4 = " + id + " " +
        "OR member5 = " + id + ")",
        (err, rows) => {
            if (err) throw err;
            if (rows.length == 0) {
                console.log("No meetings to comment on...");
                res.redirect("/customerPage");
            }
            else {
                let dataV = { meetingID: rows[0].meetingID }
                res.render('feedback', dataV);
            }
        });
})

app.post('/feedback/Insert', [
    body("feedback").notEmpty().withMessage("Feedback on your meeting would be very helpful.")
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("this is interesting: ", errors.array()[0])
        req.flash('err', errors.array()[0].msg)
        res.redirect('/feedback')
    } else {
        var id = req.user.id;
        let meetDate = req.body.meetDate
        var mID = "";
        var meetingID = con.query("SELECT meetingID from meetings LEFT OUTER JOIN "+
        "comments ON meetingID = comments.meetID "+
        "WHERE (meetingID IS NULL OR comments.meetID IS NULL) AND (meetingLeader = " + id + " "+
            "OR member2 = "+ id + " " +
            "OR member3 = "+ id + " " +
            "OR member4 = "+ id + " " +
            "OR member5 = "+ id + ")"+
        "UNION "+
        "SELECT meetingID from meetings RIGHT OUTER JOIN "+
        "comments ON meetingID = comments.meetID "+
        "WHERE (meetingID IS NULL OR comments.meetID IS NULL) AND (meetingLeader = "+ id + " "+
            "OR member2 = "+ id + " " +
            "OR member3 = "+ id + " " +
            "OR member4 = "+ id + " " +
            "OR member5 = "+ id + ")", (err,rows)=>{
                if(err) throw err;
                mID=(rows[0].meetingID).toString();
                var str = "INSERT INTO `comments` (`meetID`, `memberID`, `comment`) VALUES ("+ mID+ "," + req.user.id + ",'" + req.body.feedback+"')";
                //console.log("Got Date" + req.body.meetDate);
                var updateMeet = "UPDATE meetings SET meetDate = ' " + meetDate + " ' where (`meetingID` = " + mID + ")"
                con.query(str);
                con.query(updateMeet);
                res.redirect('/customerPage')
            });
    }
});

app.get('/inactiveToggle', (req, res) => {
    con.query('SELECT * FROM users', (err, rows) => {
        if (err) throw err;
        var act = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].internalID == req.user.id) {
                if (Number(rows[i].active) == 1) {
                    console.log(Number(rows[i].active))
                    act = 0;
                } else {
                    console.log(Number(rows[i].active))
                    act = 1;
                }
            }
        }
        console.log('act:', act)
        if (act === 1) {
            req.flash('active', 'you now are active')
            var str = "UPDATE `users` SET `active` = '" + act + "' WHERE (`internalID` = '" + req.user.id + "')";
            con.query(str);
            res.redirect('/customerPage')
        } else {
            req.flash('inactive', 'you now are inactive')
            var str = "UPDATE `users` SET `active` = '" + act + "' WHERE (`internalID` = '" + req.user.id + "')";
            con.query(str);
            res.redirect('/customerPage')
        }
    })
})

app.get('/customerPage', checkAuthenticated, (req, res) => {
    con.query("SELECT meetingLeader from meetings WHERE meetingLeader = "
    + req.user.id + " AND meetDate = '0000-00-00'",
    (err,rows)=>{
    if(err) throw err;
    console.log(rows);
    if(rows.length == 0){
        console.log("R1");
        let dataV = {leader : 0}
        res.render('customerPage', dataV);    
    }
    else{
        console.log("R2");
        let dataV = {leader : 1}
        res.render('customerPage', dataV);
    }
    });
});

app.post('/meetingHistory', (req, res) => {
    con.query(`SELECT DATE_FORMAT(meetDate, '%Y-%m-%d') AS meetDate, meetingID, meetingLeader, member2, member3, member4, member5  from meetings where meetingLeader = ${req.user.id} or member2 = ${req.user.id} or member3 = ${req.user.id} or member4 = ${req.user.id} or member5 = ${req.user.id};`,
        (err, rows) => {
            if (err) throw err;
            res.render('meetingHistory', { meetings: rows });
        });
})

app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/adminLogin');
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/adminLogin')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/customerPage')
    }
    next()
}

function checkRole(role) {
    return (req, res, next) => {
        if (req.user.admin !== role) {
            return res.redirect('/adminLogin')
        }
        next()
    }
}

function generateMeeting(res, req){
    var meeting = [];
    con.query("SELECT count(*) AS count FROM lunch44F2020.users WHERE active = 1;", function (err, results1) {
        var remain = results1[0].count % 4;
        var loops;
        if (results1[0].count > 3) {
            if (results1[0].count == 6) {
                loops = 3;
            } else {
                if (remain == 1) {
                    loops = 5;
                } else if (remain == 2) {
                    loops = 4;
                } else if (remain == 3) {
                    if (results1[0].count > 3) {
                        loops = 4;
                    } else {
                        loops = 3;
                    }
                } else {
                    loops = 4;
                }
            }

            con.query("SELECT internalID, firstName, lastName, email FROM users WHERE active = 1 ORDER BY RAND() LIMIT " + loops + ";", function (err, result, fields) {
                if (err) throw err;
                for (i = 0; i < loops; i++) {
                    console.log(result[i].internalID);
                    meeting.push(result[i]);
                    con.query("UPDATE users SET active = 0 WHERE (`internalID` = '" + result[i].internalID + "')");
                }
                console.log(meeting);
                if (loops == 5) {
                    con.query("INSERT INTO `meetings`(`meetDate`, `meetingLeader`, `member2`, `member3`, `member4`, `member5`) VALUES('" + null + "', '" + meeting[0].internalID + "', '" + meeting[1].internalID + "', '" + meeting[2].internalID + "', '" + meeting[3].internalID + "','" + meeting[4].internalID + "')");
                    var mailOptions = {
                        from: 'AULFFOUR@gmail.com',
                        to: `${meeting[0].email},${meeting[1].email},${meeting[2].email},${meeting[3].email},${meeting[4].email}`,
                        subject: 'Your scheduled AUL44 Meeting.',
                        text: `Meeting Leader: ${meeting[0].firstName}  ${meeting[0].lastName} \nMember2: ${meeting[1].firstName} ${meeting[1].lastName} \nMember 3: ${meeting[2].firstName} ${meeting[2].lastName} \nMember 4: ${meeting[3].firstName} ${meeting[3].lastName} \nMember 5: ${meeting[4].firstName} ${meeting[4].lastName}`
                      };
                } else if (loops == 4) {
                    con.query("INSERT INTO `meetings`(`meetDate`, `meetingLeader`, `member2`, `member3`, `member4`, `member5`) VALUES('" + null + "', '" + meeting[0].internalID + "', '" + meeting[1].internalID + "', '" + meeting[2].internalID + "', '" + meeting[3].internalID + "','" + null + "' )");
                    var mailOptions = {
                        from: 'AULFFOUR@gmail.com',
                        to: `${meeting[0].email},${meeting[1].email},${meeting[2].email},${meeting[3].email}`,
                        subject: 'Your scheduled AUL44 Meeting.',
                        text: `Meeting Leader: ${meeting[0].firstName}  ${meeting[0].lastName} \nMember2: ${meeting[1].firstName} ${meeting[1].lastName} \nMember 3: ${meeting[2].firstName} ${meeting[2].lastName} \nMember 4: ${meeting[3].firstName} ${meeting[3].lastName}`
                      };
                } else {
                    con.query("INSERT INTO `meetings`(`meetDate`, `meetingLeader`, `member2`, `member3`, `member4`, `member5`) VALUES('" + null + "', '" + meeting[0].internalID + "', '" + meeting[1].internalID + "', '" + meeting[2].internalID + "', '" + null + "','" + null + "' )");
                    var mailOptions = {
                        from: 'AULFFOUR@gmail.com',
                        to: `${meeting[0].email},${meeting[1].email},${meeting[2].email}`,
                        subject: 'Your scheduled AUL44 Meeting.',
                        text: `Meeting Leader: ${meeting[0].firstName}  ${meeting[0].lastName} \nMember2: ${meeting[1].firstName} ${meeting[1].lastName} \nMember 3: ${meeting[2].firstName} ${meeting[2].lastName}`
                      };
                }
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email sent: ' + info.response);
                    }
                  });

            });
            res.redirect('/generateMeetings')
            res.end()

        } else {
            console.log("Not Enough Users For Meeting")
            res.redirect('/generateMeetings')
            res.end()
        }
       
    });
}

app.listen(3000);
