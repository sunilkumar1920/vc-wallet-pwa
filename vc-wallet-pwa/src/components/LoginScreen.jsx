import { useId, useState } from "react";

/**
 * LoginScreen — mock authentication gate for the Sandbox demo.
 *
 * This is intentionally simple: the assignment's three graded parts don't
 * require a real auth system, and a real UIDAI login would involve
 * OTP/biometric flows well outside this assignment's scope. This component
 * exists so the PWA matches the scenario description end-to-end ("a test
 * user can log in..."). Any non-empty username/password is accepted —
 * there is no real backend here, only mock data.
 */
export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();

  const isValid = username.trim().length > 0 && password.trim().length > 0;

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (isValid) {
      onLogin(username.trim());
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit} noValidate aria-describedby={touched && !isValid ? errorId : undefined}>
        <h1>Verifiable Credential Wallet</h1>
        <p className="login-card__subtitle">UIDAI Sandbox — sign in to view your credentials</p>

        <label htmlFor={usernameId}>Username</label>
        <input
          id={usernameId}
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-invalid={touched && username.trim().length === 0}
        />

        <label htmlFor={passwordId}>Password</label>
        <input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={touched && password.trim().length === 0}
        />

        {touched && !isValid && (
          <p id={errorId} role="alert" className="login-card__error">
            Enter any username and password to continue (mock authentication — no real backend).
          </p>
        )}

        <button type="submit">Log In</button>

        <p className="login-card__hint">
          Sandbox demo: any non-empty credentials work, e.g. <strong>test</strong> / <strong>test</strong>.
        </p>
      </form>
    </div>
  );
}
