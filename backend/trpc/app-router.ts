import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import subscriptionCheckRoute from "./routes/subscription/check/route";
import subscriptionSetRoute from "./routes/subscription/set/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  subscription: createTRPCRouter({
    check: subscriptionCheckRoute,
    set: subscriptionSetRoute,
  }),
});

export type AppRouter = typeof appRouter;
