const path = require("path");
const fs = require("fs");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const imageFormat = require("../utils/image_format.js");
const drive = require("../utils/google-drive.js");

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
    fileNames: [{}]
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
                await file.mv(path.resolve("./public/uploads/temp/" + filename));
                result.imageNames.push(filename);
            }else if(imageFormat.isVideo(fileExtension)){
                await file.mv(path.resolve("./public/uploads/" + filename));
                result.videoName.push(filename);
            }
        }
    
        for(var i = 0; i < result.imageNames.length; i++){
            const tempPath = path.resolve("./public/uploads/temp/" + result.imageNames[i]);
            await imageFormat.addTextOnImage({
                text: prodId,
                tempPath: tempPath,
                imagePath: path.resolve("./public/uploads/" + result.imageNames[i])
            });

            fs.unlinkSync("./public/uploads/temp/" + result.imageNames[i]);
        }
        
        // Upload to google drive
        const filePaths = result.imageNames.concat(result.videoName);
        const googleDrivePaths = [];

        for(var i = 0; i < filePaths.length; i++){
            const fp = filePaths[i];
            const fullPath = path.resolve("./public/uploads/" + fp);
            const uploadPath = process.env.GD_UPLOAD_PATH;

            const data = await drive.uploadFile(fullPath, uploadPath, fp);

            if(data.error){
                continue;
            }

            googleDrivePaths.push({
                id: data.id,
                name: data.name
            });
        }

        filePaths.forEach((fp) => {
            fs.unlinkSync("./public/uploads/" + fp);
        });

        return googleDrivePaths;
    }catch(e){
        console.log(e);
        return {error: e.message};
    }
}

productSchema.statics.removeFiles = async (files) => {
    try{
        for(var i = 0; i < files.length; i++){
            const id = files[i].id || files[i]
            const result = await drive.deleteFile(id);
        }
    }catch(e){
        console.log(e.message);
    }
}

productSchema.statics.copyFile = async (file) => {
    try{
        const uploadFolder = process.env.GD_UPLOAD_PATH;
        const ordersFolder = process.env.GD_ORDERS_PATH;

        const result = await drive.copyFile(file.id, uploadFolder, ordersFolder);
        return result;
    }catch(e){
        console.log(e.message);
    }
}

productSchema.statics.removeOrderFile = async (fileId) => {
    try{
        const result = await drive.deleteFile(fileId);
    }catch(e){
        console.log(e.message);
    }
}

productSchema.statics.uploadOrderFile = async (file) => {
    try{
        const allowedFiles = ["jpeg", "png", "JPEG", "gif", "jpg"];
        const fileExtension = file.name.split(".").pop();

        if(!allowedFiles.includes(fileExtension)){
            return {error: "Please upload image files"};
        }

        // Change the name of the file to a unique name
        const filename = new ObjectId().toString() + "." + fileExtension;

        await file.mv(path.resolve("./public/uploads/orders/" + filename));

        const fullPath = path.resolve("./public/uploads/orders/" + filename);
        const uploadPath = process.env.GD_ORDERS_PATH;

        const data = await drive.uploadFile(fullPath, uploadPath, filename);

        fs.unlinkSync("./public/uploads/orders/" + filename);

        if(data.error){
            return data;
        }

        return data.id;
    }catch(e){
        console.log(e);
        return {error: "Something went wrong. Unable to upload image!"}
    }
}

const Product = mongoose.model("Product", productSchema);

module.exports = Product;

