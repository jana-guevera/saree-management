const express = require("express");

const Order = require("../models/order.js");
const Customer = require("../models/customer.js");
const Product = require("../models/product.js");
const User = require("../models/user.js");
const DeliveryService = require("../models/delivery-service.js");

const auth = require("../middleware/auth");
const apiAuth = require("../middleware/api-auth.js");
const permissions = require("../middleware/permissions.js");
const isPermAuth = require("../middleware/permission-auth.js");
const actions = permissions.actions;
const idGenerator = require("../utils/id-generator.js");
const sendEmail = require("../utils/email.js");

const router = new express.Router();

// ------------------------------------ Pages Routes ---------------------------------------------------

router.get("/orders", auth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_ORDERS)){
        return res.send({error: "Unauthorized action"});
    }

    try{
        const dServices = await DeliveryService.find({}).lean();

        if(req.session.user.role !== "ADMIN"){
            return res.render("orders", {
                user: req.session.user, 
                actions:permissions.actions,
                dServices: dServices
            });
        }
    
        const users = await User.find(
            {role: {$ne: "ADMIN"}}, 
            {_id:1, name:1
        }).lean();
    
        res.render("orders", {
            user: req.session.user, 
            actions:permissions.actions,
            users: users,
            dServices: dServices
        });
    }catch(e){
        console.log(e);
        res.send({error: e.message});
    }
});

router.get("/orders/details/:id", auth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_ORDERS)){
        return res.send({error: "Unauthorized action"});
    }

    const userRole = req.session.user.role;
    const userId = req.session.user._id;

    const _id = req.params.id;

    try{
        var order;

        if(userRole === "ADMIN"){
            order = await Order.findById(_id).lean();
        }else{
            order = await Order.findOne({
                vendor: userId, _id: _id}).lean();
        }

        if(!order){
            return res.redirect("/orders");
        }

        if(order.orderSource == 1){
            return res.render("order_details", {
                user: req.session.user, 
                actions:actions,
                order: order
            });
        }

        res.render("external_order_details", {
            user: req.session.user, 
            actions:actions,
            order: order
        });
    }catch(e){
        res.redirect("/orders");
    }   
});

// ------------------------------------ APIs Routes for Orders -----------------------------------------

//Create Order
router.post("/api/orders", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.CREATE_ORDERS)){
        return res.send({error: "Unauthorized action"});
    }

    try{
        const customer = await Customer.findOne({
            cusId: req.body.customer,
            vendor: req.body.vendor
        });
        const user = await User.findById(req.body.vendor);

        if(!customer){
            return res.send({
                error: "Customer not found or does not belong to the selected vendor!"});
        }

        if(!user){
            return res.send({error: "Vendor not found."});
        }

        if(req.body.orderSource == 0 && req.body.orderType == 1){
            return res.send({error: "Cannot place stock orders for external orders."});
        }

        req.body.OID = idGenerator.generateOrderId();
        req.body.customer = customer._id;
        req.body.customerName = customer.name;
        req.body.addedBy = req.session.user._id;
        req.body.vendorName = user.name;

        const order = await new Order(req.body);
        await order.save();
        // await order.populate("customer", {name: 1, cusId: 1});
        // await order.populate("vendor", {_id: 1, name: 1});

        if(req.session.user.role !== "ADMIN"){
            await sendEmail({
                email: process.env.ORDER_NOTIF_EMAIL,
                subject: "New Order Added",
                message: `${req.session.user.name} has added a new order ${order.OID}.`
            });
        }
        res.send(order);
    }catch(e){
        console.log(e.message);
        res.send({error: "Something went wrong! Unable to create order."});
    }
});

//Read all Orders
router.get("/api/orders", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_ORDERS)){
        return res.send({error: "Unauthorized action"});
    }

    const userRole = req.session.user.role;
    const userId = req.session.user._id;
    try{
        var orders;

        if(userRole === "ADMIN"){
            orders = await Order.find({}).populate("customer", 
            {name: 1, cusId: 1}).populate("vendor", {name: 1});
        }else{
            orders = await Order.find({vendor: userId}).populate("customer", 
            {name: 1, cusId: 1}).populate("vendor", {name: 1});
        }

        res.send(orders);
    }catch(e){
        console.log(e.message);
        res.send({error: "Something went wrong! Unable to fetch orders."});
    }
});

