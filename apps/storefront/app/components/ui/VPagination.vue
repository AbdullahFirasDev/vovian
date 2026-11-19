<script setup lang="ts">
const props = defineProps<{ page: number; total: number; perPage: number }>()
const emit = defineEmits<{ change: [page: number] }>()
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)))

const visible = computed(() => {
  const n = pages.value, p = props.page
  const set = new Set([1, n, p - 1, p, p + 1].filter((x) => x >= 1 && x <= n))
  const list = [...set].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  list.forEach((x, i) => {
    if (i && x - list[i - 1]! > 1) out.push('…')
    out.push(x)
  })
  return out
})
</script>

<template>
  <nav v-if="pages > 1" :aria-label="$t('catalog.pagination')" class="flex items-center justify-center gap-1">
    <button
      type="button"
      class="grid size-11 place-items-center disabled:opacity-30 cursor-pointer"
      :disabled="page <= 1"
      :aria-label="$t('catalog.previousPage')"
      @click="emit('change', page - 1)"
    >
      <VIcon name="chevron-left" :size="18" />
    </button>
    <template v-for="(p, i) in visible" :key="i">
      <span v-if="p === '…'" class="px-2 text-graphite">…</span>
      <button
        v-else
        type="button"
        class="grid size-11 place-items-center text-[14px] tabular-nums cursor-pointer"
        :class="p === page ? 'border-b border-ink' : 'text-graphite hover:text-ink'"
        :aria-current="p === page ? 'page' : undefined"
        @click="emit('change', p)"
      >
        {{ p }}
      </button>
    </template>
    <button
      type="button"
      class="grid size-11 place-items-center disabled:opacity-30 cursor-pointer"
      :disabled="page >= pages"
      :aria-label="$t('catalog.nextPage')"
      @click="emit('change', page + 1)"
    >
      <VIcon name="chevron-right" :size="18" />
    </button>
  </nav>
</template>
