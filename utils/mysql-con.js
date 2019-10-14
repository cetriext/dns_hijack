var mysql = require('mysql');
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: "bounties",
    queueLimit: 600,
    connectionLimit: 100
});
module.exports = pool;