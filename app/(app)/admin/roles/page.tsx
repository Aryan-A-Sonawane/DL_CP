"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, ToggleLeft, ToggleRight, Trash2, Download,
  Briefcase, CheckCircle2, XCircle, Settings2, RefreshCw,
} from "lucide-react";
import { ROLE_CATALOG, ALL_CATEGORIES, ORG_TYPE_LABELS, type RoleCategory, type OrgType } from "@/lib/roleCatalog";

// ── Types ──────────────────────────────────────────────────────────────────────
interface OrgRole {
  id: number;
  title: string;
  category: string;
  active: boolean;
  isCustom: boolean;
}

// ── Category colours (badge) ───────────────────────────────────────────────────
const CAT_BADGE: Record<string, string> = {
  "Engineering":             "badge-indigo",
  "Testing & QA":            "badge-emerald",
  "Data & Analytics":        "badge-violet",
  "DevOps & Infrastructure": "badge-amber",
  "Product & Design":        "badge-red",
  "Architecture":            "badge-indigo",
  "Management":              "badge-violet",
  "HR":                      "badge-emerald",
  "Marketing":               "badge-amber",
  "Sales":                   "badge-red",
  "Admin & Operations":      "badge-emerald",
  "Finance":                 "badge-amber",
  "Support":                 "badge-indigo",
};

const CAT_DOT: Record<string, string> = {
  "Engineering":             "bg-primary-400",
  "Testing & QA":            "bg-emerald-400",
  "Data & Analytics":        "bg-violet-400",
  "DevOps & Infrastructure": "bg-amber-400",
  "Product & Design":        "bg-red-400",
  "Architecture":            "bg-primary-600",
  "Management":              "bg-violet-600",
  "HR":                      "bg-emerald-600",
  "Marketing":               "bg-amber-600",
  "Sales":                   "bg-red-600",
  "Admin & Operations":      "bg-emerald-500",
  "Finance":                 "bg-amber-500",
  "Support":                 "bg-primary-500",
};

