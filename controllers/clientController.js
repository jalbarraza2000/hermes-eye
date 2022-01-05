const express = require("express")
const app = express()
const path = require('path');
var db = require('./database');


app.set('views', path.join(__dirname, 'views'));

//connect to SQL
// const connection = mysql.createConnection({
//     host: 'hermes-eye.c5rtjx1kw1dq.us-east-2.rds.amazonaws.com',
//     user: 'admin',
//     password: '2005B230bc',
//     database: 'hermes_eye'
// });

// connection.connect((err) => {
//     if (err) throw err;
//     console.log('Connected!');
// });

// exports.getClientHome = (req, res)=>{

// }

// exports.getClientOrders = (req, res)=>{

// }

// exports.getClientNotifications = (req, res)=>{

// }

// exports.getClientProfile = (req, res)=>{

// }