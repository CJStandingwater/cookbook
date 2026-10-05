const PRODUCTION_ORIGIN = "https://cjstandingwater.github.io";
const LOCAL_ORIGINS = new Set([
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]);

export function getAllowedOrigin(request) {
    const origin = request.headers.get("Origin");
    if (!origin) {
        return null;
    }

    if (origin === PRODUCTION_ORIGIN) {
        return origin;
    }

    const hostname = new URL(request.url).hostname;

    const isLocalWorker = hostname === "localhost" || hostname === "127.0.0.1";
    if (isLocalWorker && LOCAL_ORIGINS.has(origin)) {
        return origin;
    }

    return false;
}