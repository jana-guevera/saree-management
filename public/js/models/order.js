var datatable;
var addForm;
var updateForm;

// Populate the orders table
$(document).ready(() => {
    datatable = $('#table').DataTable( {
        responsive: true,
        "ajax": {
            "url": "/api/orders",
            "dataSrc": ""
        },
        "columns": [
            { "data": "OID" },
            { 
                "data": function(order){
                    if(order.orderSource == 0){
                        return "External Order";
                    }

                    return "Internal Order";
                },
                "visible": false
            },
            { 
                "data": function(order){
                    if(order.orderType == 0){
                        return "Pre Order";
                    }

                    return "Stock Order";
                }
            },
            { "data": (order) => {
                if(order.vendor && order.vendor.name){
                    return order.vendor.name;
                }

                return order.vendorName
            }},
            { 
                "data": (order) => {
                    if(order.customer && order.customer.cusId){
                        return order.customer.cusId;
                    }

                    return order.customerName
                }, 
                visible: false
            },
            { "data": (order) => {
                if(order.customer && order.customer.name){
                    return order.customer.name;
                }

                return order.customerName
            }},
            { "data": (order) => {
                return new Date(order.orderDate).toLocaleDateString();
            }},
            { 
                "data": function(order){
                    return new Date(order.deliveryDate).toLocaleDateString();
                }, 
                "visible": false
            },
            { "data": "totalSale" },
            { "data": "totalCommission", "visible": false},
            { "data": "deliveryAddress", "visible": false},
            { "data": "deliveryService", "visible": false},
            { "data": "trackingCode", "visible": false},
            { "data": "note", "visible": false},
            { "data": function(order){
                if(order.status === 0){
                    return `<button 
                    onclick="initiateStatusUpdate('${order._id}', '${order.status}')" 
                    class="btn btn-sm btn-secondary">Preparing</button>`;
                }

                if(order.status === 1){
                    return `<button 
                    onclick="initiateStatusUpdate('${order._id}', '${order.status}')"
                    class="btn btn-sm btn-warning">Dispatched</button>`;
                }

                if(order.status === 2){
                    return `<button 
                    onclick="initiateStatusUpdate('${order._id}', '${order.status}')"
                    class="btn btn-sm btn-success">Delivered</button>`;
                }

                return `<span class="btn btn-sm btn-danger">Cancelled</span>`;
            }},
            { "data": function(order) {
                const userRole = $("#userRole").val();

                var deleteHtml = "";
                if(userRole === "ADMIN" && order.status == 3){
                    deleteHtml = `<button class="btn btn-danger btn-sm" id="rec-del-${order._id}" onclick="initiateDelete('${order._id}')"><i class="fas fa-trash"></i></button>`;
                }
                return `
                    <button class="btn btn-secondary btn-sm" onclick="showDetails('${order._id}')"><i class="fas fa-eye"></i></button>
                    <a href="/orders/details/${order._id}" class="btn btn-secondary btn-sm"><i class="fas fa-cart-plus"></i></a>
                    <button class="btn btn-primary btn-sm" id="rec-${order._id}" onclick="initiateUpdate('${order._id}')"><i class="fas fa-edit"></i></button>
                    ${deleteHtml}
                `
            }},
        ],
        "dom": 'Bfrtip',
        buttons: ["colvis"]
    });
});

// Populate Delivery Address
const getAddress = async () => {
    const cusId = $("#customer").val();

    if(!cusId){
        $("#delAddress").val("");
        $("#contact").val("");
        return;
    }

    const url = "/api/customers/find/"+cusId;

    try{
        const response = await fetch(url);
        const customer = await response.json();

        if(!customer.error){
            $("#delAddress").val(customer.address);
            $("#contact").val(customer.phoneNum);
        }
    }catch(e){
        console.log(e.message);
    }
}

// Show Details 
const getOrderStatus = (status) => {
    if(status == 0){
        return "Preparing";
    }else if(status == 1){
        return "Dispatched";
    }else if(status == 2){
        return "Delivered";
    }else if(status == 3){
        return "Cancelled";
    }
}

const showDetails = async (id) => {
    const url = "/api/orders/" + id;

    try{
        const response = await fetch(url);
        const order = await response.json();

        if(order.error){
            return showError({msg: order.error});
        }

        const vendorName = order.vendor.name || order.vendorName;
        const customer = order.customer.name || order.customerName;
        const orderType = order.orderType == 1 ? "Stock Order" : "Pre Order";

        var leftHtml = `
            <p>Order ID: ${order.OID}</p>
            <p>Order Status: ${getOrderStatus(order.status)}</p>
            <p>Order Type: ${orderType}</p>
            <p>Vendor: ${vendorName}</p>
            <p>Customer: ${customer}</p>
            <p>Customer Contact: ${order.customerContact}</p>
            <p>Delivery Charges: ${order.deliveryCost}</p>
            <p>Orderd Date: ${new Date(order.orderDate).toLocaleDateString()}</p>
            <p>Delivery Date: ${new Date(order.deliveryDate).toLocaleDateString()}</p>
            <p>Total Sale: Rs ${order.totalSale}</p>
            <p>Total Commission: Rs ${order.totalCommission}</p>
        `;

        $("#details-modal #order-address").html(order.deliveryAddress);
        $("#details-modal #order-note").html(order.note);
        $("#details-modal #left-details").html(leftHtml);
        showModal("details-modal");
    }catch(e){
        showError({msg: e.message});
    }
}

// check order source
const checkOrderSource = () => {
    const source = $("#orderSource").val();

    if(source == 1){
        $("#orderType").val($("#orderType option:first").val());
        $(".orderType").removeClass("nodisplay");
    }else if(source == 0){
        $("#orderType").val(0);
        $(".orderType").addClass("nodisplay");
    }
}

