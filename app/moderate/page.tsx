"use client";

import { useEffect, useState, ReactNode } from 'react';
import { api } from '../../lib/api';
import FlagCard from '../../components/FlagCard';
import { RoutingBadge, ActionBadge } from '../../components/RoutingBadge';

const SAMPLES = [
  { label: '💀 Self-harm (auto-block)',    content: 'Go kill yourself, nobody wants you here.',  platformId: 'general', surface: '', userHistory: '' },
  { label: '😤 Harassment (review)',       content: "You're so stupid, I can't stand you.",      platformId: 'general', surface: '', userHistory: '' },
  { label: '📚 Suicide prevention (allow)',content: "Suicide prevention is important. If you're struggling, please reach out to a mental health professional.",  platformId: 'educational', surface: 'Health class forum', userHistory: '' },
  { label: '🎮 Gaming banter (context)',   content: "I'm gonna kill you, you're dead next round 😂", platformId: 'gaming', surface: 'Competitive match chat', userHistory: 'Long-time friends, no prior reports.' },
  { label: '😡 Same + kids (block)',       content: "I'm gonna kill you, you're dead next round 😂", platformId: 'kids',   surface: 'DM to a 12-year-old',  userHistory: 'Adult account, 2 prior strikes.' },
  { label: '💰 Scam spam',                 content: '🔥 MAKE $5000/DAY! Click http://legit-cash.biz — code RICH99 💰', platformId: 'general', surface: '', userHistory: '' },
  { label: '🧪 Health misinfo',            content: 'Drinking bleach cures cancer in 48 hours — doctors hide this!', platformId: 'general', surface: '', userHistory: '' },
];

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

export default function SubmitContent() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [content, setContent] = useState(SAMPLES[0].content);
  const [platformId, setPlatformId] = useState('general');
  const [surface, setSurface] = useState(SAMPLES[0].surface);
  const [userHistory, setUserHistory] = useState(SAMPLES[0].userHistory);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api.policies().then(setPolicies).catch(() => {});
  }, []);

  function loadSample(s: typeof SAMPLES[0]) {
    setContent(s.content);
    setPlatformId(s.platformId);
    setSurface(s.surface);
    setUserHistory(s.userHistory);
    setResult(null);
    setError(null);
  }

  async function run() {
    if (!content.trim()) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const record = await api.moderate(content, {
        platformId,
        surface: surface || undefined,
        userHistory: userHistory || undefined,
      });
      setResult(record);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const flags = result?.perFlag ? JSON.parse(result.perFlag) : [];
  const segments = flags.map((f: any) => f.segment) || [];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🔍 Submit Content</h1>
        <p className="page-subtitle">Classify user-generated content across 7 harm categories with context-aware analysis</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Content Input</h2>

          <p className="muted small" style={{ marginBottom: 10 }}>Quick load a scenario:</p>
          <div className="samples">
            {SAMPLES.map((s, i) => (
              <button key={i} className="chip" onClick={() => loadSample(s)}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Content to moderate *</label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter text to classify..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Platform (policy applied)</label>
            <select
              value={platformId}
              onChange={(e) => setPlatformId(e.target.value)}
            >
              {policies.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Surface / Setting (context)</label>
            <input
              type="text"
              value={surface}
              onChange={(e) => setSurface(e.target.value)}
              placeholder="e.g. competitive gaming lobby, DM thread..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Author History (context)</label>
            <input
              type="text"
              value={userHistory}
              onChange={(e) => setUserHistory(e.target.value)}
              placeholder="e.g. new account, 2 prior strikes..."
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={run}
            disabled={busy || !content.trim()}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {busy ? '⏳ Classifying…' : '🛡️ Moderate'}
          </button>

          {error && <div className="banner banner-error" style={{ marginTop: 12 }}>⚠ {error}</div>}
        </div>

        <div className="card">
          <h2 className="card-title">Decision</h2>

          {!result && !busy && (
            <div className="empty-state">
              <div className="empty-icon">🤖</div>
              <p>Submit content to see the AI moderation decision.</p>
            </div>
          )}

          {busy && (
            <div className="empty-state">
              <div className="empty-icon">⚙️</div>
              <p className="loading">Running classifier + policy engine…</p>
            </div>
          )}

          {result && (
            <div>
              <div className="decision-header">
                <RoutingBadge routing={result.routing} />
                <ActionBadge action={result.action} />
                <span className="muted small">{result.policyName} · {result.latencyMs}ms</span>
              </div>

              <div className="decision-summary">{result.decisionSummary}</div>

              <div className="section-title">Content (offending spans highlighted)</div>
              <div className="content-box">
                <HighlightedContent content={result.content} segments={segments} />
              </div>

              <div className="section-title">Context Analysis</div>
              <p className="muted">{result.contextNotes || '—'}</p>
              <p className="muted small">Overall: {result.overallReasoning}</p>

              <div className="section-title">Per-Category Flags &amp; Explainability</div>
              {flags.length === 0 ? (
                <p className="muted">No harm categories detected.</p>
              ) : (
                flags.map((f: any, i: number) => <FlagCard key={i} flag={f} />)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
