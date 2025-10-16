// We avoid importing DOMPurify at module load (can break in SSR). We'll lazy-load in the browser.
// In Node/SSR, we use a robust, conservative fallback sanitizer.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DOMPurifyRef: any | null = null;
function getDOMPurify() {
  if (typeof window === 'undefined') return null;
  if (DOMPurifyRef) return DOMPurifyRef;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    DOMPurifyRef = require('isomorphic-dompurify');
  } catch {
    DOMPurifyRef = null;
  }
  return DOMPurifyRef;
}

// Configure allowed tags/attributes for synopsis HTML
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 's', 'u', 'a', 'img',
  'ul', 'ol', 'li',
  'blockquote', 'hr', 'code', 'h2', 'h3'
];
// Base allowed attributes (without style)
// Note: width/height are globally allowed but will be filtered via hook to only allow on <img> with numeric values
const BASE_ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'width', 'height'] as const;
// Extended allowed attributes with style (only enabled when our hook is active)
const ALLOWED_ATTR_WITH_STYLE = [...BASE_ALLOWED_ATTR, 'style'] as const;
const ALLOWED_IMAGE_HOSTS = [
  'illusia.com.br',
  'res.cloudinary.com',
  'lh3.googleusercontent.com',
  'i.imgur.com',
  'imgur.com',
  'images.unsplash.com',
  'pbs.twimg.com',
  'ibb.co',
  'i.ibb.co',
  'cdn.discordapp.com',
  'media.discordapp.net',
  'imageshack.com',
  'i.imageshack.com',
  'postimg.cc',
  'i.postimg.cc',
  'flickr.com',
  'live.staticflickr.com',
  'tinypic.com',
  'i.pinimg.com',
  'static.wikia.nocookie.net',
];

