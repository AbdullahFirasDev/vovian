/** A small, size-capped list persisted in localStorage (recently viewed, search history). */
export function useLocalList(key: string, max = 12) {
  const items = useState<string[]>(`local-list:${key}`, () => [])
  const loaded = useState<boolean>(`local-list-loaded:${key}`, () => false)

  function load() {
    if (!import.meta.client || loaded.value) return
    try {
      const raw = localStorage.getItem(key)
      items.value = raw ? (JSON.parse(raw) as string[]).filter((v) => typeof v === 'string').slice(0, max) : []
    } catch {
      items.value = []
    }
    loaded.value = true
  }

  function persist() {
    try {
      localStorage.setItem(key, JSON.stringify(items.value))
    } catch {
      /* storage unavailable (private mode) — keep in memory */
    }
  }

  function push(value: string) {
    load()
    items.value = [value, ...items.value.filter((v) => v !== value)].slice(0, max)
    persist()
  }

  function remove(value: string) {
    items.value = items.value.filter((v) => v !== value)
    persist()
  }

  function clear() {
    items.value = []
    persist()
  }

  if (import.meta.client) onMounted(load)

  return { items, push, remove, clear, load }
}

export const useRecentlyViewed = () => useLocalList('vovian:recent', 12)
export const useSearchHistory = () => useLocalList('vovian:searches', 6)
