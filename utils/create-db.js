const mysql = require("mysql");
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
})
connection.connect((err) => {
    if (err) {
        console.error("Something went wrong while connecting to mysql with error " + error);
    }
    console.log("Connection to mysql successfull");
    createDatabase();
    selectDatabase();
    createScopeTable("hackerone");
    createProgramTable("hackerone");
    connection.end((error) => {
        if (error) {
            console.error("Error whule terminating mysql connection " + error);
            throw error;
        }
        console.log("Mysql connection termination successfull after creating tables");
    });
})

function createDatabase() {
    connection.query("CREATE DATABASE IF NOT EXISTS bounties", (error, results, fields) => {
        if (error) {
            console.error("Error while creating database");
            throw error;
        }
    })
}

function selectDatabase() {
    connection.query("USE bounties", (error, results, fields) => {
        if (error) {
            console.error("Error while selecting database");
            throw error;
        }
    })
}

function createScopeTable(tablename) {
    let query = `CREATE TABLE IF NOT EXISTS ${tablename}_scope (
                id int(30) NOT NULL AUTO_INCREMENT,
                domain varchar(255) NOT NULL,
                handle varchar(150) NOT NULL,                
                PRIMARY KEY (id),
                UNIQUE KEY domain (domain)
                ) ENGINE=InnoDB DEFAULT CHARSET=latin1`
    connection.query(query, (error, results, fields) => {
        if (error) {
            console.error(`Error while creating scope table for ${tablename} ` + error);
            throw error;
        }
    })
}

function createProgramTable(tablename) {
    let query = `CREATE TABLE IF NOT EXISTS ${tablename} (
                id int(30) NOT NULL AUTO_INCREMENT,
                name varchar(150) NOT NULL,
                handle varchar(150) NOT NULL,
                launch_date datetime NOT NULL,
                main_domain longtext DEFAULT "{}",
                reports_resolved_last_90 int(30) DEFAULT 0,
                bounties_paid_last_90 int(30) DEFAULT 0,
                low int(30) DEFAULT 0,
                avg int(30) DEFAULT 0,
                high int(30) DEFAULT 0,
                in_scope int(10) DEFAULT 0,
                last_report_resolved datetime DEFAULT NOW(),
                PRIMARY KEY (id),
                UNIQUE KEY handle (handle)
                ) ENGINE=InnoDB DEFAULT CHARSET=latin1`
    connection.query(query, (error, results, fields) => {
        if (error) {
            console.error(`Error while creating program table for ${tablename} ` + error);
            throw error;
        }
    })
}