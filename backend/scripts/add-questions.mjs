import mysql2 from 'mysql2/promise'

const db = await mysql2.createConnection({
  host: '122.184.128.90', port: 3306, user: 'root', password: 'vicidialnow', database: 'getjob'
})

const questions = [
  // Sales - Inbound
  { question_text: 'A customer calls in upset about a delayed shipment. What is your first step?', question_type: 'single_choice', options: ['Apologize and empathize with the customer','Tell them to call back later','Transfer the call immediately','Ask for their order number without greeting'], correct_answer_idx: 0, skills: ['Sales','Customer Service','Inbound Sales'], difficulty: 'easy', marks: 2, explanation: 'Empathy and apology build trust before problem-solving.' },
  { question_text: 'Which technique is most effective for qualifying inbound sales leads?', question_type: 'single_choice', options: ['BANT (Budget, Authority, Need, Timeline)','Always push the most expensive product','Ignore their stated needs and pitch everything','Close immediately without discovery'], correct_answer_idx: 0, skills: ['Inbound Sales','Sales'], difficulty: 'medium', marks: 3, explanation: 'BANT framework qualifies leads effectively.' },
  { question_text: 'In inbound sales, what does a "warm lead" mean?', question_type: 'single_choice', options: ['A prospect who has shown interest and engaged with content','A prospect called without any prior engagement','A competitor posing as a customer','Any email lead in the CRM'], correct_answer_idx: 0, skills: ['Inbound Sales','Sales'], difficulty: 'easy', marks: 2, explanation: 'Warm leads have already shown interest.' },

  // Sales - Outbound
  { question_text: 'What is the best approach for a cold call opening?', question_type: 'single_choice', options: ['Introduce yourself, state a clear value proposition, and ask for 2 minutes','Read from a long script immediately','Ask if they received your email','Start with your company history'], correct_answer_idx: 0, skills: ['Outbound Sales','Sales'], difficulty: 'medium', marks: 3, explanation: 'A concise opener with value proposition gets attention.' },
  { question_text: 'What is objection handling in outbound sales?', question_type: 'single_choice', options: ['Acknowledging concerns and providing solutions to move the deal forward','Arguing with the prospect until they agree','Ending the call when resistance is felt','Only calling easier prospects'], correct_answer_idx: 0, skills: ['Outbound Sales','Sales'], difficulty: 'easy', marks: 2, explanation: 'Good objection handling turns resistance into opportunity.' },
  { question_text: 'What is the recommended follow-up cadence for outbound prospects?', question_type: 'single_choice', options: ['Multi-touch: calls, emails, LinkedIn over 2-3 weeks','Single email and move on','Call 10 times in a single day','No follow-up, wait for them to call you'], correct_answer_idx: 0, skills: ['Outbound Sales'], difficulty: 'medium', marks: 3, explanation: 'Multi-channel follow-up significantly improves conversion rates.' },

  // Sales - Chat
  { question_text: 'In live chat sales, what is the ideal initial response time?', question_type: 'single_choice', options: ['Under 1 minute','Under 10 minutes','Under 1 hour','Within 24 hours'], correct_answer_idx: 0, skills: ['Chat Sales','Sales'], difficulty: 'easy', marks: 2, explanation: 'Under 1 minute dramatically increases conversion in live chat.' },
  { question_text: 'What is the primary advantage of AI chatbots in pre-sales chat?', question_type: 'single_choice', options: ['24/7 availability and instant qualification of leads','Replacing all human agents permanently','Making all decisions without human review','Reducing chat quality'], correct_answer_idx: 0, skills: ['Chat Sales','AI'], difficulty: 'medium', marks: 3, explanation: 'AI bots handle volume and qualify leads for human handoff.' },

  // Customer Support
  { question_text: 'What does SLA mean in customer support?', question_type: 'single_choice', options: ['A contract defining expected response and resolution times','A software tool for ticketing','A salary structure for agents','A training manual'], correct_answer_idx: 0, skills: ['Customer Support'], difficulty: 'easy', marks: 2, explanation: 'SLA defines performance standards for support teams.' },
  { question_text: 'What is First Contact Resolution (FCR)?', question_type: 'single_choice', options: ['Percentage of issues resolved during the first customer interaction','Number of calls received per day','Average handling time per ticket','Customer satisfaction score'], correct_answer_idx: 0, skills: ['Customer Support'], difficulty: 'medium', marks: 3, explanation: 'FCR is a key KPI measuring support efficiency.' },
  { question_text: 'A customer is angry and uses harsh language. What should you do?', question_type: 'single_choice', options: ['Stay calm, acknowledge frustration, and redirect to the issue','Match their tone','End the call immediately','Put them on hold for 20 minutes'], correct_answer_idx: 0, skills: ['Customer Support','Communication'], difficulty: 'easy', marks: 2, explanation: 'De-escalation starts with calm acknowledgment.' },
  { question_text: 'Best strategy for handling a complex customer complaint?', question_type: 'single_choice', options: ['Listen fully, document the issue, set realistic expectations, follow up','Promise immediate resolution of everything','Transfer to senior agent without explanation','Ask them to submit a written complaint only'], correct_answer_idx: 0, skills: ['Customer Support'], difficulty: 'medium', marks: 3, explanation: 'Structured handling builds trust and ensures resolution.' },

  // ReactJS Advanced
  { question_text: 'What is the purpose of the useCallback hook in React?', question_type: 'single_choice', options: ['Memoize a function to prevent unnecessary re-creation on re-renders','Fetch data from an API','Manage component state','Handle side effects'], correct_answer_idx: 0, skills: ['ReactJS','Frontend'], difficulty: 'medium', marks: 3, explanation: 'useCallback returns a memoized callback that only changes if dependencies change.' },
  { question_text: 'What problem does React.memo solve?', question_type: 'single_choice', options: ['Prevents re-rendering when props have not changed','Adds memoized state to class components','Replaces Redux','Handles error boundaries'], correct_answer_idx: 0, skills: ['ReactJS','Frontend'], difficulty: 'medium', marks: 3, explanation: 'React.memo is a HOC that skips re-rendering if props are shallow-equal.' },
  { question_text: 'What is lifting state up in React?', question_type: 'single_choice', options: ['Moving state to the closest common ancestor of components that need it','Using Redux instead of local state','Converting class to functional components','Using useEffect for state updates'], correct_answer_idx: 0, skills: ['ReactJS'], difficulty: 'easy', marks: 2, explanation: 'Lifting state up enables shared state between sibling components.' },
  { question_text: 'Difference between controlled and uncontrolled components in React?', question_type: 'single_choice', options: ['Controlled use React state to drive input values; uncontrolled use DOM refs','Controlled are class; uncontrolled are functional','Controlled use Redux; uncontrolled use Context','They are the same'], correct_answer_idx: 0, skills: ['ReactJS','Frontend'], difficulty: 'medium', marks: 3, explanation: 'Controlled components give React full control over form inputs.' },
  { question_text: 'What does the "key" prop do in React lists?', question_type: 'single_choice', options: ['Helps React identify which items changed for efficient reconciliation','Sets CSS class for list items','Encrypts data in the list','Prevents list from rendering'], correct_answer_idx: 0, skills: ['ReactJS'], difficulty: 'easy', marks: 2, explanation: 'Keys help React optimize DOM updates during reconciliation.' },

  // Node.js
  { question_text: 'What is the event loop in Node.js?', question_type: 'single_choice', options: ['A mechanism for non-blocking I/O despite being single-threaded','A loop that runs every 1 second','A database connection pool','A HTTP server module'], correct_answer_idx: 0, skills: ['Node.js','Backend'], difficulty: 'medium', marks: 3, explanation: 'The event loop is the core of Node.js async architecture.' },
  { question_text: 'Difference between require() and import in Node.js?', question_type: 'single_choice', options: ['require() is CommonJS (synchronous); import is ES Module (static)','They are identical','import is older than require()','require() only works with JSON'], correct_answer_idx: 0, skills: ['Node.js','JavaScript'], difficulty: 'medium', marks: 3, explanation: 'ESM imports are statically analyzed at compile time; CJS is runtime.' },
  { question_text: 'What is middleware in Express.js?', question_type: 'single_choice', options: ['Functions with access to req, res, and next in the request-response cycle','A database ORM','A frontend framework plugin','A testing utility'], correct_answer_idx: 0, skills: ['Node.js','Express'], difficulty: 'easy', marks: 2, explanation: 'Middleware enables modular request handling in Express.' },
  { question_text: 'How do you handle errors in async Express route handlers?', question_type: 'single_choice', options: ['Use try/catch and pass the error to next(err)','Let the error crash the server','Use window.onerror','Return 500 without detail'], correct_answer_idx: 0, skills: ['Node.js','Express'], difficulty: 'medium', marks: 3, explanation: 'Passing errors to next(err) triggers error-handling middleware.' },

  // Python
  { question_text: 'What is a Python decorator?', question_type: 'single_choice', options: ['A function that extends another function without modifying it','A variable naming convention','A CSS styling tool','A class inheritance mechanism'], correct_answer_idx: 0, skills: ['Python'], difficulty: 'medium', marks: 3, explanation: 'Decorators wrap functions to add functionality cleanly.' },
  { question_text: 'Difference between a list and a tuple in Python?', question_type: 'single_choice', options: ['Lists are mutable; tuples are immutable','Lists are faster than tuples','Tuples can only hold strings','They are the same'], correct_answer_idx: 0, skills: ['Python'], difficulty: 'easy', marks: 2, explanation: 'Immutability makes tuples safer for fixed data.' },
  { question_text: 'What does the "with" statement do in Python?', question_type: 'single_choice', options: ['Ensures proper resource management using context managers','Creates a new scope like JavaScript','Imports a module','Defines a loop'], correct_answer_idx: 0, skills: ['Python'], difficulty: 'easy', marks: 2, explanation: 'The with statement ensures __enter__ and __exit__ are called.' },
  { question_text: 'Difference between == and is in Python?', question_type: 'single_choice', options: ['== checks value equality; is checks object identity','== checks type; is checks value','They are identical','is is only for boolean checks'], correct_answer_idx: 0, skills: ['Python'], difficulty: 'medium', marks: 3, explanation: 'Understanding identity vs equality prevents subtle bugs.' },

  // SQL / Databases
  { question_text: 'Difference between INNER JOIN and LEFT JOIN in SQL?', question_type: 'single_choice', options: ['INNER JOIN returns matched rows; LEFT JOIN returns all rows from left table','They produce identical results','LEFT JOIN is always faster','INNER JOIN includes NULLs; LEFT JOIN does not'], correct_answer_idx: 0, skills: ['SQL','Databases'], difficulty: 'medium', marks: 3, explanation: 'JOIN type determines which rows are included.' },
  { question_text: 'What is database normalization?', question_type: 'single_choice', options: ['Organizing data to reduce redundancy through normal forms','Making queries run faster','Adding indexes to all columns','Backing up the database'], correct_answer_idx: 0, skills: ['Databases','SQL'], difficulty: 'medium', marks: 3, explanation: 'Normalization reduces data anomalies through structured design.' },
  { question_text: 'What does a database INDEX do?', question_type: 'single_choice', options: ['Improves query performance by creating a fast lookup structure','Deletes duplicate rows','Creates a backup of the table','Enforces foreign keys'], correct_answer_idx: 0, skills: ['SQL','Databases'], difficulty: 'easy', marks: 2, explanation: 'Indexes trade storage for query speed.' },
  { question_text: 'Difference between DELETE, TRUNCATE, and DROP in SQL?', question_type: 'single_choice', options: ['DELETE removes specific rows (logged); TRUNCATE removes all rows fast; DROP removes the table structure','They all do the same','TRUNCATE keeps structure; DROP keeps data','DELETE is reversible; TRUNCATE is permanent'], correct_answer_idx: 0, skills: ['SQL','Databases'], difficulty: 'hard', marks: 4, explanation: 'Understanding these differences is critical for data management.' },
  { question_text: 'What is a stored procedure in SQL?', question_type: 'single_choice', options: ['A precompiled set of SQL statements stored in the database for repeated execution','A table with one row','A type of JOIN','An auto-increment setting'], correct_answer_idx: 0, skills: ['SQL','Databases'], difficulty: 'medium', marks: 3, explanation: 'Stored procedures improve performance and encapsulate logic.' },

  // Manager Level
  { question_text: 'What is the Situational Leadership model?', question_type: 'single_choice', options: ['A leadership approach that adapts style based on follower readiness','A fixed leadership style for all situations','A financial planning tool','A performance appraisal system'], correct_answer_idx: 0, skills: ['Management','Leadership'], difficulty: 'medium', marks: 3, explanation: 'Situational leadership matches style to team member development level.' },
  { question_text: 'What does OKR stand for?', question_type: 'single_choice', options: ['Objectives and Key Results','Operations and Knowledgebase Requirements','Output and Kernel Resources','Operational Key Ratios'], correct_answer_idx: 0, skills: ['Management','Strategy'], difficulty: 'easy', marks: 2, explanation: 'OKR is a goal-setting framework used by top companies.' },
  { question_text: 'How do you handle a consistently underperforming team member?', question_type: 'single_choice', options: ['Private conversation, identify root causes, set PIP with support, review regularly','Ignore the issue and hope it resolves','Immediately terminate employment','Publicly criticize them in meetings'], correct_answer_idx: 0, skills: ['Management','HR'], difficulty: 'medium', marks: 3, explanation: 'A structured PIP with support demonstrates fair leadership.' },
  { question_text: 'What is effective delegation in management?', question_type: 'single_choice', options: ['Assigning authority and responsibility to team members to develop them','Doing all work yourself to ensure quality','Shifting blame to avoid accountability','Writing detailed instructions for every task'], correct_answer_idx: 0, skills: ['Management','Leadership'], difficulty: 'easy', marks: 2, explanation: 'Effective delegation is a key managerial competency.' },

  // MIS / Excel
  { question_text: 'What does VLOOKUP do in Excel?', question_type: 'single_choice', options: ['Searches for a value in the first column and returns a value from the same row','Calculates the vertical average','Counts visible rows','Sorts a range vertically'], correct_answer_idx: 0, skills: ['Excel','MIS'], difficulty: 'easy', marks: 2, explanation: 'VLOOKUP is fundamental for cross-referencing data in Excel.' },
  { question_text: 'What is a Pivot Table in Excel used for?', question_type: 'single_choice', options: ['Summarizing and analyzing large data sets interactively','Creating charts only','Formatting cells','Running macros'], correct_answer_idx: 0, skills: ['Excel','MIS','Data Analysis'], difficulty: 'easy', marks: 2, explanation: 'Pivot tables are the most powerful data summarization tool in Excel.' },
  { question_text: 'What does the SUMIF function do in Excel?', question_type: 'single_choice', options: ['Sums cells that meet a specified condition','Sums all cells regardless of condition','Counts cells that meet criteria','Creates conditional formatting'], correct_answer_idx: 0, skills: ['Excel','MIS'], difficulty: 'medium', marks: 3, explanation: 'SUMIF enables conditional aggregation in data analysis.' },
  { question_text: 'What is MIS reporting in a business context?', question_type: 'single_choice', options: ['Structured reports that help management make decisions using data','A Microsoft software suite','A marketing intelligence score','An accounting certification'], correct_answer_idx: 0, skills: ['MIS','Data Analysis','Reporting'], difficulty: 'easy', marks: 2, explanation: 'MIS reports translate raw data into actionable insights.' },
  { question_text: 'What advantage does INDEX-MATCH have over VLOOKUP in Excel?', question_type: 'single_choice', options: ['Can look up values in any direction, not limited to the first column','They are identical','VLOOKUP is more powerful','VLOOKUP works on rows; INDEX-MATCH on columns only'], correct_answer_idx: 0, skills: ['Excel','MIS'], difficulty: 'hard', marks: 4, explanation: 'INDEX-MATCH is the professional alternative to VLOOKUP for complex lookups.' },
]

let added = 0
for (const q of questions) {
  const [exists] = await db.execute(
    'SELECT id FROM bmi_platform_question_bank WHERE question_text = ?',
    [q.question_text]
  )
  if (exists.length > 0) {
    console.log('Skip:', q.question_text.slice(0,50))
    continue
  }
  await db.execute(
    `INSERT INTO bmi_platform_question_bank
     (id, question_text, question_type, options, correct_answer, skills, difficulty, marks, explanation, is_active, created_at)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
    [
      q.question_text,
      q.question_type,
      JSON.stringify(q.options),
      JSON.stringify(q.options[q.correct_answer_idx]),
      JSON.stringify(q.skills),
      q.difficulty,
      q.marks,
      q.explanation,
    ]
  )
  added++
}
console.log(`Added ${added} new questions`)
await db.end()
