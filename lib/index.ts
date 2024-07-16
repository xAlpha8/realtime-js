import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://afba42ddba0814d242e43bde206c47b4@o4506805333983232.ingest.us.sentry.io/4507609006538752",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

import { useConfig } from "./hooks/useConfig";
import { useRealtime } from "./hooks/useRealtime";
import { RtVideo } from "./components/rtvideo";
import { RtAudio } from "./components/rtaudio";
import { RtAudioVisualizer } from "./components/rtaudiovisualizer";
import { RtChat } from "./components/rtchat";
import { Config } from "./hooks/types";
import { devAudio, devChat, devVideo } from "./components/devComponents";

export { useConfig, useRealtime };
export { RtAudio, RtVideo, RtChat, RtAudioVisualizer };
export type { Config };
export { devAudio, devVideo, devChat };
