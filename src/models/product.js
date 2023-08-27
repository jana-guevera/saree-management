const path = require("path");
const fs = require("fs");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const imageFormat = require("../utils/image_format.js");

const productSchema = mongoose.Schema({
    prodId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    category:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "ProductCategory"
    },
    categoryName:{
        type: String,
        required: true
    },
    quantity:{
        type: Number,
        min: 0,
        default: 0
    },
    pagePrice: {
        type: Number,
        required: true,
        min: 0
    },
    vendorsPrice:[{
        vendorName: String,
        vendorId: String,
        price: Number,
        commission: Number
    }],
    status: {
        type: Number,
        default: 1
    },
    note:{
        type: String
    },
    fileNames: []
});

productSchema.statics.uploadFiles = async (files, prodId) => {
    const keys = Object.keys(files);
    var result = {
        imageNames: [],
        videoName: []
    };

    try{
        for(var i = 0; i < keys.length; i++){
            const file = files[`media[${i}]`];
            const fileExtension = file.name.split(".").pop();
    
            // Change the name of the file to a unique name
            const filename = new ObjectId().toString() + "." + fileExtension;
    
            if(imageFormat.isImage(fileExtension)){
                console.log("Result");
                const result = await file.mv(path.join(__dirname, "../temp/" + filename));
                console.log("Result End");
                result.imageNames.push(filename);
            }else if(imageFormat.isVideo(fileExtension)){
                await file.mv(path.resolve("./public/uploads/" + filename));
                result.videoName.push(filename);
            }
        }
    
        for(var i = 0; i < result.imageNames.length; i++){
            const tempPath = path.join(__dirname, "../../public/uploads/temp/" + result.imageNames[i]);
            await imageFormat.addTextOnImage({
                text: prodId,
                tempPath: tempPath,
                imagePath: path.join(__dirname, "../../public/uploads/" + result.imageNames[i])
            });
    
            fs.unlinkSync("./public/uploads/temp/" + result.imageNames[i]);
        }

        return result;
    }catch(e){
        console.log(e);
        result.error = e.message;
        return result;
    }
}

productSchema.statics.copyFile = (fileName) => {
    try{
        const oldFilePath = "./public/uploads/" + fileName;
        const newPath = "./public/uploads/orders/" + fileName;

        fs.copyFileSync(oldFilePath, newPath);
    }catch(e){
        console.log(e.message);
    }
}

productSchema.statics.removeFiles = async (files) => {
    try{
        files.forEach(file => {
            fs.unlinkSync("./public/uploads/" + file);
        });
    }catch(e){
        console.log(e.message);
    }
}

productSchema.statics.removeOrderFiles = async (files) => {
    try{
        files.forEach(file => {
            fs.unlinkSync("./public/uploads/orders/" + file);
        });
    }catch(e){
        console.log(e.message);
    }
}

const Product = mongoose.model("Product", productSchema);

module.exports = Product;