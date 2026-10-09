import { useEffect, useRef, type RefObject } from 'react'

/** Close a popover on outside click or Escape. Restores focus to the trigger on Escape. */
export function useDismiss(
  open: boolean,
  onClose: () => void,
  refs: Array<RefObject<HTMLElement | null>>,
) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (refs.some((r) => r.current?.contains(e.target as Node))) return
      close.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close.current()
        ;(refs[0]?.current as HTMLElement | null)?.focus?.()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · CyberShield AI`
  }, [title])
}

const PALETTES = {
  dark: {
    accent: '#7C6CFF', accent2: '#38BDF8', success: '#22C55E', warning: '#F59E0B', danger: '#EF4444', critical: '#F43F5E',
    fg: '#F8FAFC', muted: '#94A3B8', subtle: '#64748B', card: '#111827', elevated: '#151D2B',
    line: 'rgba(148, 163, 184, 0.15)', lineStrong: 'rgba(148, 163, 184, 0.26)',
  },
  light: {
    accent: '#5B4BEA', accent2: '#0284C7', success: '#16A34A', warning: '#B45309', danger: '#DC2626', critical: '#BE123C',
    fg: '#0B1020', muted: '#475569', subtle: '#64748B', card: '#FFFFFF', elevated: '#F1F3F7',
    line: 'rgba(15, 23, 42, 0.09)', lineStrong: 'rgba(15, 23, 42, 0.16)',
  },
}

/** Concrete token colors for libraries (e.g. Recharts) that can't read CSS variables. Mirrors index.css. */
export function useThemeColors(theme: 'dark' | 'light') {
  return PALETTES[theme]
}
