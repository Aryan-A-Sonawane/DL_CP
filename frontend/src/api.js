const API_BASE = '/api';

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard-stats`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function fetchEmployees(search = '') {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${API_BASE}/employees${params}`);
  if (!res.ok) throw new Error('Failed to fetch employees');
  return res.json();
}

export async function fetchEmployee(id) {
  const res = await fetch(`${API_BASE}/employees/${id}`);
  if (!res.ok) throw new Error('Failed to fetch employee');
  return res.json();
}

export async function analyzeProfile(employeeId) {
  const res = await fetch(`${API_BASE}/analyze-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: employeeId }),
  });
  if (!res.ok) throw new Error('Analysis failed');
  return res.json();
}

export async function runEthicalAudit(suggestionId) {
  const res = await fetch(`${API_BASE}/ethical-audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suggestion_id: suggestionId }),
  });
  if (!res.ok) throw new Error('Audit failed');
  return res.json();
}

export async function fetchSuggestions() {
  const res = await fetch(`${API_BASE}/suggestions`);
  if (!res.ok) throw new Error('Failed to fetch suggestions');
  return res.json();
}
