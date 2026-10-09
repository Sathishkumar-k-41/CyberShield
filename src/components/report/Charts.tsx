import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../../context/AppContext'
import { useThemeColors } from '../../lib/hooks'
import type { RiskLevel } from '../../lib/types'
import { riskMeta } from '../../lib/utils'

function useChartTheme() {
  const { resolvedTheme } = useApp()
  const c = useThemeColors(resolvedTheme)
  const tooltip = {
    contentStyle: {
      background: c.elevated,
      border: `1px solid ${c.lineStrong}`,
      borderRadius: 10,
      fontSize: 12,
      color: c.fg,
      boxShadow: '0 8px 24px -8px rgba(0,0,0,0.4)',
    },
    labelStyle: { color: c.muted, marginBottom: 4 },
    itemStyle: { color: c.fg, padding: 0 },
    cursor: { fill: c.line, stroke: c.lineStrong },
  }
  const axis = { stroke: c.subtle, fontSize: 11, tickLine: false, axisLine: false }
  return { c, tooltip, axis }
}

export function ActivityChart({ data }: { data: Array<{ label: string; scans: number; threats: number }> }) {
  const { c, tooltip, axis } = useChartTheme()
  const rows = data.map((d) => ({ ...d, other: d.scans - d.threats }))
  const empty = data.every((d) => d.scans === 0)
  return (
    <div className="relative h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke={c.line} />
          <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={24} />
          <YAxis allowDecimals={false} {...axis} width={44} />
          <Tooltip {...tooltip} />
          <Bar dataKey="threats" name="Threats (≥ medium risk)" stackId="a" fill={c.warning} fillOpacity={0.85} maxBarSize={22} />
          <Bar dataKey="other" name="Low-risk scans" stackId="a" fill={c.accent} fillOpacity={0.55} radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
      {empty && <p className="absolute inset-0 grid place-items-center text-sm text-muted">No scans in this period.</p>}
    </div>
  )
}

export function RiskDistributionChart({ data }: { data: Array<{ level: RiskLevel; count: number }> }) {
  const { c, tooltip, axis } = useChartTheme()
  const color: Record<RiskLevel, string> = { low: c.success, medium: c.warning, high: c.danger, critical: c.critical }
  const rows = data.map((d) => ({ ...d, name: riskMeta[d.level].label }))
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke={c.line} />
          <XAxis dataKey="name" {...axis} />
          <YAxis allowDecimals={false} {...axis} width={44} />
          <Tooltip {...tooltip} />
          <Bar dataKey="count" name="Scans" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {rows.map((r) => <Cell key={r.level} fill={color[r.level]} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryChart({ data }: { data: Array<{ category: string; count: number }> }) {
  const { c, tooltip, axis } = useChartTheme()
  return (
    <div className="w-full" style={{ height: Math.max(160, data.length * 40 + 20) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} accessibilityLayer>
          <CartesianGrid horizontal={false} stroke={c.line} />
          <XAxis type="number" allowDecimals={false} {...axis} />
          <YAxis type="category" dataKey="category" {...axis} width={150} tick={{ fill: c.muted, fontSize: 12 }} />
          <Tooltip {...tooltip} />
          <Bar dataKey="count" name="Scans" fill={c.accent} fillOpacity={0.8} radius={[0, 6, 6, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
