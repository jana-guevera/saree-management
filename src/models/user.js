const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: (value) => {
            if(!validator.isEmail(value)){
                throw new Error("Email is invalid");
            }
        }
    },
    address:{
        type: String
    },
    secret:{
        type: String
    },
    password: {
        type: String,
        required: true,
        minLength: 7,
        trim: true,
        validate: (value) => {
            if(value.toLowerCase().includes("password")){
                throw new Error("Password should not contain the word password.");
            }
        }
    },
    role:{
        type: String,
        default: "VENDOR"
    },
    status:{
        type: Number,
        default: 1
    },
    imagePath: {
        type: String,
        default: "profile.png"
    }
});

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email: email});

    if(!user){
        return undefined;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        return undefined
    }

    return user;
}

userSchema.statics.getUserPublicData = (user) => {
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        imagePath: user.imagePath
    };
}

userSchema.pre("save", async function(next) {
    const user = this;

    if(user.isModified("password")){
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;