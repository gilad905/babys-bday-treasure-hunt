interface Env {
	GOOGLE_MAPS_SERVER_KEY: string;
	ALLOWED_ORIGINS?: string;
	RATE_LIMIT_WINDOW_SECONDS?: string;
	RATE_LIMIT_MAX_REQUESTS?: string;
}

type RateRecord = {
	windowStart: number;
	count: number;
};

const ipRateWindow = new Map<string, RateRecord>();

function jsonResponse(body: unknown, status = 200, origin?: string): Response {
	const headers = new Headers({
		"content-type": "application/json; charset=utf-8",
	});
	if (origin) {
		headers.set("access-control-allow-origin", origin);
		headers.set("vary", "origin");
	}
	return new Response(JSON.stringify(body), { status, headers });
}

function parseAllowedOrigins(env: Env): Set<string> {
	const raw = env.ALLOWED_ORIGINS || "";
	return new Set(
		raw
			.split(",")
			.map((value) => value.trim())
			.filter(Boolean),
	);
}

function getOrigin(request: Request): string | null {
	return request.headers.get("origin");
}

function isOriginAllowed(request: Request, env: Env): boolean {
	const allowed = parseAllowedOrigins(env);
	if (allowed.size === 0) {
		return false;
	}
	const origin = getOrigin(request);
	return !!origin && allowed.has(origin);
}

function getClientIp(request: Request): string {
	return request.headers.get("cf-connecting-ip") || "unknown-ip";
}

function isRateLimited(request: Request, env: Env): boolean {
	const windowSeconds = Number(env.RATE_LIMIT_WINDOW_SECONDS || "60");
	const maxRequests = Number(env.RATE_LIMIT_MAX_REQUESTS || "600");
	const now = Math.floor(Date.now() / 1000);
	const ip = getClientIp(request);
	const existing = ipRateWindow.get(ip);

	if (!existing || now - existing.windowStart >= windowSeconds) {
		ipRateWindow.set(ip, { windowStart: now, count: 1 });
		return false;
	}

	existing.count += 1;
	ipRateWindow.set(ip, existing);
	return existing.count > maxRequests;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const origin = getOrigin(request) || undefined;

		if (request.method === "OPTIONS") {
			if (!isOriginAllowed(request, env)) {
				return jsonResponse({ error: "origin_not_allowed" }, 403);
			}
			const headers = new Headers();
			headers.set("access-control-allow-origin", origin || "");
			headers.set("access-control-allow-methods", "GET,OPTIONS");
			headers.set("access-control-allow-headers", "content-type");
			headers.set("vary", "origin");
			return new Response(null, { status: 204, headers });
		}

		if (request.method !== "GET") {
			return jsonResponse({ error: "method_not_allowed" }, 405, origin);
		}

		if (!isOriginAllowed(request, env)) {
			return jsonResponse({ error: "origin_not_allowed" }, 403, origin);
		}

		if (isRateLimited(request, env)) {
			return jsonResponse({ error: "rate_limited" }, 429, origin);
		}

		if (url.pathname !== "/api/streetview/metadata") {
			return jsonResponse({ error: "not_found" }, 404, origin);
		}

		const lat = Number(url.searchParams.get("lat"));
		const lng = Number(url.searchParams.get("lng"));

		if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
			return jsonResponse({ error: "invalid_coordinates" }, 400, origin);
		}

		if (!env.GOOGLE_MAPS_SERVER_KEY) {
			return jsonResponse({ error: "missing_server_key" }, 500, origin);
		}

		const upstreamUrl = new URL(
			"https://maps.googleapis.com/maps/api/streetview/metadata",
		);
		upstreamUrl.searchParams.set("location", `${lat},${lng}`);
		upstreamUrl.searchParams.set("radius", "200");
		upstreamUrl.searchParams.set("source", "outdoor");
		upstreamUrl.searchParams.set("key", env.GOOGLE_MAPS_SERVER_KEY);

		// console.debug(`Fetching ${upstreamUrl.toString()}`);
		const upstreamResponse = await fetch(upstreamUrl.toString());
		if (!upstreamResponse.ok) {
			return jsonResponse({ error: "upstream_error" }, 502, origin);
		}

		const upstreamJson = (await upstreamResponse.json()) as {
			status?: string;
			pano_id?: string;
			location?: { lat: number; lng: number };
		};

		return jsonResponse(
			{
				ok: upstreamJson.status === "OK",
				status: upstreamJson.status,
				panoId: upstreamJson.pano_id,
				location: upstreamJson.location,
			},
			200,
			origin,
		);
	},
};
