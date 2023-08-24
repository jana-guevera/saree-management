const fs = require("fs");

const generateCustomerId = () => {
    const ids = loadFile();
    ids.cusId = ids.cusId + 1;
    saveFile(ids);
    return "CUS-" + ids.cusId;
}

const generateProductId = () => {
    const ids = loadFile();
    ids.prodId = ids.prodId + 1;
    saveFile(ids);
    return "PRD" + ids.prodId;
}

const generateOrderId = () => {
    const ids = loadFile();
    ids.orderId = ids.orderId + 1;
    saveFile(ids);
    return "ORD" + ids.orderId;
}

const loadFile = () => {
    const idsBuffer = fs.readFileSync("./src/utils/ids.json");
    const idsJson = idsBuffer.toString();
    const ids = JSON.parse(idsJson);
    return ids;
}

const saveFile = (ids) => {
    const idsJson = JSON.stringify(ids);
    fs.writeFileSync("./src/utils/ids.json", idsJson);
}

module.exports = {
    generateCustomerId: generateCustomerId,
    generateProductId: generateProductId,
    generateOrderId: generateOrderId
}