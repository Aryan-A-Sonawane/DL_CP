import { useEffect, useState } from 'react';
import {
  ShieldCheck, AlertTriangle, Loader2,
  CheckCircle2, XCircle, MinusCircle, Sparkles,
} from 'lucide-react';
import { fetchSuggestions, runEthicalAudit, fetchEmployees, analyzeProfile } from '../api';

export default function Reports() {
  const [suggestions, setSuggestions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [audits, setAudits] = useState({});
  const [auditing, setAuditing] = useState({});
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([fetchSuggestions(), fetchEmployees()])
      .then(([sug, emp]) => { setSuggestions(sug); setEmployees(emp); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAudit = async (suggestionId) => {
    setAuditing((p) => ({ ...p, [suggestionId]: true }));
    try {
      const result = await runEthicalAudit(suggestionId);
      setAudits((p) => ({ ...p, [suggestionId]: result }));
    } catch (err) {
      console.error(err);
    } finally {
      setAuditing((p) => ({ ...p, [suggestionId]: false }));
    }
  };

  const handleBulkAnalyze = async () => {
    setAnalyzing(true);
    try {
      for (const emp of employees) {
        await analyzeProfile(emp.id);
      }
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const riskIcon = (level) => {
    if (level === 'Low') return <CheckCircle2 size={14} className="text-emerald-500" />;
    if (level === 'Medium') return <MinusCircle size={14} className="text-amber-500" />;
    return <XCircle size={14} className="text-red-500" />;
  };

  const riskBadge = (level) => {
    const cls = level === 'Low' ? 'badge-emerald' : level === 'Medium' ? 'badge-amber' : 'badge-red';
    return <span className={`badge ${cls}`}>{level}</span>;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Ethical Audit</h2>
          <p className="mt-1 text-sm text-surface-500">
            PASSIONIT & PRUTL compliance scores for every AI recommendation
          </p>
        </div>
        {suggestions.length === 0 && (
          <button
            onClick={handleBulkAnalyze}
            disabled={analyzing}
            className="btn-primary flex items-center gap-2"
          >
            {analyzing ? (
              <><Loader2 size={14} className="animate-spin" /> Analyzing All...</>
            ) : (
              <><Sparkles size={14} /> Analyze All Employees</>
            )}
          </button>
        )}
      </div>

      {suggestions.length === 0 ? (
        <div className="card flex flex-col items-center justify-center p-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 mb-4">
            <ShieldCheck size={28} className="text-surface-300" />
          </div>
          <p className="text-surface-600 font-medium">No recommendations yet</p>
          <p className="mt-1 text-xs text-surface-400">
            Go to the Analyze page and run analysis first, or click the button above.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {suggestions.map((sug, idx) => {
            const audit = audits[sug.id];
            const isAuditing = auditing[sug.id];

            return (
              <div
                key={sug.id}
                className="card overflow-hidden animate-slide-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-100 p-6">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-surface-900">{sug.employee_name}</span>
                      <span className="text-surface-300">→</span>
                      <span className="font-semibold text-primary-600">{sug.suggested_role}</span>
                      <span className="badge badge-indigo">{sug.match_score}%</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <MetricChip label="Growth" value={Math.round(100 - sug.failure_score)} color="emerald" />
                      <MetricChip label="Resilience" value={sug.resilience_index} color="indigo" />
                      <MetricChip label="Leadership" value={sug.leadership_score} color="blue" />
                      <MetricChip label="Trajectory" value={sug.growth_trajectory} color="violet" />
                    </div>
                  </div>
                  <button
                    onClick={() => handleAudit(sug.id)}
                    disabled={isAuditing}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isAuditing ? (
                      <><Loader2 size={14} className="animate-spin" /> Auditing...</>
                    ) : (
                      <><ShieldCheck size={14} /> {audit ? 'Re-Audit' : 'Run Ethical Audit'}</>
                    )}
                  </button>
                </div>

                {/* Audit Results */}
                {audit && (
                  <div className="animate-fade-in p-6 space-y-6 bg-surface-50/50">
                    {/* Overall Scores */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className={`rounded-2xl px-5 py-3 text-center border ${
                        audit.overall_risk === 'Low' ? 'bg-emerald-50 border-emerald-200' :
                        audit.overall_risk === 'Medium' ? 'bg-amber-50 border-amber-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <p className="text-xs text-surface-500 uppercase font-medium">Overall Risk</p>
                        <p className={`text-xl font-bold mt-1 ${
                          audit.overall_risk === 'Low' ? 'text-emerald-600' :
                          audit.overall_risk === 'Medium' ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {audit.overall_risk}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-primary-50 border border-primary-200 px-5 py-3 text-center">
                        <p className="text-xs text-surface-500 uppercase font-medium">Overall Score</p>
                        <p className="text-xl font-bold text-primary-600 mt-1">{audit.overall_score}/10</p>
                      </div>
                    </div>

                    {/* PASSIONIT Framework */}
                    <FrameworkSection
                      title="PASSIONIT Framework"
                      icon={ShieldCheck}
                      iconColor="text-primary-500"
                      data={audit.passionit}
                      riskIcon={riskIcon}
                    />

                    {/* PRUTL Framework */}
                    <FrameworkSection
                      title="PRUTL Framework"
                      icon={AlertTriangle}
                      iconColor="text-amber-500"
                      data={audit.prutl}
                      riskIcon={riskIcon}
                    />

                    {/* Disclaimer */}
                    <div className="rounded-xl border border-primary-100 bg-primary-50/50 px-5 py-3">
                      <p className="text-[11px] text-primary-600/60">{audit.disclaimer}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricChip({ label, value, color }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    indigo: 'bg-primary-50 text-primary-700 border-primary-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${colors[color] || colors.indigo}`}>
      {label}: <strong>{value}</strong>
    </span>
  );
}

function FrameworkSection({ title, icon: Icon, iconColor, data, riskIcon }) {
  return (
    <div>
      <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-500">
        <Icon size={14} className={iconColor} />
        {title}
      </h4>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Score</th>
              <th>Risk Level</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td className="font-medium text-surface-800">{d.dimension}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-surface-100">
                      <div
                        className={`h-full rounded-full ${
                          d.score >= 8 ? 'bg-emerald-500' :
                          d.score >= 5 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${d.score * 10}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-surface-700">
                      {d.score}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="flex items-center gap-1.5">
                    {riskIcon(d.risk_level)}
                    <span className={`text-xs font-semibold ${
                      d.risk_level === 'Low' ? 'text-emerald-600' :
                      d.risk_level === 'Medium' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {d.risk_level}
                    </span>
                  </span>
                </td>
                <td className="text-xs text-surface-500 max-w-xs break-words">{d.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
