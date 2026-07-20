// Dummy data standing in for a real UIDAI Sandbox eKYC/credentials endpoint.
const MOCK_CREDENTIALS = [
  {
    id: "cred-001",
    type: "Aadhaar eKYC",
    holderName: "Aarav Sharma",
    issuedBy: "UIDAI Sandbox",
    issuedOn: "2024-03-12",
    sensitiveValue: "234567891234", // mock Aadhaar-like number
  },
  {
    id: "cred-002",
    type: "Digital Address Proof",
    holderName: "Aarav Sharma",
    issuedBy: "UIDAI Sandbox",
    issuedOn: "2023-11-02",
    sensitiveValue: "SANDBX0098271",
  },
  {
    id: "cred-003",
    type: "Mobile Verification",
    holderName: "Aarav Sharma",
    issuedBy: "UIDAI Sandbox",
    issuedOn: "2025-01-19",
    sensitiveValue: "9876543210",
  },
];

/**
 * Simulated GET /api/credentials
 * @param {{ shouldFail?: boolean, delayMs?: number, empty?: boolean }} options
 */
export function fetchCredentials({ shouldFail = false, delayMs = 900, empty = false } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error("Failed to fetch credentials from UIDAI Sandbox API."));
        return;
      }
      resolve(empty ? [] : MOCK_CREDENTIALS);
    }, delayMs);
  });
}
