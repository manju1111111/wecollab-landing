import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || "wecollab-session-hardening-default-secret-2026";

/**
 * Signs a payload object by encoding it to JSON and appending an HMAC-SHA256 signature.
 * 
 * @param payload The session payload to sign
 * @returns Signed cookie value in format "base64Payload.base64Signature"
 */
export function signSession(payload: any): string {
  const payloadStr = JSON.stringify(payload);
  const base64Payload = Buffer.from(payloadStr).toString("base64");
  
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(base64Payload)
    .digest("base64");
    
  return `${base64Payload}.${signature}`;
}

/**
 * Verifies a signed cookie value and returns the decrypted payload.
 * Returns null if the signature is invalid or tampered with.
 * 
 * @param signedCookie The signed cookie string
 * @returns Decrypted payload object, or null if invalid
 */
export function verifySession(signedCookie: string | undefined): any | null {
  if (!signedCookie) return null;
  
  const parts = signedCookie.split(".");
  if (parts.length !== 2) return null;
  
  const [base64Payload, signature] = parts;
  
  const expectedSignature = crypto
    .createHmac("sha256", SECRET)
    .update(base64Payload)
    .digest("base64");
    
  // Time-constant comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, "base64");
  const expectedBuffer = Buffer.from(expectedSignature, "base64");
  
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
  
  try {
    const payloadStr = Buffer.from(base64Payload, "base64").toString("utf8");
    return JSON.parse(payloadStr);
  } catch (e) {
    return null;
  }
}
