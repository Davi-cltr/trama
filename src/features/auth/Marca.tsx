export function Marca() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <path d="M3 9C9 4 17 14 23 9" fill="none" stroke="#B3264E" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M3 17C9 12 17 22 23 17" fill="none" stroke="#3552C4" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M9 3V23M17 3V23" fill="none" stroke="#1C2238" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span style={{ fontFamily: 'var(--fonte-titulo)', fontSize: 20 }}>Trama</span>
    </div>
  );
}
