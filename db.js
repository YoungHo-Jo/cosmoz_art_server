var mysql = require('mysql');
var pool = null;

exports.connect = function() {
    pool = mysql.createPool({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 's014700!',
        database: 'art'
    });
};

exports.get = function() {
    return pool;
};