"use client";

import { useEffect, useState, ReactNode } from 'react';
import { api } from '../../lib/api';
import FlagCard from '../../components/FlagCard';
import { RoutingBadge, ActionBadge } from '../../components/RoutingBadge';

function HighlightedContent({ content, segments }: { content: string, segments: string[] }) {
  if (!segments?.length) return <span>{content}</span>;
  const marks: { start: number, end: number }[] = [];
  for (const seg of segments) {
    if (!seg) continue;
    let idx = 0;
    while (true) {
      const found = content.toLowerCase().indexOf(seg.toLowerCase(), idx);
      if (found === -1) break;
      marks.push({ start: found, end: found + seg.length });
      idx = found + 1;
    }
  }
  marks.sort((a, b) => a.start - b.start);
  const merged: { start: number, end: number }[] = [];
  for (const m of marks) {
    if (merged.length && m.start <= merged[merged.length - 1].end) {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, m.end);
    } else merged.push({ ...m });
  }
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of merged) {
    if (m.start > last) parts.push(<span key={`t${last}`}>{content.slice(last, m.start)}</span>);
    parts.push(<mark key={`m${m.start}`}>{content.slice(m.start, m.end)}</mark>);
    last = m.end;
  }
  if (last < content.length) parts.push(<span key={`t${last}`}>{content.slice(last)}</span>);
  return <>{parts}</>;
}

export default function ReviewQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [reviewer, setReviewer] = useState('moderator-1');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const [q, s] = await Promise.all([api.queue(), api.stats()]);
      setQueue(q);
      setStats(s);
      if (selected) {
        const stillInQueue = q.find((r: any) => r.id === selected.id);
        setSelected(stillInQueue ?? null);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function decide(finalAction: string) {
    if (!selected) return;
    setBusy(true); setError(null);
    try {
      await api.queueReview(selected.id, { reviewer, finalAction, notes: notes || undefined });
      setSelected(null);
      setNotes('');
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const flags = selected?.perFlag ? JSON.parse(selected.perFlag) : [];
  const segments = flags.map((f: any) => f.segment) || [];
  const thread = selected?.thread ? JSON.parse(selected.thread) : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">👥 Human Review Queue</h1>
        <p className="page-subtitle">Review AI-flagged content, see full context and reasoning, then make the final call</p>
      </div>

      {stats && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card"><div className="stat-value">{stats.pendingReview}</div><div className="stat-label">Pending Review</div></div>
          <div className="stat-card"><div className="stat-value">{stats.reviewed}</div><div className="stat-label">Reviewed</div></div>
          <div className="stat-card"><div className="stat-value">{stats.humanOverrides}</div><div className="stat-label">AI Overrides</div></div>
          <div className="stat-card"><div className="stat-value">{stats.aiHumanAgreement === null ? '—' : `${Math.round(stats.aiHumanAgreement * 100)}%`}</div><div className="stat-label">Agreement Rate</div></div>
        </div>
      )}

      {error && <div className="banner banner-error">{error}</div>}

      <div className="grid-2">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-solid)' }}>
            <div className="flex-between">
              <h2 className="card-title" style={{ margin: 0 }}>Queue ({queue.length})</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="muted small">Reviewer:</span>
                <input
                  type="text"
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  style={{ width: 140, padding: '4px 8px' }}
                />
              </div>
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <p>Queue is empty. Submit borderline content to populate it.</p>
            </div>
          ) : (
            <ul className="queue-list">
              {queue.map((r) => {
                const primaryFlag = r.primaryFlag ? JSON.parse(r.primaryFlag) : null;
                return (
                  <li
                    key={r.id}
                    className={`queue-item ${selected?.id === r.id ? 'selected' : ''}`}
                    onClick={() => { setSelected(r); setNotes(''); }}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <RoutingBadge routing={r.routing} />
                      <span className="muted small">{r.policyName}</span>
                    </div>
                    <div className="queue-item-content">{r.content}</div>
                    {primaryFlag && (
                      <div className="queue-item-meta">→ {primaryFlag.category.replace(/_/g, ' ')} ({Math.round(primaryFlag.confidence * 100)}%)</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Reviewer Workspace</h2>

          {!selected && (
            <div className="empty-state">
              <div className="empty-icon">👈</div>
              <p>Select a queued item to review.</p>
            </div>
          )}

          {selected && (
            <div>
              <div className="decision-header">
                <span className="muted small">AI recommends:</span>
                <ActionBadge action={selected.action} />
              </div>

              <div className="section-title">Content</div>
              <div className="content-box">
                <HighlightedContent content={selected.content} segments={segments} />
              </div>

              <div className="section-title">Full Context</div>
              <ul className="ctx-list">
                <li><b>Platform:</b> {selected.policyName}</li>
                {selected.surface && <li><b>Surface:</b> {selected.surface}</li>}
                {selected.userHistory && <li><b>Author history:</b> {selected.userHistory}</li>}
                {thread.length > 0 && (
                  <li>
                    <b>Thread:</b>
                    <div className="thread">
                      {thread.map((m: any, i: number) => (
                        <div key={i} className="thread-msg">
                          <span className="thread-author">{m.author}:</span> {m.text}
                        </div>
                      ))}
                    </div>
                  </li>
                )}
              </ul>

              <div className="section-title">AI Reasoning</div>
              <p className="muted">{selected.contextNotes || '—'}</p>

              <div className="section-title">Per-Category Flags</div>
              {flags.map((f: any, i: number) => <FlagCard key={i} flag={f} />)}

              <div className="section-title">Your Decision</div>
              <textarea
                rows={2}
                placeholder="Reviewer notes (optional) — captured as model-improvement feedback"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ marginBottom: 12 }}
              />

              <div className="review-actions">
                <button className="btn btn-success" onClick={() => decide('allow')}  disabled={busy}>✅ Allow</button>
                <button className="btn btn-warning" onClick={() => decide('review')} disabled={busy}>⏳ Keep Under Review</button>
                <button className="btn btn-danger"  onClick={() => decide('block')}  disabled={busy}>🚫 Block</button>
              </div>

              <p className="muted small" style={{ marginTop: 10 }}>
                Choosing anything other than "{selected.action}" records an override and saves it as feedback for model improvement.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
