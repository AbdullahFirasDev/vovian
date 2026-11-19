import { defineProvider } from '@nuxt/image/runtime'

/**
 * VOVIAN image provider.
 *  - images.unsplash.com (seed imagery): imgix parameters, preserving editorial
 *    params already on the URL (e.g. `sat=-100` for monochrome campaign shots).
 *  - Supabase Storage uploads: render endpoint when transforms are enabled,
 *    otherwise the original object URL.
 *  - Anything else is passed through untouched.
 */
export default defineProvider<{ imageTransforms?: boolean }>({
  getImage(src, { modifiers, imageTransforms }) {
    const width = modifiers.width ? Number(modifiers.width) : undefined
    const height = modifiers.height ? Number(modifiers.height) : undefined
    const quality = modifiers.quality ? Number(modifiers.quality) : 76

    let url: URL
    try {
      url = new URL(src)
    } catch {
      return { url: src }
    }

    if (url.hostname === 'images.unsplash.com') {
      url.searchParams.set('auto', 'format')
      url.searchParams.set('fit', 'crop')
      url.searchParams.set('q', String(quality))
      if (width) url.searchParams.set('w', String(width))
      if (height) url.searchParams.set('h', String(height))
      const crop = (modifiers as Record<string, unknown>).crop
      if (crop) url.searchParams.set('crop', String(crop))
      return { url: url.toString() }
    }

    if (imageTransforms && url.pathname.includes('/storage/v1/object/public/')) {
      url.pathname = url.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
      if (width) url.searchParams.set('width', String(width))
      if (height) url.searchParams.set('height', String(height))
      url.searchParams.set('quality', String(quality))
      url.searchParams.set('resize', 'cover')
      return { url: url.toString() }
    }

    return { url: src }
  },
})
