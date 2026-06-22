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

export async function sendWelcomeEmail(to: string, name: string, tempPassword?: string): Promise<void> {
  const credBlock = tempPassword
    ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin:0 0 16px;">
        <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">Your temporary password:</p>
        <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:2px;color:#111827;">${tempPassword}</p>
        <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;">Please change it after your first login.</p>
       </div>`
    : ''
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Welcome, <strong>${name}</strong>! 🎉</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">Your account on <strong>Book My Interview</strong> has been created successfully.</p>
    ${credBlock}
    <div style="text-align:center;margin:24px 0;">
      <a href="${env.FRONTEND_URL ?? 'http://localhost:5173'}/portal/jobs"
         style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Get Started →
      </a>
    </div>
    <p style="margin:0;color:#9ca3af;font-size:13px;">Complete your profile to increase your chances of getting noticed by recruiters.</p>`
  const plain = tempPassword
    ? `Welcome ${name}!\n\nYour account is ready.\nTemporary password: ${tempPassword}\n\nPlease change it after first login.\n\n— Book My Interview`
    : `Welcome ${name}!\n\nYour account is ready. Visit ${env.FRONTEND_URL ?? 'http://localhost:5173'}/portal to get started.\n\n— Book My Interview`
  await send(to, 'Welcome to Book My Interview!', branded('Welcome!', 'Your account is ready', body), plain)
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
      <a href="${env.FRONTEND_URL ?? 'http://localhost:5173'}/portal/applications"
         style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Track Application →
      </a>
    </div>`
  await send(to, `Application Received: ${jobTitle} — Book My Interview`,
    branded('Application Received', `You applied to ${jobTitle}`, body),
    `Hi ${name},\n\nYour application for ${jobTitle} at ${company} has been received.\n\nTrack status: ${env.FRONTEND_URL ?? 'http://localhost:5173'}/portal/applications\n\n— Book My Interview`)
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

export async function sendJobPostedEmail(
  to: string, name: string, jobTitle: string, jobCode: string, jobType: string, priority: string
): Promise<void> {
  const priorityLabel = { low: 'Low', medium: 'Medium', high: 'High', urgent: '🔴 Urgent' }[priority] ?? priority
  const typeLabel = { full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract', internship: 'Internship', temp: 'Temporary' }[jobType] ?? jobType
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">Your job posting has been <strong>published successfully</strong> and is now live for candidates to apply.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 20px;">
      <tr style="background:#f9fafb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;width:40%;">Job Title</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">${jobTitle}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Job Code</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">${jobCode}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Type</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">${typeLabel}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;">Priority</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#111827;">${priorityLabel}</td></tr>
    </table>
    <div style="text-align:center;margin:20px 0;">
      <a href="${env.FRONTEND_URL ?? 'http://localhost:5173'}/jobs"
         style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        View All Jobs →
      </a>
    </div>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Candidates can now discover and apply for this opening through the portal.</p>`
  await send(to, `Job Posted: ${jobTitle} (${jobCode}) — Book My Interview`,
    branded('Job Published!', `${jobTitle} is now live`, body),
    `Hi ${name},\n\nYour job "${jobTitle}" (${jobCode}) has been published successfully.\nType: ${typeLabel} | Priority: ${priorityLabel}\n\nManage jobs: ${env.FRONTEND_URL ?? 'http://localhost:5173'}/jobs\n\n— Book My Interview`)
}

