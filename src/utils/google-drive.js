const fs = require("fs");
const mime = require("mime-types");
const {google} = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
    process.env.GD_CLIENT_ID,
    process.env.GD_CLIENT_SECRET,
    process.env.GD_REDIRECT_URL
);

oauth2Client.setCredentials({refresh_token: process.env.GD_REFRESH_TOKEN});

const drive = google.drive({
    version: "v3",
    auth: oauth2Client
});

const uploadFile = async (filePath, uploadPath, fileName) => {
    try{
        const mimeType = mime.lookup(filePath);

        const response = await drive.files.create({
            requestBody:{
                name: fileName,
                mimeType: mimeType,
                parents: [uploadPath]
            },
            media:{
                mimeType: mimeType,
                body: fs.createReadStream(filePath)
            }
        });

        if(response.data.id){
            return response.data;
        }

        console.log(response);
        return {error: "Something went wrong, unable to upload file to drive."}
    }catch(e){
        console.log(e.message);
        return {error: e.message}
    }
}

const deleteFile = async (fileId) => {
    try {
        const response = await drive.files.delete({
            fileId: fileId,
        });

        if(response.status == 204){
            return {id: fileId};
        }

        console.log(response);
        return {error: "Something went wrong, unable to delete file from Drive."}
    } catch (e) {
        console.log(e.message);
        return {error: e.message}
    }
}

const copyFile = async (fileId, oldDestination, newDestination) => {
    try{
        const cloned = await drive.files.copy({
            fileId: fileId
        });

        const result = await drive.files.update({
            fileId: cloned.data.id,
            addParents: newDestination,
            removeParents: oldDestination,
            fields: "id, parents"
        });

        if(result.status == 200){
            return result.data
        }

        console.log(response);
        return {error: "Unable to copy file!"}
    }catch(e){
        console.log(e.message);
    }
}

module.exports = {
    uploadFile: uploadFile,
    deleteFile: deleteFile,
    copyFile: copyFile
}