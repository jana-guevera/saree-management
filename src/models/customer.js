const mongoose = require("mongoose");
const validator = require("validator");

const customerSchema = mongoose.Schema({
    cusId:{
        type: String,
        required: true
    },
    vendorName:{
        type: String,
        required: true
    },
    vendor:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    name: {
        type: String,
        trim: true,
        required: true
    },
    email:{
        type: String,
        trim: true,
        lowercase: true,
        validate: (value) => {
            if(value && !validator.isEmail(value)){
                throw new Error("Email is invalid");
            }
        }
    },
    phoneNum:{
        type: String,
        required: true
    },
    address:{
        type: String,
        trim: true,
        required: true
    },
    behaviour:{
        type: Number,
        default: 1
    }
});

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;