export default function RolesPage() {
  const [roles, setRoles]             = useState<OrgRole[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [catFilter, setCatFilter]     = useState<RoleCategory | "all">("all");
  const [busy, setBusy]               = useState<Set<number>>(new Set());

  // Add-role form
  const [showAdd, setShowAdd]         = useState(false);
  const [addTitle, setAddTitle]       = useState("");
  const [addCat, setAddCat]           = useState<RoleCategory>("Engineering");
  const [addError, setAddError]       = useState<string | null>(null);
  const [addBusy, setAddBusy]         = useState(false);

  // Import preset
  const [showImport, setShowImport]   = useState(false);
  const [importType, setImportType]   = useState<OrgType>("other");
  const [importBusy, setImportBusy]   = useState(false);
  const [importMsg, setImportMsg]     = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/roles");
      const d = await r.json();
      setRoles(d.roles ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // ── Toggle active ────────────────────────────────────────────────────────────
  async function toggle(role: OrgRole) {
    setBusy((s) => new Set([...s, role.id]));
    const res = await fetch(`/api/admin/roles/${role.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !role.active }),
    });
    if (res.ok) {
      setRoles((prev) => prev.map((r) => r.id === role.id ? { ...r, active: !r.active } : r));
    }
    setBusy((s) => { const n = new Set(s); n.delete(role.id); return n; });
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function del(role: OrgRole) {
    if (!confirm(`Remove "${role.title}" from your catalog?`)) return;
    setBusy((s) => new Set([...s, role.id]));
    const res = await fetch(`/api/admin/roles/${role.id}`, { method: "DELETE" });
    if (res.ok) setRoles((prev) => prev.filter((r) => r.id !== role.id));
    setBusy((s) => { const n = new Set(s); n.delete(role.id); return n; });
  }

  // ── Add custom role ──────────────────────────────────────────────────────────
  async function addRole() {
    setAddError(null);
    if (!addTitle.trim()) { setAddError("Title required"); return; }
    setAddBusy(true);
    const res = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: addTitle.trim(), category: addCat }),
    });
    const d = await res.json();
    setAddBusy(false);
    if (!res.ok) { setAddError(d.error ?? "Error"); return; }
    setRoles((prev) => [...prev, d.role]);
    setAddTitle("");
    setShowAdd(false);
  }

  // ── Import preset ────────────────────────────────────────────────────────────
  async function runImport() {
    setImportBusy(true);
    setImportMsg(null);
    const res = await fetch("/api/admin/roles/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgType: importType }),
    });
    const d = await res.json();
    setImportBusy(false);
    if (res.ok) {
      setImportMsg(`✓ ${d.added} new role${d.added !== 1 ? "s" : ""} added.`);
      load();
    } else {
      setImportMsg("Import failed. Please try again.");
    }
  }

  // ── Catalog suggestions (titles NOT yet in org) ──────────────────────────────
  const existingTitles = useMemo(() => new Set(roles.map((r) => r.title)), [roles]);
  const catalogSuggestions = useMemo(
    () => ROLE_CATALOG.filter((r) => !existingTitles.has(r.title)),
    [existingTitles],
  );

  // ── Filtered view ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return roles.filter((r) => {
      const q = search.toLowerCase();
      if (q && !r.title.toLowerCase().includes(q) && !r.category.toLowerCase().includes(q)) return false;
      if (activeFilter === "active"   && !r.active) return false;
      if (activeFilter === "inactive" &&  r.active) return false;
      if (catFilter !== "all" && r.category !== catFilter) return false;
      return true;
    });
  }, [roles, search, activeFilter, catFilter]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totalActive   = roles.filter((r) => r.active).length;
  const totalInactive = roles.filter((r) => !r.active).length;
  const totalCustom   = roles.filter((r) => r.isCustom).length;

  // Group filtered by category for display
  const grouped = useMemo(() => {
    const m = new Map<string, OrgRole[]>();
    for (const r of filtered) {
      if (!m.has(r.category)) m.set(r.category, []);
      m.get(r.category)!.push(r);
    }
    // Sort categories by display order
    const ordered = new Map<string, OrgRole[]>();
    for (const cat of ALL_CATEGORIES) {
      if (m.has(cat)) ordered.set(cat, m.get(cat)!);
    }
    // Any custom categories that don't match standard ones
    for (const [cat, list] of m) {
      if (!ordered.has(cat)) ordered.set(cat, list);
    }
    return ordered;
  }, [filtered]);

  return (
    <div className="animate-fade-in space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Role Catalog</h2>
          <p className="mt-1 text-sm text-surface-500">
            Manage the roles the AI can suggest. Only <span className="font-semibold text-primary-600">active</span> roles
            will appear in employee suggestions. {roles.length} roles total.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-import-preset"
            onClick={() => { setShowImport(true); setImportMsg(null); }}
            className="btn-ghost inline-flex items-center gap-2"
          >
            <Download size={14} />
            Import preset
          </button>
          <button
            id="btn-add-role"
            onClick={() => { setShowAdd(true); setAddError(null); }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={14} />
            Add role
          </button>
        </div>
      </div>

      {/* ── Stat chips ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active roles",    value: totalActive,              color: "stat-card-emerald", icon: CheckCircle2, ic: "text-emerald-500", ibg: "bg-emerald-50" },
          { label: "Inactive roles",  value: totalInactive,            color: "stat-card-amber",   icon: XCircle,      ic: "text-amber-500",  ibg: "bg-amber-50" },
          { label: "Custom roles",    value: totalCustom,              color: "stat-card-violet",  icon: Settings2,    ic: "text-violet-500", ibg: "bg-violet-50" },
          { label: "Catalog unused",  value: catalogSuggestions.length, color: "stat-card-indigo",  icon: Briefcase,    ic: "text-primary-500",ibg: "bg-primary-50" },
        ].map(({ label, value, color, icon: Icon, ic, ibg }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">{label}</p>
                <p className="mt-2 text-3xl font-extrabold text-surface-900">{value}</p>
              </div>
              <div className={`rounded-xl ${ibg} p-3`}>
                <Icon size={20} className={ic} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="card p-5 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            id="roles-search"
            className="input-search"
            style={{ maxWidth: "100%" }}
            placeholder="Search roles or categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Active filter */}
        <div className="flex rounded-xl border border-surface-200 overflow-hidden text-sm font-medium">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 transition-colors ${
                activeFilter === f
                  ? "bg-primary-600 text-white"
                  : "text-surface-500 hover:bg-surface-100"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          id="roles-cat-filter"
          className="field-select"
          style={{ width: "auto", minWidth: 160 }}
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value as RoleCategory | "all")}
        >
          <option value="all">All categories</option>
          {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <button onClick={load} className="btn-ghost inline-flex items-center gap-1.5 text-xs">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Import preset panel ────────────────────────────────────────────── */}
      {showImport && (
        <div className="card p-6 border-primary-200 animate-slide-up">
          <h3 className="font-bold text-surface-900 mb-1">Import preset roles</h3>
          <p className="text-sm text-surface-500 mb-4">
            Select an organization type and we&apos;ll bulk-add the relevant roles from the 100-role catalog.
            Roles already in your catalog are skipped.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              id="import-orgType"
              className="field-select"
              style={{ width: "auto", minWidth: 220 }}
              value={importType}
              onChange={(e) => setImportType(e.target.value as OrgType)}
            >
              {Object.entries(ORG_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <button
              id="btn-run-import"
              onClick={runImport}
              disabled={importBusy}
              className="btn-primary inline-flex items-center gap-2"
            >
              {importBusy ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
              {importBusy ? "Importing…" : "Import"}
            </button>
            <button onClick={() => setShowImport(false)} className="btn-ghost text-sm">
              Cancel
            </button>
          </div>
          {importMsg && (
            <p className={`mt-3 text-sm font-medium ${importMsg.startsWith("✓") ? "text-emerald-600" : "text-red-600"}`}>
              {importMsg}
            </p>
          )}
        </div>
      )}

      {/* ── Add role panel ─────────────────────────────────────────────────── */}
      {showAdd && (
        <div className="card p-6 border-primary-200 animate-slide-up">
          <h3 className="font-bold text-surface-900 mb-1">Add a role</h3>
          <p className="text-sm text-surface-500 mb-4">
            Type a role from the 100-role catalog to import it, or enter any custom title to create a bespoke role.
          </p>
          {addError && <div className="form-error mb-3">{addError}</div>}
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-56">
              <label className="field-label">Role title</label>
              <input
                id="add-role-title"
                className="field-input"
                list="catalog-list"
                placeholder="e.g. DevOps Engineer"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
              />
              <datalist id="catalog-list">
                {catalogSuggestions.map((r) => (
                  <option key={r.title} value={r.title} />
                ))}
              </datalist>
            </div>
            <div style={{ minWidth: 200 }}>
              <label className="field-label">Category</label>
              <select
                id="add-role-cat"
                className="field-select"
                value={addCat}
                onChange={(e) => setAddCat(e.target.value as RoleCategory)}
              >
                {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button
              id="btn-confirm-add"
              onClick={addRole}
              disabled={addBusy}
              className="btn-primary inline-flex items-center gap-2"
            >
              {addBusy ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
              {addBusy ? "Adding…" : "Add"}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Roles grid ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <RefreshCw size={28} className="text-primary-400 animate-spin mb-3" />
          <p className="text-sm text-surface-400">Loading role catalog…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <Briefcase size={28} className="text-surface-300 mb-3" />
          <p className="text-sm text-surface-500">No roles match your filters.</p>
          {roles.length === 0 && (
            <p className="mt-2 text-xs text-surface-400">
              Use &quot;Import preset&quot; to populate the catalog for your org type.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([cat, list]) => (
            <div key={cat} className="card p-6">
              {/* Category header */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${CAT_DOT[cat] ?? "bg-surface-400"}`} />
                <h3 className="font-semibold text-surface-900 text-sm">{cat}</h3>
                <span className={`badge ${CAT_BADGE[cat] ?? "badge-indigo"} text-[0.65rem] ml-1`}>
                  {list.filter((r) => r.active).length} / {list.length} active
                </span>
              </div>

              {/* Roles grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.map((role) => (
                  <div
                    key={role.id}
                    className={`card-soft p-4 flex items-center justify-between gap-2 transition-all ${
                      !role.active ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {role.isCustom && (
                        <span className="badge badge-violet shrink-0" style={{ fontSize: "0.6rem" }}>Custom</span>
                      )}
                      <p className="text-sm font-medium text-surface-800 truncate">{role.title}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Toggle */}
                      <button
                        id={`toggle-role-${role.id}`}
                        onClick={() => toggle(role)}
                        disabled={busy.has(role.id)}
                        title={role.active ? "Deactivate" : "Activate"}
                        className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
                      >
                        {busy.has(role.id)
                          ? <RefreshCw size={16} className="text-surface-400 animate-spin" />
                          : role.active
                          ? <ToggleRight size={18} className="text-emerald-500" />
                          : <ToggleLeft  size={18} className="text-surface-400" />}
                      </button>
                      {/* Delete */}
                      <button
                        id={`delete-role-${role.id}`}
                        onClick={() => del(role)}
                        disabled={busy.has(role.id)}
                        title="Remove from catalog"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-surface-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
