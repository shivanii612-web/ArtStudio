const mongoose = require("mongoose"); // product model

const productSchema = new mongoose.Schema({

    

    title: {
        type: String,
        required: true,
        unique: true,
    },

    description: {
        type: String,
        required: true,
    },

    price: {
        type: Number,
        required: true,
    },

    quantity: {
        type: Number,
        required: true,
    },

    image: {
        type: String,
        required: true,
    }

});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;