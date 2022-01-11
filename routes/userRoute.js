const express = require('express')
const userController = require('../controllers/userController')
const routes = express();

routes.get("/", userController.getIndex)
routes.post("/login", userController.getLogin)
routes.get("/home", userController.getHome)
routes.get("/orders", userController.getOrders)
routes.get("/notifications", userController.getNotifications)
routes.get("/registration", userController.getRegistration)
routes.post("/register", userController.getRegister)
routes.get("/users", userController.getUsers)
routes.get("/profile", userController.getProfile)
routes.get("/order_details/:orderID", userController.getOrderDetails)
routes.get("/create_order", userController.getCreateOrder)
routes.post("/add-order", userController.postCreateOrder)
routes.post("/approve-order", userController.postApprovalOrder)
routes.post("/complete-order", userController.postCompleteOrder)
routes.post("/pending-order", userController.postPendingOrder)
routes.post("/resolve-order", userController.postResolveOrder)
routes.get("/signout", userController.getSignout)

module.exports = routes