import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

const transporter = nodemailer.createTransport({
  host:   env.SMTP_HOST,
  port:   env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  tls: { rejectUnauthorized: false },
})

function branded(title: string, preheader: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
  <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 40px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-.5px;">Book My Interview</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,.8);font-size:12px;">AI Hiring Operating System</p>
  </td></tr>
  <tr><td style="padding:36px 40px;">${body}</td></tr>
  <tr><td style="background:#f9fafb;padding:18px 40px;border-top:1px solid #e5e7eb;text-align:center;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; ${new Date().getFullYear()} Book My Interview. All rights reserved.</p>
  </td></tr>
</table>
</td></tr></table></body></html>`
}

async function send(to: string, subject: string, html: string, text: string) {
  if (!env.SMTP_USER) {
    console.log(`[DEV EMAIL → ${to}]\nSubject: ${subject}\n${text}\n`)
    return
  }
  try {
    await transporter.sendMail({ from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM}>`, to, subject, html, text })
    console.log(`[email] Sent "${subject}" → ${to}`)
  } catch (err: any) {
    console.error(`[email] SMTP failed for ${to}: ${err.message}`)
    console.log(`[FALLBACK]\nTo: ${to}\n${text}`)
  }
}

function otpBox(otp: string) {
  return `<div style="background:#f0f0fe;border:2px dashed #6366f1;border-radius:10px;text-align:center;padding:24px;margin:20px 0;">
    <p style="margin:0 0 6px;color:#6366f1;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Your OTP</p>
    <p style="margin:0;color:#1e1b4b;font-size:40px;font-weight:800;letter-spacing:12px;">${otp}</p>
  </div>`
}

// ── OTP emails ────────────────────────────────────────────────

export async function sendOTPEmail(to: string, name: string, otp: string): Promise<void> {
  const body = `<p style="margin:0 0 8px;color:#111827;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 4px;color:#6b7280;font-size:14px;line-height:1.6;">We received a request to reset your password. Use the OTP below — valid for <strong>10 minutes</strong>.</p>
    ${otpBox(otp)}
    <p style="margin:0;color:#9ca3af;font-size:12px;">Never share this OTP with anyone. If you didn't request this, ignore this email.</p>`
  await send(to, 'Your Password Reset OTP — Book My Interview',
    branded('Password Reset OTP', `Your OTP is ${otp}`, body),
    `Hi ${name},\n\nYour password reset OTP: ${otp}\n\nValid for 10 minutes.\n\n— Book My Interview`)
}

export async function sendAdminOTPEmail(to: string, name: string, otp: string): Promise<void> {
  const body = `<p style="margin:0 0 8px;color:#111827;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 4px;color:#6b7280;font-size:14px;line-height:1.6;">Password reset OTP for your recruiter account. Valid for <strong>10 minutes</strong>. Max 5 attempts.</p>
    ${otpBox(otp)}
    <p style="margin:0;color:#9ca3af;font-size:12px;">If you didn't request this, your account may be compromised. Contact your administrator immediately.</p>`
  await send(to, 'Admin Password Reset OTP — Book My Interview',
    branded('Admin Password Reset', `Your admin OTP is ${otp}`, body),
    `Hi ${name},\n\nAdmin password reset OTP: ${otp}\n\nValid for 10 minutes.\n\n— Book My Interview`)
}

