const SUBMISSION_ENDPOINT = "http://127.0.0.1:8787/submit";

export async function submitRecipe(recipe) {
    const response = await fetch(
        SUBMISSION_ENDPOINT,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(recipe)
        }
    );

    let result = {};

    try {
        result = await response.json();
    } catch {
    }

    if (!response.ok) {
        const error = new Error(
            result.message || "Recipe submission failed."
        );

        error.status = response.status;
        error.retryAfter =
            response.headers.get("Retry-After");

        throw error;
    }

    return result;
}