const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
    OID: {
        type: String,
        required: true
    },
    orderSource:{
        type: Number,
        required: true
    },
    orderType:{
        type: Number,
        required: true
    },
    vendor:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    vendorName: {
        type: String,
        required: true
    },
    customer:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Customer"
    },
    customerName:{
        type: String,
        required: true
    },
    customerContact:{
        type: String,
        required: true
    },
    deliveryAddress:{
        type: String,
        required: true
    },
    deliveryService:{
        type: String,
        default: "Not set"
    },
    trackingCode:{
        type: String,
        default: "Not Set"
    },
    orderDate:{
        type: Date,
        required: true,
    },
    deliveryDate: {
        type: Date,
        required: true
    },
    products: [
        {
            prodId: String,
            name: String,
            quantity: Number,
            vendorPrice: Number,
            soldPrice:Number,
            commssionPrice: Number,
            totalCommission: Number,
            totalSale: Number,
            imagePath: String
        }
    ],
    totalSale: {
        type: Number,
        default: 0
    },
    totalCommission:{
        type: Number,
        default: 0
    },
    deliveryCost:{
        type:Number,
        default: 0
    },
    note:{
        type: String
    },
    status:{
        type: Number,
        default: 0
    },
    addedBy:{
        type: String,
        required: true
    }
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;