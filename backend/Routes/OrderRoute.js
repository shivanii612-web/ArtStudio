const express = require("express");
const router = express.Router();

const {
    createOrder,
    getAllOrders,
    getUserOrders,
    updateOrderStatus
} = require("../Controller/OrderController");


// Place Order
router.post("/place", createOrder);


// Admin - Get all orders
router.get("/all", getAllOrders);


// User - Get own orders
router.get("/user/:userId", getUserOrders);

router.put("/status/:id", updateOrderStatus);


module.exports = router;