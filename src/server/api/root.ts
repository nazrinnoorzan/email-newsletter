import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { subscriberRouter } from "~/server/api/routers/subscriber";
import { segmentRouter } from "./routers/segment";
import { composeRouter } from "./routers/compose";
import { mailRouter } from "./routers/mail";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  subscriber: subscriberRouter,
  segment: segmentRouter,
  compose: composeRouter,
  mail: mailRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
