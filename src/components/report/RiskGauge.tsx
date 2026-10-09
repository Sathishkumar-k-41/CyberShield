import { motion } from 'framer-motion'
import type { RiskLevel } from '../../lib/types'
import { riskMeta } from '../../lib/utils'

/** Semicircular gauge for a 0–100 risk score. */
export function RiskGauge({ score, level, size = 200 }: { score: number; level: RiskLevel; size?: number }) {
  const stroke = Math.max(8, Math.round(size * 0.06))
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const arc = Math.PI * r
  const pct = Math.max(0, Math.min(100, score)) / 100
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  const color = riskMeta[level].hex

  return (
    <div className="relative" style={{ width: size, height: size / 2 + stroke }}>
      <svg
        width={size}
        height={size / 2 + stroke}
        viewBox={`0 0 ${size} ${size / 2 + stroke}`}
        role="img"
        aria-label={`Risk score ${score} out of 100, ${riskMeta[level].label}`}
      >
        <path d={d} fill="none" stroke="var(--line-strong)" strokeWidth={stroke} strokeLinecap="round" />
        {/* tick marks at level thresholds */}
        {[25, 55, 80].map((t) => {
          const a = Math.PI * (1 - t / 100)
          const x1 = cx + (r - stroke) * Math.cos(a)
          const y1 = cy - (r - stroke) * Math.sin(a)
          const x2 = cx + (r - stroke - 5) * Math.cos(a)
          const y2 = cy - (r - stroke - 5) * Math.sin(a)
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--line-strong)" strokeWidth={1.5} />
        })}
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={arc}
          initial={{ strokeDashoffset: arc }}
          animate={{ strokeDashoffset: arc * (1 - pct) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="font-semibold tabular-nums tracking-tight text-fg" style={{ fontSize: size * 0.24, lineHeight: 1 }}>
          {score}
        </span>
        <span className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-subtle">of 100</span>
      </div>
    </div>
  )
}
