import { TRealtimeConnectionMachinePossibleState } from "../realtime-core";

export type TAppHeader = {
  status: keyof TRealtimeConnectionMachinePossibleState;
  onDisconnect?: () => void;
};

export function AppHeader(props: TAppHeader) {
  const { status, onDisconnect } = props;

  return (
    <div className="p-4 flex justify-between">
      <div className="flex items-center">
        <h3 className="font-bold">Adapt Playground</h3>
        {status === "Connecting" && (
          <div className="flex items-center ml-2 border px-2 rounded-[4px] overflow-hidden text-yellow-900">
            <div className="h-2 w-2 rounded-full bg-yellow-300 mr-2"></div>
            <span>{status}</span>
          </div>
        )}
        {status === "Connected" && (
          <div className="flex items-center ml-2 border px-2 rounded-[4px] overflow-hidden text-green-800">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
            <span>{status}</span>
          </div>
        )}
        {status === "Failed" && (
          <div className="flex items-center ml-2 border px-2 rounded-[4px] overflow-hidden text-red-800">
            <div className="h-2 w-2 rounded-full bg-red-400 mr-2"></div>
            <span>{status}</span>
          </div>
        )}
        {status === "Disconnected" && (
          <div className="flex items-center ml-2 border px-2 rounded-[4px] overflow-hidden text-red-800">
            <div className="h-2 w-2 rounded-full bg-red-400 mr-2"></div>
            <span>{status}</span>
          </div>
        )}
      </div>

      <div>
        {onDisconnect && <button onClick={onDisconnect}>Disconnect</button>}
      </div>
    </div>
  );
}
