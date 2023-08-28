// ----------------------- Loading Content ----------------------------------
const addLoader = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Adding...`;

const generalLoader = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`;
                    
// ------------------------- Utility Methods --------------------------------------------

const showSuccess = (data) => {
    toastr.success(data.msg);
}

const showError = (data) => {
    toastr.error(data.msg)
}

const showModal = (modalId) => {
    $("label.error").hide();
    $(".error").removeClass("error");
    $('#' + modalId).modal("show");
}

const closeModal = (modalId) => {
    $('#' + modalId).modal("hide");
}

const showLoader = (selector, data) => {
    const element = document.querySelector(selector);
    element.disabled = true;
    element.innerHTML = data.content;
}

const hideLoader = (selector, data) => {
    const element = document.querySelector(selector);
    element.disabled = false;
    element.innerHTML = data.content;
}

// Check if a file is image or video
const isImage = (fileName) => {
    const extension = fileName.split(".").pop();
    const allowedFiles = ["jpeg", "JPEG", "jpg", 
    "png", "gif", "webp", "tiff", "tif"];

    // Check if file is allowed
    return allowedFiles.includes(extension);
}

const isVideo = (fileName) => {
    const extension = fileName.split(".").pop();
    const allowedFiles = ["mp4", "mov", "wmv", "webm", "avi", "flv", "mkv", "mts"];

    // Check if file is allowed
    return allowedFiles.includes(extension.toLowerCase());
}


const generateImageSrc = (file) => {
    return `https://drive.google.com/uc?id=${file.id}&export=download`;
}

const generateDownloadLink = (file) => {
    return `
        <a  class="btn btn-primary btn-sm"
            href="https://drive.google.com/uc?id=${file.id}&export=download"
        >
            <i class="fas fa-download"></i>
        </a>
    `;
}

const generateVideoSrc = (file) => {
    return "https://drive.google.com/uc?export=download&id=" + file.id;
}