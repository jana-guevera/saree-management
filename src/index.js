const path = require("path");
const express = require("express");
const expressHbs = require("express-handlebars");
const session = require("express-session");
const fileUpload = require("express-fileupload");
const permissions = require("./middleware/permissions.js");

require("./db/mongoose.js");

const customerRouter = require("./routers/customer-router.js");
const productRouter = require("./routers/product-router.js");
const prodCategoryRouter = require("./routers/prod-cat-router.js");
const dServiceRouter = require("./routers/delivery-service-router.js");
const userRouter = require("./routers/user-router.js");
const orderRouter = require("./routers/order-router.js");

const app = express();
const port = process.env.PORT;

// Setup the session
app.use(session({secret: process.env.SESSION_SECRET, saveUninitialized: true, resave: true}));

// Setup HBS
app.engine(".hbs", expressHbs.engine({
    layoutsDir: path.join(__dirname, "../views/layouts"),
    defaultLayout: "main",
    extname: ".hbs"
}));

const hbs = expressHbs.create({});

hbs.handlebars.registerHelper("has_permission", function(role, action) {
    return permissions.hasPermission(role, action);
});

hbs.handlebars.registerHelper("is_admin", function(role){
    return role === "ADMIN"
});

app.set("view engine", "hbs");

// Setup static files
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

app.use(fileUpload());
app.use(express.urlencoded({extended: true}));
app.use(express.json()); 

app.use(userRouter);
app.use(customerRouter);
app.use(prodCategoryRouter);
app.use(productRouter);
app.use(orderRouter);
app.use(dServiceRouter);

// const User = require("./models/user.js");
// const createAccount = async () => {
//     const user = new User({
//         name: "Janarrthan",
//         email: "jeevananthanjana@gmail.com",
//         password: "jana123",
//         role: permissions.roles.ADMIN,
//     });

//     await user.save();
// }
// createAccount();


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

