var datatable;

// Populate the categories table
$(document).ready(() => {
    datatable = $('.table').DataTable( {
        responsive: true,
        "ajax": {
            "url": "/api/categories",
            "dataSrc": ""
        },
        "columns": [
            { "data": "name" },
            { "data": function(category) {
                return `
                    <button class="btn btn-primary btn-sm" id="rec-${category._id}" onclick="initiateUpdate('${category._id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" id="rec-del-${category._id}" onclick="initiateDelete('${category._id}')"><i class="fas fa-trash"></i></button>
                `
            }}
        ]
    });
});

// Create category
const createCategory = async () => {
    const url = "/api/categories";

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

        showSuccess({msg: "Category created successfully!"});
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Unable to add category. Please try again"});
    }finally{
        hideLoader("#btn-add", {content: "Add +"});
    }
}

// Initiate category update modal
const initiateUpdate = async (id) => {
    const url = "/api/categories/" + id;

    try{
        const response = await fetch(url);
        const category = await response.json();

        if(category.error){
            return showError({msg: category.error});
        }

        $("#updateName").val(category.name);
        $("#categoryId").val(category._id);

        showModal("update-modal");
    }catch(e){
        console.log(e);
        showError({msg: "Something went wrong. Unable to update category"});
    }
}

// Update Category
const updateCategory = async () => {
    const id = $("#categoryId").val();
    const url = "/api/categories/" + id;

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

        const category = await response.json();

        if(category.error){
            return showError({msg: category.error});
        }

        showSuccess({msg: "Category updated successfully!"});
    
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Something went wrong! Unable to update category."});
    }finally{
        hideLoader("#rec-" + id, {content: `<i class="fas fa-edit"></i>`});
    }
}

// Alert for deleting a category
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
            deleteCategory(id);   
        }
    });
}

// Delete customer
const deleteCategory = async (id) => {
    const url = "/api/categories/" + id;

    showLoader("#rec-del-" + id, {content: generalLoader});

    try{
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            }
        });
    
        const category = await response.text();
    
        if(category.error){
            return showError({msg: category.error});
        }
        
        showSuccess({msg: "Category deleted successfully!"});
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Something went wrong. Unable to delete category!"});
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
            createCategory();
            addForm[0].reset();
        }
    });

    updateForm.on("submit", function(e){
        e.preventDefault();

        if(updateForm.valid()){
            updateCategory();
            updateForm[0].reset();
        }
    });
});


