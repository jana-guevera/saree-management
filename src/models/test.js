const path = require("path");

const currentPathResolve = path.resolve("./public/uploads");
const currentPathJoin = path.join(__dirname, "../../public/uploads");
const currentDirectory = __dirname;

console.log("Path Resolve", currentPathResolve);
console.log("Path Join", currentPathJoin);
console.log("Directory", currentDirectory);