#!/usr/bin/env node
// generate-icons.js — يولد أيقونتي 192 و 512 بكسل بـ Canvas API (Node.js)
// شغّل: node generate-icons.js

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // خلفية
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#0d9488");
  grad.addColorStop(1, "#0f766e");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.22);
  ctx.fill();

  // رمز طبي (+)
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  const cx = size / 2, cy = size / 2;
  const arm = size * 0.18, thick = size * 0.1;
  // أفقي
  ctx.fillRect(cx - arm, cy - thick / 2, arm * 2, thick);
  // عمودي
  ctx.fillRect(cx - thick / 2, cy - arm, thick, arm * 2);

  return canvas.toBuffer("image/png");
}

const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

try {
  fs.writeFileSync(path.join(publicDir, "icon-192.png"), generateIcon(192));
  fs.writeFileSync(path.join(publicDir, "icon-512.png"), generateIcon(512));
  console.log("✅ أيقونات PWA تم توليدها في /public");
} catch (e) {
  console.error("❌ فشل توليد الأيقونات:", e.message);
  console.log("💡 شغّل: npm install canvas  ثم أعد التشغيل");
  console.log("   أو ضع أيقوناتك يدوياً في /public/icon-192.png و /public/icon-512.png");
}