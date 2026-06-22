const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const outPath = path.join(__dirname, '..', '..', 'Sample_JD_Senior_Software_Engineer.pdf')
const doc = new PDFDocument({ margin: 50, size: 'A4' })
doc.pipe(fs.createWriteStream(outPath))

// Helper
const W = 595 - 100  // usable width

// ── HEADER ──────────────────────────────────────────────────────────
doc.rect(0, 0, 595, 90).fill('#1e1b4b')
doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20)
   .text('BOOK MY INTERVIEW', 50, 22, { align: 'left' })
doc.fillColor('#a5b4fc').font('Helvetica').fontSize(10)
   .text('AI-Powered Recruitment Platform · mascallnet.ai', 50, 48, { align: 'left' })
doc.fillColor('#ffffff').fontSize(10)
   .text('tausif.ansari@teammas.in  |  +91 96671 95550', 50, 65, { align: 'left' })

doc.moveDown(4)

// ── JOB TITLE BLOCK ─────────────────────────────────────────────────
doc.rect(50, 105, W, 58).fill('#eff6ff').stroke('#bfdbfe')
doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(18)
   .text('Senior Software Engineer — Full Stack', 62, 116, { width: W - 24 })
doc.fillColor('#3b82f6').font('Helvetica').fontSize(10)
   .text('Full-Time  ·  Hybrid  ·  Bangalore / Remote  ·  8–14 LPA  ·  3–6 Years Experience', 62, 141)

doc.moveDown(2.5)
const startY = 175

// ── SECTION HELPER ───────────────────────────────────────────────────
function section(title, y) {
  doc.rect(50, y, 4, 14).fill('#6366f1')
  doc.fillColor('#1e1b4b').font('Helvetica-Bold').fontSize(12)
     .text(title, 62, y, { width: W })
  doc.moveTo(50, y + 18).lineTo(545, y + 18).stroke('#e0e7ff')
  return y + 26
}

function bullet(text, y) {
  doc.fillColor('#4b5563').font('Helvetica').fontSize(10)
  doc.circle(62, y + 4, 2).fill('#6366f1')
  doc.fillColor('#374151').text(text, 72, y, { width: W - 22, lineGap: 2 })
  return y + doc.heightOfString(text, { width: W - 22 }) + 6
}

function para(text, y) {
  doc.fillColor('#374151').font('Helvetica').fontSize(10)
     .text(text, 50, y, { width: W, lineGap: 3, align: 'justify' })
  return y + doc.heightOfString(text, { width: W, lineGap: 3 }) + 10
}

// ── ABOUT THE ROLE ───────────────────────────────────────────────────
let y = section('About the Role', startY)
y = para(
  'We are looking for a Senior Software Engineer with strong full-stack expertise to join our growing product team. ' +
  'You will design, build, and maintain high-performance web applications using React and Node.js. ' +
  'You will collaborate closely with product managers, designers, and backend engineers to deliver exceptional user experiences. ' +
  'This is a high-impact role where your code will be used by thousands of users daily.',
  y
)

// ── KEY RESPONSIBILITIES ─────────────────────────────────────────────
y += 6
y = section('Key Responsibilities', y)
const responsibilities = [
  'Design and develop scalable, high-performance React and Node.js applications',
  'Lead technical architecture discussions and code reviews',
  'Collaborate with cross-functional teams to define, design, and ship new features',
  'Write clean, maintainable, and well-tested code with >80% unit test coverage',
  'Mentor junior developers and drive engineering best practices',
  'Integrate RESTful APIs and third-party services including payment gateways',
  'Optimize application performance, reduce load times, and improve scalability',
  'Participate in Agile ceremonies — sprint planning, standups, retrospectives',
  'Troubleshoot and debug production issues with urgency and ownership',
]
for (const r of responsibilities) { y = bullet(r, y) }

// ── REQUIRED SKILLS ──────────────────────────────────────────────────
y += 6
y = section('Required Skills & Technologies', y)
const skills = [
  'React.js / Next.js (3+ years)',
  'Node.js / Express.js / TypeScript',
  'MySQL / PostgreSQL — advanced querying, indexing, optimization',
  'REST APIs & GraphQL design and integration',
  'Git, CI/CD pipelines (GitHub Actions, Jenkins)',
  'Docker / Kubernetes basics',
  'AWS services — S3, EC2, RDS, Lambda',
  'Redis for caching and session management',
  'HTML5, CSS3, Tailwind CSS',
  'Jest, Mocha — unit and integration testing',
]
for (const s of skills) { y = bullet(s, y) }

// ── QUALIFICATIONS ───────────────────────────────────────────────────
y += 6
y = section('Qualifications & Experience', y)
const quals = [
  'B.E. / B.Tech / MCA in Computer Science or related field',
  '3 to 6 years of professional full-stack development experience',
  'Prior experience in a product-based company is preferred',
  'Strong understanding of data structures, algorithms, and system design',
  'Excellent problem-solving and communication skills',
]
for (const q of quals) { y = bullet(q, y) }

// ── NICE TO HAVE ─────────────────────────────────────────────────────
y += 6
y = section('Good to Have', y)
const nice = [
  'Experience with AI/ML integration (OpenAI, Anthropic APIs)',
  'Knowledge of micro-services architecture',
  'Open-source contributions or personal projects on GitHub',
  'Familiarity with Agile / Scrum methodology',
]
for (const n of nice) { y = bullet(n, y) }

// ── COMPENSATION & BENEFITS ──────────────────────────────────────────
y += 6
y = section('Compensation & Benefits', y)
const benefits = [
  'Salary: 8 LPA – 14 LPA (based on experience)',
  'Annual performance bonus up to 15%',
  'Flexible work-from-home — 3 days office, 2 days remote (Hybrid)',
  'Health insurance: Self + Spouse + 2 Children covered',
  'Learning budget: ₹25,000/year for courses and conferences',
  '25 days paid leave + 10 national holidays',
  'ESOP options for senior roles',
]
for (const b of benefits) { y = bullet(b, y) }

// ── LOCATION & WORK MODE ─────────────────────────────────────────────
y += 6
y = section('Location & Work Details', y)
y = para('Location: Bangalore, Karnataka (HSR Layout). Work Mode: Hybrid — 3 days in office, 2 days remote. Work Hours: 10 AM – 7 PM IST (flexible). Interview Process: HR Screening → Technical Round 1 → Technical Round 2 → Culture Fit → Offer.', y)

// ── FOOTER ───────────────────────────────────────────────────────────
const footerY = 780
doc.rect(0, footerY, 595, 62).fill('#1e1b4b')
doc.fillColor('#a5b4fc').font('Helvetica').fontSize(9)
   .text('Book My Interview — Powered by MasCallnet.ai', 50, footerY + 12, { align: 'center', width: 495 })
doc.fillColor('#6366f1').fontSize(8)
   .text('Apply through Book My Interview portal: portal.mascallnet.ai  ·  tausif.ansari@teammas.in  ·  +91 96671 95550', 50, footerY + 28, { align: 'center', width: 495 })
doc.fillColor('#4c1d95').fontSize(8)
   .text('This JD is auto-parsed by AI. Upload it to Book My Interview → Post a Job → Upload JD to test extraction.', 50, footerY + 44, { align: 'center', width: 495 })

doc.end()
console.log('PDF written to:', outPath)
