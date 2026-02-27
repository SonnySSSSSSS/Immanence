import * as THREE from 'three'
import { useRef, useCallback, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Beam } from './Beam.jsx'
import { Rainbow } from './Rainbow.jsx'
import { YinYang } from './YinYang.jsx'
import { Flare } from './Flare.jsx'
import { Box } from './Box.jsx'
import { calculateRefractionAngle, lerp, lerpV3 } from './util'

export function RainbowPresetBreathSceneContent({ breathDriver = null }) {
  const [isPrismHit, hitPrism] = useState(false)
  const flare = useRef(null)
  const ambient = useRef(null)
  const spot = useRef(null)
  const boxreflect = useRef(null)
  const rainbow = useRef(null)

  const rayOut = useCallback(() => hitPrism(false), [])
  const rayOver = useCallback((e) => {
    e.stopPropagation()
    hitPrism(true)
    rainbow.current.material.speed = 1
    rainbow.current.material.emissiveIntensity = 20
  }, [])

  const vec = new THREE.Vector3()
  const rayMove = useCallback(({ api, position, direction, normal }) => {
    if (!normal) return
    vec.toArray(api.positions, api.number++ * 3)
    flare.current.position.set(position.x, position.y, -0.5)
    flare.current.rotation.set(0, 0, -Math.atan2(direction.x, direction.y))
    let angleScreenCenter = Math.atan2(-position.y, -position.x)
    const normalAngle = Math.atan2(normal.y, normal.x)
    const incidentAngle = angleScreenCenter - normalAngle
    const refractionAngle = calculateRefractionAngle(incidentAngle) * 6
    angleScreenCenter += refractionAngle
    rainbow.current.rotation.z = angleScreenCenter
    lerpV3(spot.current.target.position, [Math.cos(angleScreenCenter), Math.sin(angleScreenCenter), 0], 0.05)
    spot.current.target.updateMatrixWorld()
  }, [])

  useFrame((state) => {
    const timerProgress01 =
      breathDriver?.cycleProgress01 != null
        ? Math.max(0, Math.min(1, breathDriver.cycleProgress01))
        : ((state.clock.elapsedTime * 0.08) % 1)
    const angle = timerProgress01 * Math.PI * 2 - Math.PI / 2
    const orbitRadius = Math.min(state.viewport.width, state.viewport.height) * 0.42
    const autoRayOrigin = [Math.cos(angle) * orbitRadius, Math.sin(angle) * orbitRadius, 0]
    boxreflect.current.setRay(autoRayOrigin, [0, -0.5, 0])

    lerp(rainbow.current.material, 'emissiveIntensity', isPrismHit ? 2.5 : 0, 0.1)
    spot.current.intensity = rainbow.current.material.emissiveIntensity
    lerp(ambient.current, 'intensity', 0, 0.025)
  })

  return (
    <>
      <ambientLight ref={ambient} intensity={0} />
      <pointLight position={[10, -10, 0]} intensity={0.05} />
      <pointLight position={[0, 10, 0]} intensity={0.05} />
      <pointLight position={[-10, 0, 0]} intensity={0.05} />
      <spotLight ref={spot} intensity={1} distance={7} angle={1} penumbra={1} position={[0, 0, 1]} />
      <Beam ref={boxreflect} bounce={10} far={20}>
        <YinYang position={[0, -0.5, 0]} onRayOver={rayOver} onRayOut={rayOut} onRayMove={rayMove} />
        <Box position={[2.25, -3.5, 0]} rotation={[0, 0, Math.PI / 3.5]} />
        <Box position={[-2.5, -2.5, 0]} rotation={[0, 0, Math.PI / 4]} />
        <Box position={[-3, 1, 0]} rotation={[0, 0, Math.PI / 4]} />
      </Beam>
      <Rainbow ref={rainbow} startRadius={0} endRadius={0.5} fade={0} />
      <Flare ref={flare} visible={isPrismHit} renderOrder={10} scale={1.25} streak={[12.5, 20, 1]} />
    </>
  )
}
