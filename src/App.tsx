console.log("App.tsx: Module loaded");
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

console.log("App.tsx: Initializing router...");
const router = getRouter();

export default function App() {
  console.log("App.tsx: Rendering App component");
  return <RouterProvider router={router} />;
}
