<script setup lang="ts">
import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector2, WebGLRenderer, type Texture } from 'three'

/**
 * Campaign "lens": the photograph is shown in black & white; a soft circular
 * lens follows the pointer and reveals the original colour with a faint
 * ripple at its edge. Renders only while on screen; falls back to the static
 * monochrome image underneath if WebGL or the texture is unavailable.
 */
const props = defineProps<{ src: string }>()
const host = ref<HTMLElement | null>(null)
const ready = ref(false)

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`
const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2 uMouse;
  uniform vec2 uViewport;
  uniform vec2 uImage;
  uniform float uStrength;
  uniform float uTime;
  varying vec2 vUv;

  vec2 coverUv(vec2 uv) {
    float rv = uViewport.x / uViewport.y;
    float ri = uImage.x / uImage.y;
    vec2 scale = rv > ri ? vec2(1.0, ri / rv) : vec2(rv / ri, 1.0);
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 aspect = vec2(uViewport.x / uViewport.y, 1.0);
    vec2 d = (vUv - uMouse) * aspect;
    float dist = length(d);
    float radius = 0.24;
    float mask = smoothstep(radius, radius * 0.35, dist) * uStrength;
    float ripple = sin(dist * 46.0 - uTime * 2.4) * 0.0035 * smoothstep(radius * 1.25, radius * 0.6, dist) * uStrength;
    vec2 uv = coverUv(vUv + normalize(d + 1e-5) * ripple);
    vec3 color = texture2D(uTex, uv).rgb;
    float grey = dot(color, vec3(0.2126, 0.7152, 0.0722));
    vec3 mono = vec3(grey) * 0.92;
    gl_FragColor = vec4(mix(mono, color, mask), 1.0);
  }
`

let renderer: WebGLRenderer | null = null
let material: ShaderMaterial | null = null
let texture: Texture | null = null
let frame = 0
let visible = false
let observer: IntersectionObserver | null = null
const target = new Vector2(0.5, 0.5)
const current = new Vector2(0.5, 0.5)
let strengthTarget = 0
let strength = 0
const start = performance.now()

function resize() {
  if (!renderer || !host.value || !material) return
  const { clientWidth: w, clientHeight: h } = host.value
  renderer.setSize(w, h, false)
  material.uniforms.uViewport!.value.set(w, h)
}

function onPointer(e: PointerEvent) {
  const rect = host.value!.getBoundingClientRect()
  target.set((e.clientX - rect.left) / rect.width, 1 - (e.clientY - rect.top) / rect.height)
  strengthTarget = 1
}
function onLeave() {
  strengthTarget = 0
}

function loop() {
  frame = requestAnimationFrame(loop)
  if (!visible || !renderer || !material) return
  current.lerp(target, 0.08)
  strength += (strengthTarget - strength) * 0.06
  material.uniforms.uMouse!.value.copy(current)
  material.uniforms.uStrength!.value = strength
  material.uniforms.uTime!.value = (performance.now() - start) / 1000
  renderer.render(scene, camera)
}

const scene = new Scene()
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

onMounted(() => {
  const el = host.value
  if (!el) return
  try {
    renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' })
  } catch {
    return
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.domElement.setAttribute('aria-hidden', 'true')
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  el.appendChild(renderer.domElement)

  const url = new URL(props.src)
  url.searchParams.set('w', '1920')
  url.searchParams.set('q', '80')
  url.searchParams.set('auto', 'format')
  const loader = new TextureLoader()
  loader.setCrossOrigin('anonymous')
  loader.load(
    url.toString(),
    (tex) => {
      texture = tex
      tex.colorSpace = SRGBColorSpace
      material = new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTex: { value: tex },
          uMouse: { value: current.clone() },
          uViewport: { value: new Vector2(el.clientWidth, el.clientHeight) },
          uImage: { value: new Vector2(tex.image.width, tex.image.height) },
          uStrength: { value: 0 },
          uTime: { value: 0 },
        },
      })
      scene.add(new Mesh(new PlaneGeometry(2, 2), material))
      resize()
      ready.value = true
    },
    undefined,
    () => {
      /* texture blocked — keep the static fallback */
    },
  )

  observer = new IntersectionObserver(([entry]) => (visible = !!entry?.isIntersecting))
  observer.observe(el)
  const section = el.parentElement ?? el
  section.addEventListener('pointermove', onPointer)
  section.addEventListener('pointerleave', onLeave)
  window.addEventListener('resize', resize)
  loop()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  const section = host.value?.parentElement
  section?.removeEventListener('pointermove', onPointer)
  section?.removeEventListener('pointerleave', onLeave)
  window.removeEventListener('resize', resize)
  material?.dispose()
  texture?.dispose()
  renderer?.dispose()
  renderer?.forceContextLoss()
})
</script>

<template>
  <div ref="host" class="transition-opacity duration-1000" :class="ready ? 'opacity-100' : 'opacity-0'" />
</template>
