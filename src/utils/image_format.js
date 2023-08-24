const sharp = require("sharp");

const addTextOnImage = async (data) => {
  try {
    const metadata = await imageMetadata(data.tempPath);
    const width = metadata.width;
    const height = metadata.height;
    const text = data.text;

    const rectY = parseInt(height) - 50;

    const svgImage = `
      <svg width="${width}" height="${height}">
        <rect y="${rectY}" width="${width}" height="50px" fill="rgba(81, 80, 80, 0.57)"/>
        <style>
          .title {fill: #fff; font-size: 40px;}
        </style>
        <text x="2%" y="99%" text-anchor="left" class="title">${text}</text>
      </svg> 
    `;

    const svgBuffer = Buffer.from(svgImage);
    const image = await sharp(data.tempPath)
      .composite([
        {
          input: svgBuffer,
          top: 0,
          left: 0,
        },
      ])
      .toFile(data.imagePath);
  } catch (error) {
    console.log("test",error);
  }
}

const imageMetadata = async (imagePath) => {
  const metadata = await sharp(imagePath).metadata()

  return metadata;
}

const isImage = (extension) => {
    const allowedFiles = ["jpeg", "JPEG", "jpg", 
    "png", "gif", "webp", "tiff", "tif"];

    // Check if file is allowed
    return allowedFiles.includes(extension);
}

const isVideo = (extension) => {
  const allowedFiles = ["mp4", "mov", "wmv", "webm", "avi", "flv", "mkv", "mts"];

  // Check if file is allowed
  return allowedFiles.includes(extension.toLowerCase());
}

module.exports = {
  addTextOnImage:addTextOnImage,
  isImage: isImage,
  isVideo: isVideo
};