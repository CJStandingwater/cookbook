import { corsHeaders, jsonResponse } from "./responses.js";
import { getAllowedOrigin } from "./cors.js";
import { readRecipeRequest } from "./request.js";
import { checkSubmissionLimit } from "./limiter.js";
import { sendRecipeEmail } from "./resend.js";
import { upsertRecipeIndex } from "./database.js";

export { SubmissionLimiter } from "./limiter.js";

const SUBMISSION_EP = "/submit";
const INDEX_EP = "/index";

export default {
    async fetch(request, env) {
        switch (new URL(request.url).pathname) {
            case SUBMISSION_EP:
                return handleSubmit(request, env);
            case INDEX_EP:
                return handleIndex(request, env);
            default:
                return Response.json(
                    { message: "Not Found" },
                    { status: 404 }
                );
        }
    }   
};

async function handleSubmit(request, env) {
    const allowedOrigin = getAllowedOrigin(request);

    if (allowedOrigin === false) {
        return jsonResponse(
            { message: "Origin not allowed" },
            403,
            allowedOrigin
        );
    }

    if (request.method === "OPTIONS") {
        if (!allowedOrigin) {
            return jsonResponse(
                { message: "Origin not allowed" },
                403,
                allowedOrigin
            );
        }

        return new Response(null, {
            status: 204,
            headers: corsHeaders(allowedOrigin)
        });
    }

    if (request.method !== "POST") {
        return jsonResponse(
            { message: "Method not allowed." },
            405,
            allowedOrigin,
            { "Allow": "POST, OPTIONS" }
        );
    }

    const recipeRequest = await readRecipeRequest(request);

    if (!recipeRequest.ok) {
        return jsonResponse(
            { message: recipeRequest.message },
            recipeRequest.status,
            allowedOrigin
        );
    }

    const limit = await checkSubmissionLimit(request, env);

    if (!limit.allowed) {
        const retryAfterSeconds = Math.max(1, Math.ceil(limit.retryAfterMs / 1000));
        const message = limit.reason === "ip"
            ? "Wait 60 seconds between submissions."
            : "Global submission limit reached.";

        return jsonResponse(
            { message },
            429,
            allowedOrigin,
            {
                "Retry-After": String(retryAfterSeconds)
            }
        );
    }

    const email = await sendRecipeEmail(recipeRequest.recipe, env);

    if (!email.ok) {
        return jsonResponse(
            {
                message:
                    "Failed to send recipe email.",
                details: email.result
            },
            email.status,
            allowedOrigin
        );
    }

    return jsonResponse(
        {
            message: "Recipe submitted successfully",
            id: email.result.id
        },
        200,
        allowedOrigin
    );
}

async function handleIndex(request, env) {
    if (request.method !== 'POST') {
        return jsonResponse({ message: 'Method not allowed.' }, 405, null, {
            Allow: 'POST',
        });
    }

    if (request.headers.get('Authorization') !== `Bearer ${env.INDEX_API_KEY}`) {
        return jsonResponse({ message: 'Unauthorized.' }, 401, null);
    }

    const recipeRequest = await readRecipeRequest(request);

    if (!recipeRequest.ok) {
        return jsonResponse(
            { message: recipeRequest.message },
            recipeRequest.status,
            null,
        );
    }

    try {
        await upsertRecipeIndex(recipeRequest.recipe, env);

        return jsonResponse(
            {
                message: 'Recipe indexed successfully.',
                id: recipeRequest.recipe.id,
            },
            200,
            null,
        );
    } catch (error) {
        console.error('Recipe indexing failed:', error);

        return jsonResponse(
            {
                message: 'Failed to index recipe.',
            },
            500,
            null,
        );
    }
}
