import { z } from "zod";
export const CreditBalance = z.object({
  total: z.number().int(),
  available: z.number().int(),
  pending: z.number().int(),
  currency: z.string().default("usd"),
});
export const LedgerEntry = z.object({
  id: z.string(),
  ts: z.string(),
  delta: z.number().int(), // +issue / -consume / +admin / -admin
  reason: z.string(),
  ref: z.object({ kind: z.string(), id: z.string() }).optional(),
});
export const BalanceResponse = z.object({
  balance: CreditBalance, ledger: z.array(LedgerEntry)
});
export const AdjustRequest = z.object({
  delta: z.number().int(), reason: z.string().min(1)
});
export type TBalanceResponse = z.infer<typeof BalanceResponse>;
export type TAdjustRequest   = z.infer<typeof AdjustRequest>;
