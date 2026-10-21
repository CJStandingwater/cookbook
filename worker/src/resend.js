const RESEND_API_URL = "https://api.resend.com/emails";

function toBase64(bytes) {
    const chunkSize = 0x8000;
    let binary = '';

    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(
            ...bytes.subarray(offset, offset + chunkSize),
        );
    }

    return btoa(binary);
}

function textToBase64(value) {
    return toBase64(new TextEncoder().encode(value));
}

async function fileToBase64(file) {
    return toBase64(new Uint8Array(await file.arrayBuffer()));
}

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export async function sendRecipeEmail(recipe, images, env) {
    const json = JSON.stringify(recipe, null, 2);

    const attachments = [
        {
            filename: `${recipe.id}.json`,
            content: textToBase64(json),
            content_type: 'application/json',
        },
    ]

    for (const image of images) {
        attachments.push({
            filename: image.filename,
            content: await fileToBase64(image.file),
            content_type: image.file.type,
        })
    }

    const response = await fetch(
        RESEND_API_URL,
        {
            method: "POST",
            headers: {
                "Authorization":
                    `Bearer ${env.RESEND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: env.SUBMISSION_FROM,
                to: env.SUBMISSION_TO,
                subject:
                    `Cookbook Submission - ${recipe.title}`,
                html: `
                    <p>You have a new submission!</p>
                    <p>
                        <strong>Recipe ID:</strong>
                        ${escapeHtml(recipe.id)}
                    </p>
                    <p>
                        <strong>Recipe Title:</strong>
                        ${escapeHtml(recipe.title)}
                    </p>
                `,
                attachments
            })
        }
    );

    const result = await response.json();

    return {
        ok: response.ok,
        status: response.status,
        result
    };
}