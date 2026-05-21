console.log("router.tsx: Module loaded");
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  console.log("router.tsx: getRouter() called");
  const queryClient = new QueryClient();

  console.log("router.tsx: Creating router instance with route tree...");
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  console.log("router.tsx: Router instance successfully created!");
  return router;
};
