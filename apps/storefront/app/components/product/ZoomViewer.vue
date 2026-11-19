<script setup lang="ts">
import type { ProductImage } from '@vovian/types'

const open = defineModel<boolean>({ required: true })
const index = defineModel<number>('index', { required: true })
const props = defineProps<{ images: ProductImage[]; name: string }>()

const panel = ref<HTMLElement | null>(null)
useFocusTrap(panel, open, () => (open.value = false))

const current = computed(() => props.images[index.value])
const origin = ref('50% 50%')
const zoomed = ref(true)

function onMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  origin.value = `${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`
}

function go(delta: number) {
  index.value = (index.value + delta + props.images.length) % props.images.length
}

function onKey(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'ArrowRight') go(document.dir === 'rtl' ? -1 : 1)
  if (e.key === 'ArrowLeft') go(document.dir === 'rtl' ? 1 : -1)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition-opacity duration-300" leave-active-class="transition-opacity duration-200" enter-from-class="opacity-0" leave-to-class="opacity-0">
      <div v-if="open && current" ref="panel" role="dialog" aria-modal="true" :aria-label="$t('product.zoomTitle', { name })" class="fixed inset-0 z-[75] bg-white">
        <!-- Pointer devices: hover-pan zoom. Touch: native scroll of a 2× image. -->
        <div
          class="absolute inset-0 overflow-auto [@media(hover:hover)]:overflow-hidden"
          :class="zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'"
          @pointermove="onMove"
          @click="zoomed = !zoomed"
        >
          <NuxtImg
            :src="current.url"
            :alt="current.alt || name"
            sizes="xs:100vw lg:100vw 2xl:100vw"
            class="h-full w-full object-contain transition-transform duration-300 ease-[var(--ease-couture)] [@media(hover:none)]:h-auto [@media(hover:none)]:w-[200%] [@media(hover:none)]:max-w-none"
            :style="{ transformOrigin: origin, transform: zoomed ? 'scale(2.2)' : 'scale(1)' }"
          />
        </div>
        <button type="button" class="absolute end-3 top-3 grid size-12 place-items-center bg-white cursor-pointer" :aria-label="$t('common.close')" @click="open = false">
          <VIcon name="close" />
        </button>
        <div v-if="images.length > 1" class="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3">
          <button type="button" class="grid size-12 place-items-center bg-white cursor-pointer" :aria-label="$t('product.previousImage')" @click="go(-1)">
            <VIcon name="chevron-left" />
          </button>
          <span class="bg-white px-3 py-2 text-[13px] tabular-nums">{{ index + 1 }} / {{ images.length }}</span>
          <button type="button" class="grid size-12 place-items-center bg-white cursor-pointer" :aria-label="$t('product.nextImage')" @click="go(1)">
            <VIcon name="chevron-right" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
