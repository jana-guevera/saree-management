var datatable;
var addForm;
var updateForm;

// Populate the products table
$(document).ready(() => {
    datatable = $('.table').DataTable( {
        "ajax": {
            "url": "/api/products",
            "dataSrc": ""
        },
        "columns": [
            { "data": "prodId" },
            { "data": "name" },
            { "data": (product) => {
                if(product.category && product.category.name){
                    return product.category.name;
                }

                return product.categoryName;
            }},
            { "data": "quantity" },
            { "data": "pagePrice" },
            { "data": function(product){
                if(product.status == 1){
                    return `<span style="color:green;">Available</span>`;
                }

                return `<span style="color:red;">Unavailable</span>`;
            }},
            {"data": "note", "visible": false},
            { "data": function(product) {
                const userRole = $("#userRole").val();

                if(userRole === "ADMIN"){
                    return `
                        <button class="btn btn-secondary btn-sm" onclick="showDetails('${product._id}')"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-secondary btn-sm" onclick="showFiles('${product._id}')"><i class="fas fa-photo-video"></i></button>
                        <button class="btn btn-primary btn-sm" id="rec-${product._id}" onclick="initiateUpdate('${product._id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" id="rec-del-${product._id}" onclick="initiateDelete('${product._id}')"><i class="fas fa-trash"></i></button>
                    `;
                }
                
                return `
                        <button class="btn btn-secondary btn-sm" onclick="showDetails('${product._id}')"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-secondary btn-sm" onclick="showFiles('${product._id}')"><i class="fas fa-photo-video"></i></button>
                    `;
            }}
        ]
    });
});

const validateVendorPrice = (selector) => {
    const vendorPriceBoxes = document.querySelectorAll(selector);
    var isValid = true;

    for(var i = 0; i < vendorPriceBoxes.length; i++){
        const box = vendorPriceBoxes[i];
        const price = box.querySelector(".price").value.trim();
        const commission = box.querySelector(".commission").value.trim();

        if(!price || !commission){
            isValid = false;
            box.querySelector("span").setAttribute("class", "");
        }else{
            box.querySelector("span").setAttribute("class", "hide");
        }
    }

    return isValid;
}

const getVendorPrices = (selector) => {
    const vendorPriceBoxes = document.querySelectorAll(selector);
    var vendorPrices = [];

    for(var i = 0; i < vendorPriceBoxes.length; i++){
        const box = vendorPriceBoxes[i];
        const vendorId = box.querySelector(".vendor-id").value;
        const vendorName = box.querySelector(".vendor-name").value;
        const price = box.querySelector(".price").value.trim();
        const commission = box.querySelector(".commission").value.trim();

        vendorPrices.push({
            vendorId: vendorId,
            price: price,
            commission: commission,
            vendorName: vendorName
        });
    }

    return vendorPrices;
}

// Show Product Details
const showDetails = async (id) => {
    const url = "/api/products/" + id;

    try{
        const response = await fetch(url);
        const product = await response.json();

        if(product.error){
            return showError({msg: product.error});
        }

        const category = product.category.name || product.categoryName;
        const status = product.status === 1 ? "Available" : "Unavailable";
        var leftHtml = `
            <p>Product ID: ${product.prodId}</p>
            <p>Product Name: ${product.name}</p>
            <p>Category: ${category}</p>
            <p>Quantity: ${product.quantity}</p>
            <p>Page Price: Rs ${product.pagePrice}</p>
            <p>Status: ${status}</p>
            <hr>
            <h5>Vendor Prices</h5>
        `;

        for(var i = 0; i < product.vendorsPrice.length; i++){
            const vendorPrice = product.vendorsPrice[i];
            leftHtml += `
                <p>${vendorPrice.vendorName}:</p>
                <ul>
                    <li>Price: Rs${vendorPrice.price}</li>
                    <li>Commission: Rs${vendorPrice.commission}</li>
                </ul>
            `;
        }

        $("#details-modal #left-details").html(leftHtml);
        $("#product-description").text(product.note);
        showModal("details-modal");
    }catch(e){
        showError({msg: e.message});
    }
}

