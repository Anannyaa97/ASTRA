import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Line chart of resource levels by day. `series` = [{ key, label, color }].
export default function ResourceChart({ data, series, description }) {
  return (
    <figure aria-label={description} className="m-0">
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="#ffffff1a" vertical={false} />
            <XAxis dataKey="day" stroke="#9fb0dc" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} stroke="#9fb0dc" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#0a1230', border: '1px solid #2b3c8a', borderRadius: 12 }}
              labelFormatter={(d) => `Day ${d}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {series.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color}
                strokeWidth={2.5} dot={false} isAnimationActive={false}
                strokeDasharray={s.dashed ? '7 5' : undefined} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
