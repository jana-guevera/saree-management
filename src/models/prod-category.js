const mongoose = require("mongoose");

const productCategorySchema = mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    }
});

const ProductCategory = mongoose.model("ProductCategory", productCategorySchema);

module.exports = ProductCategory;