// Create order
const createOrder = async () => {
    const url = "/api/orders";

    const data = {
        orderType: $("#orderType").val(),
        orderSource: $("#orderSource").val(),
        vendor: $("#vendor").val(),
        customer: $("#customer").val(),
        customerContact: $("#contact").val(),
        orderDate: $("#orderDate").val(),
        deliveryDate: $("#deliveryDate").val(),
        deliveryAddress: $("#delAddress").val(),
        deliveryCost: $("#deliveryCost").val(),
        note: $("#note").val(),
    }

    closeModal("create-modal");
    showLoader("#btn-add", {content: addLoader});

    try{
        const response = await fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    
        const order = await response.json();
    
        if(order.error){
            return showError({msg: order.error});
        }

        showSuccess({msg: "Order created successfully!"});
        datatable.ajax.reload();
        addForm[0].reset();
    }catch(e){
        showError({msg: "Unable to add order. Please try again"});
    }finally{
        hideLoader("#btn-add", {content: "Add +"});
    }
}

// Initiate order update modal
const initiateUpdate = async (id) => {
    const url = "/api/orders/" + id;

    try{
        const response = await fetch(url);
        const order = await response.json();

        if(order.error){
            return showError({msg: order.error});
        }

        $("#updateOrderDate").val(new Date(order.orderDate).toISOString().slice(0, 16));
        $("#updateDeliveryDate").val(new Date(order.deliveryDate).toISOString().slice(0, 16));
        $("#updateOrderType").val(order.orderType);
        $("#updateDelAddress").val(order.deliveryAddress);
        $("#updateContact").val(order.customerContact);
        $("#updateDeliveryCost").val(order.deliveryCost);
        $("#updateNote").val(order.note);
        $("#trackingCode").val(order.trackingCode);
        $("#dService").val(order.deliveryService);
        $("#orderId").val(order._id);

        showModal("update-modal");
    }catch(e){
        console.log(e);
        showError({msg: "Something went wrong. Unable to update order"});
    }
}

// Update Order
const updateOrder = async () => {
    const id = $("#orderId").val();
    const url = "/api/orders/" + id;

    closeModal("update-modal");
    showLoader("#rec-" + id, {content: generalLoader});

    const trackingCode = $("#trackingCode").val() || "Not set";
    const dService = $("#dService").val() || "Not set";

    const data = {
        orderDate: $("#updateOrderDate").val(),
        deliveryDate: $("#updateDeliveryDate").val(),
        note: $("#updateNote").val(),
        deliveryAddress: $("#updateDelAddress").val(),
        trackingCode: trackingCode,
        deliveryService: dService
    }

    try{
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const order = await response.json();

        if(order.error){
            return showError({msg: order.error});
        }

        showSuccess({msg: "Order updated successfully!"});
    
        datatable.ajax.reload();
        updateForm[0].reset();
    }catch(e){
        showError({msg: "Something went wrong! Unable to update order."});
    }finally{
        hideLoader("#rec-" + id, {content: `<i class="fas fa-edit"></i>`});
    }
}

// Initiate status update
const initiateStatusUpdate = (orderId, status) => {
    $("#statusOrderId").val(orderId);
    $("#updateStatus").val(status);

    showModal("status-update-modal");
}

const updateStatus = async () => {
    const id = $("#statusOrderId").val();
    const url = "/api/orders/update_status/" + id;

    
    showLoader("#update-status-btn", {content: generalLoader});

    const data = {
        status: $("#updateStatus").val(),
    }

    try{
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const order = await response.json();

        if(order.error){
            return showError({msg: order.error});
        }

        showSuccess({msg: "Order updated successfully!"});
    
        hideLoader("#update-status-btn", {content: `Save Changes`});
        closeModal("status-update-modal");
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Something went wrong! Unable to update order."});
    }
}

// Alert for deleting a customer
const initiateDelete = (id) => {    
    swal({
        title: "Are you sure?",
        text: "Once deleted, you will not be able to recover this information!",
        icon: "warning",
        buttons: true,
        dangerMode: true,
    })
    .then((willDelete) => {
        if (willDelete) {
            deleteOrder(id);   
        }
    });
}

// Delete customer
const deleteOrder = async (id) => {
    const url = "/api/orders/" + id;

    showLoader("#rec-del-" + id, {content: generalLoader});

    try{
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            }
        });
    
        const order = await response.json();
    
        if(order.error){
            return showError({msg: order.error});
        }
        
        showSuccess({msg: "Order deleted successfully!"});
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Something went wrong. Unable to delete order!"});
    }finally{
        hideLoader("#rec-del-" + id, {content: `<i class="fas fa-trash"></i>`});
    }
}

$(document).ready(() => {
    addForm = $("#add-form");
    updateForm = $("#update-form");

    addForm.validate({
        rules: {
            vendor:{
                required: true
            },
            customer: {
                required: true
            },
            orderDate:{
                required: true
            },
            deliveryDate: {
                required: true
            },
            delAddress: {
                required: true
            },
            contact:{
                required: true
            },
            deliveryCost:{
                required: true
            },
            orderType:{
                required: true
            },
            orderSource:{
                required: true
            }
        }
    });
    
    updateForm.validate({
        rules: {
            updateOrderDate:{
                required: true
            },
            updateDeliveryDate: {
                required: true
            },
            updateDelAddress:{
                required: true
            },
            updateContact:{
                required: true
            },
            updateDeliveryCost:{
                required: true
            }
        }
    });

    addForm.on("submit", function(e) {
        e.preventDefault();

        if(addForm.valid()){
            createOrder();
        }
    });

    updateForm.on("submit", function(e){
        e.preventDefault();

        if(updateForm.valid()){
            updateOrder();
        }
    });
});


