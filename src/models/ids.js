const mongoose = require("mongoose");

const idsSchema = mongoose.Schema({
    prodId:{
        type: Number,
    },
    orderId:{
        type: Number
    },
    cusId:{
        type:Number
    }
});

const Id = mongoose.model("Id", idsSchema);

module.exports = Id;