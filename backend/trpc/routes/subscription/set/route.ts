import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { setPremiumStatus } from "@/backend/lib/db";

export default publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      isPremium: z.boolean(),
      stripeSessionId: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("Setting premium status for:", input.email, "to:", input.isPremium);
    const success = await setPremiumStatus(input.email, input.isPremium, input.stripeSessionId);
    return { success };
  });
