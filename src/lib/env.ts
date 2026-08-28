import { z } from "zod";

/**
 * Environment access, split into two surfaces:
 *
 *  • `publicEnv` — NEXT_PUBLIC_* only. Safe to read from browser code.
 *  • `env`       — server secrets. Validated lazily on first property access
 *                  so that merely importing this module from a file that also
 *                  ends up in the client graph can never throw (or hint at a
 *                  secret's existence). Reading it in the browser throws.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1, "NEXT_PUBLIC_SANITY_PROJECT_ID is required"),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1, "NEXT_PUBLIC_SANITY_DATASET is required"),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1, "NEXT_PUBLIC_RAZORPAY_KEY_ID is required"),
});

const serverSchema = publicSchema.extend({
  SANITY_API_TOKEN: z.string().min(1, "SANITY_API_TOKEN is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, "RAZORPAY_WEBHOOK_SECRET is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

// Next.js inlines NEXT_PUBLIC_* at build time, so these must be referenced as
// static property accesses rather than via a computed key.
const rawPublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
};

const publicResult = publicSchema.safeParse(rawPublicEnv);

if (!publicResult.success) {
  // Surface the misconfiguration loudly in logs, but do not hard-crash the
  // render — a missing public var should not white-screen the storefront.
  console.error(
    "❌ Invalid public environment variables:",
    publicResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
  );
}

export const publicEnv: PublicEnv = (publicResult.success
  ? publicResult.data
  : {
      NEXT_PUBLIC_SUPABASE_URL: rawPublicEnv.NEXT_PUBLIC_SUPABASE_URL ?? "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: rawPublicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      NEXT_PUBLIC_SANITY_PROJECT_ID: rawPublicEnv.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "",
      NEXT_PUBLIC_SANITY_DATASET: rawPublicEnv.NEXT_PUBLIC_SANITY_DATASET ?? "",
      NEXT_PUBLIC_RAZORPAY_KEY_ID: rawPublicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
    }) as PublicEnv;

let cachedServerEnv: ServerEnv | null = null;

function loadServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;

  if (typeof window !== "undefined") {
    throw new Error("Server environment variables are not available in the browser");
  }

  const result = serverSchema.safeParse({
    ...rawPublicEnv,
    SANITY_API_TOKEN: process.env.SANITY_API_TOKEN,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    console.error(`❌ Invalid server environment variables: ${missing}`);
    throw new Error(`Invalid server environment variables: ${missing}`);
  }

  cachedServerEnv = result.data;
  return cachedServerEnv;
}

/**
 * Server-only secrets. Validation runs on first property read, not on import.
 */
export const env: ServerEnv = new Proxy({} as ServerEnv, {
  get(_target, prop: string) {
    return loadServerEnv()[prop as keyof ServerEnv];
  },
  has(_target, prop: string) {
    return prop in loadServerEnv();
  },
  ownKeys() {
    return Reflect.ownKeys(loadServerEnv());
  },
  getOwnPropertyDescriptor(_target, prop: string) {
    return Reflect.getOwnPropertyDescriptor(loadServerEnv(), prop);
  },
});
