export function PreviewRibbon() {
  if (import.meta.env.VITE_APP_ENV !== 'preview') {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="Preview environment indicator"
      style={{
        position: 'fixed',
        bottom: '8px',
        right: '8px',
        zIndex: 9999,
        padding: '4px 10px',
        backgroundColor: '#fef3c7',
        color: '#92400e',
        border: '1px solid #f59e0b',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      Preview · sample data
    </div>
  );
}
