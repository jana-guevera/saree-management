const actions = {
    MODIFY_USERS: "MODIFY_USERS",
    VIEW_USERS: "VIEW_USERS",
    DELETE_USERS: "DELETE_USERS",
    CREATE_USERS: "CREATE_USERS",

    MODIFY_CATEGORIES: "MODIFY_CATEGORIES",
    VIEW_CATEGORIES: "VIEW_CATEGORIES",
    DELETE_CATEGORIES: "DELETE_CATEGORIES",
    CREATE_CATEGORIES: "CREATE_CATEGORIES",

    MODIFY_PRODUCTS: "MODIFY_PRODUCTS",
    VIEW_PRODUCTS: "VIEW_PRODUCTS",
    DELETE_PRODUCTS: "DELETE_PRODUCTS",
    CREATE_PRODUCTS: "CREATE_PRODUCTS",

    MODIFY_ORDERS: "MODIFY_ORDERS",
    VIEW_ORDERS: "VIEW_ORDERS",
    DELETE_ORDERS: "DELETE_ORDERS",
    CREATE_ORDERS: "CREATE_ORDERS",

    MODIFY_CUSTOMERS: "MODIFY_CUSTOMERS",
    VIEW_CUSTOMERS: "VIEW_CUSTOMERS",
    DELETE_CUSTOMERS: "DELETE_CUSTOMERS",
    CREATE_CUSTOMERS: "CREATE_CUSTOMERS",
};
  
const roles = {
    ADMIN: "ADMIN",
    VENDOR: "VENDOR",
    GUEST: "GUEST"
};

const mappings = new Map();

mappings.set(actions.MODIFY_USERS, [roles.ADMIN]);
mappings.set(actions.VIEW_USERS, [roles.ADMIN]);
mappings.set(actions.DELETE_USERS, [roles.ADMIN]);
mappings.set(actions.CREATE_USERS, [roles.ADMIN]);

mappings.set(actions.MODIFY_CATEGORIES, [roles.ADMIN]);
mappings.set(actions.VIEW_CATEGORIES, [roles.ADMIN]);
mappings.set(actions.DELETE_CATEGORIES, [roles.ADMIN]);
mappings.set(actions.CREATE_CATEGORIES, [roles.ADMIN]);

mappings.set(actions.MODIFY_PRODUCTS, [roles.ADMIN]);
mappings.set(actions.VIEW_PRODUCTS, [roles.ADMIN, roles.VENDOR, roles.GUEST]);
mappings.set(actions.DELETE_PRODUCTS, [roles.ADMIN]);
mappings.set(actions.CREATE_PRODUCTS, [roles.ADMIN]);

mappings.set(actions.MODIFY_ORDERS, [roles.ADMIN, roles.VENDOR]);
mappings.set(actions.VIEW_ORDERS, [roles.ADMIN, roles.VENDOR]);
mappings.set(actions.DELETE_ORDERS, [roles.ADMIN]);
mappings.set(actions.CREATE_ORDERS, [roles.ADMIN, roles.VENDOR]);

mappings.set(actions.MODIFY_CUSTOMERS, [roles.ADMIN, roles.VENDOR]);
mappings.set(actions.VIEW_CUSTOMERS, [roles.ADMIN, roles.VENDOR]);
mappings.set(actions.DELETE_CUSTOMERS, [roles.ADMIN]);
mappings.set(actions.CREATE_CUSTOMERS, [roles.ADMIN, roles.VENDOR]);

function hasPermission(role, action) {
    if (!role) {
        return false;
    }

    if (mappings.has(action)) {
        return mappings.get(action).includes(role);
    }

    return false;
}