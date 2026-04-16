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
  const openId = "local-dev-user";
  
  // Ensure the local dev user exists in the database
  await db.upsertUser({
    openId,
    name: "Local Dev User",
    email: "local-dev@example.com",
    loginMethod: "local",
    lastSignedIn: new Date(),
  });
  
  const user = (await db.getUserByOpenId(openId)) ?? null;

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
