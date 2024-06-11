import { z } from "zod";

export const ConfigSchema = z.object({
  functionUrl: z.string().optional(),
  offerUrl: z.string().optional(),
  isVideoEnabled: z.boolean(),
  videoCodec: z.enum(["default", "VP8/90000", "H264/90000"]),
  videoTransform: z.enum(["none", "edges", "cartoon", "rotate"]),
  videoResolution: z.string(),
  videoInput: z.string(),
  isAudioEnabled: z.boolean(),
  audioCodec: z.enum(["default", "opus/48000/2", "PCMU/8000", "PCMA/8000"]),
  audioInput: z.string(),
  isScreenShareEnabled: z.boolean(),
  isDataEnabled: z.boolean(),
  dataParameters: z.record(z.any()),
  useStun: z.boolean()
});

export type Config = z.infer<typeof ConfigSchema>;

export const RtTrackSchema = z.object({
  kind: z.enum(["video", "audio"]),
  track: z.instanceof(MediaStreamTrack),
  stream: z.instanceof(MediaStream)
})

export type RtTrack = z.infer<typeof RtTrackSchema>;

export const ChatMessageSchema = z.object({
    content: z.string(),
    role: z.enum(["assistant", "user"]),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export type DeviceOptions = { value: string; label: string }