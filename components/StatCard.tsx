export default function StatCard({ label, value, highlight, icon }: { label: string, value: string | number | null, highlight?: boolean, icon?: string }) {
  return (
    <div className={`stat-card ${highlight ? 'highlight' : ''}`}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
