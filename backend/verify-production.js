"use strict";

const https = require("https");

function get(path) {
  return new Promise(r => {
    https.get(`https://art-studio-mh42.onrender.com${path}`, res => {
      let b = ""; res.on("data", c => b += c);
      res.on("end", () => { try { r({ status: res.statusCode, body: JSON.parse(b) }); } catch { r({ status: res.statusCode, body: b.substring(0,100) }); } });
    }).on("error", e => r({ status: "ERR", body: e.message }));
  });
}

function post(path, body) {
  return new Promise(r => {
    const d = JSON.stringify(body);
    const req = https.request({
      hostname: "art-studio-mh42.onrender.com",
      path, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(d) }
    }, res => {
      let b = ""; res.on("data", c => b += c);
      res.on("end", () => { try { r({ status: res.statusCode, body: JSON.parse(b) }); } catch { r({ status: res.statusCode, body: b.substring(0,200) }); } });
    });
    req.on("error", e => r({ status: "ERR", body: e.message }));
    req.write(d); req.end();
  });
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function poll() {
  const MAX = 40;
  for (let i = 1; i <= MAX; i++) {
    const now = new Date().toLocaleTimeString();
    console.log(`\n[Attempt ${i}/${MAX}] ${now}`);

    const health = await get("/health");
    if (health.status === 200 && health.body && health.body.version === "2026-08-22-resend-final-http") {
      console.log("✓ NEW CODE DETECTED via /health:", JSON.stringify(health.body));

      // Now test OTP routes
      const fp = await post("/forgot-password", { email: "shivaniramakrishnan7@gmail.com" });
      console.log("/forgot-password =>", fp.status, JSON.stringify(fp.body).substring(0, 100));

      const ve = await post("/verify-email", { email: "t@t.com", otp: "123456" });
      console.log("/verify-email    =>", ve.status, JSON.stringify(ve.body).substring(0, 100));

      const reg = await post("/register", { name: "t", email: `test_${Date.now()}@x.com`, password: "123456" });
      console.log("/register (OTP)  =>", reg.status, JSON.stringify(reg.body).substring(0, 100));

      console.log("\n=== PRODUCTION DEPLOYMENT VERIFIED ===");
      process.exit(0);
    } else {
      console.log("/health =>", health.status, JSON.stringify(health.body).substring(0, 100));
      console.log("Old code still running. Waiting 15s...");
    }
    await delay(15000);
  }
  console.log("Timed out.");
  process.exit(1);
}

poll();
