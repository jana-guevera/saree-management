const permissions = require("./permissions.js");

const isAuthorized = (role, action) => {
    return permissions.hasPermission(role, action);
}

module.exports = isAuthorized;