// Read an Order
router.get("/api/orders/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.VIEW_ORDERS)){
        return res.send({error: "Unauthorized action"});
    }

    const userRole = req.session.user.role;
    const userId = req.session.user._id;

    const _id = req.params.id;

    try{
        var order;

        if(userRole === "ADMIN"){
            order = await Order.findById(_id).populate("customer", 
            {name: 1, cusId: 1}).populate("vendor", {name: 1});
        }else{
            order = await Order.findOne({
                vendor: userId, _id: _id}).populate("customer", 
            {name: 1, cusId: 1}).populate("vendor", {name: 1});
        }

        if(!order){
            return res.send({
                error: "Order not found!"
            });
        }

        res.send(order);
    }catch(e){
        console.log(e.message);
        res.send({error: "Something went wrong! Unable to fetch order."});
    }
});

// Update an Order
router.patch("/api/orders/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.MODIFY_ORDERS)){
        return res.send({error: "Unauthorized action"});
    }

    const userRole = req.session.user.role;
    const userId = req.session.user._id;

    const _id = req.params.id;

    const updates = Object.keys(req.body);
    const allowedUpdates = ["orderDate", "deliveryDate", "deliveryService",
        "trackingCode", "deliveryAddress","note", "customerContact", "deliveryCost"];

    const isValidOperation = updates.every((key) => {
        return allowedUpdates.includes(key);
    });

    if(!isValidOperation){
       return res.send({error: "Invalid updates."});
    }

    try{
        var order;

        if(userRole === "ADMIN"){
            order = await Order.findByIdAndUpdate({_id: _id}, 
                req.body, {new : true, runValidators: true});
        }else{
            order = await Order.findOneAndUpdate({_id: _id, vendor: userId}, 
                req.body, {new : true, runValidators: true});
        }

        if(!order){
            return res.send({
                error: "Order not found"
            });
        }

        if(req.session.user.role !== "ADMIN"){
            await sendEmail({
                email: process.env.ORDER_NOTIF_EMAIL,
                subject: "Order Updated",
                message: `${req.session.user.name} has updated the order ${order.OID}`
            });
        }

        res.send(order);
    }catch(e){
        res.send({error: "Something went wrong! Unable to update order."});
    }
});

// Update Order Status
router.patch("/api/orders/update_status/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.MODIFY_ORDERS)){
        return res.send({error: "Unauthorized action"});
    }

    const userRole = req.session.user.role;
    const userId = req.session.user._id;

    const _id = req.params.id;

    const updates = Object.keys(req.body);
    const allowedUpdates = ["status"];

    const isValidOperation = updates.every((key) => {
        return allowedUpdates.includes(key);
    });

    if(!isValidOperation){
       return res.send({error: "Invalid updates."});
    }

    try{
        var order;

        if(userRole === "ADMIN"){
            order = await Order.findById({_id: _id});
        }else{
            order = await Order.findOne({_id: _id, vendor: userId});
        }

        if(!order){
            return res.send({
                error: "Order not found"
            });
        }

        if(order.status == 3){
            return res.send({
                error: "Cannot update the status of cancelled order!"
            }); 
        }

        if(order.status == req.body.status){
            return res.send(order);
        }

        if(order.orderSource == 1 && order.orderType == 1 && req.body.status == 3){
            for(var i = 0; i < order.products.length; i++){
                const product = await Product.findOne({
                    prodId: order.products[i].prodId
                });

                if(product){
                    product.quantity = product.quantity + order.products[i].quantity;
                    await product.save();
                }
            }
        }

        order.status = req.body.status;
        await order.save();

        if(req.session.user.role !== "ADMIN"){
            await sendEmail({
                email: process.env.ORDER_NOTIF_EMAIL,
                subject: "Order Status Updated",
                message: `${req.session.user.name} has updated the status of order ${order.OID}`
            });
        }

        res.send(order);
    }catch(e){
        res.send({error: "Something went wrong! Unable to update order."});
    }
});

