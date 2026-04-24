import { defineConfig } from "@trigger.dev/sdk/v3";
// import { env } from "@/env";

export default defineConfig({
  // project: env.TRIGGER_PROJECT,
  project: "proj_vaqzcpxtjwtxijppnrhu",
  runtime: "node",
  logLevel: "log",
  maxDuration: 600, // 10 minutes in seconds
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10_000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
  build: {
    external: ["mupdf"],
  },
});
