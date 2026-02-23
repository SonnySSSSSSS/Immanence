// Literal port of sandbox Effects.js
// Uses three/examples postprocessing (EffectComposer, RenderPass, UnrealBloomPass, WaterPass).
// Adapted for R3F v8: passes added imperatively via addPass instead of deprecated attachArray.
import * as THREE from 'three'
import { useRef, useMemo, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

export default function Effects() {
  const composer = useRef()
  const { scene, gl, size, camera } = useThree()
  const aspect = useMemo(() => new THREE.Vector2(512, 512), [])

  useEffect(() => {
    const c = new EffectComposer(gl)
    const renderPass = new RenderPass(scene, camera)
    const bloomPass = new UnrealBloomPass(aspect, 0.8, 0.5, 0.72)
    c.addPass(renderPass)
    c.addPass(bloomPass)
    c.setSize(size.width, size.height)
    composer.current = c
    return () => { c.dispose() }
  }, [scene, gl, camera]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    composer.current?.setSize(size.width, size.height)
  }, [size])

  useFrame(() => composer.current?.render(), 1)
  return null
}
