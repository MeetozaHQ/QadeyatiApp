import server from "../dist/server/server.js";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req, res) {
  try {
    // 1. Reconstruct the absolute base URL
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const base = `${protocol}://${host}`;
    
    // Parse the incoming rewritten request URL
    const reqUrlParsed = new URL(req.url, base);
    
    // Get the original request URI (which contains/preserves the exact pathname and queries)
    let originalUri = req.headers["x-rewrite-url"] || req.headers["x-original-url"];
    
    let ssrUrl;
    let originalPath = null;
    
    if (originalUri) {
      if (!originalUri.startsWith("/")) {
        originalUri = "/" + originalUri;
      }
      ssrUrl = new URL(originalUri, base);
    } else {
      // Retrieve the original routing path using multiple fallback layers
      originalPath = reqUrlParsed.searchParams.get("__original_path");
      
      if (originalPath === null) {
        // Fallcamp A: parse from Vercel's route regex matches header
        const routeMatches = req.headers["x-now-route-matches"];
        if (routeMatches) {
          const matches = new URLSearchParams(routeMatches);
          const firstMatch = matches.get("1");
          if (firstMatch !== null) {
            originalPath = firstMatch;
          }
        }
      }
      
      if (originalPath === null) {
        // Fallcamp B: parse from Vercel's matched path header
        const matched = req.headers["x-matched-path"];
        if (matched && matched !== "/api/index" && matched !== "/api/index.js") {
          originalPath = matched;
        }
      }
      
      // Clean and normalize the pathname (ensure there is exactly one leading slash)
      let originalPathname = "/";
      if (originalPath !== null && originalPath !== undefined) {
        originalPathname = "/" + originalPath.replace(/^\//, "");
      }
      
      ssrUrl = new URL(originalPathname, base);
      reqUrlParsed.searchParams.forEach((val, key) => {
        if (key !== "__original_path") {
          ssrUrl.searchParams.append(key, val);
        }
      });
    }
    
    const originalPathname = ssrUrl.pathname;

    // Add diagnostics endpoint to dynamically inspect route forwarding of headers to the custom server
    if (req.url.includes("/api/debug-routes")) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        url: req.url,
        headers: req.headers,
        originalUri,
        originalPath,
        originalPathname,
        parsedURL: reqUrlParsed.toString(),
        base,
        ssrUrl: ssrUrl.toString()
      }, null, 2));
      return;
    }
    
    const url = ssrUrl.toString();

    // 2. Build headers
    const headers = new Headers();
    
    // Overwrite all potential headers that Nitro/H3/Vinxi check to determine the current path.
    // If any of these point to "/api/index" or "/api/index.js", Vinxi will match a 404 route.
    // Overriding them to originalPathname guarantees successful SSR routing matching.
    const headersToOverride = {
      "x-matched-path": originalPathname,
      "x-vercel-matched-path": originalPathname,
      "x-rewrite-url": originalPathname,
      "x-original-url": originalPathname,
      "x-forwarded-path": originalPathname,
      "x-forwarded-uri": originalPathname,
    };

    const headersToSkip = new Set([
      "x-matched-path",
      "x-vercel-matched-path",
      "x-now-route-matches",
      "x-now-route-matches-all",
      "x-rewrite-url",
      "x-original-url",
    ]);

    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        const lowerKey = key.toLowerCase();
        
        // Skip keys we will explicitly override or block to prevent "/api/index" leakages
        if (headersToSkip.has(lowerKey) || headersToOverride[lowerKey] !== undefined || lowerKey.startsWith("x-now-") || lowerKey.startsWith("x-vercel-")) {
          continue;
        }
        
        if (Array.isArray(value)) {
          for (const val of value) {
            headers.append(key, val);
          }
        } else {
          headers.set(key, value);
        }
      }
    }

    // Explicitly apply/force normalized routing headers for H3 / Vinxi underlying layer
    for (const [key, value] of Object.entries(headersToOverride)) {
      headers.set(key, value);
    }

    // 3. Prepare body if applicable (since bodyParser is disabled, we read the stream)
    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", (err) => reject(err));
      });
    }

    // 4. Create Web Request
    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    // 5. Run standard SSR handler
    const context = {};
    const response = await server.fetch(request, {}, context);

    // 6. Set status and response headers
    res.statusCode = response.status;
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    // 7. Stream/send body
    const arrayBuffer = await response.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("Vercel Serverless function error:", err);
    res.statusCode = 500;
    res.end("Internal Server Error: " + err.message);
  }
}