function isAllowedImageUrl(src: string): boolean {
  try {
    const u = new URL(src);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    return ALLOWED_IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

// Ensure we only keep safe CSS in style attributes
// Specifically, we keep only `text-align: left|center|right|justify` on paragraphs and headings.
let hookInstalled = false;
// eslint-disable-next-line @typescript-eslint/ban-types
type DPWithHook = (typeof DOMPurifyRef) & { addHook?: (name: string, cb: (...args: unknown[]) => void) => void; sanitize?: (dirty: string, cfg?: Record<string, unknown>) => string };
function ensureSanitizeHook() {
  if (hookInstalled) return;
  try {
    const dp = getDOMPurify() as DPWithHook | null;
    if (!dp || typeof dp.addHook !== 'function') return; // cannot safely sanitize style; we'll avoid allowing it
    dp.addHook('uponSanitizeAttribute', (node: Element, data: { attrName: string; attrValue: string; keepAttr?: boolean }) => {
      const tag = node.nodeName.toLowerCase();
      // Guard allowed style only on paragraphs/headings and only for text-align
      if (data.attrName === 'style') {
        if (!['p', 'h2', 'h3'].includes(tag)) {
          data.keepAttr = false;
          return;
        }
        const m = /(^|;|\s)text-align\s*:\s*(left|center|right|justify)\s*;?/i.exec(data.attrValue || '');
        if (m) {
          const align = (m[2] || '').toLowerCase();
          data.attrValue = `text-align: ${align};`;
          data.keepAttr = true;
        } else {
          data.keepAttr = false;
        }
        return;
      }

      // Allow numeric width/height only on <img>
      if (data.attrName === 'width' || data.attrName === 'height') {
        if (tag !== 'img') { data.keepAttr = false; return; }
        const n = parseInt((data.attrValue || '').toString(), 10);
        if (Number.isFinite(n) && n > 0 && n <= 5000) {
          data.attrValue = String(n); // HTML attribute expects number (pixels)
          data.keepAttr = true;
        } else {
          data.keepAttr = false; // drop invalid values
        }
        return;
      }
    });
    hookInstalled = true;
  } catch {
    // If DOMPurify cannot be hooked (SSR), we'll fall back later
    hookInstalled = false;
  }
}

export function sanitizeSynopsisHtml(html: string): string {
  const input = html || '';
  // If running on server, use fallback immediately (do not touch DOMPurify)
  if (typeof window === 'undefined') {
    return fallbackSanitize(input);
  }
  // Try to install hook if DOMPurify is usable (no-op if missing)
  ensureSanitizeHook();
  const dp = getDOMPurify() as DPWithHook | null;
  let cleaned = '';
  // Preprocess: migrate text-align from style into a safe data-align attribute on p/h2/h3
  // This ensures alignment survives even if 'style' is removed by DOMPurify (in environments without hooks)
  const preprocessedAlign = (html || '').replace(
    /<(p|h2|h3)([^>]*)style=("|')([^"']*?)\3([^>]*)>/gi,
    (_m, tag: string, before: string, _q: string, styleVal: string, after: string) => {
      const m = /(^|;|\s)text-align\s*:\s*(left|center|right|justify)\s*;?/i.exec(styleVal || '');
      if (!m) return _m; // keep original match
      const align = (m[2] || '').toLowerCase();
      // Attach/replace data-align, keep original style as-is; DOMPurify will strip style if not allowed
      const hasDataAlign = /\sdata-align=\s*("|')(?:left|center|right|justify)\1/i.test(before + after);
      const withData = hasDataAlign
        ? `<${tag}${before.replace(/\sdata-align=\s*("|')(?:left|center|right|justify)\1/i, ` data-align="${align}"`)} style="${styleVal}"${after}>`
        : `<${tag}${before} data-align="${align}" style="${styleVal}"${after}>`;
      return withData;
    }
  );
  // Normalize spacing: remove empty paragraphs like <p><br></p> or <p>&nbsp;</p> and collapse stray NBSPs
  const preprocessed = normalizeHtmlSpacing(preprocessedAlign);

  // Prefer DOMPurify when available and functional
  try {
    if (dp && typeof dp.sanitize === 'function') {
      cleaned = (dp as Required<DPWithHook>).sanitize!(preprocessed, {
        ALLOWED_TAGS,
        ALLOWED_ATTR: hookInstalled && typeof dp.addHook === 'function' ? (ALLOWED_ATTR_WITH_STYLE as unknown as string[]) : (BASE_ALLOWED_ATTR as unknown as string[]),
        ADD_ATTR: ['class', 'data-align'],
        FORBID_TAGS: ['script', 'style', 'iframe'],
        FORBID_ATTR: ['onerror', 'onclick', 'onload'],
      }) as unknown as string;
    } else {
      throw new Error('DOMPurify unavailable');
    }
  } catch {
    cleaned = fallbackSanitize(preprocessed);
  }

  // Strip <img> with disallowed hosts (double safety)
  return cleaned.replace(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi, (match: string, src: string) =>
    isAllowedImageUrl(src) ? match : ''
  );
}

// Node-safe conservative sanitizer used on SSR or when DOMPurify is not available
function fallbackSanitize(preprocessed: string): string {
  // 1) Remove dangerous tags completely
  let out = preprocessed
    .replace(/<\/?(script|style|iframe|object|embed|link|meta)[^>]*>/gi, '')
    // 2) Remove event handlers and javascript: URLs
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '')
    // 3) Drop all tags not in allowlist (keep inner text)
    .replace(/<\/?(?!p\b|br\b|strong\b|em\b|s\b|u\b|a\b|img\b|ul\b|ol\b|li\b|blockquote\b|hr\b|code\b|h2\b|h3\b)[a-z0-9:-]+[^>]*>/gi, '');

  // 4) For remaining tags, strip disallowed attributes (keep only allowed ones)
  out = out.replace(/<(p|h2|h3|a|img|ul|ol|li|blockquote|hr|code)([^>]*)>/gi, (_m, tag: string, attrs: string) => {
    const keep: Record<string, string> = {};
    const attrRe = /(\w[\w:-]*)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(attrs))) {
      const name = m[1].toLowerCase();
      let val = m[2];
      // normalize quotes
      if (val.startsWith('"') || val.startsWith("'")) val = val.slice(1, -1);
      if (name === 'style') continue; // style is handled via data-align preprocessing
      if (name.startsWith('on')) continue; // drop handlers
      if (!BASE_ALLOWED_ATTR.includes(name as (typeof BASE_ALLOWED_ATTR)[number]) && name !== 'class' && name !== 'data-align') continue;
      // width/height only numeric and only on img
      if ((name === 'width' || name === 'height')) {
        if (tag !== 'img') continue;
        const n = parseInt(val, 10);
        if (!Number.isFinite(n) || n <= 0 || n > 5000) continue;
        keep[name] = String(n);
        continue;
      }
      // href/src basic validation
      if (name === 'href' || name === 'src') {
        try {
          const u = new URL(val, 'http://x');
          if (!['http:', 'https:'].includes(u.protocol)) continue;
        } catch { continue; }
      }
      keep[name] = val;
    }
    // For <img>, drop if src host is not allowed
    if (tag === 'img') {
      const src = keep['src'];
      if (!src || !isAllowedImageUrl(src)) return '';
    }
    const renderedAttrs = Object.entries(keep)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    return `<${tag}${renderedAttrs ? ' ' + renderedAttrs : ''}>`;
  });

  return out;
}

export function getPlainTextLength(html: string): number {
  const safe = html || '';
  if (typeof window === 'undefined') {
    // Node: quick fallback
    const stripped = safe.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    return stripped.length;
  }
  const div = document.createElement('div');
  div.innerHTML = safe;
  const text = (div.textContent || div.innerText || '').trim();
  return text.length;
}

// Collapse excessive spacing introduced by WYSIWYG pastes (Docs/Word, etc.)
// - Remove paragraphs that are effectively empty: only <br>, &nbsp; or whitespace
// - Convert NBSP to regular spaces to avoid artificial spacing
// Keeping it conservative to not alter meaningful content.
export function normalizeHtmlSpacing(html: string): string {
  if (!html) return '';
  let out = html;
  // Convert &nbsp; to regular spaces
  out = out.replace(/&nbsp;/gi, ' ');
  // Remove paragraphs that are empty (only <br/> and whitespace)
  out = out.replace(/<p\b[^>]*>(?:\s|<br\s*\/?>)*<\/p>/gi, '');
  // Also remove paragraphs that only contain spaces
  out = out.replace(/<p\b[^>]*>\s*<\/p>/gi, '');
  // Within paragraphs: remove leading/trailing <br> and surrounding whitespace
  out = out.replace(/(<p\b[^>]*>)\s*(?:<br\s*\/?>\s*)+/gi, '$1');
  out = out.replace(/(?:\s*<br\s*\/?>\s*)+(<\/p>)/gi, '$1');
  // Compress multiple consecutive <br> into a single <br>
  out = out.replace(/(?:\s*<br\s*\/?>\s*){2,}/gi, '<br>');
  // Trim spaces inside paragraph boundaries to avoid artificial indents/gaps
  out = out.replace(/(<p\b[^>]*>)\s+/gi, '$1');
  out = out.replace(/\s+(<\/p>)/gi, '$1');
  // Remove multiple consecutive empty <p> just in case (after previous rules)
  out = out.replace(/(?:\s*<p\b[^>]*>\s*<\/p>\s*){2,}/gi, '');
  return out;
}
