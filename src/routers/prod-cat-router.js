const express = require("express");

const ProductCategory = require("../models/prod-category.js");
const auth = require("../middleware/auth");
const apiAuth = require("../middleware/api-auth.js");
const actions = require("../middleware/permissions.js").actions;
const isPermAuth = require("../middleware/permission-auth.js");

const router = new express.Router();

// ------------------------------------ Pages Routes ---------------------------------------------------

router.get("/categories", auth, (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_CATEGORIES)){
        return res.send({error: "Unauthorized action"});
    }
    res.render("categories", {user: req.session.user, actions:actions});
});

// ------------------------------------ APIs Routes ---------------------------------------------------

//Create Product Category
router.post("/api/categories", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.CREATE_CATEGORIES)){
        return res.send({error: "Unauthorized action"});
    }

    const category = new ProductCategory(req.body);

    try{
        await category.save();
        res.send(category);
    }catch(e){
        res.send({error: "Something went wrong! Unable to create product category."});
    }
});

//Read all Product Categories
router.get("/api/categories", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_CATEGORIES)){
        return res.send({error: "Unauthorized action"});
    }

    try{
        categories = await ProductCategory.find({});
        res.send(categories);
    }catch(e){
        res.send({error: "Something went wrong! Unable to fetch product categories."});
    }
});

// Read a Product Category
router.get("/api/categories/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_CATEGORIES)){
        return res.send({error: "Unauthorized action"});
    }
    
    const _id = req.params.id;

    try{
        const category = await ProductCategory.findOne({_id: _id});

        if(!category){
            return res.send({
                error: "Product category not found!"
            });
        }

        res.send(category);
    }catch(e){
        res.send({error: "Something went wrong! Unable to fetch product category."});
    }
});

// Update a Product Category
router.patch("/api/categories/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.MODIFY_CATEGORIES)){
        return res.send({error: "Unauthorized action"});
    }

    const _id = req.params.id;

    const updates = Object.keys(req.body);
    const allowedUpdates = ["name"];

    const isValidOperation = updates.every((key) => {
        return allowedUpdates.includes(key);
    });

    if(!isValidOperation){
       return res.send({error: "Invalid updates."});
    }

    try{
        const category = await ProductCategory.findByIdAndUpdate({_id: _id}, req.body, {new : true, runValidators: true});

        if(!category){
            res.send({
                error: "Product category not found"
            });
        }

        res.send(category);
    }catch(e){
        res.send({error: "Something went wrong! Unable to update product category."});
    }
});

// Delete a Product Category
router.delete("/api/categories/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.DELETE_CATEGORIES)){
        return res.send({error: "Unauthorized action"});
    }

    const _id = req.params.id;

    try {
        const category = await ProductCategory.findByIdAndDelete({_id: _id});

        if(!category){
            return res.send({error: "Product category not found."});
        }

        res.send(category);
    }catch(e){
        res.send({error: "Something went wrong! Unable to delete product category."});
    }
});

module.exports = router;

