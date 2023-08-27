
const mongoose = require("mongoose");

const deliveryServiceSchema = mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    }
});

const DeliveryService = mongoose.model("DeliveryService", deliveryServiceSchema);

module.exports = DeliveryService;