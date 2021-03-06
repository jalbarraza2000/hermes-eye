const express = require("express")
const app = express()
const path = require('path');
var db = require('./database');
const { body, validationResult } = require('express-validator')
const bcrypt = require("bcryptjs")

app.set('views', path.join(__dirname, 'views'));

// //connect to SQL
// const db = mysql.createdb({
//     host: 'hermes-eye.c5rtjx1kw1dq.us-east-2.rds.amazonaws.com',
//     user: 'admin',
//     password: '2005B230bc',
//     database: 'hermes_eye'
// });

// db.connect((err) => {
//     if (err) throw err;
//     console.log('Connected!');
// });

exports.getIndex = (req, res)=>{    

    if(req.session.username){
        db.query(`SELECT SUM(readStatus+readPendStatus) AS notifs FROM adminNotif WHERE username = '${req.session.username}' `, (err, row) => {
            if(err) throw err;
            
            req.session.notifs = row[0].notifs;

            if(req.session.isOwner){
                db.query("SELECT o.orderID, c.branch FROM orders o JOIN clients c ON o.clientID = c.clientID WHERE status = 'For Approval' LIMIT 3;", (err, forApprove) => {
                    if(err) throw err;

                    db.query("SELECT o.orderID, c.branch FROM orders o JOIN clients c ON o.clientID = c.clientID WHERE status = 'In Transit' ORDER BY o.shippedOn DESC LIMIT 3;", (err, inTransit) => {
                        if (err) throw err;

                        db.query("SELECT o.orderID, c.branch FROM orders o JOIN clients c ON o.clientID = c.clientID WHERE status = 'Delivered' ORDER BY o.completedOn DESC LIMIT 3;", (err, delivered) => {
                            if (err) throw err;

                            db.query("SELECT COUNT(*) AS deliveredOrders, TIME_FORMAT(SEC_TO_TIME(AVG(TIME_TO_SEC(TIMEDIFF(o.completedOn, o.shippedOn)))), '%H:%i:%s') AS avgtimediff FROM hermes_eye.orders o JOIN hermes_eye.clients c ON o.clientID = c.clientID WHERE shippedOn IS NOT NULL AND completedOn IS NOT NULL;", (err, avgTime) => {
                                if(err) throw err;

                                db.query("SELECT c.branch, TIME_FORMAT(SEC_TO_TIME(AVG(TIME_TO_SEC(TIMEDIFF(o.completedOn, o.shippedOn)))), '%H:%i:%s') AS avgtimediff FROM hermes_eye.orders o JOIN hermes_eye.clients c ON o.clientID = c.clientID WHERE shippedOn IS NOT NULL AND completedOn IS NOT NULL GROUP BY c.branch ORDER BY c.branch LIMIT 7;", (err, result) => {
                                    if (err) throw err;

                                    db.query("SELECT * FROM issues LIMIT 5;", (err, issues) => {
                                        if (err) throw err;
                                        
                                        db.query("SELECT COUNT(*) AS monthlyOrders FROM orders o WHERE MONTH(completedOn) = MONTH(CURRENT_DATE) AND completedOn IS NOT NULL;", (err, monthlyDelivery) => {
                                            if (err) throw err;

                                            db.query("SELECT COUNT(*) AS num FROM issues WHERE status = 'On Going';", (err, ongoing) => {
                                                if (err) throw err;
                                                
                                                db.query("SELECT COUNT(*) AS num FROM issues WHERE status = 'Resolved';", (err, resolved) => {
                                                    if (err) throw err;
                                                    res.render("home.hbs", {
                                                        firstname: req.session.firstname,
                                                        lastname: req.session.lastname,
                                                        notifs : req.session.notifs,
                                                        forApprove: forApprove,
                                                        inTransit : inTransit,
                                                        delivered : delivered,
                                                        avgTime: avgTime[0].avgtimediff,
                                                        compOrders: avgTime[0].deliveredOrders,
                                                        result: result,
                                                        issues: issues,
                                                        monthly: monthlyDelivery[0].monthlyOrders,
                                                        resolved: resolved[0].num,
                                                        ongoing: ongoing[0].num,
                                                        totalIssues: resolved[0].num + ongoing[0].num
                                                    }) 
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }


            else if(req.session.isAdmin){
                db.query("SELECT u.username, u.firstname, u.lastname, u.role FROM users u WHERE u.status = 'Active' AND u.userID > 0;", (err, activeUsers) => {
                    if (err) throw err;

                    res.render("home-admin.hbs", {
                        firstname: req.session.firstname,
                        lastname: req.session.lastname,
                        notifs : req.session.notifs,
                        activeUsers: activeUsers
                    })
                });
            }
            else if(req.session.isSales){
                db.query("SELECT o.orderID, c.branch FROM orders o JOIN clients c ON o.clientID = c.clientID WHERE status = 'For Approval' LIMIT 3;", (err, forApprove) => {
                    if(err) throw err;

                    db.query("SELECT o.orderID, c.branch FROM orders o JOIN clients c ON o.clientID = c.clientID WHERE status = 'In Transit' ORDER BY o.shippedOn DESC LIMIT 3;", (err, inTransit) => {
                        if (err) throw err;

                        db.query("SELECT o.orderID, c.branch FROM orders o JOIN clients c ON o.clientID = c.clientID WHERE status = 'Delivered' ORDER BY o.completedOn DESC LIMIT 3;", (err, delivered) => {
                            if (err) throw err;

                            db.query("SELECT c.branch, c.contactNum FROM clients c", (err, clients) => {
                                if(err) throw err;

                                db.query("SELECT p.brand, p.modelNum, p.unitPrice FROM products p", (err, products) => {
                                    if (err) throw err;

                                    res.render("home-sales.hbs", {
                                        firstname: req.session.firstname,
                                        lastname: req.session.lastname,
                                        notifs : req.session.notifs,
                                        forApprove: forApprove,
                                        inTransit : inTransit,
                                        delivered : delivered,
                                        clients: clients,
                                        products: products
                                    })
                                });
                            });
                        });
                    });
                });
            }
            else if(req.session.isLogistics){
                db.query("SELECT o.orderID, c.branch FROM orders o JOIN clients c ON o.clientID = c.clientID WHERE status = 'For Approval' LIMIT 3;", (err, forApprove) => {
                    if(err) throw err;

                    db.query("SELECT o.orderID, c.branch FROM orders o JOIN clients c ON o.clientID = c.clientID WHERE status = 'In Transit' ORDER BY o.shippedOn DESC LIMIT 3;", (err, inTransit) => {
                        if (err) throw err;

                        db.query("SELECT o.orderID, c.branch FROM orders o JOIN clients c ON o.clientID = c.clientID WHERE status = 'Delivered' ORDER BY o.completedOn DESC LIMIT 3;", (err, delivered) => {
                            if (err) throw err;

                            db.query("SELECT COUNT(*) AS deliveredOrders, SEC_TO_TIME(AVG(TIME_TO_SEC(TIMEDIFF(o.completedOn, o.shippedOn)))) AS avgtimediff FROM hermes_eye.orders o JOIN hermes_eye.clients c ON o.clientID = c.clientID WHERE shippedOn IS NOT NULL AND completedOn IS NOT NULL;", (err, avgTime) => {
                                if(err) throw err;

                                db.query("SELECT c.branch, SEC_TO_TIME(AVG(TIME_TO_SEC(TIMEDIFF(o.completedOn, o.shippedOn)))) AS avgtimediff FROM hermes_eye.orders o JOIN hermes_eye.clients c ON o.clientID = c.clientID WHERE shippedOn IS NOT NULL AND completedOn IS NOT NULL GROUP BY c.branch ORDER BY c.branch LIMIT 5;", (err, result) => {
                                    if (err) throw err;

                                    db.query("SELECT * FROM issues", (err, issues) => {
                                        if (err) throw err;
                                        
                                        res.render("home-logistics.hbs", {
                                            firstname: req.session.firstname,
                                            lastname: req.session.lastname,
                                            notifs : req.session.notifs,
                                            forApprove: forApprove,
                                            inTransit : inTransit,
                                            delivered : delivered,
                                            avgTime: avgTime[0].avgtimediff,
                                            compOrders: avgTime[0].deliveredOrders,
                                            result: result,
                                            issues: issues
                                        })
                                    });
                                });
                            });
                        });
                    });
                });
            }
            else{
                res.render("home-client.hbs", {
                    firstname: req.session.firstname,
                    lastname: req.session.lastname,
                    notifs : req.session.notifs
                })
            }   
        });

    }
    else{
        // the user has not registered or logged
        res.render("login.hbs")

    }

}

exports.getLogin = async (req,res)=>{
    let username = req.body.username
    let password = req.body.password
    let remember_me = req.body.remember

    db.query(`SELECT userID, firstname, lastname, role, password FROM users WHERE username = '${req.body.username}';`, (err, row) => {
        if(err) throw err;

        // console.log(row);

        if(row.length > 0){
            //FOUND USER
            
            let userID = row[0].userID;
            let dbFname = row[0].firstname;
            let dbLname = row[0].lastname;
            let dbRole = row[0].role;
            let dbPassword = row[0].password;

            if(!bcrypt.compareSync(password, dbPassword)) {
                //WRONG PASSWORD

                res.render("login.hbs", {
                    errors:"Invalid email/password" 
                })
            }
            else{
                //RIGHT PASSWORD
                
                req.session.userID = userID
                req.session.username = username
                req.session.firstname = dbFname
                req.session.lastname = dbLname
                req.session.role = dbRole
                
                if(dbRole == "Owner"){
                    req.session.isOwner = true

                    req.session.isAdmin = false
                    req.session.isSales = false
                    req.session.isLogistics = false
                    req.session.isClient = false
                }
                else if (dbRole == "Admin"){
                    req.session.isAdmin = true

                    req.session.isOwner = false
                    req.session.isSales = false
                    req.session.isLogistics = false
                    req.session.isClient = false
                }
                else if (dbRole == "Sales"){
                    req.session.isSales = true

                    req.session.isOwner = false
                    req.session.isAdmin = false
                    req.session.isLogistics = false
                    req.session.isClient = false
                }
                else if (dbRole == "Logistics"){
                    req.session.isLogistics = true

                    req.session.isOwner = false
                    req.session.isAdmin = false
                    req.session.isSales = false
                    req.session.isClient = false
                }
                else{
                    req.session.isClient = true

                    req.session.isOwner = false
                    req.session.isAdmin = false
                    req.session.isSales = false
                    req.session.isLogistics = false
                }
    
                if(remember_me){    
                    req.session.cookie.maxAge = 1000 * 3600 * 24 * 30
                }
    
                res.redirect("/")
    
            }
        }
        else{
            //FOUND NO USER

            res.render("login.hbs", {
                errors:"Invalid email/password" 
            })
        }

    });
  
}

exports.getHome = (req, res)=>{
    res.redirect("/")
}

exports.getOrders = (req, res)=>{

    if(req.session.username){   

        if(req.session.isOwner){
            db.query("SELECT o.orderID, o.clientID, o.shippedOn, o.status, c.branch, c.contactPersonFName, c.contactPersonLName FROM orders o JOIN clients c ON o.clientID = c.clientID", (err, rows) => {
                if(err) throw err;
                res.render('orders', {rows: rows, notifs : req.session.notifs});
            });
        }
        else if(req.session.isLogistics){
            db.query("SELECT o.orderID, o.clientID, o.shippedOn, o.status, c.branch, c.contactPersonFName, c.contactPersonLName FROM orders o JOIN clients c ON o.clientID = c.clientID", (err, rows) => {
                if(err) throw err;
                res.render('orders-logistics.hbs', {rows: rows, notifs : req.session.notifs});
            });
        }
        else if(req.session.isSales) {
            db.query("SELECT o.orderID, o.clientID, o.shippedOn, o.status, c.branch, c.contactPersonFName, c.contactPersonLName FROM orders o JOIN clients c ON o.clientID = c.clientID", (err, rows) => {
                if(err) throw err;
                res.render('orders-sales', {rows: rows, notifs : req.session.notifs});
            });
        }
        else{
            res.render("orders-client.hbs", {
                notifs : req.session.notifs
            })
        }
        
    }
    else{
        res.redirect("/") 
    }

}

exports.getRFID = (req, res)=>{

    if(req.session.username){   
        res.render("rfid.hbs", {
            // notifs : req.session.notifs
        })
    }
    else{
        res.redirect("/") 
    }

}

// update notification status
let data = [false, 1];

exports.getNotifications = (req, res)=>{

    if(req.session.username){   
        db.query(`SELECT orderID, status, readStatus, pendStatus, readPendStatus  
                        FROM hermes_eye.adminNotif
                        WHERE username="${req.session.username}"
                        AND (readStatus <> 0
                        OR readPendStatus <> 0)
                        ORDER BY notifID DESC;`, (err, rows) => {
            if(err) throw err;
            
            req.session.notifications = rows
                            
            if(!req.session.notifications.isEmpty){
            // execute the UPDATE statement
            db.query(`UPDATE hermes_eye.adminNotif
                            SET readStatus = 0, readPendStatus = 0
                            WHERE username="${req.session.username}";`, data, (error, results, fields) => {
                if (error){
                    return console.error(error.message);
                }

                // console.log('Rows affected:', results.affectedRows);
                req.session.notifs = 0;

                if(req.session.isOwner || req.session.isSales){
                    res.render("notifications.hbs", {
                        notifs : req.session.notifs,
                        notifications: req.session.notifications
                    })
                }
                else if(req.session.isLogistics){
                    res.render("notifications-logistics.hbs", {
                        notifs : req.session.notifs,
                        notifications: req.session.notifications
                    })
                }
                else{
                    res.render("notifications-client.hbs", {
                        notifs : req.session.notifs,
                        notifications: req.session.notifications
                    })
                }
   
                });
            }
        

        });
    }
    else{
        res.redirect("/") 
    }
    
}

exports.getRegistration = (req, res)=>{

    if(req.session.username){   
        res.render("registration.hbs", {
            notifs : req.session.notifs
        })
    }
    else{
        res.redirect("/") 
    }
}

exports.postRegister = (req, res)=>{

    if(req.session.username){         
        // reading fields from hbs
        let username = req.body.un
        let password = req.body.pw
        let confirm_password = req.body.c_pw
        let first_name = req.body.firstname
        let last_name = req.body.lastname
        let role = req.body.role

        //checking if valid
        body("username").notEmpty();
        body("password").notEmpty();
        body("password").isLength({min:8});
        body("confirm_password").notEmpty();
        body("confirm_password").isLength({min:8});       
        body("first_name").notEmpty();
        body("last_name").notEmpty();
        body("role").notEmpty();

        // if(confirm_password == password){
        //     console.log("SAME");
        // }
        // else{
        //     console.log("NOT SAME");
        // }

        //check errors
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.render("registration.hbs", {
                errors:errors,
                notifs : req.session.notifs
            });
        }
        else if(confirm_password != password){
            res.render("registration.hbs", {
                errors:"Error in registering: incorrect password",
                notifs : req.session.notifs
            });
        }
        else{

            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(password,salt);
            password = hash;

            //save user to db
            db.query(`SELECT MAX(userID)+1 AS newID FROM users;`, (err, row) => {
                if(err) throw err;
        
                let newID = row[0].newID;
                console.log(newID);
        
                db.query(`SELECT username FROM users WHERE username = "${username}";`, function(err, result){
                    if(err) throw err;
                    
                    if(result.length < 1){ //empty result, no match username
                    //new user logic
                    db.query(`INSERT INTO hermes_eye.users (userID, username, password, firstname, lastname, role, status)
                                        VALUES (${newID}, "${username}", "${password}", "${first_name}", "${last_name}", "${role}", "Active");`, (err, row) => {
                            if(err) throw err;
            
                            console.log("SUCCESSFULLY REGISTERED UID: " +newID);
            
                            res.render("registration.hbs", {
                                message:"Registration successful",
                                notifs : req.session.notifs
                            })
                        });;
                    }
                    else{ 
                        //existing user
                        console.log("UNSUCCESSFULLY REGISTERED UID: ");
                        res.render("registration.hbs", {
                            errors:"Error in registering: username already in use",
                            notifs : req.session.notifs
                        })                    
                    }
                });
        
            });           
        }
    }
    else{
        res.redirect("/") 
    }

}

exports.getUsers = (req, res)=>{

    if(req.session.username){   
        db.query("SELECT * FROM users GROUP BY userID ORDER BY userID ASC;", (err, rows) => {
            if(err) throw err;
        
            res.render("users.hbs", {
                users: rows,
                userRole: req.session.role,
                notifs : req.session.notifs});
         });
    }
    else{
        res.redirect("/") 
    }
}

exports.getListMaintenance = (req, res)=>{

    if(req.session.username){   ////HEREEEE
        db.query("SELECT driverID, plateNum, shippedVia FROM trucks GROUP BY driverID ORDER BY driverID ASC;", (err, rows) => {
            if(err) throw err;
            db.query("SELECT id AS shippedViaID, shippedVia FROM hermes_eye.shipmentVia;", (err, shipmentOptions) => {
                if(err) throw err;
                db.query("SELECT id AS businessStyleID, businessStyle FROM hermes_eye.businessStyle;", (err, businessStyles) => {
                    if(err) throw err;

                    res.render("list_maintenance.hbs", {
                        plateNums: rows,
                        shipmentOptions: shipmentOptions,
                        businessStyles: businessStyles
                    });
                })   
            })
        
         }); 
    }
    else{
        res.redirect("/") 
    }


}

exports.postAddPlateNumber = (req, res) => {

    if(req.session.username){         
        // reading fields from hbs
        let plateNum = req.body.plateNum
        let shippedVia = req.body.shippedVia

        //checking if valid
        body("plateNum").notEmpty();

        //check errors
        const errors = validationResult(req);
        if(!errors.isEmpty()){

            db.query("SELECT driverID, plateNum, shippedVia FROM trucks GROUP BY driverID ORDER BY driverID ASC;", (err, rows) => {
                if(err) throw err;
                db.query("SELECT id AS shippedViaID, shippedVia FROM hermes_eye.shipmentVia;", (err, shipmentOptions) => {
                    if(err) throw err;
                db.query("SELECT id AS businessStyleID, businessStyle FROM hermes_eye.businessStyle;", (err, businessStyles) => {
                    if(err) throw err;

                    res.render("list_maintenance.hbs", {
                        errors:errors,
                        plateNums: rows,
                        shipmentOptions: shipmentOptions,
                        businessStyles: businessStyles
                    });
                })
                })
            
             });

        }
        else{
            //save plate number to db
            db.query(`SELECT MAX(driverID)+1 AS newID FROM trucks;`, (err, row) => {
                if(err) throw err;
        
                let newID = row[0].newID;
        
                db.query(`SELECT plateNum FROM trucks WHERE plateNum = "${plateNum}";`, function(err, result){
                    if(err) throw err;
                    
                    if(result.length < 1){ //empty result, no match plate number
                    //new plate number logic
                    db.query(`INSERT INTO hermes_eye.trucks (driverID, plateNum, shippedVia)
                                        VALUES (${newID}, "${plateNum}", "${shippedVia}");`, (err, row) => {
                            if(err) throw err;
            
                            console.log("SUCCESSFULLY REGISTERED PLATE NUMBER UID: " +newID);
                            db.query("SELECT driverID, plateNum, shippedVia FROM trucks GROUP BY driverID ORDER BY driverID ASC;", (err, rows) => {
                                if(err) throw err;
                                db.query("SELECT id AS shippedViaID, shippedVia FROM hermes_eye.shipmentVia;", (err, shipmentOptions) => {
                                    if(err) throw err;
                                    db.query("SELECT id AS businessStyleID, businessStyle FROM hermes_eye.businessStyle;", (err, businessStyles) => {
                                        if(err) throw err;
                    
                                        res.render("list_maintenance.hbs", {
                                            message:"Successfully added plate number: " +plateNum,
                                            plateNums: rows,
                                            shipmentOptions: shipmentOptions,
                                            businessStyles: businessStyles
                                        });
                                    })
                                })
                            
                             });

                        });;
                    }
                    else{ 
                        //existing plate number 
                        console.log("UNSUCCESSFULLY REGISTERED PLATE NUMBER");

                        db.query("SELECT driverID, plateNum, shippedVia FROM trucks GROUP BY driverID ORDER BY driverID ASC;", (err, rows) => {
                            if(err) throw err;
                            db.query("SELECT id AS shippedViaID, shippedVia FROM hermes_eye.shipmentVia;", (err, shipmentOptions) => {
                                if(err) throw err;
                                db.query("SELECT id AS businessStyleID, businessStyle FROM hermes_eye.businessStyle;", (err, businessStyles) => {
                                    if(err) throw err;
                
                                    res.render("list_maintenance.hbs", {
                                        errors:"Error in registering: plate number already available",
                                        plateNums: rows,
                                        shipmentOptions: shipmentOptions,
                                        businessStyles: businessStyles
                                    });
                                })
                            })
                        
                         });                  
                    }
                });
        
            });           
        }
    }
    else{
        res.redirect("/") 
    }
}

exports.postDeletePlateNumber = (req, res) => {

    if(req.session.username){ 
        // reading fields from hbs
        let driverID = req.body.driverID
        let plateNum = req.body.plateNum
        
        db.query(`DELETE FROM trucks WHERE driverID = ${driverID};`, (err, rows) => {
            if(err) throw err;

            db.query("SELECT driverID, plateNum, shippedVia FROM trucks GROUP BY driverID ORDER BY driverID ASC;", (err, rows) => {
                if(err) throw err;
                db.query("SELECT id AS shippedViaID, shippedVia FROM hermes_eye.shipmentVia;", (err, shipmentOptions) => {
                    if(err) throw err;
                    db.query("SELECT id AS businessStyleID, businessStyle FROM hermes_eye.businessStyle;", (err, businessStyles) => {
                        if(err) throw err;
    
                        res.render("list_maintenance.hbs", {
                            message: "Successfully deleted plate number: " +plateNum,
                            plateNums: rows,
                            shipmentOptions: shipmentOptions,
                            businessStyles: businessStyles
                        });
                    })

                })
            });

            
         });
        
    }
    else{
        res.redirect("/") 
    }
}

exports.postAddShippedVia = (req, res) => {

    if(req.session.username){         
        // reading fields from hbs
        let shippedVia = req.body.addShippedVia

        //checking if valid
        body("shippedVia").notEmpty();

        //check errors
        const errors = validationResult(req);
        if(!errors.isEmpty()){

            db.query("SELECT driverID, plateNum, shippedVia FROM trucks GROUP BY driverID ORDER BY driverID ASC;", (err, rows) => {
                if(err) throw err;
                db.query("SELECT id AS shippedViaID, shippedVia FROM hermes_eye.shipmentVia;", (err, shipmentOptions) => {
                    if(err) throw err;
                db.query("SELECT id AS businessStyleID, businessStyle FROM hermes_eye.businessStyle;", (err, businessStyles) => {
                    if(err) throw err;
        
                    res.render("list_maintenance.hbs", {
                        errors:errors,
                        plateNums: rows,
                        shipmentOptions: shipmentOptions,
                        businessStyles: businessStyles
                    });
                })
                })
            
             });

        }
        else{
            //save shipping method to db
            db.query(`SELECT MAX(id)+1 AS newID FROM shipmentVia;`, (err, row) => {
                if(err) throw err;
        
                let newID = row[0].newID;
        
                db.query(`SELECT shippedVia FROM shipmentVia WHERE shippedVia = "${shippedVia}";`, function(err, result){
                    if(err) throw err;
                    
                    if(result.length < 1){ //empty result, no match shipping method
                    //new shipping method logic
                    db.query(`INSERT INTO hermes_eye.shipmentVia (id, shippedVia)
                                        VALUES (${newID}, "${shippedVia}");`, (err, row) => {
                            if(err) throw err;
            
                            console.log("SUCCESSFULLY REGISTERED SHIPMENT METHOD UID: " +newID);
                            db.query("SELECT driverID, plateNum, shippedVia FROM trucks GROUP BY driverID ORDER BY driverID ASC;", (err, rows) => {
                                if(err) throw err;
                                db.query("SELECT id AS shippedViaID, shippedVia FROM hermes_eye.shipmentVia;", (err, shipmentOptions) => {
                                    if(err) throw err;
                                    db.query("SELECT id AS businessStyleID, businessStyle FROM hermes_eye.businessStyle;", (err, businessStyles) => {
                                        if(err) throw err;
                    
                                        res.render("list_maintenance.hbs", {
                                            message:"Successfully added shipping method: " +shippedVia,
                                            plateNums: rows,
                                            shipmentOptions: shipmentOptions,
                                            businessStyles: businessStyles
                                        });
                                    })
                                })
                            
                             });

                        });;
                    }
                    else{ 
                        //existing shipping method 
                        console.log("UNSUCCESSFULLY REGISTERED SHIPPING METHOD");

                        db.query("SELECT driverID, plateNum, shippedVia FROM trucks GROUP BY driverID ORDER BY driverID ASC;", (err, rows) => {
                            if(err) throw err;
                            db.query("SELECT id AS shippedViaID, shippedVia FROM hermes_eye.shipmentVia;", (err, shipmentOptions) => {
                                if(err) throw err;
                                db.query("SELECT id AS businessStyleID, businessStyle FROM hermes_eye.businessStyle;", (err, businessStyles) => {
                                    if(err) throw err;
                
                                    res.render("list_maintenance.hbs", {
                                        errors:"Error in registering: shipping method already available",
                                        plateNums: rows,
                                        shipmentOptions: shipmentOptions,
                                        businessStyles: businessStyles
                                    });
                                })
                            })
                        
                         });                  
                    }
                });
        
            });           
        }
    }
    else{
        res.redirect("/") 
    }
}

exports.postDeleteShippedVia = (req, res) => {

    if(req.session.username){ 
        // reading fields from hbs
        let shippedViaID = req.body.shippedViaID
        let deleteShippedVia = req.body.deleteShippedVia
        
        db.query(`DELETE FROM shipmentVia WHERE id = ${shippedViaID};`, (err, rows) => {
            if(err) throw err;

            db.query("SELECT driverID, plateNum, shippedVia FROM trucks GROUP BY driverID ORDER BY driverID ASC;", (err, rows) => {
                if(err) throw err;
                db.query("SELECT id AS shippedViaID, shippedVia FROM hermes_eye.shipmentVia;", (err, shipmentOptions) => {
                    if(err) throw err;
                    db.query("SELECT id AS businessStyleID, businessStyle FROM hermes_eye.businessStyle;", (err, businessStyles) => {
                        if(err) throw err;
    
                        res.render("list_maintenance.hbs", {
                            message: "Successfully deleted shipping method: " +deleteShippedVia,
                            plateNums: rows,
                            shipmentOptions: shipmentOptions,
                            businessStyles: businessStyles
                        });
                    })

                })
            });

            
         });
        
    }
    else{
        res.redirect("/") 
    }
}

exports.postAddBusinessStyle = (req, res) => {

    if(req.session.username){         
        // reading fields from hbs
        let businessStyle = req.body.addBusinessStyle

        //checking if valid
        body("businessStyle").notEmpty();

        //check errors
        const errors = validationResult(req);
        if(!errors.isEmpty()){

            db.query("SELECT driverID, plateNum, shippedVia FROM trucks GROUP BY driverID ORDER BY driverID ASC;", (err, rows) => {
                if(err) throw err;
                db.query("SELECT id AS shippedViaID, shippedVia FROM hermes_eye.shipmentVia;", (err, shipmentOptions) => {
                    if(err) throw err;
                db.query("SELECT id AS businessStyleID, businessStyle FROM hermes_eye.businessStyle;", (err, businessStyles) => {
                    if(err) throw err;
        
                    res.render("list_maintenance.hbs", {
                        errors:errors,
                        plateNums: rows,
                        shipmentOptions: shipmentOptions,
                        businessStyles: businessStyles
                    });
                })
                })
            
             });

        }
        else{
            //save business style to db
            db.query(`SELECT MAX(id)+1 AS newID FROM businessStyle;`, (err, row) => {
                if(err) throw err;
        
                let newID = row[0].newID;
        
                db.query(`SELECT businessStyle FROM businessStyle WHERE businessStyle = "${businessStyle}";`, function(err, result){
                    if(err) throw err;
                    
                    if(result.length < 1){ //empty result, no match business style
                    //new business style logic
                    db.query(`INSERT INTO hermes_eye.businessStyle (id, businessStyle)
                                        VALUES (${newID}, "${businessStyle}");`, (err, row) => {
                            if(err) throw err;
            
                            console.log("SUCCESSFULLY REGISTERED BUSINESS STYLE UID: " +newID);
                            db.query("SELECT driverID, plateNum, shippedVia FROM trucks GROUP BY driverID ORDER BY driverID ASC;", (err, rows) => {
                                if(err) throw err;
                                db.query("SELECT id AS shippedViaID, shippedVia FROM hermes_eye.shipmentVia;", (err, shipmentOptions) => {
                                    if(err) throw err;
                                    db.query("SELECT id AS businessStyleID, businessStyle FROM hermes_eye.businessStyle;", (err, businessStyles) => {
                                        if(err) throw err;
                    
                                        res.render("list_maintenance.hbs", {
                                            message:"Successfully added business style: " +businessStyle,
                                            plateNums: rows,
                                            shipmentOptions: shipmentOptions,
                                            businessStyles: businessStyles
                                        });
                                    })
                                })
                            
                             });

                        });;
                    }
                    else{ 
                        //existing business style
                        console.log("UNSUCCESSFULLY REGISTERED BUSINESS STYLE");

                        db.query("SELECT driverID, plateNum, shippedVia FROM trucks GROUP BY driverID ORDER BY driverID ASC;", (err, rows) => {
                            if(err) throw err;
                            db.query("SELECT id AS shippedViaID, shippedVia FROM hermes_eye.shipmentVia;", (err, shipmentOptions) => {
                                if(err) throw err;
                                db.query("SELECT id AS businessStyleID, businessStyle FROM hermes_eye.businessStyle;", (err, businessStyles) => {
                                    if(err) throw err;
                
                                    res.render("list_maintenance.hbs", {
                                        errors:"Error in registering: business style option already available",
                                        plateNums: rows,
                                        shipmentOptions: shipmentOptions,
                                        businessStyles: businessStyles
                                    });
                                })
                            })
                        
                         });                  
                    }
                });
        
            });           
        }
    }
    else{
        res.redirect("/") 
    }
}

exports.postDeleteBusinessStyle = (req, res) => {

    if(req.session.username){ 
        // reading fields from hbs
        let businessStyleID = req.body.businessStyleID
        let deleteBusinessStyle = req.body.deleteBusinessStyle
        
        db.query(`DELETE FROM businessStyle WHERE id = ${businessStyleID};`, (err, rows) => {
            if(err) throw err;

            db.query("SELECT driverID, plateNum, shippedVia FROM trucks GROUP BY driverID ORDER BY driverID ASC;", (err, rows) => {
                if(err) throw err;
                db.query("SELECT id AS shippedViaID, shippedVia FROM hermes_eye.shipmentVia;", (err, shipmentOptions) => {
                    if(err) throw err;
                    db.query("SELECT id AS businessStyleID, businessStyle FROM hermes_eye.businessStyle;", (err, businessStyles) => {
                        if(err) throw err;
    
                        res.render("list_maintenance.hbs", {
                            message: "Successfully deleted business style: " +deleteBusinessStyle,
                            plateNums: rows,
                            shipmentOptions: shipmentOptions,
                            businessStyles: businessStyles
                        });
                    })

                })
            });

            
         });
        
    }
    else{
        res.redirect("/") 
    }
}

exports.getProfile = (req, res)=>{

    if(req.session.username){   
               
        if(req.session.isOwner || req.session.isSales){
            res.render("profile.hbs", {
                notifs : req.session.notifs,
                username: req.session.username,
                firstname: req.session.firstname,
                lastname: req.session.lastname,
                role: req.session.role,
                userID: req.session.userID
            })
        }
        else if(req.session.isLogistics){
            res.render("profile-logistics.hbs", {
                notifs : req.session.notifs,
                username: req.session.username,
                firstname: req.session.firstname,
                lastname: req.session.lastname,
                userID: req.session.userID
            })
        }
        else if(req.session.isAdmin){
            res.render("profile-admin.hbs", {
                username: req.session.username,
                firstname: req.session.firstname,
                lastname: req.session.lastname,
                userID: req.session.userID
            })
        }
        else{
            res.render("profile-client.hbs", {
                notifs : req.session.notifs
            })
        }
    }
    else{
        res.redirect("/") 
    }
}

exports.getOrderDetails = (req, res) => {
    db.query("SELECT longitude, latitude, loggedOn FROM locations WHERE orderID = ? ORDER BY loggedOn DESC", req.params.orderID, (err, result) => {
        if(err) throw err;
        db.query("SELECT o.orderID, o.clientID, o.shippedOn, o.issueStatus, o.completedOn, o.shippedVia, o.businessStyle, o.approvedBy, o.receivedBy, o.status, o.plateNum, c.branch, c.contactPersonFName, c.contactPersonLName, o.shippedOn FROM orders o JOIN clients c ON o.clientID = c.clientID WHERE orderID = ?", req.params.orderID, (err, orderDetails) => {
          if(err) throw err;
          db.query("SELECT * FROM deliveryItems WHERE orderID = ?", req.params.orderID, (err, rows) => {
            if(err) throw err;
                db.query("SELECT plateNum FROM hermes_eye.trucks", (err, plateNums) => {
                    
                if(err) throw err;
                res.render('order_details', {result: JSON.stringify(result), errorLoc: result, rows:rows, orderID: orderDetails[0].orderID, plateNum: orderDetails[0].plateNum, 
                branch: orderDetails[0].branch, contactPerson: orderDetails[0].contactPersonFName + " " + orderDetails[0].contactPersonLName, status: orderDetails[0].status, 
                shippedVia: orderDetails[0].shippedVia, businessStyle: orderDetails[0].businessStyle, approvedBy: orderDetails[0].approvedBy, receivedBy: orderDetails[0].receivedBy, 
                shippedOn: orderDetails[0].shippedOn, completedOn: orderDetails[0].completedOn, issueStatus: orderDetails[0].issueStatus,
                plateNums: plateNums, userName: req.session.username});
            });
         });
        });
    });
}

exports.getGenerateOrder = (req, res) => {
    db.query("SELECT o.orderID, o.clientID, o.shippedOn, o.issueStatus, o.completedOn, o.shippedVia, o.businessStyle, o.approvedBy, o.receivedBy, o.status, o.plateNum, c.branch, c.contactPersonFName, c.contactPersonLName, o.shippedOn FROM orders o JOIN clients c ON o.clientID = c.clientID WHERE orderID = ?", req.params.orderID, (err, orderDetails) => {
        if(err) throw err;
        db.query("SELECT * FROM deliveryItems WHERE orderID = ?", req.params.orderID, (err, rows) => {
          if(err) throw err;
          res.render('generate-order', {rows:rows, orderID: orderDetails[0].orderID, plateNum: orderDetails[0].plateNum, 
            branch: orderDetails[0].branch, contactPerson: orderDetails[0].contactPersonFName + " " + orderDetails[0].contactPersonLName, status: orderDetails[0].status, 
            shippedVia: orderDetails[0].shippedVia, businessStyle: orderDetails[0].businessStyle, approvedBy: orderDetails[0].approvedBy, receivedBy: orderDetails[0].receivedBy, 
            shippedOn: orderDetails[0].shippedOn, completedOn: orderDetails[0].completedOn, issueStatus: orderDetails[0].issueStatus});
       });
      });
}


exports.getCreateOrder = (req, res) => {
    db.query("SELECT c.branch FROM clients c;", (err, rows) => {
        if(err) throw err;
        db.query("SELECT o.orderID FROM orders o;", (err, orders) => {
            if(err) throw err;
            db.query("SELECT shippedVia FROM hermes_eye.shipmentVia;", (err, shipmentOptions) => {
                if(err) throw err;
                db.query("SELECT businessStyle FROM hermes_eye.businessStyle;", (err, businessStyles) => {
                    if(err) throw err;
        
                    res.render('create_order', {
                        rows: JSON.stringify(rows), 
                        orders: JSON.stringify(orders),
                        shipmentOptions: shipmentOptions,
                        businessStyles: businessStyles});
                })
            })

            // res.render('create_order', {rows: JSON.stringify(rows), orders: JSON.stringify(orders)});
        })
        
     });
}

exports.postCreateOrder = (req, res) => {
    db.query('SELECT clientID FROM clients WHERE branch = ?', req.body.clientBranch, (err, result) => {
        if(err) throw err;
        db.query('INSERT INTO orders (orderID, clientID, shippedVia, businessStyle, status) VALUES(?,?,?,?,?)', [req.body.orderID, result[0].clientID, req.body.shippedVia, req.body.businessStyle, 'For Approval'], function(err) {
            if (err) {
              return console.log(err.message);
            }

            db.query("SELECT username FROM users WHERE role IN ('Owner', 'Sales', 'Logistics');", (err, inserts) => {
                if (err) throw err;

                for(let i = 0; i < inserts.length; i++) {
                    db.query("INSERT INTO adminNotif (orderID, username, status, readStatus, readPendStatus) VALUES (?,?,?,?,0)", [req.body.orderID, inserts[i].username, 'For Approval', 1], function(err) {
                        if (err) {
                            return console.log(err.message);
                          }
                    })
                } 

                res.redirect('/orders');
            });
          });
    });
}

exports.postApprovalOrder = (req, res) => {
    db.query('UPDATE orders SET approvedBy = ?, shippedOn = ?, status = ?, plateNum = ? WHERE orderID = ?', [req.body.approvedBy, req.body.dateApproved, 'In Transit', req.body.plateNum, parseInt(req.body.orderID)], function(err) {
        if (err) {
          return console.log(err.message);
        }

        db.query("UPDATE adminNotif SET readStatus = readStatus + 1, status = ? WHERE orderID = ?", ['In Transit', parseInt(req.body.orderID)], function(err) {
            if (err) {
                return console.log(err.message);
              }
              
            res.redirect('back');
        });
    });
}

exports.postCompleteOrder = (req, res) => {
    db.query('UPDATE orders SET receivedBy = ?, status = ? WHERE orderID = ?', [req.body.receivedBy, 'Verified', parseInt(req.body.orderID)], function(err) {
        if (err) {
          return console.log(err.message);
        }
        db.query("UPDATE adminNotif SET readStatus = readStatus + 1, status = ? WHERE orderID = ?", ['Verified', parseInt(req.body.orderID)], function(err) {
            if (err) {
                return console.log(err.message);
              }
              
            res.redirect('back');
        });
    });
}

exports.postPendingOrder = (req, res) => {
    db.query('UPDATE orders SET issueStatus = ? WHERE orderID = ?', ['Pending', parseInt(req.body.orderID)], function(err) {
        if (err) {
          return console.log(err.message);
        }

        db.query('INSERT INTO issues (orderID, justification, status) VALUES(?,?,?)', [req.body.orderID, req.body.justification, 'On Going'], function(err) {
            if (err) {
                return console.log(err.message);
            }

            db.query("UPDATE adminNotif SET readPendStatus = readPendStatus + 1, pendStatus = ? WHERE orderID = ?", ['Pending', parseInt(req.body.orderID)], function(err) {
                if (err) {
                    return console.log(err.message);
                  }
                  
                res.redirect('back');
            });
        });
    });
}

exports.postResolveOrder = (req, res) => {
    db.query('UPDATE orders SET issueStatus = ? WHERE orderID = ?', ['Resolved', parseInt(req.body.orderID)], function(err) {
        if (err) {
          return console.log(err.message);
        }
        db.query('UPDATE issues SET resolution = ?, status = ? WHERE orderID = ?', [req.body.resolution, 'Resolved', req.body.orderID], function(err) {
            if (err) {
                return console.log(err.message);
              }

              db.query("UPDATE adminNotif SET readPendStatus = readPendStatus + 1, pendStatus = ? WHERE orderID = ?", ['Resolved', parseInt(req.body.orderID)], function(err) {
                if (err) {
                    return console.log(err.message);
                  }
                  
                res.redirect('back');
            });
        });
    });
}

exports.getAllAverageBranch = (req, res) => {
    db.query("SELECT COUNT(*) AS deliveredOrders, SEC_TO_TIME(AVG(TIME_TO_SEC(TIMEDIFF(o.completedOn, o.shippedOn)))) AS avgtimediff FROM hermes_eye.orders o JOIN hermes_eye.clients c ON o.clientID = c.clientID WHERE shippedOn IS NOT NULL AND completedOn IS NOT NULL;", (err, avgTime) => {
        if(err) throw err;

        db.query("SELECT c.branch, c.contactPersonFName, c.contactPersonLName, c.contactNum, SEC_TO_TIME(AVG(TIME_TO_SEC(TIMEDIFF(o.completedOn, o.shippedOn)))) AS avgtimediff FROM hermes_eye.orders o JOIN hermes_eye.clients c ON o.clientID = c.clientID WHERE shippedOn IS NOT NULL AND completedOn IS NOT NULL GROUP BY c.branch ORDER BY avgtimediff;", (err, result) => {
            if (err) throw err;
             
            res.render("average_branch", {
                numOrders: avgTime[0].deliveredOrders,
                avgTime: avgTime[0].avgtimediff,
                avgBranch: result,
                firstBranch: result[0].avgtimediff
            })
        });
    });
}

exports.getPendingOrders = (req, res) => {
    db.query("SELECT * FROM issues", (err, result) => {
        if(err) throw err;

        res.render("pending_orders", {
            result: result
        })
    });
}

exports.postUpdateUser = (req, res) => {
    if(req.session.username){         
        // reading fields from hbs
        let userID = req.body.userID
        let username = req.body.username
        let first_name = req.body.firstname
        let last_name = req.body.lastname
        let new_password = req.body.new_password
        let confirm_new_password = req.body.confirm_new_password
        let role = req.body.role

        //checking if valid
        body("username").notEmpty();
        body("first_name").notEmpty();
        body("last_name").notEmpty();
        // body("new_password").notEmpty();
        body("new_password").isLength({min:8}); 
        // body("confirm_new_password").notEmpty();
        body("confirm_new_password").isLength({min:8}); 
        body("role").notEmpty();    

        //check errors
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            console.log("IS EMPTY");

            db.query("SELECT * FROM users GROUP BY userID ORDER BY userID ASC;", (err, rows) => {
                if(err) throw err;
            
                res.render("users.hbs", {
                    errors:errors,
                    users: rows,
                    userRole: req.session.role,
                    notifs : req.session.notifs
                });
            });
        }
        else if(new_password != confirm_new_password){ //If not same new pass and confirmation pass
            db.query("SELECT * FROM users GROUP BY userID ORDER BY userID ASC;", (err, rows) => {
                if(err) throw err;
            
                res.render("users.hbs", {
                    errors:"Error in updating account: incorrect password confirmation",
                    users: rows,
                    userRole: req.session.role,
                    notifs : req.session.notifs
                });
            });
        }
        else{
            db.query(`SELECT userID FROM users WHERE username = "${username}";`, function(err, result){
                if(err) throw err;
                
                if(result.length < 1){ //empty result, no match username, can update to a new username                   
                    
                    if(new_password.length && confirm_new_password.length && (new_password == confirm_new_password)){ //new pass and confirm pass have values, and are the same
                        var salt = bcrypt.genSaltSync(10);
                        var hash = bcrypt.hashSync(new_password,salt);
                        new_password = hash; 
                        
                        //update user to db
                        db.query(`UPDATE users
                        SET username="${username}", firstname = "${first_name}", lastname ="${last_name}", password="${new_password}", role="${role}"
                        WHERE userID = ${userID};`, (err, row) => {
                            if(err) throw err;

                            db.query("SELECT * FROM users GROUP BY userID ORDER BY userID ASC;", (err, rows) => {
                                if(err) throw err;
                            
                                res.render("users.hbs", {
                                    message:"Successfully update User ID: " +userID,
                                    users: rows,
                                    userRole: req.session.role,
                                    notifs : req.session.notifs
                                });
                            }); 
                        }); 

                    }
                    else{ // no update password in db
                        //update user to db
                        db.query(`UPDATE users
                        SET username="${username}", firstname = "${first_name}", lastname ="${last_name}", role="${role}"
                        WHERE userID = ${userID};`, (err, row) => {
                            if(err) throw err;

                            db.query("SELECT * FROM users GROUP BY userID ORDER BY userID ASC;", (err, rows) => {
                                if(err) throw err;
                            
                                res.render("users.hbs", {
                                    message:"Successfully update User ID: " +userID,
                                    users: rows,
                                    userRole: req.session.role,
                                    notifs : req.session.notifs
                                });
                            }); 
                        });  
                    }
                    
                      
                }
                else if(result.length == 1) { //match userID, have user in DB

                    if(result[0].userID == userID){ //same user that is and trying to update data

                        if(new_password.length && confirm_new_password.length && (new_password == confirm_new_password)){ //new pass and confirm pass have values, and are the same
                            var salt = bcrypt.genSaltSync(10);
                            var hash = bcrypt.hashSync(new_password,salt);
                            new_password = hash; 
                            
                            //update user to db
                            db.query(`UPDATE users
                            SET username="${username}", firstname = "${first_name}", lastname ="${last_name}", password="${new_password}", role="${role}"
                            WHERE userID = ${userID};`, (err, row) => {
                                if(err) throw err;
    
                                db.query("SELECT * FROM users GROUP BY userID ORDER BY userID ASC;", (err, rows) => {
                                    if(err) throw err;
                                
                                    res.render("users.hbs", {
                                        message:"Successfully update User ID: " +userID,
                                        users: rows,
                                        userRole: req.session.role,
                                        notifs : req.session.notifs
                                    });
                                }); 
                            }); 
    
                        }
                        else{ // no update password in db
                            //update user to db
                            db.query(`UPDATE users
                            SET username="${username}", firstname = "${first_name}", lastname ="${last_name}", role="${role}"
                            WHERE userID = ${userID};`, (err, row) => {
                                if(err) throw err;

                                db.query("SELECT * FROM users GROUP BY userID ORDER BY userID ASC;", (err, rows) => {
                                    if(err) throw err;
                                
                                    res.render("users.hbs", {
                                        message:"Successfully update User ID: " +userID,
                                        users: rows,
                                        userRole: req.session.role,
                                        notifs : req.session.notifs
                                    });
                                }); 
                            }); 
                        }
                    }
                    else{ //existing user
                        // console.log("UNSUCCESSFULLY UPDATED");
                        db.query("SELECT * FROM users GROUP BY userID ORDER BY userID ASC;", (err, rows) => {
                            if(err) throw err;
                        
                            res.render("users.hbs", {
                                errors:"Error in registering: username already in use",
                                users: rows,
                                userRole: req.session.role,
                                notifs : req.session.notifs
                            });
                        });   
                    }
                }
                // else{ 
                                    
                // }
            });
             
                       
        }
    }
    else{
        res.redirect("/") 
    }
}


exports.postUpdateProfile = (req, res) => {

    if(req.session.username){         
        // reading fields from hbs
        let userID = req.body.userID
        let username = req.body.username
        let first_name = req.body.firstname
        let last_name = req.body.lastname
        let new_password = req.body.new_password
        let confirm_new_password = req.body.confirm_new_password

        //checking if valid
        body("username").notEmpty();
        body("first_name").notEmpty();
        body("last_name").notEmpty();
        body("new_password").isLength({min:8}); 
        body("confirm_new_password").isLength({min:8});   

        //check errors
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            if(req.session.isOwner || req.session.isSales){
                res.render("profile.hbs", {
                    errors:errors,
                    notifs : req.session.notifs,
                    username: req.session.username,
                    firstname: req.session.firstname,
                    lastname: req.session.lastname,
                    role: req.session.role,
                    userID: req.session.userID
                })
            }
            else if(req.session.isLogistics){
                res.render("profile-logistics.hbs", {
                    errors:errors,
                    notifs : req.session.notifs,
                    username: req.session.username,
                    firstname: req.session.firstname,
                    lastname: req.session.lastname,
                    userID: req.session.userID
                })
            }
            else if(req.session.isAdmin){
                res.render("profile-admin.hbs", {
                    errors:errors,
                    username: req.session.username,
                    firstname: req.session.firstname,
                    lastname: req.session.lastname,
                    userID: req.session.userID
                })
            }
            else{
                res.render("profile-client.hbs", {
                    notifs : req.session.notifs
                })
            }
        }
        else if(new_password != confirm_new_password){ //If not same new pass and confirmation pass

            if(req.session.isOwner || req.session.isSales){
                res.render("profile.hbs", {
                    errors:"Error in updating account: incorrect password confirmation",
                    notifs : req.session.notifs,
                    username: req.session.username,
                    firstname: req.session.firstname,
                    lastname: req.session.lastname,
                    role: req.session.role,
                    userID: req.session.userID
                })
            }
            else if(req.session.isLogistics){
                res.render("profile-logistics.hbs", {
                    errors:"Error in updating account: incorrect password confirmation",
                    notifs : req.session.notifs,
                    username: req.session.username,
                    firstname: req.session.firstname,
                    lastname: req.session.lastname,
                    userID: req.session.userID
                })
            }
            else if(req.session.isAdmin){
                res.render("profile-admin.hbs", {
                    errors:"Error in updating account: incorrect password confirmation",
                    username: req.session.username,
                    firstname: req.session.firstname,
                    lastname: req.session.lastname,
                    userID: req.session.userID
                })
            }
            else{
                res.render("profile-client.hbs", {
                    notifs : req.session.notifs
                })
            }
        }
        else{
            db.query(`SELECT userID FROM users WHERE username = "${username}";`, function(err, result){
                if(err) throw err;
                
                if(result.length < 1){ //empty result, no match username, can update to a new username                   
                    
                    if(new_password.length && confirm_new_password.length && (new_password == confirm_new_password)){ //new pass and confirm pass have values, and are the same
                        var salt = bcrypt.genSaltSync(10);
                        var hash = bcrypt.hashSync(new_password,salt);
                        new_password = hash; 
                        
                        //update user to db
                        db.query(`UPDATE users
                        SET username="${username}", firstname = "${first_name}", lastname ="${last_name}", password="${new_password}"
                        WHERE userID = ${userID};`, (err, row) => {
                            if(err) throw err;

                            db.query("SELECT * FROM users GROUP BY userID ORDER BY userID ASC;", (err, rows) => {
                                if(err) throw err;

                                if(req.session.isOwner || req.session.isSales){
                                    res.render("profile.hbs", {
                                        message:"Successfully Updated User Profile" ,
                                        notifs : req.session.notifs,
                                        username: req.session.username,
                                        firstname: req.session.firstname,
                                        lastname: req.session.lastname,
                                        role: req.session.role,
                                        userID: req.session.userID
                                    })
                                }
                                else if(req.session.isLogistics){
                                    res.render("profile-logistics.hbs", {
                                        message:"Successfully Updated User Profile" ,
                                        notifs : req.session.notifs,
                                        username: req.session.username,
                                        firstname: req.session.firstname,
                                        lastname: req.session.lastname,
                                        userID: req.session.userID
                                    })
                                }
                                else if(req.session.isAdmin){
                                    res.render("profile-admin.hbs", {
                                        message:"Successfully Updated User Profile",
                                        username: req.session.username,
                                        firstname: req.session.firstname,
                                        lastname: req.session.lastname,
                                        userID: req.session.userID
                                    })
                                }
                                else{
                                    res.render("profile-client.hbs", {
                                        notifs : req.session.notifs
                                    })
                                }
                            }); 
                        }); 

                    }
                    else{ // no update password in db
                        //update user to db
                        db.query(`UPDATE users
                        SET username="${username}", firstname = "${first_name}", lastname ="${last_name}"
                        WHERE userID = ${userID};`, (err, row) => {
                            if(err) throw err;

                            db.query("SELECT * FROM users GROUP BY userID ORDER BY userID ASC;", (err, rows) => {
                                if(err) throw err;

                                if(req.session.isOwner || req.session.isSales){
                                    res.render("profile.hbs", {
                                        message:"Successfully Updated User Profile" ,
                                        notifs : req.session.notifs,
                                        username: req.session.username,
                                        firstname: req.session.firstname,
                                        lastname: req.session.lastname,
                                        role: req.session.role,
                                        userID: req.session.userID
                                    })
                                }
                                else if(req.session.isLogistics){
                                    res.render("profile-logistics.hbs", {
                                        message:"Successfully Updated User Profile" ,
                                        notifs : req.session.notifs,
                                        username: req.session.username,
                                        firstname: req.session.firstname,
                                        lastname: req.session.lastname,
                                        userID: req.session.userID
                                    })
                                }
                                else if(req.session.isAdmin){
                                    res.render("profile-admin.hbs", {
                                        message:"Successfully Updated User Profile",
                                        username: req.session.username,
                                        firstname: req.session.firstname,
                                        lastname: req.session.lastname,
                                        userID: req.session.userID
                                    })
                                }
                                else{
                                    res.render("profile-client.hbs", {
                                        notifs : req.session.notifs
                                    })
                                }
                            }); 
                        });  
                    }
                    
                      
                }
                else if(result.length == 1) { //match userID, have user in DB

                    if(result[0].userID == userID){ //same user that is and trying to update data

                        if(new_password.length && confirm_new_password.length && (new_password == confirm_new_password)){ //new pass and confirm pass have values, and are the same
                            var salt = bcrypt.genSaltSync(10);
                            var hash = bcrypt.hashSync(new_password,salt);
                            new_password = hash; 
                            
                            //update user to db
                            db.query(`UPDATE users
                            SET username="${username}", firstname = "${first_name}", lastname ="${last_name}", password="${new_password}"
                            WHERE userID = ${userID};`, (err, row) => {
                                if(err) throw err;
    
                                db.query("SELECT * FROM users GROUP BY userID ORDER BY userID ASC;", (err, rows) => {
                                    if(err) throw err;

                                    if(req.session.isOwner || req.session.isSales){
                                        res.render("profile.hbs", {
                                            message:"Successfully Updated User Profile" ,
                                            notifs : req.session.notifs,
                                            username: req.session.username,
                                            firstname: req.session.firstname,
                                            lastname: req.session.lastname,
                                            role: req.session.role,
                                            userID: req.session.userID
                                        })
                                    }
                                    else if(req.session.isLogistics){
                                        res.render("profile-logistics.hbs", {
                                            message:"Successfully Updated User Profile" ,
                                            notifs : req.session.notifs,
                                            username: req.session.username,
                                            firstname: req.session.firstname,
                                            lastname: req.session.lastname,
                                            userID: req.session.userID
                                        })
                                    }
                                    else if(req.session.isAdmin){
                                        res.render("profile-admin.hbs", {
                                            message:"Successfully Updated User Profile",
                                            username: req.session.username,
                                            firstname: req.session.firstname,
                                            lastname: req.session.lastname,
                                            userID: req.session.userID
                                        })
                                    }
                                    else{
                                        res.render("profile-client.hbs", {
                                            notifs : req.session.notifs
                                        })
                                    }
                                }); 
                            }); 
    
                        }
                        else{ // no update password in db
                            //update user to db
                            db.query(`UPDATE users
                            SET username="${username}", firstname = "${first_name}", lastname ="${last_name}"
                            WHERE userID = ${userID};`, (err, row) => {
                                if(err) throw err;

                                db.query("SELECT * FROM users GROUP BY userID ORDER BY userID ASC;", (err, rows) => {
                                    if(err) throw err;

                                    if(req.session.isOwner || req.session.isSales){
                                        res.render("profile.hbs", {
                                            message:"Successfully Updated User Profile" ,
                                            notifs : req.session.notifs,
                                            username: req.session.username,
                                            firstname: req.session.firstname,
                                            lastname: req.session.lastname,
                                            role: req.session.role,
                                            userID: req.session.userID
                                        })
                                    }
                                    else if(req.session.isLogistics){
                                        res.render("profile-logistics.hbs", {
                                            message:"Successfully Updated User Profile" ,
                                            notifs : req.session.notifs,
                                            username: req.session.username,
                                            firstname: req.session.firstname,
                                            lastname: req.session.lastname,
                                            userID: req.session.userID
                                        })
                                    }
                                    else if(req.session.isAdmin){
                                        res.render("profile-admin.hbs", {
                                            message:"Successfully Updated User Profile",
                                            username: req.session.username,
                                            firstname: req.session.firstname,
                                            lastname: req.session.lastname,
                                            userID: req.session.userID
                                        })
                                    }
                                    else{
                                        res.render("profile-client.hbs", {
                                            notifs : req.session.notifs
                                        })
                                    }
                                }); 
                            }); 
                        }
                    }
                    else{ //existing user
                        // console.log("UNSUCCESSFULLY UPDATED");   

                        if(req.session.isOwner || req.session.isSales){
                            res.render("profile.hbs", {
                                errors:"Error in registering: username already in use",
                                notifs : req.session.notifs,
                                username: req.session.username,
                                firstname: req.session.firstname,
                                lastname: req.session.lastname,
                                role: req.session.role,
                                userID: req.session.userID
                            })
                        }
                        else if(req.session.isLogistics){
                            res.render("profile-logistics.hbs", {
                                errors:"Error in registering: username already in use",
                                notifs : req.session.notifs,
                                username: req.session.username,
                                firstname: req.session.firstname,
                                lastname: req.session.lastname,
                                userID: req.session.userID
                            })
                        }
                        else if(req.session.isAdmin){
                            res.render("profile-admin.hbs", {
                                errors:"Error in registering: username already in use",
                                username: req.session.username,
                                firstname: req.session.firstname,
                                lastname: req.session.lastname,
                                userID: req.session.userID
                            })
                        }
                        else{
                            res.render("profile-client.hbs", {
                                notifs : req.session.notifs
                            })
                        }
                    }
                }
                // else{ 
                                    
                // }
            });
             
                       
        }
    }
    
}


exports.postDeleteUser = (req, res) => {
    if(req.session.username){         
        // reading fields from hbs
        let userID = req.body.userID

        db.query(`UPDATE users
                SET status = "Deleted"
                WHERE userID = ${userID};`, (err, row) => {
            if(err) throw err;

            db.query("SELECT * FROM users GROUP BY userID ORDER BY userID ASC;", (err, rows) => {
                if(err) throw err;
            
                res.render("users.hbs", {
                    message:"Successfully deleted User ID: " +userID,
                    users: rows,
                    userRole: req.session.role,
                    notifs : req.session.notifs
                });
            }); 

        });
        
    }
    else{
        res.redirect("/") 
    }
}

exports.getSignout = (req,res)=>{
    req.session.destroy()
    res.redirect("/")
}