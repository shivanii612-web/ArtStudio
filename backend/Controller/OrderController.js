const Order = require("../Model/Order");
const Product = require("../Model/ProductModel");
const { redisClient } = require("../Config/redis");


const createOrder = async (req, res) => {
  try {

    const {
      userId,
      fullName,
      phone,
      address,
      city,
      state,
      pincode,
      paymentMethod,
      products,
      totalAmount,
    } = req.body;

    // 1. Create order in MongoDB
    const order = new Order({
      userId,
      fullName,
      phone,
      address,
      city,
      state,
      pincode,
      paymentMethod,
      products,
      totalAmount,
    });

    await order.save();

    // 2. Store order in Redis
    await redisClient.setEx(
      `order:${order._id}`,
      60 * 5,
      JSON.stringify(order)
    );

    // 3. Get order from Redis
    const cachedOrder = await redisClient.get(
      `order:${order._id}`
    );

    if (cachedOrder) {
      console.log("Order placed and cached in Redis");

      return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order: JSON.parse(cachedOrder),
        source: "Redis Cache",
      });
    }

    // 4. MongoDB response
    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
      source: "MongoDB",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ADMIN - GET ALL ORDERS
const getAllOrders = async (req, res) => {
  try {

    // 1. Get orders from MongoDB
    const orders = await Order.find()
      .populate("userId", "name email");

    // 2. Store orders in Redis
    await redisClient.setEx(
      "orders",
      60 * 5,
      JSON.stringify(orders)
    );

    // 3. Get orders from Redis
    const cachedOrders = await redisClient.get("orders");

    if (cachedOrders) {
      console.log("Orders fetched from Redis cache");

      return res.status(200).json({
        success: true,
        orders: JSON.parse(cachedOrders),
        source: "Redis Cache",
      });
    }

    // 4. MongoDB response
    res.status(200).json({
      success: true,
      orders,
      source: "MongoDB",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// USER - GET OWN ORDERS
const getUserOrders = async (req, res) => {
  try {

    // 1. Get user's orders from MongoDB
    const orders = await Order.find({
      userId: req.params.userId,
    });

    // 2. Store user's orders in Redis
    await redisClient.setEx(
      `orders:user:${req.params.userId}`,
      60 * 5,
      JSON.stringify(orders)
    );

    // 3. Get user's orders from Redis
    const cachedOrders = await redisClient.get(
      `orders:user:${req.params.userId}`
    );

    if (cachedOrders) {
      console.log("User orders fetched from Redis cache");

      return res.status(200).json({
        success: true,
        orders: JSON.parse(cachedOrders),
        source: "Redis Cache",
      });
    }

    // 4. MongoDB response
    res.status(200).json({
      success: true,
      orders,
      source: "MongoDB",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ADMIN - UPDATE ORDER STATUS
const updateOrderStatus = async (req, res) => {
  try {

    const { status } = req.body;

    // 1. Update order in MongoDB
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // 2. Store updated order in Redis
    await redisClient.setEx(
      `order:${order._id}`,
      60 * 5,
      JSON.stringify(order)
    );

    // 3. Get updated order from Redis
    const cachedOrder = await redisClient.get(
      `order:${order._id}`
    );

    if (cachedOrder) {
      console.log("Updated order fetched from Redis cache");

      return res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order: JSON.parse(cachedOrder),
        source: "Redis Cache",
      });
    }

    // 4. MongoDB response
    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
      source: "MongoDB",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  createOrder,
  getAllOrders,
  getUserOrders,
  updateOrderStatus,
};