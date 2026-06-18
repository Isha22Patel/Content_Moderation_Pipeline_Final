export const api = {
  health: () => fetch('/api/health').then(r => r.json()),
  categories: () => fetch('/api/categories').then(r => r.json()),
  stats: () => fetch('/api/stats').then(r => r.json()),
  records: () => fetch('/api/records').then(r => r.json()),
  moderate: (content: string, context: any) =>
    fetch('/api/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, context }),
    }).then(r => {
      if (!r.ok) return r.json().then(e => Promise.reject(new Error(e.error)));
      return r.json();
    }),
  policies: () => fetch('/api/policies').then(r => r.json()),
  policyUpdate: (id: string, updates: any) =>
    fetch(`/api/policies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(r => r.json()),
  policyReset: () => fetch('/api/policies/reset', { method: 'POST' }).then(r => r.json()),
  queue: () => fetch('/api/queue').then(r => r.json()),
  queueReview: (id: string, decision: any) =>
    fetch(`/api/queue/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(decision),
    }).then(r => r.json()),
  feedback: () => fetch('/api/feedback').then(r => r.json()),
};
