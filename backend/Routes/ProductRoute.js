const express = require("express");  //product router

const router = express.Router();
console.log("Product Route Loaded");
const { createProduct,getAllProducts,getProductById,updateProduct,deleteProduct,deleteAllProducts,reserveProductStock,releaseProductStock} = require("../Controller/ProductController");

router.post("/create", createProduct);
router.get("/AllProducts", getAllProducts);
router.get("/product/:id", getProductById);

router.put("/updateproduct/:id", updateProduct);
router.delete("/delete/:id", deleteProduct);
router.delete("/deleteAll", deleteAllProducts);

router.post("/products/reserve/:id", reserveProductStock);
router.post("/products/release/:id", releaseProductStock);

module.exports = router;