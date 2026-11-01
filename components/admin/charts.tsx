'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const AXIS_TICK = { fill: '#64748b', fontSize: 12 }
const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 14px rgba(15,23,42,0.08)',
  fontSize: 13,
}

export type MonthPoint = {
  month: string
  patients: number
  doctors: number
}

export type AppointmentPoint = {
  month: string
  pending: number
  confirmed: number
  completed: number
  cancelled: number
}

export function RegistrationTrendChart({ data }: { data: MonthPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="gradPatients" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradDoctors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
          <Area
            type="monotone"
            dataKey="patients"
            name="Patients"
            stroke="#16a34a"
            strokeWidth={2.5}
            fill="url(#gradPatients)"
          />
          <Area
            type="monotone"
            dataKey="doctors"
            name="Doctors"
            stroke="#14b8a6"
            strokeWidth={2.5}
            fill="url(#gradDoctors)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const APPOINTMENT_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#0ea5e9',
  completed: '#16a34a',
  cancelled: '#ef4444',
}

export function AppointmentStatsChart({ data }: { data: AppointmentPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
          <Bar dataKey="pending" name="Pending" stackId="a" fill={APPOINTMENT_COLORS.pending} radius={[0, 0, 0, 0]} />
          <Bar dataKey="confirmed" name="Confirmed" stackId="a" fill={APPOINTMENT_COLORS.confirmed} />
          <Bar dataKey="completed" name="Completed" stackId="a" fill={APPOINTMENT_COLORS.completed} />
          <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill={APPOINTMENT_COLORS.cancelled} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export type DonutSlice = { name: string; value: number }

export function StatusDonutChart({ data }: { data: DonutSlice[] }) {
  const palette = ['#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="relative h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="85%"
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-secondary-900">{total}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-secondary-400">Total</span>
      </div>
    </div>
  )
}
