import server from "../dist/server/server.js";

export const config = {
  runtime: "edge",
};

export default async function handler(request, context) {
  try {
    return await server.fetch(request, {}, context);
  } catch (err) {
    console.error("Vercel Edge function error:", err);
    return new Response("Internal Server Error: " + err.message, { status: 500 });
  }
}
