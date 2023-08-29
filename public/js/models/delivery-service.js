var datatable;
var addForm;
var updateForm;

// Populate table
$(document).ready(() => {
    datatable = $('.table').DataTable( {
        responsive: true,
        "ajax": {
            "url": "/api/delivery-services",
            "dataSrc": ""
        },
        "columns": [
            { "data": "name" },
            { "data": function(dService) {
                return `
                    <button class="btn btn-primary btn-sm" id="rec-${dService._id}" onclick="initiateUpdate('${dService._id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" id="rec-del-${dService._id}" onclick="initiateDelete('${dService._id}')"><i class="fas fa-trash"></i></button>
                `
            }}
        ]
    });
});

// Create record
const create = async () => {
    const url = "/api/delivery-services";

    const data = {
        name: document.querySelector("#name").value
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
    
        const category = await response.json();
    
        if(category.error){
            return showError({msg: category.error});
        }

        showSuccess({msg: "Record created successfully!"});
        datatable.ajax.reload();
        addForm[0].reset();
    }catch(e){
        showError({msg: "Unable to create record. Please try again"});
    }finally{
        hideLoader("#btn-add", {content: "Add +"});
    }
}

// Initiate update modal
const initiateUpdate = async (id) => {
    const url = "/api/delivery-services/" + id;

    try{
        const response = await fetch(url);
        const dService = await response.json();

        if(dService.error){
            return showError({msg: dService.error});
        }

        $("#updateName").val(dService.name);
        $("#dServiceId").val(dService._id);

        showModal("update-modal");
    }catch(e){
        console.log(e);
        showError({msg: "Something went wrong. Unable to update record"});
    }
}

// Update record
const update = async () => {
    const id = $("#dServiceId").val();
    const url = "/api/delivery-services/" + id;

    closeModal("update-modal");
    showLoader("#rec-" + id, {content: generalLoader});

    const data = {
        name: document.querySelector("#updateName").value
    };

    try{
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const dService = await response.json();

        if(dService.error){
            return showError({msg: dService.error});
        }

        showSuccess({msg: "Record updated successfully!"});
    
        datatable.ajax.reload();
        updateForm[0].reset();
    }catch(e){
        showError({msg: "Something went wrong! Unable to update record."});
    }finally{
        hideLoader("#rec-" + id, {content: `<i class="fas fa-edit"></i>`});
    }
}

// Alert for deleting a record
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
            deleteRecord(id);   
        }
    });
}

// Delete record
const deleteRecord = async (id) => {
    const url = "/api/delivery-services/" + id;

    showLoader("#rec-del-" + id, {content: generalLoader});

    try{
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            }
        });
    
        const dService = await response.text();
    
        if(dService.error){
            return showError({msg: dService.error});
        }
        
        showSuccess({msg: "Record deleted successfully!"});
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Something went wrong. Unable to delete record!"});
    }finally{
        hideLoader("#rec-del-" + id, {content: `<i class="fas fa-trash"></i>`});
    }
}

$(document).ready(() => {
    addForm = $("#add-form");
    updateForm = $("#update-form");

    addForm.validate({
        rules: {
            name: {
                required: true
            }
        }
    });
    
    updateForm.validate({
        rules: {
            updateName: {
                required: true
            }
        }
    });

    addForm.on("submit", function(e) {
        e.preventDefault();

        if(addForm.valid()){
            create();
        }
    });

    updateForm.on("submit", function(e){
        e.preventDefault();

        if(updateForm.valid()){
            update();
        }
    });
});


