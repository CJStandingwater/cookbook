import { corsHeaders, jsonResponse } from "./responses.js";
import { getAllowedOrigin } from "./cors.js";
import { readRecipeRequest } from "./request.js";
import { checkSubmissionLimit } from "./limiter.js";
import { sendRecipeEmail } from "./resend.js";

export { SubmissionLimiter } from "./limiter.js";

const SUBMISSION_EP = "/submit";

export default {
    async fetch(request, env) {
        switch (new URL(request.url).pathname) {
            case SUBMISSION_EP:
                return handleSubmit(request, env);
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