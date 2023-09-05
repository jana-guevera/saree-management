const express = require("express");

const Customer = require("../models/customer.js");
const User = require("../models/user.js");
const Id = require("../models/ids.js");

const auth = require("../middleware/auth");
const apiAuth = require("../middleware/api-auth.js");
const permissions = require("../middleware/permissions.js");
const isPermAuth = require("../middleware/permission-auth.js");
const actions = permissions.actions;

const router = new express.Router();

// ------------------------------------ Pages Routes ---------------------------------------------------

router.get("/customers", auth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_CUSTOMERS)){
        return res.send({error: "Unauthorized action"});
    }

    if(req.session.user.role !== "ADMIN"){
        return res.render("customers", {
            user: req.session.user, 
            actions:permissions.actions
        });
    }

    const users = await User.find(
        {role: {$ne: "ADMIN"}}, 
        {_id:1, name:1
    }).lean();

    res.render("customers", {
        user: req.session.user, 
        actions:permissions.actions,
        users: users
    });
});

// ------------------------------------ APIs Routes ---------------------------------------------------

//Create Customer
router.post("/api/customers", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.CREATE_CUSTOMERS)){
        return res.send({error: "Unauthorized action"});
    }

    try{
        const vendor = await User.findById(req.body.vendor);

        if(!vendor){
            return res.send({error: "Vendor not found!"});
        }

        const idsId = "64f778a3d6767ea683a6dde5";
        const idResult = await Id.findByIdAndUpdate(
            idsId, {$inc: {cusId: 1}}, {new: true}
        );

        if(!idResult){
            return res.send({error: "Unable to create customer Id."});
        }

        req.body.cusId = "CUS-" + idResult.cusId;
        const customer = new Customer(req.body);
        customer.vendorName = vendor.name;
        await customer.save();
        res.send(customer);
    }catch(e){
        console.log(e.message);
        res.send({error: "Something went wrong! Unable to create customer."});
    }
});

//Read all Customers
router.get("/api/customers", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_CUSTOMERS)){
        return res.send({error: "Unauthorized action"});
    }

    try{
        var customers;
        if(req.session.user.role === "ADMIN"){
            customers = await Customer.find({}).populate("vendor", "name");
        }else{
            customers = await Customer.find({
                vendor: req.session.user._id}).populate("vendor", "name");
        }
        res.send(customers);
    }catch(e){
        console.log(e.message);
        res.send({error: "Something went wrong! Unable to fetch customers."});
    }
});

// Read a Customer
router.get("/api/customers/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_CUSTOMERS)){
        return res.send({error: "Unauthorized action"});
    }
    
    const _id = req.params.id;

    try{
        var customer;

        if(req.session.user.role === "ADMIN"){
            customer = await Customer.findOne({
                _id: _id}).populate("vendor", "name");
        }else{
            customer = await Customer.findOne({vendor: req.session.user._id,
                _id: _id}).populate("vendor", "name");
        }

        if(!customer){
            return res.send({
                error: "Customer not found!"
            });
        }

        if(!customer.vendor){
            customer.depopulate("vendor");
        }

        res.send(customer);
    }catch(e){
        console.log(e);
        res.send({error: "Something went wrong! Unable to fetch customer."});
    }
});

// Find a Customer
router.get("/api/customers/find/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_CUSTOMERS)){
        return res.send({error: "Unauthorized action"});
    }

    if(!req.params.id){
        res.send({error: "Please provide the customer id"});
    }
    
    const cusId = req.params.id;

    try{
        var customer;

        if(req.session.user.role === "ADMIN"){
            customer = await Customer.findOne({
                cusId: cusId}).populate("vendor", {name: 1, address: 1, phoneNum:1});
        }else{
            customer = await Customer.findOne({vendor: req.session.user._id,
                cusId: cusId}).populate("vendor", {name: 1, address: 1, phoneNum:1});
        }

        if(!customer){
            return res.send({
                error: "Customer not found!"
            });
        }

        res.send(customer);
    }catch(e){
        console.log(e.message);
        res.send({error: "Something went wrong! Unable to fetch customer."});
    }
});

// Get vandors 
router.get("/api/vendors", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.MODIFY_CUSTOMERS)){
        return res.send({error: "Unauthorized action"});
    }

    try{
        const vendors = await User.find({role: {$ne: "ADMIN"}});
        res.send(vendors);
    }catch(e){
        res.send({error: e.message});
    }
});

// Update a Customer
router.patch("/api/customers/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.MODIFY_CUSTOMERS)){
        return res.send({error: "Unauthorized action"});
    }

    const _id = req.params.id;

    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "address", "email", "phoneNum", "vendor", "behaviour"];

    const isValidOperation = updates.every((key) => {
        return allowedUpdates.includes(key);
    });

    if(!isValidOperation){
       return res.send({error: "Invalid updates."});
    }

    try{
        const user = await User.findById(req.body.vendor);

        if(user){
            req.body.vendorName = user.name;
        }
        var customer; 

        if(req.session.user.role === "ADMIN"){
            customer = await Customer.findByIdAndUpdate({_id: _id}, 
                req.body, {new : true, runValidators: true});
        }else{
            customer = await Customer.findOneAndUpdate(
                {_id: _id, vendor: req.session.user._id}, 
                req.body, 
                {new : true, runValidators: true}
            );
        }

        if(!customer){
            res.send({
                error: "Customer not found"
            });
        }

        res.send(customer);
    }catch(e){
        res.send({error: "Something went wrong! Unable to update customer."});
    }
});

// Delete a Customer
router.delete("/api/customers/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.DELETE_CUSTOMERS)){
        return res.send({error: "Unauthorized action"});
    }

    const _id = req.params.id;

    try {
        const customer = await Customer.findByIdAndDelete({_id: _id});

        if(!customer){
            return res.send({error: "Customer not found."});
        }

        res.send(customer);
    }catch(e){
        res.send({error: "Something went wrong! Unable to delete customer."});
    }
});

module.exports = router;

