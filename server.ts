/**
 * server.ts — Express backend for OTP generation, Supabase storage, and Nodemailer delivery
 * Run with: npx tsx server.ts
 */

import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ──────────────────────────────────────────────
// Config — pulled from .env
// ──────────────────────────────────────────────
const PORT        = parseInt(process.env.SERVER_PORT || '4000', 10);
const OTP_TTL_SEC = parseInt(process.env.OTP_TTL_SECONDS || '300', 10); // 5 min default

const SUPABASE_URL  = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const SMTP_HOST   = process.env.SMTP_HOST   || 'smtp.gmail.com';
const SMTP_PORT   = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER   = process.env.SMTP_USER   || '';
const SMTP_PASS   = process.env.SMTP_PASS   || '';
const SMTP_FROM   = process.env.SMTP_FROM   || `"Finance Tracker Pro" <${SMTP_USER}>`;

// ──────────────────────────────────────────────
// Supabase client
// ──────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ──────────────────────────────────────────────
// Nodemailer transporter
// ──────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

// ──────────────────────────────────────────────
// HTML email template
// ──────────────────────────────────────────────
function buildEmailHtml(otp: string, purpose: string): string {
  const year = new Date().getFullYear();
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#09090b;padding:32px 16px;border-radius:12px;color:#e4e4e7;border:1px solid #27272a;max-width:500px;margin:0 auto;">
  <div style="text-align:center;border-bottom:1px solid #27272a;padding-bottom:16px;margin-bottom:24px;">
    <div style="display:inline-block;padding:8px;background:#064e3b;border:1px solid #059669;border-radius:8px;margin-bottom:8px;">
      <span style="font-size:20px;">🛡️</span>
    </div>
    <h2 style="margin:0;font-size:18px;color:#e4e4e7;font-weight:bold;">Finance Tracker Pro</h2>
    <span style="font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Security Intelligence Portal</span>
  </div>
  <div style="padding:0 8px;">
    <p style="margin-top:0;font-size:13px;color:#a1a1aa;line-height:1.6;">Hello,</p>
    <p style="font-size:13px;color:#a1a1aa;line-height:1.6;">
      An authentication action (<span style="color:#34d399;font-weight:bold;">${purpose}</span>) has been triggered on your account.
      Use the following OTP to confirm your identity.
    </p>
    <div style="text-align:center;margin:28px 0;background:#18181b;border:1px solid #27272a;padding:16px;border-radius:12px;">
      <span style="font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:2px;font-weight:bold;display:block;margin-bottom:8px;">Security Verification Code</span>
      <div style="font-size:32px;font-family:monospace;font-weight:900;letter-spacing:6px;color:#10b981;line-height:1.2;">${otp}</div>
      <span style="font-size:10px;color:#71717a;display:block;margin-top:8px;">Expires in ${Math.round(OTP_TTL_SEC / 60)} minutes • Do not share with anyone</span>
    </div>
    <p style="font-size:11px;color:#71717a;line-height:1.6;">
      If you did not initiate this request, please secure your account immediately.
    </p>
  </div>
  <div style="text-align:center;border-top:1px solid #27272a;padding-top:16px;margin-top:24px;">
    <span style="font-size:10px;color:#71717a;">Finance Tracker Pro • Secure Transaction Ledger • ${year}</span>
  </div>
</div>`;
}

// ──────────────────────────────────────────────
// Express app
// ──────────────────────────────────────────────
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── POST /api/otp/send ────────────────────────
app.post('/api/otp/send', async (req: Request, res: Response) => {
  const { recipient, purpose } = req.body as { recipient?: string; purpose?: string };

  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    return res.status(400).json({ success: false, error: 'A valid email address is required.' });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_SEC * 1000);
  const otpPurpose = purpose || 'Security Authentication';

  // Invalidate previous unused OTPs for this recipient + purpose
  const { error: updateError } = await supabase
    .from('otps')
    .update({ used: true })
    .eq('recipient', recipient.toLowerCase())
    .eq('purpose', otpPurpose)
    .eq('used', false);

  if (updateError) {
    console.error('Supabase update error:', updateError.message);
  }

  // Insert new OTP row
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
    console.error('Supabase insert error:', insertError.message);
    return res.status(500).json({ success: false, error: 'Failed to store OTP: ' + insertError.message });
  }

  // Send email
  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: recipient,
      subject: `[Finance Tracker Pro] Your OTP: ${otp}`,
      html: buildEmailHtml(otp, otpPurpose)
    });
    console.log(`📧 OTP email sent → ${recipient} (${otp})`);
    return res.json({ success: true, message: 'OTP sent to ' + recipient });
  } catch (err: any) {
    console.error('Nodemailer error:', err.message);
    return res.status(500).json({ success: false, error: 'Email delivery failed: ' + err.message });
  }
});

// ── POST /api/otp/verify ─────────────────────
app.post('/api/otp/verify', async (req: Request, res: Response) => {
  const { recipient, otp, purpose } = req.body as { recipient?: string; otp?: string; purpose?: string };

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

  // Mark as used
  await supabase
    .from('otps')
    .update({ used: true })
    .eq('id', data.id);

  console.log(`✅ OTP verified → ${recipient}`);
  return res.json({ success: true, message: 'OTP verified successfully.' });
});

// ── GET /api/health ───────────────────────────
app.get('/api/health', async (_req, res) => {
  const { error } = await supabase.from('otps').select('id').limit(1);
  res.json({
    status: 'ok',
    supabase: !error,
    time: new Date().toISOString()
  });
});

// Serve built frontend
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*path', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ──────────────────────────────────────────────
// Startup
// ──────────────────────────────────────────────
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log('[OK] Server running at http://localhost:' + PORT);
  console.log('[OK] Supabase URL: ' + SUPABASE_URL);
  console.log('[OK] POST /api/otp/send    - generate & email OTP');
  console.log('[OK] POST /api/otp/verify  - verify OTP from Supabase');
});

server.on('error', (err) => {
  console.error('[ERROR] Failed to start server:', err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[CRASH] Uncaught exception:', err.message);
  process.exit(1);
});
