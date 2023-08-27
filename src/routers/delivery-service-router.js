const express = require("express");

const DeliveryService = require("../models/delivery-service.js");
const auth = require("../middleware/auth");
const apiAuth = require("../middleware/api-auth.js");
const actions = require("../middleware/permissions.js").actions;
const isPermAuth = require("../middleware/permission-auth.js");

const router = new express.Router();

// ------------------------------------ Pages Routes ---------------------------------------------------

router.get("/delivery-services", auth, (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_CATEGORIES)){
        return res.send({error: "Unauthorized action"});
    }
    res.render("delivery-services", {user: req.session.user, actions:actions});
});

// ------------------------------------ APIs Routes ---------------------------------------------------

//Create Delivery Service
router.post("/api/delivery-services", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.CREATE_DELIVERY_SERVICE)){
        return res.send({error: "Unauthorized action"});
    }

    try{
        const dService = new DeliveryService(req.body);
        await dService.save();
        res.send(dService);
    }catch(e){
        res.send({error: e.message});
    }
});

//Read all Delivery Services
router.get("/api/delivery-services", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_DELIVERY_SERVICE)){
        return res.send({error: "Unauthorized action"});
    }

    try{
        dService = await DeliveryService.find({});
        res.send(dService);
    }catch(e){
        res.send({error: e.message});
    }
});

// Read a Delivery Service
router.get("/api/delivery-services/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_DELIVERY_SERVICE)){
        return res.send({error: "Unauthorized action"});
    }
    
    const _id = req.params.id;

    try{
        const dService = await DeliveryService.findById(_id);

        if(!dService){
            return res.send({
                error: "Delivery service not found!"
            });
        }

        res.send(dService);
    }catch(e){
        res.send({error: e.message});
    }
});

// Update a Delivery Service
router.patch("/api/delivery-services/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.MODIFY_DELIVERY_SERVICE)){
        return res.send({error: "Unauthorized action"});
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ["name"];

    const isValidOperation = updates.every((key) => {
        return allowedUpdates.includes(key);
    });

    if(!isValidOperation){
       return res.send({error: "Invalid updates."});
    }

    try{
        const _id = req.params.id;

        const dService = await DeliveryService.findByIdAndUpdate(
            _id, 
            req.body, 
            {new : true, runValidators: true}
        );

        if(!dService){
            res.send({
                error: "Delivery Service not found"
            });
        }

        res.send(dService);
    }catch(e){
        res.send({error: e.message});
    }
});

// Delete a Delivery Service
router.delete("/api/delivery-services/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.DELETE_DELIVERY_SERVICE)){
        return res.send({error: "Unauthorized action"});
    }

    try {
        const _id = req.params.id;
        const dService = await DeliveryService.findByIdAndDelete(_id);

        if(!dService){
            return res.send({error: "Delivery Service not found."});
        }

        res.send(dService);
    }catch(e){
        res.send({error: e.message});
    }
});

module.exports = router;