export async function sendAssessmentInviteEmail(
  to: string, name: string, jobTitle: string, assessmentLink: string
): Promise<void> {
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">As part of the screening process for <strong>${jobTitle}</strong>, you have been invited to complete an online assessment.</p>
    <div style="background:#f0f0fe;border:1px solid #c7d2fe;border-radius:8px;padding:16px;margin:0 0 16px;">
      <p style="margin:0;color:#4338ca;font-size:13px;font-weight:600;">📋 Important Instructions</p>
      <ul style="margin:8px 0 0;padding-left:20px;color:#6b7280;font-size:13px;line-height:1.8;">
        <li>Ensure stable internet connection before starting</li>
        <li>You cannot pause once the timer begins</li>
        <li>Complete in one sitting for best results</li>
      </ul>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${assessmentLink}"
         style="background:#4f46e5;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Start Assessment →
      </a>
    </div>
    <p style="margin:0;color:#9ca3af;font-size:12px;">This link is unique to you and can only be used once. It expires in 7 days.</p>`
  await send(to, `Assessment Invitation: ${jobTitle} — Book My Interview`,
    branded('Assessment Invitation', `Complete your assessment for ${jobTitle}`, body),
    `Hi ${name},\n\nYou have been invited to take an assessment for ${jobTitle}.\n\nStart here: ${assessmentLink}\n\nThis link is unique to you.\n\n— Book My Interview`)
}

export async function sendAssessmentReminderEmail(
  to: string, name: string, jobTitle: string, assessmentLink: string, hoursLeft: number
): Promise<void> {
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">This is a reminder that you have a pending assessment for <strong>${jobTitle}</strong>. Your link expires in <strong>${hoursLeft} hours</strong>.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${assessmentLink}"
         style="background:#f59e0b;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Complete Assessment Now →
      </a>
    </div>`
  await send(to, `Reminder: Complete Assessment for ${jobTitle} — Book My Interview`,
    branded('Assessment Reminder', `Your assessment expires soon`, body),
    `Hi ${name},\n\nReminder: Your assessment for ${jobTitle} expires in ${hoursLeft} hours.\n\n${assessmentLink}\n\n— Book My Interview`)
}

export async function sendOfferLetterEmail(
  to: string, name: string, jobTitle: string, company: string, offeredCtc: string, joiningDate: string, letterUrl?: string
): Promise<void> {
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Dear <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">We are delighted to offer you the position of <strong>${jobTitle}</strong> at <strong>${company}</strong>!</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 20px;">
      <tr style="background:#f9fafb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Position</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">${jobTitle}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Offered CTC</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#059669;border-bottom:1px solid #e5e7eb;">${offeredCtc}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;">Date of Joining</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#111827;">${joiningDate}</td></tr>
    </table>
    ${letterUrl ? `<div style="text-align:center;margin:20px 0;"><a href="${letterUrl}" style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Download Offer Letter →</a></div>` : ''}
    <p style="margin:0;color:#6b7280;font-size:13px;">Please respond within 3 working days. We look forward to welcoming you to the team!</p>`
  await send(to, `Offer Letter: ${jobTitle} at ${company} — Book My Interview`,
    branded('Offer Letter', `Congratulations on your offer!`, body),
    `Dear ${name},\n\nWe are pleased to offer you ${jobTitle} at ${company}.\nCTC: ${offeredCtc}\nJoining: ${joiningDate}\n\n— Book My Interview`)
}

export async function sendInterviewRescheduleEmail(
  to: string, name: string, jobTitle: string, newDate: string, newTime: string, mode: string, link?: string
): Promise<void> {
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">Your interview for <strong>${jobTitle}</strong> has been rescheduled to the following time.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 16px;">
      <tr style="background:#f9fafb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">New Date</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">${newDate}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">New Time</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">${newTime}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;">Mode</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#111827;">${mode}</td></tr>
    </table>
    ${link ? `<p style="margin:0 0 16px;color:#6b7280;font-size:14px;">Meeting Link: <a href="${link}" style="color:#4f46e5;">${link}</a></p>` : ''}
    <p style="margin:0;color:#9ca3af;font-size:13px;">Please be available 5 minutes before the scheduled time.</p>`
  await send(to, `Interview Rescheduled: ${jobTitle} — Book My Interview`,
    branded('Interview Rescheduled', `Your interview has been rescheduled`, body),
    `Hi ${name},\n\nYour interview for ${jobTitle} has been rescheduled.\nDate: ${newDate}\nTime: ${newTime}\nMode: ${mode}${link ? `\nLink: ${link}` : ''}\n\n— Book My Interview`)
}

