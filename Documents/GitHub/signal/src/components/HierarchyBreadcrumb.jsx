/**
 * Displays a breadcrumb trail for the region drill-down hierarchy.
 * crumbs: [{ id, name, type }]
 */
export default function HierarchyBreadcrumb({ crumbs = [], onNavigate }) {
  if (crumbs.length <= 1) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
        padding: '6px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: 12,
      }}
    >
      {crumbs.map((crumb, i) => (
        <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {i > 0 && <span style={{ color: 'var(--text-muted)' }}>›</span>}
          {i < crumbs.length - 1 ? (
            <button
              className="btn-icon"
              style={{ fontSize: 12, color: 'var(--accent)', padding: '2px 4px' }}
              onClick={() => onNavigate(crumb)}
            >
              {crumb.name}
            </button>
          ) : (
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {crumb.name}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
