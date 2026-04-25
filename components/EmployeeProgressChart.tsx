"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface ProgressPoint {
  cycle: string;
  resilience: number;
  leadership: number;
  growth: number;
}

interface RecordPoint {
  cycle: string;
  hours: number;
  defects: number;
  tat: number;
}

export default function EmployeeProgressChart({
  data,
  records,
}: {
  data: ProgressPoint[];
  records: RecordPoint[];
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase font-semibold text-surface-400 tracking-wider mb-3">
          Resilience · Leadership · Growth
        </p>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7f0" />
              <XAxis dataKey="cycle" tick={{ fill: "#6b7280", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7f0" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="resilience" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="leadership" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="growth" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {records.length > 1 && (
        <div>
          <p className="text-xs uppercase font-semibold text-surface-400 tracking-wider mb-3">
            Cycle records (hours · defects · avg turn-around)
          </p>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={records}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7f0" />
                <XAxis dataKey="cycle" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7f0" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="hours" name="Hours worked" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="defects" name="Defects" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="tat" name="Avg TAT (h)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