export async function sendInterviewCancelEmail(
  to: string, name: string, jobTitle: string, reason?: string
): Promise<void> {
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">Unfortunately, your scheduled interview for <strong>${jobTitle}</strong> has been cancelled.</p>
    ${reason ? `<p style="margin:0 0 16px;color:#6b7280;font-size:14px;"><strong>Reason:</strong> ${reason}</p>` : ''}
    <p style="margin:0;color:#6b7280;font-size:13px;">Our team will reach out to you shortly to reschedule or provide further information.</p>`
  await send(to, `Interview Cancelled: ${jobTitle} — Book My Interview`,
    branded('Interview Cancelled', `Regarding your interview for ${jobTitle}`, body),
    `Hi ${name},\n\nYour interview for ${jobTitle} has been cancelled.${reason ? `\nReason: ${reason}` : ''}\n\n— Book My Interview`)
}

export async function sendOfferMadeEmail(
  to: string, name: string, jobTitle: string, company: string
): Promise<void> {
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Dear <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">We are excited to inform you that you have received an <strong>offer</strong> for the position of <strong>${jobTitle}</strong> at <strong>${company}</strong>!</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:0 0 20px;text-align:center;">
      <p style="margin:0;color:#166534;font-size:18px;font-weight:700;">🎉 Congratulations! Offer Extended</p>
    </div>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">Our team will be in touch with the full offer details shortly. Please log in to your portal to track this update.</p>
    <div style="text-align:center;margin:20px 0;">
      <a href="${env.FRONTEND_URL ?? 'http://localhost:5173'}/portal/applications"
         style="background:#059669;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        View Offer →
      </a>
    </div>`
  await send(to, `Offer Extended: ${jobTitle} at ${company} — Book My Interview`,
    branded('Offer Extended!', `You have an offer for ${jobTitle}`, body),
    `Dear ${name},\n\nCongratulations! You have received an offer for ${jobTitle} at ${company}.\n\nCheck your portal: ${env.FRONTEND_URL ?? 'http://localhost:5173'}/portal/applications\n\n— Book My Interview`)
}

export async function sendHiredEmail(
  to: string, name: string, jobTitle: string, company: string
): Promise<void> {
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Dear <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">We are thrilled to confirm that you have been <strong>selected</strong> for the role of <strong>${jobTitle}</strong> at <strong>${company}</strong>.</p>
    <div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #6ee7b7;border-radius:12px;padding:24px;margin:0 0 20px;text-align:center;">
      <p style="margin:0 0 4px;color:#065f46;font-size:22px;font-weight:800;">🏆 Welcome to the team!</p>
      <p style="margin:4px 0 0;color:#059669;font-size:14px;">You have been officially hired.</p>
    </div>
    <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">The HR team will reach out shortly with onboarding details. We look forward to having you on board!</p>`
  await send(to, `You're Hired! ${jobTitle} at ${company} — Book My Interview`,
    branded("You're Hired!", `Welcome to ${company}!`, body),
    `Dear ${name},\n\nCongratulations! You have been hired for ${jobTitle} at ${company}. Welcome to the team!\n\n— Book My Interview`)
}

