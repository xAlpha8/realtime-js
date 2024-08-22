import { vi } from "vitest";

export type TUserDevice = {
  deviceId: string;
  kind: "videoinput" | "audioinput" | "audiooutput";
  label: string;
};

export type TGetNavigatorOptions = {
  /**
   * User devices to return
   */
  userDevices?: TUserDevice[];
  /**
   * Screen devices to return
   */
  screenDevices?: TUserDevice[];
};

export const MOCK_AUDIO_INPUT_DEVICE: TUserDevice = {
  deviceId: "audio1",
  kind: "audioinput",
  label: "AudioInput 1",
};

export const MOCK_VIDEO_INPUT_DEVICE: TUserDevice = {
  deviceId: "video1",
  kind: "videoinput",
  label: "Camera 1",
};

export const MOCK_SCREEN_INPUT_DEVICE: TUserDevice = {
  deviceId: "screen1",
  kind: "videoinput",
  label: "Screen 1",
};

export function makeStreamFromUserDevices(userDevices: TUserDevice[]) {
  const tracks = userDevices.map((device) => ({
    kind: device.kind.includes("audio") ? "audio" : "video",
  }));

  return {
    getTracks: vi.fn(() => tracks),
  };
}

export function getNavigator(options = {} as TGetNavigatorOptions) {
  const { userDevices = [], screenDevices = [] } = options;

  return {
    mediaDevices: {
      getUserMedia: vi.fn(() =>
        Promise.resolve(makeStreamFromUserDevices(userDevices))
      ),
      getDisplayMedia: vi.fn(() =>
        Promise.resolve(makeStreamFromUserDevices(screenDevices))
      ),
      enumerateDevices: vi.fn(() => Promise.resolve(userDevices)),
    },
  };
}
