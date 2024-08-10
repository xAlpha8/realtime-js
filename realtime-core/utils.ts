// Returns a list of all available audio devices.
type TAllUserMedia = {
  videoInputDevices: MediaDeviceInfo[];
  audioInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
};

export async function getAllUserMediaWithoutAskingForPermission(): Promise<TAllUserMedia> {
  const audioInputDevices: MediaDeviceInfo[] = [];
  const audioOutputDevices: MediaDeviceInfo[] = [];
  const videoInputDevices: MediaDeviceInfo[] = [];

  const devices = await navigator.mediaDevices.enumerateDevices();

  for (const device of devices) {
    switch (device.kind) {
      case "audioinput":
        audioInputDevices.push(device);
        break;
      case "audiooutput":
        audioOutputDevices.push(device);
        break;
      case "videoinput":
        videoInputDevices.push(device);
        break;
    }
  }

  function addIndexIfLabelMissing(
    mediaDevices: MediaDeviceInfo[],
    type: string
  ): MediaDeviceInfo[] {
    return mediaDevices.map((device, idx) => {
      const label = device.label ? device.label : `${type} #${idx}`;
      return {
        deviceId: device.deviceId,
        groupId: device.groupId,
        kind: device.kind,
        label,
        toJSON: device.toJSON,
      };
    });
  }

  return {
    audioInputDevices: addIndexIfLabelMissing(audioInputDevices, "Audio Input"),
    audioOutputDevices: addIndexIfLabelMissing(
      audioOutputDevices,
      "Audio Output"
    ),
    videoInputDevices: addIndexIfLabelMissing(videoInputDevices, "Video"),
  };
}

export async function getAllUserMedia(): Promise<TAllUserMedia> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  const devices = await getAllUserMediaWithoutAskingForPermission();

  stream.getTracks().forEach(function (track) {
    track.stop();
  });

  return devices;
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = 3,
  backoff: number = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      // Attempt the fetch request
      const response = await fetch(url, options);

      // If the response is ok (status in the range 200-299), return it
      if (response.ok) {
        return response;
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      // If this was the last attempt, rethrow the error
      if (i === retries - 1) {
        let msg = "Unknown";

        if (error instanceof Error) {
          msg = error.message;
        }

        throw new Error(`Fetch failed after ${retries} attempts: ${msg}`);
      }

      // Otherwise, wait for the backoff time before retrying
      await new Promise((resolve) => setTimeout(resolve, backoff));

      // Exponentially increase the backoff time
      backoff *= 2;
    }
  }

  // This line should never be reached, but TypeScript requires a return type
  throw new Error("Unexpected error");
}
