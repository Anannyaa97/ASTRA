import { Area, AreaChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

const tip = { background: '#120d24', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, color: '#f4ecda' }

// Smooth line chart with dots, like a "statistics" card: one resource over the mission days.
export function LineTrend({ title, data, dataKey, big, caption }) {
  return (
    <section aria-label={title} className="panel flex h-full flex-col p-4">
      <div className="flex items-center justify-between text-sm text-ink-dim"><span>{title}</span><span>By day</span></div>
      <p className="mt-1 text-3xl font-extrabold">{big}</p>
      <p className="text-xs text-ink-dim">{caption}</p>
      <div className="relative mt-2 min-h-32 flex-1"><div className="absolute inset-0">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#f472b6" /></linearGradient>
            </defs>
            <XAxis dataKey="day" hide />
            <Tooltip contentStyle={tip} labelFormatter={(d) => `Day ${d}`} />
            <Line type="monotone" dataKey={dataKey} name={title} stroke="url(#line-grad)" strokeWidth={3}
              dot={{ r: 3, fill: '#fff', strokeWidth: 0 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div></div>
    </section>
  )
}

// Filled area chart (teal), like a "total customers" card: here, research points collected.
export function AreaTrend({ title, data, dataKey, big, caption }) {
  return (
    <section aria-label={title} className="panel flex h-full flex-col overflow-hidden p-4 pb-0">
      <div className="flex items-center justify-between text-sm text-ink-dim"><span>{title}</span></div>
      <p className="mt-1 text-3xl font-extrabold">{big}</p>
      <p className="text-xs text-ink-dim">{caption}</p>
      <div className="relative -mx-4 mt-2 min-h-28 flex-1"><div className="absolute inset-0">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2dd4bf" stopOpacity=".5" /><stop offset="100%" stopColor="#2dd4bf" stopOpacity=".05" /></linearGradient>
            </defs>
            <XAxis dataKey="day" hide />
            <Tooltip contentStyle={tip} labelFormatter={(d) => `Day ${d}`} />
            <Area type="monotone" dataKey={dataKey} name={title} stroke="#2dd4bf" strokeWidth={2.5} fill="url(#area-grad)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div></div>
    </section>
  )
}
