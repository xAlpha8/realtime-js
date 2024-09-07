import { useNavigate } from "react-router-dom";

export function RealtimeExamples() {
  const navigate = useNavigate();

  const data = [
    {
      title: "WebRTC",
      description: "See an example of WebRTC in action.",
      link: "/webrtc",
    },
    {
      title: "Web Socket",
      description: "See an example of Web Socket in action.",
      link: "/websocket",
    },
  ];

  return (
    <div className="flex-1 h-full">
      <div className="font-bold mb-4 text-xl">Examples</div>
      <div className="flex flex-wrap gap-4">
        {data.map((item) => (
          <div
            className="border max-w-[220px] p-4 rounded hover:bg-slate-50 cursor-pointer"
            key={item.title}
            onClick={() => navigate(item.link)}
          >
            <div className="font-bold">{item.title}</div>
            <div>{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
