import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../shared/db-types";
import * as db from "../db";
import { ENV } from "./env";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    if (ENV.devAuthBypass) {
      const openId = "local-dev-user";
      await db.upsertUser({
        openId,
        name: "Local Dev User",
        email: "local-dev@example.com",
        loginMethod: "local",
        lastSignedIn: new Date(),
      });
      user = (await db.getUserByOpenId(openId)) ?? null;
    } else {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
