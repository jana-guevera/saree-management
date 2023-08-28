var datatable;
var addForm;

// Populate the ordered products table
$(document).ready(() => {
    datatable = $('.table').DataTable( {
        "ajax": {
            "url": "/api/orders/" + $("#orderId").val(),
            "dataSrc": "products"
        },
        "columns": [
            { "data": function(product){
                return `<img class="product-image" src="${generateImageSrc({id:product.imagePath})}">`;
            }, "width": "5%"},
            { "data": "name" },
            { "data": "soldPrice" },
            { "data": "quantity" },
            { "data": "totalSale" },
            { "data": function(product) {
                return `
                    <button class="btn btn-danger btn-sm" id="rec-del-${product._id}" onclick="initiateDelete('${product._id}')"><i class="fas fa-trash"></i></button>
                `
            }}
        ]
    });
});

// Add product to order
const addProduct = async () => {
    const url = "/api/orders/external/products";

    const formData = new FormData();
    formData.append("orderId", $("#orderId").val());
    formData.append("name", $("#name").val());
    formData.append("soldPrice", $("#soldPrice").val());
    formData.append("quantity", $("#quantity").val());

    const files = document.querySelector("#imageFile").files;
    formData.append("imageFile", files[0]);

    closeModal("create-modal");
    showLoader("#btn-add", {content: addLoader});

    try{
        const response = await fetch(url, {
            method: "POST",
            body: formData
        });

        const product = await response.json();
    
        if(product.error){
            return showError({msg: product.error});
        }

        showSuccess({msg: "Product added to order successfully!"});

        
        datatable.ajax.reload();
        addForm[0].reset();
    }catch(e){
        console.log(e);
        showError({msg: "Unable to add product. Please try again"});
    }finally{
        hideLoader("#btn-add", {content: "Add +"});
    }
}

// Alert for deleting a product
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
            deleteProduct(id);   
        }
    });
}

// Delete product
const deleteProduct = async (id) => {
    const url = "/api/orders/external/products/" + id; 

    showLoader("#rec-del-" + id, {content: generalLoader});

    const data = {
        orderId: $("#orderId").val()
    }

    try{
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    
        const product = await response.json();
    
        if(product.error){
            return showError({msg: product.error});
        }
        
        showSuccess({msg: "Product deleted successfully!"});
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Something went wrong. Unable to delete product!"});
    }finally{
        hideLoader("#rec-del-" + id, {content: `<i class="fas fa-trash"></i>`});
    }
}

$(document).ready(() => {
    addForm = $("#add-form");

    addForm.validate({
        rules: {
            name: {
                required: true
            },
            quantity:{
                required: true,
                min: 1
            },
            soldPrice:{
                required: true,
                min: 0
            },
            imageFile:{
                required: true
            }
        }
    });

    addForm.on("submit", function(e) {
        e.preventDefault();

        if(addForm.valid()){
            addProduct();
        }
    });
});
