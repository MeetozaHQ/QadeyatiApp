import server from "../dist/server/index.js";

export default async function handler(request, context) {
  try {
    return await server.fetch(request, {}, context);
  } catch (err) {
    console.error("Vercel Serverless function error:", err);
    return new Response("Internal Server Error: " + err.message, { status: 500 });
  }
}
