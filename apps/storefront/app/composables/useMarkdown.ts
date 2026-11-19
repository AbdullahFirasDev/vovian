import MarkdownIt from 'markdown-it'

// Raw HTML is disabled, so CMS content can never inject markup or scripts.
const md = new MarkdownIt({ html: false, linkify: true, typographer: true })

const defaultLinkOpen = md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]!
  const href = String(token.attrGet('href') ?? '')
  if (/^https?:\/\//.test(href)) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
  } else if (href.startsWith('/') && (env as { prefix?: string }).prefix) {
    token.attrSet('href', `${(env as { prefix: string }).prefix}${href}`)
  }
  return defaultLinkOpen(tokens, idx, options, env, self)
}

/** Renders trusted-but-sanitised CMS Markdown, prefixing internal links for the active locale. */
export function useMarkdown() {
  const { locale } = useI18n()
  return (source: string | null | undefined) => md.render(source ?? '', { prefix: locale.value === 'en' ? '' : `/${locale.value}` })
}
