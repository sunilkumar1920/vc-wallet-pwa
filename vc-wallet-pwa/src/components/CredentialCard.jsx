import { memo } from "react";
import SecureDataMask from "./SecureDataMask";

function CredentialCard({ credential }) {
  const { type, holderName, issuedBy, issuedOn, sensitiveValue } = credential;

  return (
    <li className="credential-card" aria-label={`${type} credential`}>
      <div className="credential-card__header">
        <h3>{type}</h3>
        <span className="credential-card__issuer">{issuedBy}</span>
      </div>
      <dl className="credential-card__body">
        <dt>Holder</dt>
        <dd>{holderName}</dd>
        <dt>Issued on</dt>
        <dd>{issuedOn}</dd>
        <dt>Identifier</dt>
        <dd>
          <SecureDataMask value={sensitiveValue} label={`${type} identifier`} />
        </dd>
      </dl>
    </li>
  );
}

export default memo(CredentialCard);
