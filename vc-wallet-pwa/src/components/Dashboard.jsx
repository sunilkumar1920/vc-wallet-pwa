import { useCredentials } from "../context/CredentialsContext";
import CredentialCard from "./CredentialCard";

export default function Dashboard() {
  const { isLoading, isError, isEmpty, credentials, error, refetch } = useCredentials();

  if (isLoading) {
    return (
      <div className="state-panel" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>Loading your credentials…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="state-panel state-panel--error" role="alert">
        <p>Something went wrong: {error}</p>
        <button type="button" onClick={refetch}>
          Retry
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="state-panel">
        <p>You don't have any credentials yet.</p>
        <button type="button" onClick={refetch}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <ul className="credential-grid">
      {credentials.map((cred) => (
        <CredentialCard key={cred.id} credential={cred} />
      ))}
    </ul>
  );
}
