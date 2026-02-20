import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { setPremiumStatus } from "./lib/db";

const app = new Hono();

app.use("*", cors());

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.post("/stripe-webhook", async (c) => {
  try {
    const body = await c.req.json();
    console.log("Stripe webhook received:", body.type);

    if (body.type === "checkout.session.completed" || body.type === "payment_intent.succeeded") {
      const session = body.data?.object;
      const customerEmail = session?.customer_email || session?.customer_details?.email || session?.receipt_email;
      const sessionId = session?.id || "";

      console.log("Payment successful for email:", customerEmail, "session:", sessionId);

      if (customerEmail) {
        const success = await setPremiumStatus(customerEmail, true, sessionId);
        console.log("Premium status set:", success);
        return c.json({ received: true, premium_set: success });
      } else {
        console.error("No customer email found in webhook payload");
        return c.json({ received: true, error: "no_email" }, 200);
      }
    }

    return c.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return c.json({ received: true, error: "processing_error" }, 200);
  }
});

export default app;
