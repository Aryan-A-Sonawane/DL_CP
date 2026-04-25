"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Plus, Trash2, Brain } from "lucide-react";

interface Profile {
  name: string;
  empCode: string | null;
  primaryDomain: string | null;
  yearsExperience: number;
  softSkillScore: number;
  profileComplete: boolean;
}

interface Skill {
  id: number;
  name: string;
  description: string | null;
  learnedAt: string;
}

interface Cert {
  id: number;
  name: string;
  issuer: string | null;
  description: string | null;
  obtainedAt: string;
}

interface Personality {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

const PERSONALITY_LABELS: Record<keyof Personality, string> = {
  openness: "Openness",
  conscientiousness: "Conscientiousness",
  extraversion: "Extraversion",
  agreeableness: "Agreeableness",
  neuroticism: "Neuroticism (low is calm)",
};

export default function ProfileClient({
  profile,
  skills,
  certifications,
  personality,
}: {
  profile: Profile;
  skills: Skill[];
  certifications: Cert[];
  personality: Personality | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [skillName, setSkillName] = useState("");
  const [skillDesc, setSkillDesc] = useState("");
  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certDesc, setCertDesc] = useState("");

  const [pers, setPers] = useState<Personality>(
    personality ?? {
      openness: 5,
      conscientiousness: 5,
      extraversion: 5,
      agreeableness: 5,
      neuroticism: 5,
    },
  );

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await fetch("/api/employee/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          empCode: form.empCode,
          primaryDomain: form.primaryDomain,
          yearsExperience: form.yearsExperience,
          softSkillScore: form.softSkillScore,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSuccess("Profile saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function addSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!skillName.trim()) return;
    await fetch("/api/employee/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: skillName, description: skillDesc }),
    });
    setSkillName("");
    setSkillDesc("");
    router.refresh();
  }

  async function removeSkill(id: number) {
    if (!confirm("Remove this skill?")) return;
    await fetch(`/api/employee/skills/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function addCert(e: React.FormEvent) {
    e.preventDefault();
    if (!certName.trim()) return;
    await fetch("/api/employee/certifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: certName, issuer: certIssuer, description: certDesc }),
    });
    setCertName("");
    setCertIssuer("");
    setCertDesc("");
    router.refresh();
  }

  async function removeCert(id: number) {
    if (!confirm("Remove this certification?")) return;
    await fetch(`/api/employee/certifications/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function savePersonality() {
    await fetch("/api/employee/personality", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pers),
    });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section className="card p-7">
        <h3 className="text-lg font-bold text-surface-900 mb-4">Basics</h3>
        <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {error && <div className="form-error md:col-span-2">{error}</div>}
          {success && <div className="form-success md:col-span-2">{success}</div>}
          <div>
            <label className="field-label">Full name</label>
            <input
              className="field-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="field-label">Employee ID</label>
            <input
              className="field-input"
              value={form.empCode ?? ""}
              onChange={(e) => setForm({ ...form, empCode: e.target.value })}
              placeholder="EMP123"
            />
          </div>
          <div>
            <label className="field-label">Primary domain</label>
            <input
              className="field-input"
              value={form.primaryDomain ?? ""}
              onChange={(e) => setForm({ ...form, primaryDomain: e.target.value })}
              placeholder="Backend Engineering"
            />
          </div>
          <div>
            <label className="field-label">Years of experience</label>
            <input
              type="number"
              min={0}
              max={60}
              step={0.5}
              className="field-input"
              value={form.yearsExperience}
              onChange={(e) => setForm({ ...form, yearsExperience: Number(e.target.value) })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">Soft-skill self-rating (0–10)</label>
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              className="field-input"
              value={form.softSkillScore}
              onChange={(e) => setForm({ ...form, softSkillScore: Number(e.target.value) })}
            />
            <p className="mt-1 text-xs text-surface-400">
              Used in resilience and leadership scoring. No demographic info collected.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary inline-flex items-center gap-2 md:col-span-2 md:w-auto"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save profile
          </button>
        </form>
      </section>

      <section className="card p-7">
        <h3 className="text-lg font-bold text-surface-900 mb-4">New skills you&apos;ve learned</h3>
        <form onSubmit={addSkill} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mb-5">
          <div>
            <label className="field-label">Skill</label>
            <input
              className="field-input"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="Kubernetes"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">What did you do with it?</label>
            <input
              className="field-input"
              value={skillDesc}
              onChange={(e) => setSkillDesc(e.target.value)}
              placeholder="Migrated payments service to k8s"
            />
          </div>
          <button type="submit" className="btn-primary inline-flex items-center gap-2 md:col-span-3 md:w-auto md:justify-self-start">
            <Plus size={14} /> Add skill
          </button>
        </form>
        {skills.length === 0 ? (
          <p className="text-sm text-surface-400">No skills logged yet.</p>
        ) : (
          <ul className="divide-y divide-surface-100">
            {skills.map((s) => (
              <li key={s.id} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-surface-900">{s.name}</p>
                  {s.description && <p className="text-xs text-surface-500 mt-0.5">{s.description}</p>}
                  <p className="text-[10px] uppercase tracking-wider text-surface-400 mt-1">
                    {new Date(s.learnedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeSkill(s.id)}
                  className="rounded-lg bg-red-50 border border-red-100 p-1.5 text-red-600 hover:bg-red-100 transition"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-7">
        <h3 className="text-lg font-bold text-surface-900 mb-4">Certifications</h3>
        <form onSubmit={addCert} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mb-5">
          <div>
            <label className="field-label">Certification</label>
            <input
              className="field-input"
              value={certName}
              onChange={(e) => setCertName(e.target.value)}
              placeholder="AWS Solutions Architect"
              required
            />
          </div>
          <div>
            <label className="field-label">Issuer</label>
            <input
              className="field-input"
              value={certIssuer}
              onChange={(e) => setCertIssuer(e.target.value)}
              placeholder="Amazon Web Services"
            />
          </div>
          <div>
            <label className="field-label">Notes</label>
            <input
              className="field-input"
              value={certDesc}
              onChange={(e) => setCertDesc(e.target.value)}
              placeholder="Associate level"
            />
          </div>
          <button type="submit" className="btn-primary inline-flex items-center gap-2 md:col-span-3 md:w-auto md:justify-self-start">
            <Plus size={14} /> Add certification
          </button>
        </form>
        {certifications.length === 0 ? (
          <p className="text-sm text-surface-400">No certifications logged yet.</p>
        ) : (
          <ul className="divide-y divide-surface-100">
            {certifications.map((c) => (
              <li key={c.id} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-surface-900">{c.name}</p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {c.issuer}
                    {c.description ? ` — ${c.description}` : ""}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-surface-400 mt-1">
                    {new Date(c.obtainedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeCert(c.id)}
                  className="rounded-lg bg-red-50 border border-red-100 p-1.5 text-red-600 hover:bg-red-100 transition"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-7">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={16} className="text-violet-500" />
          <h3 className="text-lg font-bold text-surface-900">Personality (Big Five, 0–10)</h3>
        </div>
        <p className="text-xs text-surface-400 mb-4">
          Self-rate each trait. Used as one input alongside performance to suggest roles —
          never displayed to others by name.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(PERSONALITY_LABELS) as (keyof Personality)[]).map((k) => (
            <div key={k}>
              <label className="field-label">{PERSONALITY_LABELS[k]}</label>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={pers[k]}
                onChange={(e) => setPers({ ...pers, [k]: Number(e.target.value) })}
                className="w-full accent-primary-500"
              />
              <p className="text-xs text-surface-500 mt-0.5">{pers[k].toFixed(1)} / 10</p>
            </div>
          ))}
        </div>
        <button
          onClick={savePersonality}
          className="btn-primary inline-flex items-center gap-2 mt-5"
        >
          <Save size={14} />
          Save personality test
        </button>
      </section>
    </div>
  );
}
