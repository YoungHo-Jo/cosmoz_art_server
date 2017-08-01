var express = require('express'),
    jwt = require('express-jwt'),
    db = require('../db'),
    config = require('../config'),
    multer = require('multer'), // for image uploading
    Q = require('q'),
    gm = require('gm'),
    fs = require('fs'),
    datetime = require('node-datetime');
var router = express.Router();

var jwtCheck = jwt({
    secret: config.secretKey
});

// authorized request
router.use('/private', jwtCheck);



/**
 * Private Request
 * 
 * Add a new art into arts table
 * 
 */
router.post('/private/newart', function(req, res) {
    // accept json format
    req.accepts('application/json');

    // read json
    var jsonData = req.body;

    var userPK = jsonData.user_pk;
    var missionPK = jsonData.mission_pk;
    var imageURL = jsonData.image_url;
    var isPublic = jsonData.is_public;
    var date = datetime.create().format('Y-m-d H:M:S');
    

    if (!userPK || !missionPK || !imageURL || !isPublic) {
        res.status(400).send('You must send rqeuired data');
        return;
    }
    
    var item = {
        user_pk: userPK,
        mission_pk: missionPK,
        image_url: imageURL,
        date: date,
        is_public: isPublic
    };

    db.get().query('insert into arts set ?', [item], function(err, result) {
        if (err) {
            throw err;
        } else {
            res.status(201).send('Successfully add a new art');
            console.log(result);
        }
    });
});


/**
 * Private Request
 * 
 * Get arts for the user
 */
router.get('/private/get/:userPK', function(req, res) {
    var userPK = req.params.userPK;

    if (!userPK) {
        res.status(400).send('You muset send user primary key');
        return;
    }

    db.get().query('select * from arts where user_pk = ?', userPK, function(err, result) {
        if(err) {
            throw err;
        } else {
            res.status(201).json(result);
        }
    });
});


var imagePath = __dirname + '/upload';
/**
 * Upload a image
 */
router.post('/image/:filename', function(req, res, next) {
    upload(req, res).then(function(file) {
        // success
        res.status(201).json(file);
    }, function(err) {
        // fail
        console.log('Error in posting a file.');
        console.log(err);
        res.status(500).send(err);
    });
});


var upload = function(req, res) {
    var deferred = Q.defer();
    var storage = multer.diskStorage({
        // The folder for saveing uploaded files
        destination: function(req, file, cb) {
            cb(null, imagePath);
        },
        filename: function(req, file, cb) { // The name of file that will be uploaded into the server.
            file.uploadedFile = {
                name: req.params.filename,
                ext: file.mimetype.split('/')[1]
            };
            console.log(file.uploadedFile);

            cb(null, file.uploadedFile.name + '.' + file.uploadedFile.ext);
        }
    });

    var upload = multer({
        storage: storage
    }).any();
    upload(req, res, function(err) {
        if (err) {
            console.log(err);
            deferred.reject();
        } else {
            deferred.resolve(req.files.uploadedFile);
        }
    });
    return deferred.promise;
};


/**
 * Return Image 
 */
router.get('/image/:id', function(req, res) {
    var artPK = req.params.id;
    fs.readFile(imagePath + '/' + artPK + '.jpeg', function(err, data) {
        if (err) {
            console.log(err); // fail
            res.status(500).send('fail to load image');
        } else {
            res.writeHead(200, {
                'Content-Type': 'image/jpeg'
            });
            res.end(data); // Send the file data to the brower.
        }
    });
});

/**
 * 
 * Post a user's a like art
 */
router.post('/private/like-art', function(req, res) {
    req.accepts('application/json');
    
    var userPK = req.body.user_pk;
    var artPK = req.body.art_pk;
    var date = datetime.create().format('Y-m-d H:M:S');

    if(!userPK || !artPK) {
        res.status(400).send('you must send the user_pk and art_pk');
        return;
    }

    db.get().query('insert into user_like_art set ?', {
        user_pk: userPK,
        art_pk: artPK,
        date: date
    }, function(err, result) {
        if(err) {
            throw err;
        } else {
            res.status(201).send('Succcessfully added a like art');
        }
    });
});


/**
 * 
 * Get a user's like arts
 */
router.get('/private/like-art/:userid', function(req, res) {
    var userPK = req.params.userid;

    db.get().query('select * from user_like_art where user_pk = ?', userPK, function(err, result) {
        if(err) {
            throw err;
        } else {
            res.status(201).send('Suceess: Get a user\'s like arts');
        }
    });
});


module.exports = router;


/*
  #로그인 페이지
  ^ post /user (사용자 추가)
  get /user/after-signup/:verifying-code (인증코드 비교)
  get /user/signup/:email (이메일 중복 비교)
  post /user/login (로그인된 사용자 목록에 추가)


  #메인페이지
  get /mission/:id (특정 미션 보여주기) 
  ^ post /art (예술(=게시물) 추가)
  post /user/:id/likes/mission (좋아하는 미션목록에 등록)

  #공유페이지
  get /user/:id/art (특정 사용자(본인)가 올린 예술 보여주기)
  get /subject/:id/art (특정 예술과 같은 주제의 예술 보여주기)
  post /user/:id/likes/art (좋아하는 예술 목록에 등록)
  delete /user/:id/likes/art (좋아하는 예술 목록에서 삭제)

  #마이페이지
  get /user/:id/history (특정 사용자의 누적 시간, 그에 따른 문구 보여주기)
  get /user/:id/art (특정 사용자(본인)가 올린 모든 예술 보여주기;날짜 필요)
  get /user/:id/art? (특정 사용자가 올린 예술 중 선택한 유형에 해당하는 예술 보여주기)
  get /user/:id/likes/mission (특정 사용자가 좋아한 미션 보여주기)
  get /user/:id/likes/art (특정 사용자(본인)가 좋아한 예술 보여주기)
  get /user/:id/was-liked/art (특정 사용자의 예술 중 누군가 좋아한 예술 보여주기)

  #설정페이지
  get /user/:id (특정 사용자의 정보 보여주기)
  put /user/:id (특정 사용자의 정보 수정)

  #추가 필요
  (자동 로그인)
  (아이디 저장)
  (좋아하는 미션 목록에서 삭제?)

*/