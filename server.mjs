/**
 * server.mjs — Plain JavaScript Express server (no TypeScript)
 * Run with: node server.mjs
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Load .env manually ──────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  const envFile = readFileSync(path.join(__dirname, '.env'), 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
  console.log('[OK] .env loaded');
} catch (e) {
  console.error('[WARN] Could not load .env:', e.message);
}

// ── Config ──────────────────────────────────────────────────────────────────
const PORT        = parseInt(process.env.SERVER_PORT || '4000', 10);
const OTP_TTL_SEC = parseInt(process.env.OTP_TTL_SECONDS || '300', 10);
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const SMTP_HOST   = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT   = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER   = process.env.SMTP_USER || '';
const SMTP_PASS   = process.env.SMTP_PASS || '';
const SMTP_FROM   = process.env.SMTP_FROM || `Finance Tracker Pro <${SMTP_USER}>`;

console.log('[OK] Config loaded');
console.log('[OK] SMTP_USER:', SMTP_USER);
console.log('[OK] SUPABASE_URL:', SUPABASE_URL);

// ── Supabase ────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log('[OK] Supabase client created');

// ── Nodemailer ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});
console.log('[OK] Nodemailer transporter created');

// ── Email template ──────────────────────────────────────────────────────────
function buildEmailHtml(otp, purpose) {
  const year = new Date().getFullYear();
  return `
<div style="font-family:sans-serif;background:#09090b;padding:32px 16px;border-radius:12px;color:#e4e4e7;border:1px solid #27272a;max-width:500px;margin:0 auto;">
  <h2 style="color:#e4e4e7;text-align:center;">Finance Tracker Pro</h2>
  <p style="color:#a1a1aa;">Your OTP for <strong style="color:#34d399;">${purpose}</strong>:</p>
  <div style="text-align:center;background:#18181b;border:1px solid #27272a;padding:24px;border-radius:12px;margin:24px 0;">
    <div style="font-size:36px;font-family:monospace;font-weight:900;letter-spacing:8px;color:#10b981;">${otp}</div>
    <p style="color:#71717a;font-size:12px;margin-top:8px;">Expires in ${Math.round(OTP_TTL_SEC / 60)} minutes</p>
  </div>
  <p style="color:#71717a;font-size:11px;">If you did not request this, please ignore this email.</p>
  <p style="color:#71717a;font-size:10px;text-align:center;">Finance Tracker Pro - ${year}</p>
</div>`;
}

// ── Express app ─────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── POST /api/otp/send ───────────────────────────────────────────────────────
app.post('/api/otp/send', async (req, res) => {
  const { recipient, purpose } = req.body;
  console.log('[otp/send] recipient:', recipient);

  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    return res.status(400).json({ success: false, error: 'A valid email address is required.' });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_SEC * 1000);
  const otpPurpose = purpose || 'Security Authentication';

  const { error: updateError } = await supabase
    .from('otps')
    .update({ used: true })
    .eq('recipient', recipient.toLowerCase())
    .eq('purpose', otpPurpose)
    .eq('used', false);

  if (updateError) console.error('[otp/send] Supabase update error:', updateError.message);

  const { error: insertError } = await supabase
    .from('otps')
    .insert({
      recipient: recipient.toLowerCase(),
      otp,
      purpose: otpPurpose,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      used: false
    });

  if (insertError) {
    console.error('[otp/send] Supabase insert error:', insertError.message);
    return res.status(500).json({ success: false, error: 'Failed to store OTP: ' + insertError.message });
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: recipient,
      subject: `[Finance Tracker Pro] Your OTP: ${otp}`,
      html: buildEmailHtml(otp, otpPurpose)
    });
    console.log('[otp/send] Email sent to:', recipient, '| OTP:', otp);
    return res.json({ success: true, message: 'OTP sent to ' + recipient });
  } catch (err) {
    console.error('[otp/send] Email error:', err.message);
    return res.status(500).json({ success: false, error: 'Email delivery failed: ' + err.message });
  }
});

// ── POST /api/otp/verify ─────────────────────────────────────────────────────
app.post('/api/otp/verify', async (req, res) => {
  const { recipient, otp, purpose } = req.body;
  console.log('[otp/verify] recipient:', recipient);

  if (!recipient || !otp || !purpose) {
    return res.status(400).json({ success: false, error: 'recipient, otp and purpose are required.' });
  }

  const { data, error } = await supabase
    .from('otps')
    .select('id')
    .eq('recipient', recipient.toLowerCase())
    .eq('otp', otp)
    .eq('purpose', purpose)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return res.status(401).json({ success: false, error: 'Invalid or expired OTP.' });
  }

  await supabase.from('otps').update({ used: true }).eq('id', data.id);
  console.log('[otp/verify] Verified for:', recipient);
  return res.json({ success: true, message: 'OTP verified successfully.' });
});

// ── GET /api/health ──────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const { error } = await supabase.from('otps').select('id').limit(1);
  res.json({ status: 'ok', supabase: !error, time: new Date().toISOString() });
});

// ── Start server ─────────────────────────────────────────────────────────────
console.log('[OK] Starting server on port', PORT);
app.listen(PORT, '0.0.0.0', () => {
  console.log('[READY] Server listening at http://localhost:' + PORT);
}).on('error', (err) => {
  console.error('[ERROR] Server failed to start:', err.message);
  process.exit(1);
});
