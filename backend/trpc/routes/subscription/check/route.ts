import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { getPremiumStatus } from "@/backend/lib/db";

export default publicProcedure
  .input(z.object({ email: z.string().email() }))
  .query(async ({ input }) => {
    console.log("Checking premium status for:", input.email);
    const isPremium = await getPremiumStatus(input.email);
    console.log("Premium status:", isPremium);
    return { isPremium };
  });
