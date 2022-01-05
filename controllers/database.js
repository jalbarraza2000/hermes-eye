const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'hermes-eye.c5rtjx1kw1dq.us-east-2.rds.amazonaws.com',
    user: 'admin',
    password: '2005B230bc',
    database: 'hermes_eye'
  });

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
  });

  module.exports = connection;