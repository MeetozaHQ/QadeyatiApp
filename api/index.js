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
    const originalPath = req.headers["x-matched-path"] || req.url;
    
    let url;
    try {
      const base = `${protocol}://${host}`;
      const reqUrlParsed = new URL(req.url, base);
      const originalPathParsed = new URL(originalPath, base);
      reqUrlParsed.pathname = originalPathParsed.pathname;
      url = reqUrlParsed.toString();
    } catch (e) {
      url = `${protocol}://${host}${originalPath}`;
    }

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