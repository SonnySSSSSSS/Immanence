import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { RainbowPresetBreathSceneContent } from './RainbowPresetBreathScene.jsx'

export function RainbowPresetCanvas({ style = {}, breathDriver = null }) {
  return (
    <Canvas
      orthographic
      dpr={[1, 1.25]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 100], zoom: 70 }}
      style={{ ...style, width: '100%', height: '100%', display: 'block' }}
    >
      <color attach="background" args={['#000000']} />
      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom mipmapBlur levels={9} intensity={1.5} luminanceThreshold={1} luminanceSmoothing={1} />
      </EffectComposer>
      <RainbowPresetBreathSceneContent breathDriver={breathDriver} />
    </Canvas>
  )
}
