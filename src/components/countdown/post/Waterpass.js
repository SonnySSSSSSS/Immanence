// Ported from pmndrs/particle-text sandbox
import * as THREE from 'three'
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js'

export class WaterPass extends Pass {
  constructor() {
    super()
    const shader = {
      uniforms: {
        tDiffuse: { value: null },
        time:     { value: 0.0 },
        factor:   { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float factor;
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
          vec2 uv = vUv;
          float y = uv.y * 2.0 - 1.0;
          float x = uv.x * 2.0 - 1.0;
          float len = sqrt(x * x + y * y);
          uv.x += cos(len * 12.0 - time * 4.0) * factor * 0.01 / (len + 1.0);
          uv.y += cos(len * 12.0 - time * 4.0) * factor * 0.01 / (len + 1.0);
          gl_FragColor = texture2D( tDiffuse, uv );
        }
      `,
    }
    this.uniforms = THREE.UniformsUtils.clone(shader.uniforms)
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
    })
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.scene = new THREE.Scene()
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null)
    this.quad.frustumCulled = false
    this.scene.add(this.quad)
    this.needsSwap = true
    this.renderToScreen = false
  }

  render(renderer, writeBuffer, readBuffer, deltaTime) {
    this.uniforms['tDiffuse'].value = readBuffer.texture
    this.uniforms['time'].value += deltaTime
    this.quad.material = this.material
    if (this.renderToScreen) {
      renderer.setRenderTarget(null)
    } else {
      renderer.setRenderTarget(writeBuffer)
    }
    renderer.render(this.scene, this.camera)
  }
}
