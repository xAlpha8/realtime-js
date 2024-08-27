import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { AvatarMesh } from "./AvatarMesh";

export function RealtimeAvatar() {
  return (
    <Canvas>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
      <AvatarMesh />
      <OrbitControls makeDefault />
    </Canvas>
  );
}
