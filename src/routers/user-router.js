const express = require("express");
const ObjectId = require("mongoose").Types.ObjectId;
const sendEmail = require("../utils/email.js");
const User = require("../models/user.js");
const auth = require("../middleware/auth");
const apiAuth = require("../middleware/api-auth.js");
const isPermAuth = require("../middleware/permission-auth.js");
const permissions = require("../middleware/permissions.js");
const actions = permissions.actions;
const roles = permissions.roles;


const router = new express.Router();

// ------------------------------------------- Pages -------------------------------------------------

router.get("/", (req, res) => {
    if(req.session.user){
        req.session.user = undefined;
    }

    res.render("index", {layout: "", message: req.query.message});
});

router.get("/users", auth, (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_USERS)){
        return res.send({error: "Unauthorized action"});
    }

    res.render("users", {user: req.session.user, actions:actions});
});

router.get("/users/forgot_password", (req, res) => {
    res.render("forgot_password", {layout: ""});
});

router.get("/users/reset_password", async (req, res) => {
    if(!req.query.secret || !req.query.id){
        return res.redirect("/");
    }

    res.render("reset_password", {
        layout: "",
        _id: req.query.id, 
        secret: req.query.secret
    });
});

// ------------------------------------------- APIs -------------------------------------------------

//Read all Users
router.get("/api/users", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_USERS)){
        return res.send({error: "Unauthorized action"});
    }

    try{
        users = await User.find({role: {$ne: roles.ADMIN}});
        res.send(users);
    }catch(e){
        res.send({error: "Something went wrong! Unable to fetch users."});
    }
});

// Read a User
router.get("/api/users/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_USERS)){
        return res.send({error: "Unauthorized action"});
    }

    const _id = req.params.id;

    try{
        const user = await User.findOne({_id: _id});

        if(!user){
            return res.send({
                error: "User not found!"
            });
        }

        res.send(user);
    }catch(e){
        res.send({error: "Something went wrong! Unable to fetch user."});
    }
});

// Create a user
router.post("/api/users", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.CREATE_USERS)){
        return res.send({error: "Unauthorized action"});
    }

    const user = new User(req.body);

    try{
        await user.save();
        res.send(user);
    }catch(e){
        res.send({error: "Something went wrong! Unable to create user."});
    }
});

// Update a user
router.patch("/api/users/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.MODIFY_ORDERS)){
        return res.send({error: "Unauthorized action"});
    }

    const _id = req.params.id;

    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "email", "address", "status"];

    const isValidOperation = updates.every((key) => {
        return allowedUpdates.includes(key);
    });

    if(!isValidOperation){
       return res.send({error: "Invalid updates."});
    }

    try{
        const user = await User.findByIdAndUpdate({_id: _id}, req.body, {new : true, runValidators: true});

        if(!user){
            res.send({
                error: "User not found"
            });
        }

        res.send(user);
    }catch(e){
        res.send({error: "Something went wrong! Unable to update user."});
    }
});

// Delete a User
router.delete("/api/users/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.DELETE_USERS)){
        return res.send({error: "Unauthorized action"});
    }

    const _id = req.params.id;

    try {
        const user = await User.findByIdAndDelete({_id: _id});

        if(!user){
            return res.send({error: "User not found."});
        }

        res.send(user);
    }catch(e){
        res.send({error: "Something went wrong! Unable to delete user."});
    }
});

// =================== Login Apis =================================
router.post("/api/users/login", async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password);

        if(!user){
            return res.send({error: "Inavlid Credentials!"});
        }

        if(user.status === 0){
            return res.send({error: "You account is blocked. Please contact admin!"});
        }

        req.session.user = User.getUserPublicData(user);
        res.send(User.getUserPublicData(user));

    }catch(error){
        res.send({error: "Something went wrong. Please try again."});
    }
});

router.get("/api/users/password_reset_link", async (req, res) => {
    if(!req.query.email){
        return res.redirect("/?message=Please provide the email!");
    }

    try{
        const user = await User.findOne(req.query);
        if(user){
            const secret = new ObjectId().toString();
            user.secret = secret;
            await user.save();
            await sendEmail({
                email: user.email,
                subject: "Password Reset Link",
                message: `<a href=${process.env.DOMAIN}/users/reset_password?id=${user._id}&secret=${secret
                }>Click Here to Reset Password</a>`
            });
        }

        res.redirect("/?message=Click the link send to your email to reset the password.");
    }catch(e){
        res.redirect("/?message=" + e.message);
    }
});

router.post("/api/users/reset_password", async (req,res) => {
    try{
        const user = await User.findById(req.body._id);

        if(!user){
            return res.send({error: "Invalid Reset Link!"});
        }
        
        user.password = req.body.password;
        user.secret = "";

        await user.save();
        res.send(user);
    }catch(e){
        res.send({error: e.message});
    }
});

module.exports = router;


