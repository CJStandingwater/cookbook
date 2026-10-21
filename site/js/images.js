import { normalizeWhitespace } from './normalize.js';

const IMAGE_EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

export function buildImage(fileInput, altInput, recipeId, position) {
    const file = fileInput.files[0];
    const existingSrc = fileInput.dataset.existingSrc;

    if (!file && !existingSrc) {
        return undefined;
    }

    const src = file ? buildImagePath(file, recipeId, position) : existingSrc;

    return {
        src,
        alt: normalizeWhitespace(altInput.value),
    };
}

export function populateImage(image, fileInput, altInput) {
    fileInput.value = '';

    if (!image) {
        delete fileInput.dataset.existingSrc;
        altInput.value = '';

        return;
    }

    fileInput.dataset.existingSrc = image.src;

    altInput.value = image.alt ?? '';
}

export function validateImage(fileInput, altInput) {
    const file = fileInput.files[0];
    const existingSrc = fileInput.dataset.existingSrc;

    if (!file && !existingSrc) {
        return null;
    }

    if (file && !getImageExtension(file)) {
        return 'Images must be JPEG, PNG, or WebP.';
    }

    if (!normalizeWhitespace(altInput.value)) {
        return 'An image description is required.';
    }

    return null;
}

function buildImagePath(file, recipeId, position) {
    const extension = getImageExtension(file);

    return `assets/recipe-images/` + `${recipeId}/${position}.${extension}`;
}

function getImageExtension(file) {
    const mimeExtension = IMAGE_EXTENSIONS[file.type];

    if (mimeExtension) {
        return mimeExtension;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'jpeg') {
        return 'jpg';
    }

    if (extension === 'jpg' || extension === 'png' || extension === 'webp') {
        return extension;
    }

    return null;
}

export function getSelectedImageFiles() {
    const images = [];

    const recipeFile = document.getElementById('recipe-image').files[0];

    if (recipeFile) {
        images.push({
            position: 0,
            file: recipeFile,
        });
    }

    const instructions = [
        ...document.querySelectorAll('#instructions > .instruction'),
    ];

    instructions.forEach((instruction, index) => {
        const file = instruction.querySelector('.instruction-image').files[0];

        if (!file) {
            return;
        }

        images.push({
            position: index + 1,
            file,
        });
    });

    return images;
}
