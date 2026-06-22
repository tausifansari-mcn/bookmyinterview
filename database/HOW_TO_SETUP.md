# Book My Interview — Database Setup Guide

## Prerequisites
- MySQL 8.0 or higher
- Node.js 18+

---

## Step 1 — Create the database

Run the single SQL file. It creates the database, all tables, and seeds the default data:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p < complete_schema.sql
```

Or open it in MySQL Workbench / DBeaver / phpMyAdmin and run it.

---

## Step 2 — Configure environment

Copy the template to the backend folder:

```bash
cp env.template ../backend/.env
```

Edit `../backend/.env` and fill in:
- Your MySQL host / password
- Your Gmail app password for SMTP
- (Optional) Claude API key for AI features

---

## Step 3 — Install and run

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd ..
npm install
npm run dev
```

- Frontend runs on: http://localhost:5173
- Backend API runs on: http://localhost:5055

---

## Default Login Credentials

| Portal | URL | Email | Password |
|--------|-----|-------|----------|
| Client Admin | /login | admin@bookmyinterview.in | Admin@123 |
| Super Admin | /super-admin/login | superadmin@bookmyinterview.in | Admin@123 |
| Candidate | /portal/login | (register first) | (your password) |

---

## What the SQL file includes

| Section | Tables |
|---------|--------|
| Tenants | `bmi_tenant` |
| Platform Admin | `bmi_platform_admin` |
| Client Users | `bmi_user`, `bmi_refresh_token`, `bmi_admin_otp` |
| Candidates | `bmi_candidate`, `bmi_candidate_education`, `bmi_candidate_experience`, `bmi_candidate_skill`, `bmi_candidate_certification`, `bmi_candidate_language`, `bmi_candidate_portal_session`, `bmi_candidate_document`, `bmi_saved_job`, `bmi_candidate_feedback` |
| Jobs | `bmi_job`, `bmi_job_question`, `bmi_job_question_bank`, `bmi_jd_request` |
| Applications | `bmi_application`, `bmi_application_answer`, `bmi_evaluation_score` |
| Assessments | `bmi_assessment`, `bmi_candidate_assessment`, `bmi_platform_question_bank`, `bmi_assessment_auto_log` |
| Interviews | `bmi_interview`, `bmi_interview_feedback`, `bmi_interview_transcript`, `bmi_interview_recording` |
| Offers | `bmi_offer` |
| AI Engine | `bmi_ai_screening_result`, `bmi_ai_credit_ledger`, `bmi_match_result` |
| Notifications | `bmi_notification_log` |
| Company | `bmi_company_media`, `bmi_department`, `bmi_location` |
| Billing | `bmi_subscription`, `bmi_ai_credit_ledger` |
| Analytics | `bmi_hiring_metric_daily`, `bmi_audit_log` |

**Seed data included:**
- 1 Demo tenant company
- 1 Super Admin account
- 1 Client Admin account
- 5 Departments + 5 Locations (demo tenant)
- 80+ MCQ questions across 20+ skills (JavaScript, React, Node.js, SQL, Python, Java, DevOps, etc.)
