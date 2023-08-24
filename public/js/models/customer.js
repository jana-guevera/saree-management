var datatable;

// Populate the customer table
$(document).ready(() => {
    datatable = $('.table').DataTable({
        "ajax": {
            "url": "/api/customers",
            "dataSrc": ""
        },
        "columns": [
            { "data": "cusId" },
            { "data": (customer) => {
                if(customer.vendor && customer.vendor.name){
                    return customer.vendor.name;
                }

                return customer.vendorName
            }},
            { "data": "name" },
            { "data": "phoneNum" },
            { "data": (customer) => {
                if(customer.behaviour === 1){
                    return "<span style='color:green'>Good</span>";
                }

                return "<span style='color:red'>Bad</span>"
            }},
            { "data": (customer) => {
                const userRole = $("#userRole").val();
                var deleteHtml = "";

                if(hasPermission(userRole, actions.DELETE_CUSTOMERS)){
                    deleteHtml = `<button class="btn btn-danger btn-sm" id="rec-del-${customer._id}" onclick="initiateDelete('${customer._id}')"><i class="fas fa-trash"></i></button>`;
                }

                return `
                    <button class="btn btn-secondary btn-sm" onclick="showDetails('${customer._id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-primary btn-sm" id="rec-${customer._id}" onclick="initiateUpdate('${customer._id}')"><i class="fas fa-edit"></i></button>
                    ${deleteHtml}
                `;
            }, "width": "15%"}
        ]
    });
});

const showDetails = async (id) => {
    const response = await fetch("/api/customers/" + id);
    const customer = await response.json();

    const vendorName = customer.vendor.name || customer.vendorName;
    const bodyElement = document.querySelector("#details-modal .modal-body");
    bodyElement.innerHTML = `
        <p>Customer ID: ${customer.cusId}</p>
        <p>Vendor: ${vendorName}</p>
        <p>Name: ${customer.name}</p>
        <p>Contact: ${customer.phoneNum}</p>
        <p>Email: ${customer.email}</p>
        <p>Address: ${customer.address}</p>
    `;

    showModal("details-modal");
}

// Create customer
const createCustomer = async () => {
    const url = "/api/customers";

    const data = {
        name: document.querySelector("#name").value,
        email: document.querySelector("#email").value,
        address: document.querySelector("#address").value,
        phoneNum: document.querySelector("#phoneNum").value,
        vendor: document.querySelector("#vendor").value
    };
    
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
    
        const customer = await response.json();
    
        if(customer.error){
            return showError({msg: customer.error});
        }

        showSuccess({msg: "Cutomer created successfully!"});
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Unable to add customer. Please try again"});
    }finally{
        hideLoader("#btn-add", {content: "Add +"});
    }
}

// Initiate customer update modal
const initiateUpdate = async (id) => {
    const url = "/api/customers/" + id;
    const vendorsUrl = "/api/vendors";

    try{
        const response = await fetch(url);
        const customer = await response.json();

        const vendorsResponse = await fetch(vendorsUrl);
        const vendors = await vendorsResponse.json();

        if(customer.error || vendors.error){
            const error = customer.error || vendors.error;
            return showError({msg: error});
        }

        $("#updateName").val(customer.name);
        $("#updateEmail").val(customer.email);
        $("#updateAddress").val(customer.address);
        $("#updatePhoneNum").val(customer.phoneNum);
        $("#behaviour").val(customer.behaviour);
        $("#customerId").val(customer._id);

        var selectHtml = "";
        var vendorId = "";

        for(var i = 0; i < vendors.length; i++){
            selectHtml += `
                <option value=${vendors[i]._id}>
                ${vendors[i].name}</option>
            `;
        }

        if(customer.vendor && customer.vendor._id){
            vendorId = customer.vendor._id;
        }else{
            vendorId = customer.vendor;
            selectHtml += `<option value=${customer.vendor}>
                ${customer.vendorName}</option>`;
        }

        $("#updateVendor").html(selectHtml);
        $("#updateVendor").val(vendorId);

        showModal("update-modal");
    }catch(e){
        console.log(e.message);
        showError({msg: "Something went wrong. Unable to update customer"});
    }
}

// Update Customer
const updateCustomer = async () => {
    const id = $("#customerId").val();
    const url = "/api/customers/" + id;

    closeModal("update-modal");
    showLoader("#rec-" + id, {content: generalLoader});

    const data = {
        name: document.querySelector("#updateName").value,
        email: document.querySelector("#updateEmail").value,
        address: document.querySelector("#updateAddress").value,
        phoneNum: document.querySelector("#updatePhoneNum").value,
        vendor: document.querySelector("#updateVendor").value,
        behaviour: document.querySelector("#behaviour").value,
    };

    try{
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const customer = await response.json();

        if(customer.error){
            return showError({msg: customer.error});
        }

        showSuccess({msg: "Customer updated successfully!"});
    
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Something went wrong! Unable to update customer."});
    }finally{
        hideLoader("#rec-" + id, {content: `<i class="fas fa-edit"></i>`});
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
            deleteCustomer(id);   
        }
    });
}

// Delete customer
const deleteCustomer = async (id) => {
    const url = "/api/customers/" + id;

    showLoader("#rec-del-" + id, {content: generalLoader});

    try{
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            }
        });
    
        const customer = await response.json();
    
        if(customer.error){
            return showError({msg: customer.error});
        }
        
        showSuccess({msg: "Customer deleted successfully!"});
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Something went wrong. Unable to delete customer!"});
    }finally{
        hideLoader("#rec-del-" + id, {content: `<i class="fas fa-trash"></i>`});
    }
}

$(document).ready(() => {
    const addForm = $("#add-form");
    const updateForm = $("#update-form");

    addForm.validate({
        rules: {
            name: {
                required: true
            },
            address:{
                required: true
            },
            phoneNum:{
                required: true
            },
            vendor:{
                required: true
            }
        }
    });
    
    updateForm.validate({
        rules: {
            updateName: {
                required: true
            },
            updateAddress:{
                required: true
            },
            updatePhoneNum:{
                required: true
            }
        }
    });

    addForm.on("submit", function(e) {
        e.preventDefault();

        if(addForm.valid()){
            createCustomer();
            addForm[0].reset();
        }
    });

    updateForm.on("submit", function(e){
        e.preventDefault();

        if(updateForm.valid()){
            updateCustomer();
            updateForm[0].reset();
        }
    });
});