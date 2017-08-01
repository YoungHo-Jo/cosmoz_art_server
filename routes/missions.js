var express = require('express'),
    jwt = require('express-jwt'),
    db = require('../db'),
    config = require('../config'),
    datetime = require('node-datetime');
var router = express.Router();

var jwtCheck = jwt({
    secret: config.secretKey
});

// authorized request
router.use('/private', jwtCheck);

/**
 * Update a user's a like mission
 */
router.put('/private/like', function(req, res) {
    req.accepts('application/json');

    var userPK = req.body.user_pk;
    var missionPK = req.body.mission_pk;

    if(!userPK || !missionPK) {
        res.status(400).send('You must send the user_pk and mission_pk');
        return;
    }

    db.get().query('update user_done_mission set is_like = 1 where user_pk = ? && mission_pk = ?', [userPK, missionPK], function(err, result) {
        if(err) {
            throw err;
        } else {
            res.status(201).send('Success: post/private/like');
            console.log(result);
        }
    });
});


/**
 * Update a user's a mission to dislike mission
 */
router.put('/private/dislike', function(req, res) {
    req.accepts('application/json');

    var userPK = req.body.user_pk;
    var missionPK = req.body.mission_pk;

    if(!userPK || !missionPK) {
        res.status(400).send('You must send the user_pk and mission_pk');
        return;
    }

    db.get().query('update user_done_mission set is_like = 0 where user_pk = ? && mission_pk = ?', [userPK, missionPK], function(err, result) {
        if(err) {
            throw err;
        } else {
            res.status(201).send('Success: post/private/dislike');
            console.log(result);
        }
    });
});


/**
 * Post a user's a done mission
 */
router.post('/private/done', function(req, res) {
    req.accepts('application/json');

    var userPK = req.body.user_pk;
    var missionPK = req.body.mission_pk;
    var isLike = req.body.is_like;
    var date = datetime.create().format('Y-m-d H:M:S');

    if(!userPK || !missionPK || !isLike) {
        res.status(400).send('You must send the user_pk, mission_pk and is_like');
        return;
    }

    var doneMission = {
        user_pk: userPK,
        mission_pk: missionPK,
        date: date,
        is_like: isLike
    };

    db.get().query('insert into user_done_mission set ?', [doneMission], function(err, result){
        if(err) {
            throw err;
        } else {
            res.status(201).send('Success: post/private/done');
        }
    });
});


/**
 * Get a user's done missions
 */
router.get('/private/:userpk', function(req, res) {
    var userPK = req.params.userpk;

    if(!userPK) {
        res.status(400).send('You must send the user_pk');
        return;
    }
    db.get().query('select * from user_done_mission where user_pk = ?', userPK, function(err, result) {
        if(err) {
            throw err;
        } else {
            res.status(201).json(result);
            console.log(result);
        }
    }); 
});








module.exports = router;