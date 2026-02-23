// Literal port of sandbox Effects.js
// Uses three/examples postprocessing (EffectComposer, RenderPass, UnrealBloomPass, WaterPass).
// Adapted for R3F v8: passes added imperatively via addPass instead of deprecated attachArray.
import * as THREE from 'three'
import { useRef, useMemo, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js'
import { WaterPass } from './post/Waterpass.js'

export default function Effects() {
  const composer = useRef()
  const rgbShiftRef = useRef(null)
  const { scene, gl, size, camera } = useThree()
  const aspect = useMemo(() => new THREE.Vector2(512, 512), [])

  useEffect(() => {
    const c = new EffectComposer(gl)
    const renderPass = new RenderPass(scene, camera)

    // Water ripple distortion (subtle but gives the “alive” shimmer behind glow).
    const waterPass = new WaterPass()
    waterPass.uniforms.factor.value = 1.5

    // Big glow, like the reference sandbox: strength=2, radius=1, threshold=0.
    const bloomPass = new UnrealBloomPass(aspect, 1.8, 1.0, 0.0)

    // Chromatic aberration (RGB shift). Keep small to avoid nausea/blur.
    const rgbShift = new ShaderPass(RGBShiftShader)
    rgbShift.uniforms.amount.value = 0.0018
    rgbShift.uniforms.angle.value = 0.0
    rgbShiftRef.current = rgbShift

    c.addPass(renderPass)
    c.addPass(waterPass)
    c.addPass(bloomPass)
    c.addPass(rgbShift)
    c.setSize(size.width, size.height)
    composer.current = c
    return () => { c.dispose() }
  }, [scene, gl, camera]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    composer.current?.setSize(size.width, size.height)
  }, [size])

  useFrame((state) => {
    // Micro-animate CA angle for a slight prismatic shimmer.
    if (rgbShiftRef.current) {
      rgbShiftRef.current.uniforms.angle.value = state.clock.elapsedTime * 0.15
    }
    composer.current?.render(state.clock.getDelta())
  }, 1)
  return null
}
