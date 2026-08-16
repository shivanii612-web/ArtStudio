const Product = require("../Model/ProductModel");
const { redisClient } = require("../Config/redis");
// product controller

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    // 1. Create product in MongoDB
    const product = await Product.create(req.body);

    // 2. Store product in Redis
    await redisClient.setEx(
      `product:${product._id}`,
      60 * 5,
      JSON.stringify(product)
    );

    // 3. Get product from Redis
    const cachedProduct = await redisClient.get(
      `product:${product._id}`
    );

    if (cachedProduct) {
      console.log("Product fetched from Redis cache");

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: JSON.parse(cachedProduct),
        source: "Redis Cache",
      });
    }

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
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

const getAllProducts = async (req, res) => {
    try {
    const cachedProducts = await redisClient.get("products");

    if (cachedProducts) {
      console.log("Products fetched from Redis cache");
      const parsedProducts = JSON.parse(cachedProducts);
      return res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        data: parsedProducts,
        products: parsedProducts,
        source: "redis Cache",
      });
    }

    const products = await Product.find();

    await redisClient.setEx("products", 60 * 5, JSON.stringify(products));

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: products,
      products,
      source: "MongoDB",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};


// GET PRODUCT BY ID
const getProductById = async (req, res) => {
  try {
    // 1. Get product from MongoDB
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 2. Store product in Redis
    await redisClient.setEx(
      `product:${req.params.id}`,
      60 * 5,
      JSON.stringify(product)
    );

    // 3. Get product from Redis
    const cachedProduct = await redisClient.get(
      `product:${req.params.id}`
    );

    if (cachedProduct) {
      console.log("Product fetched from Redis cache");

      return res.status(200).json({
        success: true,
        message: "Product retrieved successfully",
        data: JSON.parse(cachedProduct),
        source: "Redis Cache",
      });
    }

    // 4. MongoDB response
    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product,
      source: "MongoDB",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    // 1. Update product in MongoDB
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 2. Store updated product in Redis
    await redisClient.setEx(
      `product:${req.params.id}`,
      60 * 5,
      JSON.stringify(product)
    );

    // 3. Get updated product from Redis
    const cachedProduct = await redisClient.get(
      `product:${req.params.id}`
    );

    if (cachedProduct) {
      console.log("Updated product fetched from Redis cache");

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: JSON.parse(cachedProduct),
        source: "Redis Cache",
      });
    }

    // 4. MongoDB response
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
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


// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    // 1. Delete product from MongoDB
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 2. Store deleted product in Redis
    await redisClient.setEx(
      `deletedProduct:${req.params.id}`,
      60 * 5,
      JSON.stringify(product)
    );

    // 3. Get deleted product from Redis
    const cachedProduct = await redisClient.get(
      `deletedProduct:${req.params.id}`
    );

    if (cachedProduct) {
      console.log("Deleted product fetched from Redis cache");

      return res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        data: JSON.parse(cachedProduct),
        source: "Redis Cache",
      });
    }

    // 4. MongoDB response
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: product,
      source: "MongoDB",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

// DELETE ALL PRODUCTS
const deleteAllProducts = async (req, res) => {
  try {
    // 1. Delete all products from MongoDB
    const result = await Product.deleteMany({});

    // 2. Store delete result in Redis
    await redisClient.setEx(
      "deletedProducts",
      60 * 5,
      JSON.stringify({
        deletedCount: result.deletedCount,
      })
    );

    // 3. Get delete result from Redis
    const cachedResult = await redisClient.get("deletedProducts");

    if (cachedResult) {
      console.log("Delete all products result fetched from Redis cache");

      return res.status(200).json({
        success: true,
        message: "All products deleted successfully",
        deletedCount: JSON.parse(cachedResult).deletedCount,
        source: "Redis Cache",
      });
    }

    // 4. MongoDB response
    res.status(200).json({
      success: true,
      message: "All products deleted successfully",
      deletedCount: result.deletedCount,
      source: "MongoDB",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete all products",
    });
  }
};


// RESERVE PRODUCT STOCK
const reserveProductStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    const requestedQty = Number(quantity) || 1;

    // Atomically find and decrement quantity, ensuring quantity >= requestedQty
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, quantity: { $gte: requestedQty } },
      { $inc: { quantity: -requestedQty } },
      { new: true }
    );

    if (!product) {
      // Find current stock to output an accurate error message
      const dbProduct = await Product.findById(req.params.id);
      const availableQty = dbProduct ? dbProduct.quantity : 0;
      return res.status(400).json({
        success: false,
        message: `Only ${availableQty} items are available.`,
      });
    }

    // Invalidate Redis cache
    try {
      await redisClient.del("products");
      await redisClient.del(`product:${product._id}`);
    } catch (redisError) {
      console.log("Redis error:", redisError);
    }

    res.status(200).json({
      success: true,
      message: "Stock reserved successfully",
      quantity: product.quantity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// RELEASE PRODUCT STOCK
const releaseProductStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    const releaseQty = Number(quantity) || 1;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id },
      { $inc: { quantity: releaseQty } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Invalidate Redis cache
    try {
      await redisClient.del("products");
      await redisClient.del(`product:${product._id}`);
    } catch (redisError) {
      console.log("Redis error:", redisError);
    }

    res.status(200).json({
      success: true,
      message: "Stock released successfully",
      quantity: product.quantity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  createProduct,
  getAllProducts,
  getProductById, 
  updateProduct,
  deleteProduct,
  deleteAllProducts,
  reserveProductStock,
  releaseProductStock
};


