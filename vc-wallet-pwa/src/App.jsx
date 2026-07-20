import { useCallback, useMemo, useState } from "react";
import { CredentialsProvider } from "./context/CredentialsContext";
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/LoginScreen";
import "./styles.css";

export default function App() {
  // Mock session state — no real backend, so this simply gates the dashboard
  // behind a login form per the scenario ("a test user can log in...").
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = useCallback((username) => setCurrentUser(username), []);
  const handleLogout = useCallback(() => setCurrentUser(null), []);

  // Memoized so the provider doesn't tear down/rebuild its effect on every render.
  // Flip `shouldFail` or `empty` to true here to demo the Error / Empty states.
  const apiOptions = useMemo(() => ({ shouldFail: false, empty: false, delayMs: 900 }), []);

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <CredentialsProvider apiOptions={apiOptions}>
      <header className="app-header">
        <div>
          <h1>Verifiable Credential Wallet</h1>
          <p>UIDAI Sandbox — Digital Identity Dashboard</p>
        </div>
        <div className="app-header__user">
          <span>Signed in as {currentUser}</span>
          <button type="button" onClick={handleLogout} className="app-header__logout">
            Log Out
          </button>
        </div>
      </header>
      <main>
        <Dashboard />
      </main>
    </CredentialsProvider>
  );
}
