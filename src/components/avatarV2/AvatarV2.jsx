import React from "react";
import { Canvas } from "@react-three/fiber";
import { NebulaLayer } from "./NebulaLayer.jsx";

export function AvatarV2() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <NebulaLayer />
      <Canvas
        gl={{ alpha: true, antialias: true }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
        dpr={[1, 2]}
      >
        {/* Scene will be added next step */}
      </Canvas>
    </div>
  );
}
