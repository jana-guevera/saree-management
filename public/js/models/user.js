var datatable;

// Populate the customer table
$(document).ready(() => {
    datatable = $('.table').DataTable({
        "ajax": {
            "url": "/api/users",
            "dataSrc": ""
        },
        "columns": [
            { "data": "name" },
            { "data": "email" },
            { "data": "address" },
            { "data": function(user){
                if(user.status == 1){
                    return `<span style="color:green;">Active</span>`;
                }

                return `<span style="color:red;">Blocked</span>`;
            }},
            { "data": (user) => {
                return `
                    <button class="btn btn-primary btn-sm" id="rec-${user._id}" onclick="initiateUpdate('${user._id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" id="rec-del-${user._id}" onclick="initiateDelete('${user._id}')"><i class="fas fa-trash"></i></button>
                `;
            }, "width": "8%"}
        ]
    });
});

// Create user
const create = async () => {
    const url = "/api/users";

    const data = {
        name: document.querySelector("#name").value,
        email: document.querySelector("#email").value,
        address: document.querySelector("#address").value,
        password: document.querySelector("#password").value
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
    
        const user = await response.json();
    
        if(user.error){
            return showError({msg: user.error});
        }

        showSuccess({msg: "User created successfully!"});
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Unable to add user. Please try again"});
    }finally{
        hideLoader("#btn-add", {content: "Add +"});
    }
}

// Initiate user update modal
const initiateUpdate = async (id) => {
    const url = "/api/users/" + id;

    try{
        const response = await fetch(url);
        const user = await response.json();

        if(user.error){
            return showError({msg: user.error});
        }

        $("#updateName").val(user.name);
        $("#updateEmail").val(user.email);
        $("#updateAddress").val(user.address);
        $("#status").val(user.status);
        $("#userId").val(user._id);

        showModal("update-modal");
    }catch(e){
        showError({msg: "Something went wrong. Unable to update user"});
    }
}

// Update Customer
const update = async () => {
    const id = $("#userId").val();
    const url = "/api/users/" + id;

    closeModal("update-modal");
    showLoader("#rec-" + id, {content: generalLoader});

    const data = {
        name: document.querySelector("#updateName").value,
        email: document.querySelector("#updateEmail").value,
        address: document.querySelector("#updateAddress").value,
        status:$("#status").val()
    };

    try{
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const user = await response.json();

        if(user.error){
            return showError({msg: user.error});
        }

        showSuccess({msg: "User updated successfully!"});
    
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Something went wrong! Unable to update user."});
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
    const url = "/api/users/" + id;

    showLoader("#rec-del-" + id, {content: generalLoader});

    try{
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            }
        });
    
        const user = await response.json();
    
        if(user.error){
            return showError({msg: user.error});
        }
        
        showSuccess({msg: "User deleted successfully!"});
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Something went wrong. Unable to delete user!"});
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
            email: {
                required: true
            },
            password:{
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
            updateEmail: {
                required: true
            }
        }
    });

    addForm.on("submit", function(e) {
        e.preventDefault();

        if(addForm.valid()){
            create();
            addForm[0].reset();
        }
    });

    updateForm.on("submit", function(e){
        e.preventDefault();

        if(updateForm.valid()){
            update();
            updateForm[0].reset();
        }
    });
});