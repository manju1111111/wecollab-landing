import * as dotenv from "dotenv";
import path from "path";

// Load local environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function runTests() {
  console.log(`=== RUNNING ROUTING SMOKE TESTS ON ${BASE_URL} ===\n`);
  let passed = true;

  // Test 1: Accessing /discover when logged out -> should redirect to /brand/login
  try {
    console.log("TEST 1: Logged-out access to /discover...");
    const res = await fetch(`${BASE_URL}/discover`, { redirect: "manual" });
    const status = res.status;
    const location = res.headers.get("location") || "";
    
    if ((status === 307 || status === 308 || status === 302) && location.includes("/brand/login")) {
      console.log("✅ PASS: Correctly redirected to login page.");
    } else {
      console.error(`❌ FAIL: Expected redirect to /brand/login, got status ${status} and location "${location}"`);
      passed = false;
    }
  } catch (e: any) {
    console.error("❌ TEST 1 ERROR:", e.message);
    passed = false;
  }

  // Test 2: Accessing /brand/login when logged in -> should redirect to /discover
  try {
    console.log("\nTEST 2: Logged-in access to /brand/login...");
    // Simulate brand session cookie
    const mockSessionCookie = 'brand_session={"id":"test-brand-id","role":"brand"}.signature';
    const res = await fetch(`${BASE_URL}/brand/login`, {
      headers: { Cookie: mockSessionCookie },
      redirect: "manual"
    });
    const status = res.status;
    const location = res.headers.get("location") || "";

    if ((status === 307 || status === 308 || status === 302) && location.endsWith("/discover")) {
      console.log("✅ PASS: Logged-in brand correctly redirected to /discover.");
    } else {
      console.error(`❌ FAIL: Expected redirect to /discover, got status ${status} and location "${location}"`);
      passed = false;
    }
  } catch (e: any) {
    console.error("❌ TEST 2 ERROR:", e.message);
    passed = false;
  }

  // Test 3: Accessing /brand/login when logged out -> should render login form (200 OK)
  try {
    console.log("\nTEST 3: Logged-out access to /brand/login...");
    const res = await fetch(`${BASE_URL}/brand/login`, { redirect: "manual" });
    const status = res.status;

    if (status === 200) {
      console.log("✅ PASS: Login page rendered successfully.");
    } else {
      console.error(`❌ FAIL: Expected 200 OK, got status ${status}`);
      passed = false;
    }
  } catch (e: any) {
    console.error("❌ TEST 3 ERROR:", e.message);
    passed = false;
  }

  console.log("\n=== TEST RUN SUMMARY ===");
  if (passed) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error("🚨 SOME TESTS FAILED! Please check the logs above.");
    process.exit(1);
  }
}

runTests();
