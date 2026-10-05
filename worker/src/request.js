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