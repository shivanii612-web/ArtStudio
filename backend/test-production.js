"use strict";
const https = require("https");

function post(hostname, path, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          "Origin": "https://artstudio-eta.vercel.app",
        },
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          const corsHeader = res.headers["access-control-allow-origin"] || "(not set)";
          try {
            resolve({ status: res.statusCode, body: JSON.parse(buf), cors: corsHeader });
          } catch {
            resolve({ status: res.statusCode, body: buf, cors: corsHeader });
          }
        });
      }
    );
    req.on("error", (e) => resolve({ status: 0, body: { message: e.message }, cors: "N/A" }));
    req.write(data);
    req.end();
  });
}

async function run() {
  const HOST = "art-studio-mh42.onrender.com";

  console.log("=== PRODUCTION DIAGNOSIS ===");
  console.log("Backend:", "https://" + HOST);
  console.log("Frontend:", "https://artstudio-eta.vercel.app");
  console.log("");

  // 1. Test /register
  console.log("--- TEST 1: POST /register ---");
  const randomEmail = `prod_test_${Date.now()}@gmail.com`;
  console.log("Registering with:", randomEmail);
  const r1 = await post(HOST, "/register", {
    name: "Prod Test",
    email: randomEmail,
    password: "Test1234!",
  });
  console.log("Status         :", r1.status);
  console.log("Response       :", JSON.stringify(r1.body));
  console.log("CORS header    :", r1.cors);
  console.log("");

  // 2. Test /forgot-password with a real registered email
  console.log("--- TEST 2: POST /forgot-password ---");
  const r2 = await post(HOST, "/forgot-password", {
    email: "harivarshan610@gmail.com",
  });
  console.log("Status         :", r2.status);
  console.log("Response       :", JSON.stringify(r2.body));
  console.log("CORS header    :", r2.cors);
  console.log("");

  // 3. Test /AllProducts to confirm backend is alive
  const https2 = require("https");
  const r3 = await new Promise((res) => {
    https2.get("https://" + HOST + "/AllProducts", (resp) => {
      let buf = "";
      resp.on("data", c => buf += c);
      resp.on("end", () => {
        try { const j = JSON.parse(buf); res({ status: resp.statusCode, count: (j.products || j.data || []).length }); }
        catch { res({ status: resp.statusCode, body: buf.substring(0, 100) }); }
      });
    }).on("error", e => res({ status: 0, msg: e.message }));
  });
  console.log("--- TEST 3: GET /AllProducts ---");
  console.log("Status         :", r3.status);
  console.log("Product count  :", r3.count !== undefined ? r3.count : r3.body || r3.msg);
}

run().catch(console.error);
