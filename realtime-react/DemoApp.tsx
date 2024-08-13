import "./index.css";
import { PageContainer } from "./components/PageContainer";
import { Video } from "./components/Video";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { Chat } from "./components/Chat";
import { Settings } from "./components/Settings";

export function DemoApp() {
  return (
    <PageContainer>
      <Video />
      <AudioVisualizer />
      <Chat />
      <Settings />
    </PageContainer>
  );
}
