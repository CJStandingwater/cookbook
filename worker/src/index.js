import { corsHeaders, jsonResponse } from "./responses.js";
import { getAllowedOrigin } from "./cors.js";
import { readRecipeRequest } from "./request.js";
import { checkSubmissionLimit } from "./limiter.js";
import { sendRecipeEmail } from "./resend.js";
import { deleteRecipeIndex, getRecipeCards, upsertRecipeIndex } from './database.js';

export { SubmissionLimiter } from "./limiter.js";

const SUBMISSION_EP = "/submit";
const INDEX_EP = "/index";
const BROWSER_EP = '/browse';

export default {
    async fetch(request, env) {
        switch (new URL(request.url).pathname) {
            case SUBMISSION_EP:
                return handleSubmit(request, env);
            case INDEX_EP:
                return handleIndex(request, env);
            case BROWSER_EP:
                return handleBrowse(request, env);
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

async function handleIndex(request, env, pathname) {
    if (request.headers.get('Authorization') !== `Bearer ${env.INDEX_API_KEY}`) {
        return jsonResponse({ message: 'Unauthorized.' }, 401, null);
    }

    if (request.method === 'DELETE') {
        const recipeId = new URL(request.url).searchParams.get('id');

        if (!recipeId) {
            return jsonResponse({ message: 'Recipe ID is required.' }, 400, null);
        }

        await deleteRecipeIndex(recipeId, env);

        return jsonResponse(
            {
                message: 'Recipe removed from index.',
                id: recipeId,
            },
            200,
            null,
        );
    }

    if (request.method !== 'POST') {
        return jsonResponse({ message: 'Method not allowed.' }, 405, null, {
            Allow: 'POST, DELETE',
        });
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

        return jsonResponse({ message: 'Failed to index recipe.' }, 500, null);
    }
}

async function handleBrowse(request, env) {
    const allowedOrigin = getAllowedOrigin(request);

    if (allowedOrigin === false) {
        return jsonResponse({ message: 'Origin not allowed.' }, 403, allowedOrigin);
    }

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders(allowedOrigin),
        });
    }

    if (request.method !== 'GET') {
        return jsonResponse(
            { message: 'Method not allowed.' },
            405,
            allowedOrigin,
            { Allow: 'GET, OPTIONS' },
        );
    }

    const url = new URL(request.url);
    const title = url.searchParams.get('title') ?? '';
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '24', 10) || 24;
    const offset = Number.parseInt(url.searchParams.get('offset') ?? '0', 10) || 0;

    try {
        const result = await getRecipeCards(env, {
            title,
            limit,
            offset,
        });

        return jsonResponse(result, 200, allowedOrigin);
    } catch (error) {
        console.error('Recipe browser query failed:', error);

        return jsonResponse(
            { message: 'Unable to load recipes.' },
            500,
            allowedOrigin,
        );
    }
}
