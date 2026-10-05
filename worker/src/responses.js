export function corsHeaders(origin) {
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Vary": "Origin"
    };
}

export function jsonResponse(
    body,
    status,
    origin,
    extraHeaders = {}
) {
    return Response.json(body, {
        status,
        headers: {
            ...(origin ? corsHeaders(origin) : {}),
            ...extraHeaders
        }
    });
}