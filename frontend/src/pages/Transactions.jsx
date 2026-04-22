import { useEffect, useState } from 'react';
import {
  Sparkles, TrendingUp, Shield, Brain, Heart, Target,
  ChevronDown, ChevronUp, ArrowRight, Loader2,
} from 'lucide-react';
import { fetchEmployees, analyzeProfile } from '../api';

export default function Transactions() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState({});
  const [analyzing, setAnalyzing] = useState({});
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchEmployees()
      .then(setEmployees)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAnalyze = async (empId) => {
    setAnalyzing((prev) => ({ ...prev, [empId]: true }));
    try {
      const result = await analyzeProfile(empId);
      setAnalyses((prev) => ({ ...prev, [empId]: result }));
      setExpanded((prev) => ({ ...prev, [empId]: true }));
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing((prev) => ({ ...prev, [empId]: false }));
    }
  };

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

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
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Analyze</h2>
        <p className="mt-1 text-sm text-surface-500">
          Discover growth-oriented role pathways — click "Discover Growth Path" to generate AI recommendations
        </p>
      </div>

      {/* Employee Cards */}
      <div className="space-y-4">
        {employees.map((emp, idx) => {
          const a = analyses[emp.id];
          const isExpanded = expanded[emp.id];
          const isAnalyzing = analyzing[emp.id];

          return (
            <div
              key={emp.id}
              className="card animate-slide-up overflow-hidden"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-violet-100 text-sm font-bold text-primary-600">
                    {emp.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900">{emp.name}</h3>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {emp.primary_domain} · {emp.department} · {emp.years_experience} yrs
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {a && (
                    <button
                      onClick={() => toggle(emp.id)}
                      className="rounded-xl bg-surface-50 border border-surface-200 p-2.5 text-surface-400 transition hover:bg-surface-100 hover:text-surface-600"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                  <button
                    onClick={() => handleAnalyze(emp.id)}
                    disabled={isAnalyzing}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        {a ? 'Re-Analyze' : 'Discover Growth Path'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Analysis Result */}
              {a && isExpanded && (
                <div className="animate-fade-in border-t border-surface-100 p-6 space-y-6 bg-surface-50/50">
                  {/* Score Cards */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <MiniStat icon={Target} label="Growth Score" value={Math.round(100 - a.failure_score)} color="text-emerald-600" bg="bg-emerald-50" />
                    <MiniStat icon={Shield} label="Resilience" value={a.resilience_index} color="text-primary-600" bg="bg-primary-50" />
                    <MiniStat icon={Brain} label="Leadership" value={a.leadership_score} color="text-blue-600" bg="bg-blue-50" />
                    <MiniStat icon={TrendingUp} label="Trajectory" value={a.growth_trajectory} color="text-violet-600" bg="bg-violet-50" />
                    <MiniStat icon={Sparkles} label="Learning" value={a.transformational_learning_score} color="text-amber-600" bg="bg-amber-50" />
                    <MiniStat icon={Heart} label="Recovery" value={a.emotional_recovery_score} color="text-pink-600" bg="bg-pink-50" />
                  </div>

                  {/* Suggested Roles */}
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
                      Recommended Growth Roles
                    </h4>
                    <div className="space-y-3">
                      {a.suggested_roles.map((role, i) => (
                        <div
                          key={i}
                          className="flex flex-wrap items-start gap-4 rounded-2xl border border-surface-200 bg-white p-5"
                        >
                          <div className="flex items-center gap-2 min-w-[200px]">
                            <ArrowRight size={14} className="text-primary-500" />
                            <span className="font-semibold text-primary-600">{role.role}</span>
                            <span className="badge badge-indigo ml-1">{role.match_score}%</span>
                          </div>
                          <p className="flex-1 text-xs text-surface-500 leading-relaxed">
                            {role.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feature Importance */}
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
                      Feature Importance (Explainability)
                    </h4>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {Object.entries(a.feature_importance).slice(0, 8).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="min-w-[130px] truncate text-xs text-surface-600">
                            {key}
                          </span>
                          <div className="h-2 flex-1 rounded-full bg-surface-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary-400 to-violet-400"
                              style={{ width: `${val}%` }}
                            />
                          </div>
                          <span className="min-w-[36px] text-right text-xs font-semibold text-primary-600">
                            {val}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="rounded-xl border border-primary-100 bg-primary-50/50 px-5 py-3">
                    <p className="text-[11px] text-primary-600/60">{a.disclaimer}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-4 text-center">
      <div className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${bg}`}>
        <Icon size={15} className={color} />
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-surface-400 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
