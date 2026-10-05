const RESEND_API_URL = "https://api.resend.com/emails";

function toBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary);
}

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export async function sendRecipeEmail(recipe, env) {
    const json = JSON.stringify(recipe, null, 2);

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
                attachments: [
                    {
                        filename: `${recipe.id}.json`,
                        content: toBase64(json),
                        content_type: "application/json"
                    }
                ]
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