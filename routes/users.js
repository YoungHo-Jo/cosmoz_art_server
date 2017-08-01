var express = require('express'),
    _ = require('lodash'),
    config = require('../config'),
    jwt = require('jsonwebtoken'),
    db = require('../db');

var app = module.exports = express.Router();

/*
    Create a token for user authorization.
    This token is stored in client and used to request private methods.
*/
function createToken(userId) {
    //  config.secretKey: will keep a secret key for encoding user token after logged in.
    return jwt.sign(_.omit(userId, 'password'), config.secretKey, {
        expiresIn: 60 * 60 * 5
    });
}

/*
    Get user information in database matching with user email.
*/
function getUserDB(userId, done) {
    db.get().query('select * from users where id = ? LIMIT 1', [userId], function (err, rows, fields) {
        if (err) {
            throw err;
        }
        done(rows[0]);
    });
}

/*
    Create a hash code. 
    The hash code is used to authorize the user email.
*/
function createHashCode(input) {
    var hashkey = "my hash Key";

    return hashcoder().value(input + hashkey);
}

/*
    Create a new user.

    First, a new user information is inserted into database. 
    And then, we have to check the user email is verified.
    So, using node mailer and gamil server, we send a mail with the verification URL.
    If the user email is valid, the user can open that url
         and the server update email_checkd value to 1.
*/
app.post('/user/create', function (req, res) {
    req.accepts('application/json');


    var id = req.body.id;
    var pw = req.body.password;
    var nickname = req.body.nickname;

    if (!id || !pw || !nickname) {
        return res.status(400).send("You must send the username, password and nickname");
    }

    // Check if there is a same email address.
    getUserDB(id, function (user) {
        // There is no same email address.
        if (!user) {
            user = {
                id: id,
                pw: pw,
                nickname: nickname,
            };

            db.get().query('insert into users set ? ', [user], function (err, result) {
                if (err) {
                    throw err;
                } else {
                    res.status(201).send('Successfully created a user');
                }


            });
        } else {
            res.status(400).send("A user with that email already exists");
        }
    });
});

/*
    Login api.
    Input data type is json.
        id
        passwrod
    The passwrod is encryted in client side. So no one can know the real value of the password
        except only the user.
        We just compare this encryted value with the stored encryted value.
*/
app.post('/user/login', function (req, res) {
    req.accepts('application/json');
    console.log('requset: user login');

    var id = req.body.id;
    var pw = req.body.pw;

    // Error handling
    if (!id || !pw) {
        return res.status(400).send("You must send the id and password.");
    }

    getUserDB(id, function (user) {
        if (!user) {
            return res.status(401).send("The id is not existing");
        }
        if (user.pw !== pw) {
            return res.status(401).send("The id or password don't match");
        }
        // Success.
        res.status(201).send({
            id_token: createToken(user),
            id: user.pk
        });
    });
});

/**
 * Check if there is a same id
 */
app.get('/user/check/:id', function (req, res) {
    var id = req.params.id;

    if (!id) {
        return res.status(400).send("You must send a id");
    }

    getUserDB(id, function (user) {
        if (!user) {
            res.status(201).send({
                id: "OK"
            });
        } else {
            res.status(400).send("A user with that id already exists");
        }
    });

});