// Delete a Order
router.delete("/api/orders/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.DELETE_ORDERS)){
        return res.send({error: "Unauthorized action"});
    }

    const userRole = req.session.user.role;
    const userId = req.session.user._id;

    const _id = req.params.id;

    try {
        var order;

        if(userRole === "ADMIN"){
            order = await Order.findById({_id: _id});
        }else{
            order = await Order.findOne({vendor: userId, _id: _id});
        }

        if(!order){
            return res.send({error: "Order not found."});
        }

        if(order.status != 3){
            return res.send({error: "Only cancelled orders can be deleted!"});
        }

        await Order.findByIdAndDelete({_id: _id});
        res.send(order);

        order.products.forEach(async (prod) => {
            await Product.removeOrderFile(prod.imagePath);
        });
    }catch(e){
        console.log(e.message);
        res.send({error: "Something went wrong! Unable to delete customer."});
    }
});

// ------------------------------------ APIs Routes for Order Details -----------------------------------------

//Add Product to Order
router.post("/api/orders/products", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.MODIFY_ORDERS)){
        return res.send({error: "Unauthorized action"});
    }

    const userRole = req.session.user.role;
    const userId = req.session.user._id;

    const orderId = req.body.orderId;
    const prodId = req.body.prodId;

    try{
        var order;

        if(userRole === "ADMIN"){
            order = await Order.findById(orderId);
        }else{
            order = await Order.findOne({vendor: userId, _id: orderId});
        }

        if(!order){
            return res.send({error: "Order not found."});
        }

        if(order.status == 3){
            return res.send({error: "Cannot add products to Canceled orders"});
        }

        const product = await Product.findOne({prodId: prodId}); 

        if(!product){
            return res.send({error: "Product not found."});
        }

        if(product.status == 0){
            return res.send({error: "Product is unavailable."});
        }

        if(order.orderType == 1){
            if(product.quantity < req.body.quantity){
                return res.send({error: "Insufficient quantity."});
            }
        }else{
            if(product.quantity > 0){
                return res.send({error: "Cannot add a product which has stock in a pre order."});
            }
        }

        const addedProduct = order.products.find((product) => {
            return product.prodId === prodId
        });

        if(addedProduct){
            return res.send({error: "Product already added!"});
        }

        // ==== Calculate sale and commission
        const vendorPriceObj = product.vendorsPrice.find((v) => {
            return v.vendorId === order.vendor.toString();
        });

        const vendorPrice = parseFloat(vendorPriceObj.price); //5000
        const commssion = parseFloat(vendorPriceObj.commission); //1000
        const soldPrice = parseFloat(req.body.soldPrice); // 5800

        const commssionPerSale = soldPrice - (vendorPrice - commssion);
        const totalCommission = commssionPerSale * req.body.quantity;
        const totalSale = soldPrice * parseInt(req.body.quantity);

        var newProduct = {
            prodId: product.prodId,
            name: product.name,
            quantity: req.body.quantity,
            vendorPrice: vendorPriceObj.price,
            soldPrice: req.body.soldPrice,
            commssionPrice: vendorPriceObj.commission,
            totalCommission: totalCommission,
            totalSale: totalSale,
        }

        // Copy image to order folder
        if(product.fileNames.length > 0){
            const orderImage = await Product.copyFile(product.fileNames[0]);

            if(!orderImage.error){
                newProduct.imagePath = orderImage.id;
            }else{
                newProduct.imagePath = product.fileNames[0].id;
            }
        }

        order.products.push(newProduct);

        if(order.orderType == 1){
            product.quantity = product.quantity - parseInt(req.body.quantity); 
        }

        var orderTotalSale = 0;
        var orderTotalCommission = 0;

        order.products.forEach(prod => {
            orderTotalSale += parseFloat(prod.totalSale);
            orderTotalCommission += parseFloat(prod.totalCommission);
        });

        order.totalSale = orderTotalSale;
        order.totalCommission = orderTotalCommission;

        await order.save();
        await product.save();

        if(req.session.user.role !== "ADMIN"){
            await sendEmail({
                email: process.env.ORDER_NOTIF_EMAIL,
                subject: "Order Updated",
                message: `${req.session.user.name} has added a product for the order ${order.OID}`
            });
        }

        res.send(order);
    }catch(e){
        console.log(e);
        res.send({error: "Something went wrong! Unable to add product to order."});
    }
});

