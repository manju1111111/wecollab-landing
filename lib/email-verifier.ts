import { promises as dns } from "dns";

/**
 * Verifies if an email address has a valid format and its domain resolves active MX (mail exchange) records.
 * This is a 100% free, self-hosted verification method that requires no third-party APIs.
 * 
 * @param email The email address to verify
 * @returns Promise<boolean> True if the email domain can receive email, false otherwise
 */
export async function verifyEmail(email: string): Promise<boolean> {
  if (!email || typeof email !== "string") return false;

  const cleanEmail = email.trim();

  // 1. Basic formatting regex check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    console.log(`[EMAIL_VERIFICATION] Invalid format: ${cleanEmail}`);
    return false;
  }

  // 2. Extract domain
  const domain = cleanEmail.split("@")[1];
  if (!domain) return false;

  try {
    console.log(`[EMAIL_VERIFICATION] Resolving DNS MX records for domain: ${domain}`);
    
    // Resolve Mail Exchange (MX) records for the domain
    const mxRecords = await dns.resolveMx(domain);
    
    if (mxRecords && mxRecords.length > 0) {
      console.log(`[EMAIL_VERIFICATION] Success: Found ${mxRecords.length} MX record(s) for ${domain}`);
      return true;
    }
    
    console.warn(`[EMAIL_VERIFICATION] Failed: No MX records found for ${domain}`);
    return false;
  } catch (error: any) {
    // Fail-open for network/connection blockages (like ECONNREFUSED in firewalled environments)
    if (error && (error.code === "ECONNREFUSED" || error.code === "EREFUSED" || error.code === "ESERVFAIL")) {
      console.warn(`[EMAIL_VERIFICATION] DNS server connection failed (${error.code || error}). Failsafe: falling back to format check.`);
      return true; 
    }
    console.warn(`[EMAIL_VERIFICATION] DNS MX resolution failed for ${domain}:`, error.message || error);
    return false;
  }
}
