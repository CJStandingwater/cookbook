const MAX_BODY_BYTES = 100 * 1024;

export async function readRecipeRequest(request) {
    const contentType = request.headers.get("Content-Type") || "";

    if (!contentType.includes("application/json")) {
        return {
            ok: false,
            status: 415,
            message: "Content-Type must be application/json"
        };
    }

    const contentLengthHeader = request.headers.get("Content-Length");

    if (contentLengthHeader !== null) {
        const contentLength = Number(contentLengthHeader);

        if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
            return {
                ok: false,
                status: 413,
                message: "Request body too large"
            };
        }
    }

    const rawBody = await request.text();

    const actualSize = new TextEncoder()
        .encode(rawBody)
        .byteLength;

    if (actualSize > MAX_BODY_BYTES) {
        return {
            ok: false,
            status: 413,
            message: "Request body too large"
        };
    }

    let recipe;

    try {
        recipe = JSON.parse(rawBody);
    } catch {
        return {
            ok: false,
            status: 400,
            message: "Invalid JSON in request body"
        };
    }

    if (
        typeof recipe.id !== "string" ||
        typeof recipe.title !== "string"
    ) {
        return {
            ok: false,
            status: 400,
            message: "Recipe id and title are required."
        };
    }

    return {
        ok: true,
        recipe
    };
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const MAX_TOTAL_IMAGE_BYTES = 25 * 1024 * 1024;

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const IMAGE_EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

export async function readSubmissionRequest(request) {
    const contentType = request.headers.get('Content-Type') || '';

    if (!contentType.includes('multipart/form-data')) {
        return failure(415, 'Content-Type must be multipart/form-data.');
    }

    let formData;

    try {
        formData = await request.formData();
    } catch {
        return failure(400, 'Invalid submission body.');
    }

    const rawRecipe = formData.get('recipe');

    if (typeof rawRecipe !== 'string') {
        return failure(400, 'Recipe data is required.');
    }

    if (new TextEncoder().encode(rawRecipe).byteLength > MAX_BODY_BYTES) {
        return failure(413, 'Recipe data is too large.');
    }

    let recipe;

    try {
        recipe = JSON.parse(rawRecipe);
    } catch {
        return failure(400, 'Invalid recipe JSON.');
    }

    if (typeof recipe.id !== 'string' || typeof recipe.title !== 'string') {
        return failure(400, 'Recipe id and title are required.');
    }

    const images = [];
    const positions = new Set();
    let totalImageBytes = 0;

    for (const [name, value] of formData.entries()) {
        const match = /^image-(\d+)$/.exec(name);

        if (!match) {
            continue;
        }

        if (!(value instanceof File) || !value.size) {
            continue;
        }

        const position = Number(match[1]);

        if (positions.has(position)) {
            return failure(400, `Duplicate image position ${position}.`);
        }

        if (!IMAGE_TYPES.has(value.type)) {
            return failure(415, `Image ${position} must be JPEG, PNG, or WebP.`);
        }

        if (value.size > MAX_IMAGE_BYTES) {
            return failure(413, `Image ${position} is too large.`);
        }

        totalImageBytes += value.size;

        if (totalImageBytes > MAX_TOTAL_IMAGE_BYTES) {
            return failure(413, 'Combined recipe images are too large.');
        }

        positions.add(position);

        images.push({
            position,
            filename: `${position}.` + IMAGE_EXTENSIONS[value.type],
            file: value,
        });
    }

    images.sort((a, b) => a.position - b.position);

    return {
        ok: true,
        recipe,
        images,
    };
}

function failure(status, message) {
    return {
        ok: false,
        status,
        message,
    };
}
