import "@react-three/fiber";
import "r3f-stage/styles.css";
import { Application, FlatStage } from "r3f-stage";

function Thingy() {
  return (
    <mesh position-y={1.5} castShadow>
      <icosahedronGeometry />
      <meshStandardMaterial color="hotpink" metalness={0.4} roughness={0.3} />
    </mesh>
  );
}

export default function App() {
  return (
    <Application>
      <FlatStage>
        <Thingy />
      </FlatStage>
    </Application>
  );
}