// ── Candidate emails ──────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Welcome, <strong>${name}</strong>! 🎉</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">Your candidate account on <strong>Book My Interview</strong> has been created successfully. You can now browse open positions and apply to jobs that match your skills.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${env.FRONTEND_URL ?? 'http://localhost:5174'}/portal/jobs"
         style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Browse Jobs →
      </a>
    </div>
    <p style="margin:0;color:#9ca3af;font-size:13px;">Complete your profile to increase your chances of getting noticed by recruiters.</p>`
  await send(to, 'Welcome to Book My Interview!',
    branded('Welcome!', 'Your account is ready', body),
    `Welcome ${name}!\n\nYour candidate account is ready. Visit ${env.FRONTEND_URL ?? 'http://localhost:5174'}/portal/jobs to browse jobs.\n\n— Book My Interview`)
}

export async function sendApplicationConfirmationEmail(
  to: string, name: string, jobTitle: string, company: string
): Promise<void> {
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">Your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> has been received successfully!</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:0 0 16px;">
      <p style="margin:0;color:#166534;font-size:14px;">✓ Application Submitted Successfully</p>
    </div>
    <p style="margin:0 0 4px;color:#6b7280;font-size:14px;line-height:1.6;">Our recruitment team will review your profile and get back to you. You can track your application status on the portal.</p>
    <div style="text-align:center;margin:20px 0;">
      <a href="${env.FRONTEND_URL ?? 'http://localhost:5174'}/portal/applications"
         style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Track Application →
      </a>
    </div>`
  await send(to, `Application Received: ${jobTitle} — Book My Interview`,
    branded('Application Received', `You applied to ${jobTitle}`, body),
    `Hi ${name},\n\nYour application for ${jobTitle} at ${company} has been received.\n\nTrack status: ${env.FRONTEND_URL ?? 'http://localhost:5174'}/portal/applications\n\n— Book My Interview`)
}

export async function sendShortlistEmail(
  to: string, name: string, jobTitle: string, company: string, nextSteps?: string
): Promise<void> {
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">Congratulations! You have been <strong>shortlisted</strong> for the position of <strong>${jobTitle}</strong> at <strong>${company}</strong>.</p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:0 0 16px;">
      <p style="margin:0;color:#1e40af;font-size:14px;font-weight:600;">🎉 You've been shortlisted!</p>
    </div>
    ${nextSteps ? `<p style="margin:0 0 4px;color:#374151;font-size:14px;font-weight:600;">Next Steps:</p><p style="margin:4px 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">${nextSteps}</p>` : ''}
    <p style="margin:0;color:#9ca3af;font-size:13px;">Our team will reach out to you shortly with further details.</p>`
  await send(to, `Shortlisted for ${jobTitle} — Book My Interview`,
    branded('You\'ve Been Shortlisted!', `Great news about ${jobTitle}`, body),
    `Hi ${name},\n\nCongratulations! You have been shortlisted for ${jobTitle} at ${company}.\n\n${nextSteps ?? ''}\n\n— Book My Interview`)
}

export async function sendRejectionEmail(
  to: string, name: string, jobTitle: string, company: string
): Promise<void> {
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">Thank you for applying for <strong>${jobTitle}</strong> at <strong>${company}</strong>.</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs. We appreciate the time you invested in your application.</p>
    <p style="margin:0 0 4px;color:#6b7280;font-size:14px;line-height:1.6;">We encourage you to apply for future openings that match your profile. We wish you the best in your career journey!</p>`
  await send(to, `Application Update: ${jobTitle} — Book My Interview`,
    branded('Application Update', `Regarding your ${jobTitle} application`, body),
    `Hi ${name},\n\nThank you for applying to ${jobTitle} at ${company}. After careful consideration, we have decided to proceed with other candidates.\n\nWe wish you the very best in your career search.\n\n— Book My Interview`)
}

export async function sendInterviewScheduleEmail(
  to: string, name: string, jobTitle: string, interviewDate: string, interviewTime: string, mode: string, link?: string
): Promise<void> {
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">Your interview for <strong>${jobTitle}</strong> has been scheduled.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 16px;">
      <tr style="background:#f9fafb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Date</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">${interviewDate}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Time</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">${interviewTime}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;">Mode</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#111827;">${mode}</td></tr>
    </table>
    ${link ? `<p style="margin:0 0 16px;color:#6b7280;font-size:14px;">Meeting Link: <a href="${link}" style="color:#4f46e5;">${link}</a></p>` : ''}
    <p style="margin:0;color:#9ca3af;font-size:13px;">Please be available 5 minutes before your scheduled time. Ensure your internet connection and device are working properly.</p>`
  await send(to, `Interview Scheduled: ${jobTitle} — Book My Interview`,
    branded('Interview Scheduled', `Interview on ${interviewDate}`, body),
    `Hi ${name},\n\nInterview for ${jobTitle} scheduled.\nDate: ${interviewDate}\nTime: ${interviewTime}\nMode: ${mode}${link ? `\nLink: ${link}` : ''}\n\n— Book My Interview`)
}
