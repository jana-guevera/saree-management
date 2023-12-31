const express = require("express");

const Product = require("../models/product.js");
const Category = require("../models/prod-category.js");
const User = require("../models/user.js");
const Id = require("../models/ids.js");

const auth = require("../middleware/auth");
const apiAuth = require("../middleware/api-auth.js");
const isPermAuth = require("../middleware/permission-auth.js");
const actions = require("../middleware/permissions.js").actions;

const router = new express.Router();

// ------------------------------------ Pages Routes ---------------------------------------------------

router.get("/products", auth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_PRODUCTS)){
        return res.send({error: "Unauthorized action"});
    }

    if(req.session.user.role !== "ADMIN"){
        return res.render("products", {
            user: req.session.user, 
            actions:actions
        });
    }

    const users = await User.find(
        {role: {$ne: "ADMIN"}}, 
        {_id:1, name:1
    }).lean();

    const categories = await Category.find({}).lean();

    res.render("products", {
        user: req.session.user, 
        actions:actions,
        users: users,
        categories: categories
    });
});

// Route to send preview 
router.get("/products/preview/:id", async (req, res) => {
    try{
        const id = req.params.id;
        const vendor = req.params.vendor;

        const product = await Product.findById(id);

        if(!product){
            return res.send({error: "Product not found!"});
        }

        res.render("product-preview", {layout: "", product: product});
    }catch(e){
        res.send({error: e.message});
    }
});

// ------------------------------------ APIs Routes ---------------------------------------------------

//Create Product
router.post("/api/products", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.CREATE_PRODUCTS)){
        return res.send({error: "Unauthorized action"});
    }

    try{
        const category = await Category.findById(req.body.category);
        req.body.categoryName = category.name;
        const idsId = "64f778a3d6767ea683a6dde5";
        const idResult = await Id.findByIdAndUpdate(
            idsId, {$inc: {prodId: 1}}, {new: true}
        );

        if(!idResult){
            return res.send({error: "Unable to create prduct Id."});
        }

        req.body.prodId = "PRD" + idResult.prodId;


        const product = new Product(req.body);
        await product.save();
        res.send(product);
    }catch(e){
        console.log(e);
        res.send({error: "Something went wrong! Unable to create product."});
    }
});

//Read all Products
router.get("/api/products", apiAuth, async (req, res) => {  
    try{
        var products = await Product.find({}).populate("category");

        if(req.session.user.role !== "ADMIN"){
            products.forEach((product) => {
                product.vendorsPrice = product.vendorsPrice.filter((vendor) => {
                    return vendor.vendorId === req.session.user._id;
                });
            });
        }
        
        res.send(products);
    }catch(e){
        res.send({error: "Something went wrong! Unable to fetch products."});
    }
});

// Read a Product
router.get("/api/products/:id", apiAuth, async (req, res) => {
    const _id = req.params.id;
    const userRole = req.session.user.role;

    try{
        const product = await Product.findById({_id: _id}).populate("category");

        if(!product){
            return res.send({
                error: "Product not found!"
            });
        }

        if(!product.category){
            product.depopulate("category");
        }

        if(userRole === "ADMIN"){
            return res.send(product); 
        }

        product.vendorsPrice = product.vendorsPrice.filter((vendor) => {
            return vendor.vendorId === req.session.user._id;
        });

        res.send(product);
    }catch(e){
        res.send({error: "Something went wrong! Unable to fetch product."});
    }
});

// Update a Product
router.patch("/api/products/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.MODIFY_PRODUCTS)){
        return res.send({error: "Unauthorized action"});
    }
  
    const _id = req.params.id;

    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "category", "quantity", "pagePrice", "status", "note", "vendorsPrice"];

    const isValidOperation = updates.every((key) => {
        return allowedUpdates.includes(key);
    });

    if(!isValidOperation){
       return res.send({error: "Invalid updates."});
    }

    try{
        const product = await Product.findById(_id);

        if(!product){
            res.send({
                error: "Product not found"
            });
        }

        updates.forEach((update) => {
            product[update] = req.body[update];
        });

        const category = await Category.findById(req.body.category);

        if(category){
            product.categoryName = category.name;
        }

        await product.save();
        await product.populate("category");
        res.send(product);
    }catch(e){
        res.send({error: "Something went wrong! Unable to update product."});
    }
});

// Update selling price
router.patch("/api/products/selling-price/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_PRODUCTS)){
        return res.send({error: "Unauthorized action"});
    }
  
    const _id = req.params.id;

    try{
        const product = await Product.findById(_id);

        if(!product){
            res.send({
                error: "Product not found"
            });
        }

        product.vendorsPrice.forEach(async (vPrice) => {
            if(vPrice.vendorId === req.session.user._id){
                vPrice.vendorSellingPrice = req.body.vendorSellingPrice;
                await product.save();
            }
        });

        res.send(product);
    }catch(e){
        res.send({error: "Something went wrong! Unable to update product."});
    }
});

// Delete a Product
router.delete("/api/products/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.DELETE_PRODUCTS)){
        return res.send({error: "Unauthorized action"});
    }

    const _id = req.params.id;

    try {
        const product = await Product.findByIdAndDelete({_id: _id});

        if(!product){
            return res.send({error: "Product not found."});
        }

        await Product.removeFiles(product.fileNames);
        res.send(product);
    }catch(e){
        res.send({error: "Something went wrong! Unable to delete product."});
    }
});

// Upload files
router.post("/api/products/upload_files/:id", async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.MODIFY_PRODUCTS)){
        return res.send({error: "Unauthorized action"});
    }

    try{
        const product = await Product.findById(req.params.id);

        if(!product){
            return res.send({error: "Product not found!"});
        }

        if(req.files){
            const result = await Product.uploadFiles(req.files, product.prodId); 
           
            if(result.error){
                return res.send(result);
            }
    
            const fileNames = product.fileNames.concat(result);
            product.fileNames = fileNames;
            await product.save();
            res.send(product);
        }else{
            res.send({error: "No files uploaded!"});
        }
    }catch(e){
        res.send({error: e.message});
        console.log(e.message);
    }
});

router.delete("/api/products/remove_files/:id/:fileId", async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.MODIFY_PRODUCTS)){
        return res.send({error: "Unauthorized action"});
    }

    const productId = req.params.id;
    const fileId = req.params.fileId;

    try{
        const product = await Product.findById(productId);

        if(!product){
            return res.send({error: "Product not found!"});
        }

        const newArr = product.fileNames.filter((f) => {
            return f.id !== fileId;
        });

        product.fileNames = newArr;
        await product.save();

        await Product.removeFiles([fileId]);
        res.send(product);
    }catch(e){
        res.send({error: e.message});
    }
});

module.exports = router;

