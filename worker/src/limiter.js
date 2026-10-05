import { DurableObject } from "cloudflare:workers";

const IP_INTERVAL_MS = 60_000;
const GLOBAL_INTERVAL_MS = 1_000;

export class SubmissionLimiter extends DurableObject {
    async reserve(ip) {
        const stored = await this.ctx.storage.get([
            "lastGlobalAt",
            "acceptedIps"
        ]);
        const lastGlobalAt = stored.get("lastGlobalAt") ?? 0;
        const acceptedIps = stored.get("acceptedIps") ?? {};
        const now = Date.now();

        for (const [storedIp, timestamp] of Object.entries(acceptedIps)) {
            if (now - timestamp >= IP_INTERVAL_MS) {
                delete acceptedIps[storedIp];
            }
        }

        const lastIpAt = acceptedIps[ip] ?? 0;
        const ipWait = IP_INTERVAL_MS - (now - lastIpAt);

        if (ipWait > 0) {
            return {
                allowed: false,
                reason: "ip",
                retryAfterMs: ipWait
            };
        }

        const globalWait = GLOBAL_INTERVAL_MS - (now - lastGlobalAt);

        if (globalWait > 0) {
            return {
                allowed: false,
                reason: "global",
                retryAfterMs: globalWait
            };
        }

        acceptedIps[ip] = now;

        await this.ctx.storage.put({
            lastGlobalAt: now,
            acceptedIps
        });

        return {
            allowed: true,
            retryAfterMs: 0
        };
    }
}

function getClientIp(request) {
    const hostname = new URL(request.url).hostname;

    const isLocal =
        hostname === "localhost" ||
        hostname === "127.0.0.1";

    if (isLocal) {
        return (
            request.headers.get("X-Test-Client-IP") ||
            request.headers.get("CF-Connecting-IP") ||
            "local"
        );
    }

    return request.headers.get("CF-Connecting-IP");
}

export async function checkSubmissionLimit(request, env) {
    const ip = getClientIp(request);
    const limiter = env.SUBMISSION_LIMITER.getByName("global");
    return limiter.reserve(ip);
}