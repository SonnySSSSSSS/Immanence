import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { RainbowPresetBreathSceneContent } from './RainbowPresetBreathScene.jsx'

export function RainbowPresetCanvas({ style = {}, breathDriver = null, quality = 'default' }) {
  const isReducedQuality = quality === 'stillness';
  const dpr = isReducedQuality ? [1, 1] : [1, 1.25];
  const bloomLevels = isReducedQuality ? 6 : 9;
  const bloomIntensity = isReducedQuality ? 0.45 : 1.5;

  return (
    <Canvas
      orthographic
      dpr={dpr}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 100], zoom: 70 }}
      style={{ ...style, width: '100%', height: '100%', display: 'block' }}
    >
      <color attach="background" args={['#000000']} />
      {bloomIntensity > 0 && (
        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom
            mipmapBlur
            levels={bloomLevels}
            intensity={bloomIntensity}
            luminanceThreshold={1}
            luminanceSmoothing={1}
          />
        </EffectComposer>
      )}
      <RainbowPresetBreathSceneContent breathDriver={breathDriver} quality={quality} />
    </Canvas>
  )
}
