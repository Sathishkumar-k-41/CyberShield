import { ImageUp, Trash2 } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { ACCEPTED_IMAGE_TYPES, validateImage } from '../../lib/qr'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'

interface Props {
  label: string
  hint: string
  file: File | null
  previewUrl: string | null
  onFile: (file: File) => void
  onRemove: () => void
  error?: string | null
  onError: (msg: string) => void
}

export function Dropzone({ label, hint, file, previewUrl, onFile, onRemove, error, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const id = useId()

  const accept = (f: File | undefined) => {
    if (!f) return
    const err = validateImage(f)
    if (err) onError(err)
    else onFile(f)
  }

  if (file && previewUrl) {
    return (
      <div className="overflow-hidden rounded-xl border border-line bg-bg-2">
        <div className="grid max-h-[340px] place-items-center bg-[repeating-conic-gradient(rgb(var(--fg)/0.03)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] p-4">
          <img src={previewUrl} alt={`Preview of ${file.name}`} className="max-h-[300px] max-w-full rounded-md object-contain" />
        </div>
        <div className="flex items-center gap-3 border-t border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-fg">{file.name}</p>
            <p className="text-xs text-subtle">{(file.size / 1024).toFixed(0)} KB · {file.type.replace('image/', '').toUpperCase()}</p>
          </div>
          <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint${error ? ` ${id}-err` : ''}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          accept(e.dataTransfer.files?.[0])
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center transition-colors',
          drag ? 'border-accent bg-accent/[0.06]' : error ? 'border-danger/50 bg-danger/[0.03]' : 'border-line-strong bg-bg-2 hover:border-subtle/60 hover:bg-fg/[0.02]',
        )}
      >
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-line-strong bg-elevated">
          <ImageUp aria-hidden className={cn('h-5 w-5', drag ? 'text-accent' : 'text-muted')} />
        </span>
        <p id={`${id}-label`} className="mt-4 text-sm font-medium text-fg">
          {drag ? 'Drop to upload' : label}
        </p>
        <p id={`${id}-hint`} className="mt-1 text-[13px] text-subtle">{hint}</p>
        <span className="mt-4 inline-flex h-8 items-center rounded-lg border border-line-strong px-3 text-[13px] font-medium text-fg">
          Choose file
        </span>
      </div>
      {error && <p id={`${id}-err`} role="alert" className="mt-2 text-[13px] text-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          accept(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
