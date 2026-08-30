export function AppShell({ children }) {
  return (
    <main className="wardround-app">
      <header className="app-shell__header">
        <a className="app-shell__brand" href="#live-ward" aria-label="Wardround live ward">
          <span className="app-shell__brand-mark" aria-hidden="true" />
          <span>Wardround</span>
        </a>
        <a className="app-shell__live-link" href="#live-ward">
          Live ward
        </a>
      </header>
      {children}
    </main>
  );
}
