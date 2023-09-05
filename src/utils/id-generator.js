const Id = require("../models/ids.js");

const generateCustomerId = async () => {
    const ids = await Id.find({})[0];
    ids.cusId = ids.cusId + 1;
    const customerId = ids.cusId;
    saveFile(ids);
    return "CUS-" + customerId;
}

const generateProductId = () => {
    const ids = loadFile();
    ids.prodId = ids.prodId + 1;
    const productId = ids.prodId;
    saveFile(ids);
    return "PRD" + productId;
}

const generateOrderId = () => {
    const ids = loadFile();
    ids.orderId = ids.orderId + 1;
    const orderId = ids.orderId;
    saveFile(ids);
    return "ORD" + orderId;
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