export async function sendJobMatchEmail(
  to: string, name: string, jobTitle: string, company: string,
  jobType: string, location: string, skills: string[]
): Promise<void> {
  const portalUrl = `${env.FRONTEND_URL ?? 'http://localhost:5173'}/portal/jobs`
  const skillChips = skills.slice(0, 5).map(s =>
    `<span style="display:inline-block;padding:3px 10px;margin:2px;background:#eff6ff;color:#2563eb;border-radius:20px;font-size:11px;font-weight:600;">${s}</span>`
  ).join('')
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">A company just posted a job that matches your skills. Don't miss this opportunity!</p>
    <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:14px;padding:20px;margin:0 0 20px;border:1px solid #bfdbfe;">
      <p style="margin:0 0 4px;color:#1e3a8a;font-size:20px;font-weight:800;">${jobTitle}</p>
      <p style="margin:4px 0 8px;color:#3b82f6;font-size:14px;font-weight:600;">${company}</p>
      <p style="margin:0 0 10px;color:#64748b;font-size:13px;">🏢 ${jobType.replace('_',' ')} · 📍 ${location || 'India'}</p>
      <div>${skillChips}</div>
    </div>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">Your profile skills align with this role. Apply now before spots fill up!</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${portalUrl}"
         style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
        View Job &amp; Apply →
      </a>
    </div>
    <p style="margin:0;color:#9ca3af;font-size:12px;">You received this because your skills match this job. <a href="${portalUrl}" style="color:#6366f1;">Manage preferences</a></p>`
  await send(to, `Job Match: ${jobTitle} at ${company} — Book My Interview`,
    branded('New Job Match!', `${company} is hiring for ${jobTitle}`, body),
    `Hi ${name},\n\n${company} posted ${jobTitle} — it matches your skills!\n\nApply here: ${portalUrl}\n\n— Book My Interview`)
}

export async function sendInterviewUnlockEmail(
  to: string, name: string, jobTitle: string, company: string
): Promise<void> {
  const url = `${env.FRONTEND_URL ?? 'http://localhost:5173'}/portal/applications`
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">Great news! You have successfully cleared all screening gates for <strong>${jobTitle}</strong> at <strong>${company}</strong>.</p>
    <div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #6ee7b7;border-radius:12px;padding:20px;margin:0 0 20px;text-align:center;">
      <p style="margin:0 0 8px;color:#065f46;font-size:16px;font-weight:700;">🎉 All 3 Gates Cleared!</p>
      <div style="display:flex;justify-content:center;gap:16px;margin:12px 0;">
        <span style="background:#fff;border:1px solid #6ee7b7;border-radius:8px;padding:8px 12px;font-size:12px;color:#059669;font-weight:600;">✓ Profile 95%+</span>
        <span style="background:#fff;border:1px solid #6ee7b7;border-radius:8px;padding:8px 12px;font-size:12px;color:#059669;font-weight:600;">✓ Assessment 80%+</span>
        <span style="background:#fff;border:1px solid #6ee7b7;border-radius:8px;padding:8px 12px;font-size:12px;color:#059669;font-weight:600;">✓ Intro 80%+</span>
      </div>
    </div>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">You are now invited to select your preferred interview date and time. Visit your portal to choose a slot.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${url}" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
        Pick Interview Slot →
      </a>
    </div>`
  await send(to, `Interview Unlocked: ${jobTitle} — Book My Interview`,
    branded('Interview Unlocked!', 'You cleared all gates — pick your slot', body),
    `Hi ${name},\n\nCongratulations! You cleared all 3 gates for ${jobTitle} at ${company}.\n\nPick your interview slot: ${url}\n\n— Book My Interview`)
}

export async function sendMeetingLinkEmail(
  to: string, name: string, jobTitle: string, company: string, slotDate: string, meetingLink: string
): Promise<void> {
  const body = `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">Your interview for <strong>${jobTitle}</strong> at <strong>${company}</strong> is confirmed. Here are the details:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 20px;">
      <tr style="background:#f9fafb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Date &amp; Time</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">${slotDate}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;">Mode</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#4f46e5;">Online / Video Call</td></tr>
    </table>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:0 0 20px;">
      <p style="margin:0 0 8px;color:#1e40af;font-size:13px;font-weight:600;">Meeting Link:</p>
      <a href="${meetingLink}" style="color:#4f46e5;font-size:14px;word-break:break-all;">${meetingLink}</a>
    </div>
    <div style="text-align:center;margin:20px 0;">
      <a href="${meetingLink}" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Join Interview →
      </a>
    </div>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Please join 5 minutes early. Ensure your camera and microphone are working.</p>`
  await send(to, `Interview Confirmed: ${jobTitle} — Book My Interview`,
    branded('Interview Confirmed!', `Your meeting link for ${jobTitle} is ready`, body),
    `Hi ${name},\n\nYour interview for ${jobTitle} at ${company} is confirmed.\n\nDate: ${slotDate}\nJoin: ${meetingLink}\n\n— Book My Interview`)
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
