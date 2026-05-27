import server from "../dist/server/server.js";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req, res) {
  try {
    // 1. Determine URL (restoring original path in case of Vercel rewrites)
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const base = `${protocol}://${host}`;
    
    // Parse the incoming rewritten URL
    const reqUrlParsed = new URL(req.url, base);
    
    // Retrieve the original routing path using multiple bulletproof fallback layers
    let originalPath = reqUrlParsed.searchParams.get("__original_path");
    
    if (originalPath === null) {
      // Fallback A: parse from Vercel's route regex matches header
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
      // Fallback B: parse from Vercel's matched path header
      const matched = req.headers["x-matched-path"];
      if (matched && matched !== "/api/index" && matched !== "/api/index.js") {
        originalPath = matched;
      }
    }
    
    // Clean and normalize the pathname
    let originalPathname = "/";
    if (originalPath !== null && originalPath !== undefined) {
      originalPathname = "/" + originalPath.replace(/^\//, "");
    }
    
    // Reconstruct the perfect URL including query parameters
    const ssrUrl = new URL(originalPathname, base);
    reqUrlParsed.searchParams.forEach((val, key) => {
      if (key !== "__original_path") {
        ssrUrl.searchParams.append(key, val);
      }
    });
    
    const url = ssrUrl.toString();

    // 2. Build headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (const val of value) {
            headers.append(key, val);
          }
        } else {
          headers.set(key, value);
        }
      }
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