// Delete an Ordered Product
router.delete("/api/orders/products/:prodId", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.MODIFY_ORDERS)){
        return res.send({error: "Unauthorized action"});
    }

    try{
        const prodId = req.params.prodId;
        const orderId = req.body.orderId;

        const user = req.session.user;

        const order = await Order.findById(orderId);

        if(!order){
            return res.send({error: "Order not found"});
        }

        if(user.role !== "ADMIN" && order.vendor.toString() !== user._id.toString()){
            return res.send({error: "Order not found"});
        }

        const orderedProd = order.products.find((prod) => prod._id.toString() === prodId);
        const product = await Product.findOne({prodId: orderedProd.prodId});

        if(!orderedProd){
           return res.send({error: "Product not found"});
        }

        order.products = order.products.filter((prod) => prod._id.toString() !== prodId);
        order.totalSale = order.totalSale - orderedProd.totalSale;
        order.totalCommission = orderedProd.totalCommission;

        if(order.orderType == 1){
            product.quantity = product.quantity + orderedProd.quantity;
            await product.save();
        }

        await order.save();
        Product.removeOrderFile(orderedProd.imagePath);

        if(req.session.user.role !== "ADMIN"){
            await sendEmail({
                email: process.env.ORDER_NOTIF_EMAIL,
                subject: "Order Updated",
                message: `${req.session.user.name} has removed a product from the order ${order.OID}`
            });
        }

        res.send(order);
    }catch(e){
        res.send({error: "Something went wrong. Unable to delete ordered product"});
    }
});

// Add products to external orders
router.post("/api/orders/external/products", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.MODIFY_ORDERS)){
        return res.send({error: "Unauthorized action"});
    }

    const userRole = req.session.user.role;
    const userId = req.session.user._id;

    const orderId = req.body.orderId;

    try{
        var order;

        if(userRole === "ADMIN"){
            order = await Order.findById(orderId);
        }else{
            order = await Order.findOne({vendor: userId, _id: orderId});
        }

        if(!order){
            return res.send({error: "Order not found."});
        }

        if(order.status == 3){
            return res.send({error: "Cannot add products to Canceled orders"});
        }

        const imageId = await Product.uploadOrderFile(req.files.imageFile); 
           
        if(imageId.error){
            return res.send(imageId);
        }

        const soldPrice = parseFloat(req.body.soldPrice); 
        const totalSale = soldPrice * parseInt(req.body.quantity);

        var newProduct = {
            prodId: "External",
            name: req.body.name,
            quantity: req.body.quantity,
            vendorPrice: 0,
            soldPrice: req.body.soldPrice,
            commssionPrice: 0,
            totalCommission: 0,
            totalSale: totalSale,
            imagePath: imageId
        }

        order.products.push(newProduct);

        var orderTotalSale = 0;

        order.products.forEach(prod => {
            orderTotalSale += parseFloat(prod.totalSale);
        });

        order.totalSale = orderTotalSale;

        await order.save();

        if(req.session.user.role !== "ADMIN"){
            await sendEmail({
                email: process.env.ORDER_NOTIF_EMAIL,
                subject: "Order Updated",
                message: `${req.session.user.name} has added a product for the order ${order.OID}`
            });
        }

        res.send(order);
    }catch(e){
        console.log(e);
        res.send({error: "Something went wrong! Unable to add product to order."});
    }
});

// Delete products from external orders
router.delete("/api/orders/external/products/:id", apiAuth, async (req, res) => {
    if(!isPermAuth(req.session.user.role, actions.MODIFY_ORDERS)){
        return res.send({error: "Unauthorized action"});
    }

    try{
        const prodId = req.params.id;
        const orderId = req.body.orderId;

        const user = req.session.user;

        const order = await Order.findById(orderId);

        if(!order){
            return res.send({error: "Order not found"});
        }

        if(user.role !== "ADMIN" && order.vendor.toString() !== user._id.toString()){
            return res.send({error: "Order not found"});
        }

        const orderedProd = order.products.find((prod) => {
            return prod._id.toString() === prodId;
        });

        if(!orderedProd){
           return res.send({error: "Product not found"});
        }

        order.products = order.products.filter((prod) => prod._id.toString() !== prodId);
        order.totalSale = order.totalSale - orderedProd.totalSale;

        await order.save();
        Product.removeOrderFile(orderedProd.imagePath);

        if(req.session.user.role !== "ADMIN"){
            await sendEmail({
                email: process.env.ORDER_NOTIF_EMAIL,
                subject: "Order Updated",
                message: `${req.session.user.name} has removed a product from the order ${order.OID}`
            });
        }

        res.send(order);
    }catch(e){
        res.send({error: "Something went wrong. Unable to delete ordered product"});
    }
});

module.exports = router;