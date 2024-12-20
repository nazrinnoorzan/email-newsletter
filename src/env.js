import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z
      .string()
      .refine(
        (str) => !str.includes("YOUR_MYSQL_URL_HERE"),
        "You forgot to change the default URL",
      ),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string() : z.string().url(),
    ),
    NEXTAUTH_EMAIL: z.string().email("This is not a valid email."),
    NEXTAUTH_PASSWORD: z.string(),
    SES_ACCESS_KEY: z.string(),
    SES_SECRET_KEY: z.string(),
    SES_REGION: z.string(),
    SES_EMAIL_SENDER: z.string(),
    SES_EMAIL_RETURN: z.string(),
    SQS_QUEUE_URL: z.string(),
    X_API_KEY: z.string(),
    SCHEDULE_LAMBDA: z.string(),
    SCHEDULE_ROLE: z.string(),
    S3_BUCKET_NAME: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_EMAIL: process.env.NEXTAUTH_EMAIL,
    NEXTAUTH_PASSWORD: process.env.NEXTAUTH_PASSWORD,
    SES_ACCESS_KEY: process.env.SES_ACCESS_KEY,
    SES_SECRET_KEY: process.env.SES_SECRET_KEY,
    SES_REGION: process.env.SES_REGION,
    SES_EMAIL_SENDER: process.env.SES_EMAIL_SENDER,
    SES_EMAIL_RETURN: process.env.SES_EMAIL_RETURN,
    SQS_QUEUE_URL: process.env.SQS_QUEUE_URL,
    X_API_KEY: process.env.X_API_KEY,
    SCHEDULE_LAMBDA: process.env.SCHEDULE_LAMBDA,
    SCHEDULE_ROLE: process.env.SCHEDULE_ROLE,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