const generateGallaryHtml = (product) => {
    const userRole = $("#userRole").val();
    var html = "";

    product.fileNames.forEach((file) => {
        var deleteHtml = "";
        const id = file.split(".")[0];

        if(userRole === "ADMIN"){
            deleteHtml = `
                <button 
                    class="btn btn-danger btn-sm delete-file" 
                    onclick="deleteFile('${product._id}', '${file}')">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }

        if(isImage(file)){
            html += `
                <div class="file__image" id="fil-rec-${id}">
                    <img class="img-file" src="/uploads/${file}"/>
                    ${deleteHtml}
                </div>
            `;
        }else if(isVideo(file)){
            const ext = file.split(".").pop();
            html += `
                <div class="file__video" id="fil-rec-${id}">
                    <video width="250px" height="300px" controls="controls">
                        <source src="/uploads/${file}" type="video/${ext}" />
                    </video>
                    ${deleteHtml}
                </div>
            `;
        }
    });

    return html;
}

// Show Files
const showFiles = async (id) => {
    const url = "/api/products/" + id;

    try{
        const response = await fetch(url);
        const product = await response.json();

        if(product.error){
            return showError({msg: product.error});
        }
        
        $(".files-container").html(generateGallaryHtml(product));

        $("#files-modal #product-id").val(id);
        showModal("files-modal");
    }catch(e){
        showError({msg: e.message});
    }
}

async function addFiles(event){
    const id = $("#files-modal #product-id").val();
    const url = "/api/products/upload_files/" + id;

    if(event.target.files.length < 1){
        return;
    }

    const formData = new FormData();

    for(var i = 0; i < event.target.files.length; i++){
        formData.append(`media[${i}]`, event.target.files[i]);
    }
    
    showLoader("#btn-file-upload", {content: generalLoader});

    try{
        const response = await fetch(url, {
            method: "POST",
            body: formData
        });

        const product = await response.json();
        $(".files-container").html(generateGallaryHtml(product));
    }catch(e){
        showError({msg: e.message});
    }finally{
        hideLoader("#btn-file-upload", {content: "Upload Files"});
    }
}

const deleteFile = async (productId, file) => {
    const url = `/api/products/remove_files/${productId}/${file}`;
    const fileId = file.split(".")[0];
    const btnElement = "#fil-rec-" + fileId + " .delete-file";

    try{
        showLoader(btnElement, {content: generalLoader});

        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json(); 

        if(result.error){
            return showError({msg: result.error});
        }

        document.querySelector("#fil-rec-" + fileId).remove();
    }catch(e){
        showError({msg: e.message});
    }
}

// Create product
const createProduct = async () => {
    const url = "/api/products";

    if(!validateVendorPrice("#create-modal .vendor-price")){
        return;
    }

    const data = {
        name: $("#name").val(),
        category: $("#category").val(),
        quantity: $("#quantity").val(),
        pagePrice: $("#pagePrice").val(),
        note: $("#note").val(),
        vendorsPrice: getVendorPrices("#create-modal .vendor-price")
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
    
        const product = await response.json();
    
        if(product.error){
            return showError({msg: product.error});
        }

        showSuccess({msg: "Product created successfully!"});
        addForm[0].reset();
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Unable to add product. Please try again"});
    }finally{
        hideLoader("#btn-add", {content: "Add +"});
    }
}

// Initiate product update modal
const initiateUpdate = async (id) => {
    const url = "/api/products/" + id;
    const catUrl = "/api/categories";
    const vendorsUrl = "/api/vendors";

    try{
        const response = await fetch(url);
        const product = await response.json();

        const catResponse = await fetch(catUrl);
        const categories = await catResponse.json();

        const vendorResponse = await fetch(vendorsUrl);
        const vendors = await vendorResponse.json();

        if(product.error || vendors.error || categories.error){
            const error = product.error || vendors.error || categories.error;
            return showError({msg: error});
        }

        $("#updateName").val(product.name);
        $("#updateQuantity").val(product.quantity);
        $("#updatePrice").val(product.pagePrice);
        $("#productId").val(product._id);
        $("#updateNote").val(product.note);
        $("#status").val(product.status);

        var categoryOptions = "";
        var categoryId = "";

        categories.forEach(category => {
            categoryOptions += ` <option value="${category._id}">${category.name}</option>`;
        });

        if(product.category && product.category._id){
            categoryId = product.category._id;
        }else{
            categoryId = product.category;
            categoryOptions += `<option value=${product.category}>
                ${product.categoryName}</option>`;
        }

        $("#updateCategory").html(categoryOptions);
        $("#updateCategory").val(categoryId);

        var vendorPriceHtml = "";

        vendors.forEach((v) => {
            const existingVendorP = product.vendorsPrice.find(e => 
                e.vendorId === v._id);
            if(existingVendorP){
                vendorPriceHtml += `
                    <div class="form-group vendor-price" id="${existingVendorP.vendorId}">
                        <label for="name">${v.name}</label>
                        <input type="hidden" class="vendor-id" value="${existingVendorP.vendorId}">
                        <input type="hidden" class="vendor-name" value="${v.name}">
                        <div class="inputs">
                            <input value="${existingVendorP.price}" type="number" step="0.01" class="form-control price" placeholder="Price">
                            <input value="${existingVendorP.commission}" type="number" step="0.01" class="form-control commission" placeholder="Commission">
                        </div>
                        <span style="color: red;" class="hide">Field should not be empty</span>
                    </div>
                `;
            }else{
                vendorPriceHtml += `
                    <div class="form-group vendor-price" id="${v._id}">
                        <label for="name">${v.name}</label>
                        <input type="hidden" class="vendor-id" value="${v._id}">
                        <input type="hidden" class="vendor-name" value="${v.name}">
                        <div class="inputs">
                            <input value="" type="number" step="0.01" class="form-control price" placeholder="Price">
                            <input value="" type="number" step="0.01" class="form-control commission" placeholder="Commission">
                        </div>
                        <span style="color: red;" class="hide">Field should not be empty</span>
                    </div>
                `;
            }
        });

        $("#update-modal #vendor-prices-container").html(vendorPriceHtml);

        showModal("update-modal");
    }catch(e){
        console.log(e);
        showError({msg: "Something went wrong. Unable to update product"});
    }
}

// Update Product
const updateProduct = async () => {
    const id = $("#productId").val();
    const url = "/api/products/" + id;

    if(!validateVendorPrice("#update-modal .vendor-price")){
        return;
    }

    closeModal("update-modal");
    showLoader("#rec-" + id, {content: generalLoader});

    const data = {
        name: $("#updateName").val(),
        category: $("#updateCategory").val(),
        quantity: $("#updateQuantity").val(),
        pagePrice: $("#updatePrice").val(),
        note: $("#updateNote").val(),
        status: $("#status").val(),
        vendorsPrice: getVendorPrices("#update-modal .vendor-price")
    }

    try{
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const product = await response.json();

        if(product.error){
            return showError({msg: product.error});
        }

        showSuccess({msg: "Product updated successfully!"});
    
        updateForm[0].reset();
        datatable.ajax.reload();
    }catch(e){
        showError({msg: "Something went wrong! Unable to update product."});
    }finally{
        hideLoader("#rec-" + id, {content: `<i class="fas fa-edit"></i>`});
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
    const url = "/api/products/" + id;

    showLoader("#rec-del-" + id, {content: generalLoader});

    try{
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            }
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
    updateForm = $("#update-form");

    addForm.validate({
        rules: {
            name: {
                required: true
            },
            category:{
                required: true
            },
            quantity: {
                required: true,
                min: 0
            },
            pagePrice: {
                required: true,
                min: 0
            },
        }
    });
    
    updateForm.validate({
        rules: {
            updateName: {
                required: true
            },
            updateCategory:{
                required: true
            },
            updateQuantity: {
                required: true,
                min: 0
            },
            updatePrice: {
                required: true,
                min: 0
            }
        }
    });

    addForm.on("submit", function(e) {
        e.preventDefault();

        if(addForm.valid()){
            createProduct();
        }
    });

    updateForm.on("submit", function(e){
        e.preventDefault();

        if(updateForm.valid()){
            updateProduct();
        }
    });
});


