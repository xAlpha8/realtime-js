import { test, describe, expect, beforeAll, afterAll, vi } from "vitest";
import {
  MOCK_AUDIO_INPUT_DEVICE,
  MOCK_VIDEO_INPUT_DEVICE,
  MockedRTCPeerConnection,
  MockedRTCSessionDescription,
  getMockedNavigator,
} from "../../__mocks__";
import { createConfig } from "../../create-config";
import { ConsoleLogger } from "../../Logger";
import { getMockedFetch } from "../../__mocks__/MockedFetch.mock";
import { createActor } from "xstate";
import { realtimeConnectionMachine } from "../../machine";

vi.mock("../../utils", async () => {
  const originalFetchWithRetry =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (await vi.importActual("../../utils")).fetchWithRetry as any;

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchWithRetry: async (url: string, options: any, retries: number) => {
      return originalFetchWithRetry(url, options, retries, 10);
    },
    isAValidRTCSessionDescription: () => true,
  };
});

describe("The RealtimeConnection Machine", () => {
  beforeAll(() => {
    global.MediaStream = vi.fn();
    const navigator = getMockedNavigator({
      userDevices: [MOCK_VIDEO_INPUT_DEVICE, MOCK_AUDIO_INPUT_DEVICE],
    });
    global.navigator = navigator as never;
    global.f = getMockedFetch();
    global.fetch = global.f.fetch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.RTCSessionDescription = MockedRTCSessionDescription as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.RTCPeerConnection = MockedRTCPeerConnection as any;
  });
  test("should be in Init state when created.", async () => {
    const actor = createActor(realtimeConnectionMachine);
    let currentState = "";

    actor.subscribe((snapshot) => {
      currentState = snapshot.value;
    });

    actor.start();
    // In the beginning the state should be Init.
    expect(currentState).toBe("Init");
  });

  test("should not transition to SetupCompleted if no config is provided for the SETUP event.", async () => {
    const actor = createActor(realtimeConnectionMachine);
    let currentState = "";

    actor.subscribe((snapshot) => {
      currentState = snapshot.value;
    });

    actor.start();
    // In the beginning the state should be Init.
    expect(currentState).toBe("Init");

    // If we try to send "SETUP_CONNECTION" without a payload then it
    // should transition to next state.
    // @ts-expect-error Intentionally not passing a payload.
    actor.send({ type: "SETUP_CONNECTION" });
    expect(currentState).not.toBe("SetupCompleted");

    // It should state at Init
    expect(currentState).toBe("Init");
  });

  test("should not transition to Connecting state if setup is not completed.", async () => {
    const actor = createActor(realtimeConnectionMachine);
    let currentState = "";

    actor.subscribe((snapshot) => {
      currentState = snapshot.value;
    });

    actor.start();
    // In the beginning the state should be Init.
    expect(currentState).toBe("Init");

    actor.send({ type: "CONNECT" });
    expect(currentState).not.toBe("Connecting");

    // It should state at Init
    expect(currentState).toBe("Init");
  });

  test("should be transition to SetupCompleted if config is provided.", async () => {
    const config = createConfig({
      functionURL: "https://infra.adapt.ai",
      audioDeviceId: "123",
      videoDeviceId: "123",
    });

    const actor = createActor(realtimeConnectionMachine);
    let currentState = "";

    actor.subscribe((snapshot) => {
      currentState = snapshot.value;
    });

    actor.start();
    // In the beginning the state should be Init.
    expect(currentState).toBe("Init");

    // If we pass the payload then it should transition to "SetupCompleted"
    actor.send({ type: "SETUP_CONNECTION", payload: { config } });
    expect(currentState).toBe("SetupCompleted");
  });

  test(
    "should able to connect if current config is provided.",
    async () => {
      const config = createConfig({
        functionURL: "https://infra.adapt.ai",
        audioDeviceId: "123",
        videoDeviceId: "123",
        logger: ConsoleLogger.getLogger(),
      });

      const actor = createActor(realtimeConnectionMachine);
      let currentState = "";

      actor.subscribe((snapshot) => {
        currentState = snapshot.value;
      });

      actor.start();
      // In the beginning the state should be Init.
      expect(currentState).toBe("Init");

      // If we pass the payload then it should transition to "SetupCompleted"
      actor.send({ type: "SETUP_CONNECTION", payload: { config } });
      expect(currentState).toBe("SetupCompleted");

      actor.send({ type: "CONNECT" });
      expect(currentState).toBe("Connecting");
    },
    { timeout: 30000 }
  );

  afterAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).navigator;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).MediaStream;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).fetch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).f;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).RTCSessionDescription;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).RTCPeerConnection;
  });
});
