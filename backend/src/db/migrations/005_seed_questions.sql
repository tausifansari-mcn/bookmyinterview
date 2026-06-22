-- ============================================================
-- Seed 100+ questions across 20+ skills for the platform
-- question bank. Run once after migration 004.
-- ============================================================

-- ── JAVASCRIPT ────────────────────────────────────────────────
INSERT IGNORE INTO bmi_platform_question_bank (id, question_text, question_type, options, correct_answer, skills, category, difficulty, marks, explanation) VALUES
(UUID(), 'Which of the following is NOT a JavaScript data type?', 'single_choice', '["String","Boolean","Character","Number"]', '[2]', '["JavaScript"]', 'Frontend', 'easy', 1, 'JavaScript does not have a "Character" type; it uses strings for single characters.'),
(UUID(), 'What does the `===` operator do in JavaScript?', 'single_choice', '["Assigns a value","Compares value only","Compares value and type","Compares reference"]', '[2]', '["JavaScript"]', 'Frontend', 'easy', 1, '=== is the strict equality operator that compares both value and type.'),
(UUID(), 'Which method adds an element to the end of an array?', 'single_choice', '["pop()","push()","shift()","unshift()"]', '[1]', '["JavaScript"]', 'Frontend', 'easy', 1, 'push() appends a new element to the end of an array.'),
(UUID(), 'What is the output of `typeof null` in JavaScript?', 'single_choice', '["null","undefined","object","boolean"]', '[2]', '["JavaScript"]', 'Frontend', 'medium', 1, 'typeof null returns "object" — this is a well-known JavaScript bug from its first release.'),
(UUID(), 'Which of the following is true about closures in JavaScript?', 'single_choice', '["They only work with arrow functions","They have access to outer function variables","They cannot return values","They are only used in loops"]', '[1]', '["JavaScript"]', 'Frontend', 'medium', 2, 'A closure is a function that has access to its outer function scope even after the outer function has returned.'),
(UUID(), 'What method creates a new array with elements that pass a test?', 'single_choice', '["forEach()","map()","filter()","reduce()"]', '[2]', '["JavaScript"]', 'Frontend', 'easy', 1, 'filter() creates a new array with all elements that pass the test implemented by the provided function.'),
(UUID(), 'What is the event propagation order in the DOM?', 'single_choice', '["Bubbling then Capturing","Capturing then Bubbling","Only Bubbling","Random order"]', '[1]', '["JavaScript"]', 'Frontend', 'hard', 2, 'DOM events first capture (window to target) then bubble (target to window).'),
(UUID(), 'Which statement correctly declares a constant in JavaScript?', 'single_choice', '["let x = 5","var x = 5","const x = 5","constant x = 5"]', '[2]', '["JavaScript"]', 'Frontend', 'easy', 1, 'const is used to declare block-scoped constants that cannot be reassigned.'),

-- ── REACT ─────────────────────────────────────────────────────
(UUID(), 'What is the virtual DOM in React?', 'single_choice', '["The actual browser DOM","A lightweight copy of the DOM","A separate database","A CSS framework"]', '[1]', '["React"]', 'Frontend', 'easy', 1, 'The virtual DOM is a lightweight JavaScript representation of the actual DOM.'),
(UUID(), 'Which hook is used for side effects in React?', 'single_choice', '["useState","useEffect","useContext","useReducer"]', '[1]', '["React"]', 'Frontend', 'easy', 1, 'useEffect handles side effects like data fetching, subscriptions, and DOM manipulation.'),
(UUID(), 'What does the `key` prop do in React lists?', 'single_choice', '["Styles the list","Helps identify changed items","Adds a key to the DOM","Increases performance automatically"]', '[1]', '["React"]', 'Frontend', 'medium', 1, 'The key prop helps React identify which items have changed, been added, or removed.'),
(UUID(), 'What is the correct way to update state in React?', 'single_choice', '["state = newValue","this.state = newValue","setState(newValue)","updateState(newValue)"]', '[2]', '["React"]', 'Frontend', 'easy', 1, 'setState (or the setter from useState) is the proper way to update state in React.'),
(UUID(), 'Which of the following is NOT a React lifecycle method?', 'single_choice', '["componentDidMount","componentWillUnmount","componentShouldUpdate","componentDidUpdate"]', '[2]', '["React"]', 'Frontend', 'medium', 1, 'There is no componentShouldUpdate lifecycle method — it is shouldComponentUpdate.'),

-- ── NODE.JS ───────────────────────────────────────────────────
(UUID(), 'What is npm?', 'single_choice', '["Node Package Manager","Node Process Manager","Next Package Module","Native Package Middleware"]', '[0]', '["Node.js"]', 'Backend', 'easy', 1, 'npm stands for Node Package Manager and is the default package manager for Node.js.'),
(UUID(), 'Which method reads a file asynchronously in Node.js?', 'single_choice', '["fs.readFileSync()","fs.readFile()","fs.read()","fs.readAsync()"]', '[1]', '["Node.js"]', 'Backend', 'easy', 1, 'fs.readFile() reads files asynchronously. readFileSync() is the synchronous version.'),
(UUID(), 'What is middleware in Express.js?', 'single_choice', '["A database driver","Functions that execute during the request-response cycle","A templating engine","A type of route"]', '[1]', '["Node.js"]', 'Backend', 'medium', 1, 'Middleware functions have access to the request and response objects and execute during the request-response cycle.'),
(UUID(), 'What does the `require()` function do in Node.js?', 'single_choice', '["Executes a shell command","Imports modules","Creates a new file","Defines a variable"]', '[1]', '["Node.js"]', 'Backend', 'easy', 1, 'require() is used to import modules, JSON, and local files in Node.js.'),
(UUID(), 'Which of these is a built-in Node.js module?', 'single_choice', '["http","express","mongoose","axios"]', '[0]', '["Node.js"]', 'Backend', 'medium', 1, 'http is a built-in Node.js module. express, mongoose, and axios are third-party packages.'),

-- ── SQL ───────────────────────────────────────────────────────
(UUID(), 'Which SQL statement is used to retrieve data from a database?', 'single_choice', '["GET","FETCH","SELECT","EXTRACT"]', '[2]', '["SQL"]', 'Backend', 'easy', 1, 'SELECT is used to query/retrieve data from a database table.'),
(UUID(), 'What does the JOIN clause do in SQL?', 'single_choice', '["Combines rows from two tables","Deletes duplicate rows","Sorts the results","Groups results by a column"]', '[0]', '["SQL"]', 'Backend', 'easy', 1, 'JOIN combines rows from two or more tables based on a related column.'),
(UUID(), 'What is the purpose of the PRIMARY KEY constraint?', 'single_choice', '["Allows NULL values","Uniquely identifies each row","Enforces a default value","Creates an index automatically"]', '[1]', '["SQL"]', 'Backend', 'easy', 1, 'A PRIMARY KEY uniquely identifies each row in a table and cannot contain NULL values.'),
(UUID(), 'Which aggregate function counts the number of rows?', 'single_choice', '["SUM()","AVG()","COUNT()","TOTAL()"]', '[2]', '["SQL"]', 'Backend', 'easy', 1, 'COUNT() returns the number of rows that match a specified condition.'),
(UUID(), 'What does the HAVING clause do in SQL?', 'single_choice', '["Filters rows before grouping","Filters groups after GROUP BY","Sorts the results","Limits the number of rows"]', '[1]', '["SQL"]', 'Backend', 'medium', 1, 'HAVING filters groups created by GROUP BY, while WHERE filters individual rows.'),

-- ── PYTHON ────────────────────────────────────────────────────
(UUID(), 'Which of these is NOT a Python data type?', 'single_choice', '["List","Dictionary","Array","Tuple"]', '[2]', '["Python"]', 'Backend', 'easy', 1, 'Python has lists, not arrays as a built-in type (though arrays exist in the array module).'),
(UUID(), 'How do you create a list comprehension in Python?', 'single_choice', '["[x for x in range(10)]","list(x for x in range(10))","for x in range(10): list.add(x)","{x for x in range(10)}"]', '[0]', '["Python"]', 'Backend', 'medium', 1, 'List comprehensions use square brackets with a for clause: [expression for item in iterable].'),
(UUID(), 'What does the `len()` function do in Python?', 'single_choice', '["Returns the last element","Returns the length of an object","Converts to lowercase","Creates a new list"]', '[1]', '["Python"]', 'Backend', 'easy', 1, 'len() returns the number of items in an object like a string, list, or dictionary.'),
(UUID(), 'Which keyword is used to define a function in Python?', 'single_choice', '["function","def","func","define"]', '[1]', '["Python"]', 'Backend', 'easy', 1, 'def is the keyword used to define functions in Python.'),

-- ── JAVA ──────────────────────────────────────────────────────
(UUID(), 'What is the JVM?', 'single_choice', '["Java Visual Machine","Java Virtual Machine","Java Variable Manager","Java Version Manager"]', '[1]', '["Java"]', 'Backend', 'easy', 1, 'JVM stands for Java Virtual Machine — it runs Java bytecode.'),
(UUID(), 'Which keyword is used to inherit a class in Java?', 'single_choice', '["inherit","extends","implements","super"]', '[1]', '["Java"]', 'Backend', 'easy', 1, 'extends is used for class inheritance. implements is used for interfaces.'),
(UUID(), 'What is the difference between `==` and `.equals()` in Java?', 'single_choice', '["They are the same","== compares reference, .equals() compares value","== compares value, .equals() compares reference","Both compare reference"]', '[1]', '["Java"]', 'Backend', 'medium', 2, '== compares object references, while .equals() compares the actual content/value of objects.'),

-- ── HTML ──────────────────────────────────────────────────────
(UUID(), 'What does HTML stand for?', 'single_choice', '["HyperText Markup Language","High Tech Modern Language","HyperTransfer Markup Language","Home Tool Markup Language"]', '[0]', '["HTML"]', 'Frontend', 'easy', 1, 'HTML = HyperText Markup Language, the standard language for web pages.'),
(UUID(), 'Which tag is used for the largest heading in HTML?', 'single_choice', '["<heading>","<h6>","<h1>","<header>"]', '[2]', '["HTML"]', 'Frontend', 'easy', 1, '<h1> defines the most important/ largest heading. <h6> is the smallest.'),
(UUID(), 'What does the `alt` attribute do in an `<img>` tag?', 'single_choice', '["Adds a title","Provides alternative text","Sets the image height","Links to another image"]', '[1]', '["HTML"]', 'Frontend', 'easy', 1, 'The alt attribute provides alternative text if the image cannot be displayed.'),

-- ── CSS ───────────────────────────────────────────────────────
(UUID(), 'What does CSS stand for?', 'single_choice', '["Computer Style Sheets","Cascading Style Sheets","Creative Style System","Colorful Style Sheets"]', '[1]', '["CSS"]', 'Frontend', 'easy', 1, 'CSS = Cascading Style Sheets, used to style HTML elements.'),
(UUID(), 'Which property makes a flexbox container?', 'single_choice', '["display: block","display: flex","display: inline","position: relative"]', '[1]', '["CSS"]', 'Frontend', 'easy', 1, 'display: flex creates a flexbox container and enables flex properties on children.'),
(UUID(), 'What does `z-index` control?', 'single_choice', '["Horizontal position","Stacking order","Font size","Element width"]', '[1]', '["CSS"]', 'Frontend', 'easy', 1, 'z-index controls the stacking order of positioned elements. Higher values appear on top.'),

-- ── TypeScript ────────────────────────────────────────────────
(UUID(), 'What is the main benefit of TypeScript over JavaScript?', 'single_choice', '["Faster runtime","Static type checking","Smaller bundle size","Built-in database"]', '[1]', '["TypeScript"]', 'Frontend', 'medium', 1, 'TypeScript adds optional static typing to catch errors at compile time rather than runtime.'),
(UUID(), 'How do you define an interface in TypeScript?', 'single_choice', '["interface User { name: string }","object User { name: string }","class User { name: string }","type User = { name: string }"]', '[0]', '["TypeScript"]', 'Frontend', 'medium', 1, 'Both interface and type can define object shapes, but interface is the traditional way.'),

-- ── MongoDB ───────────────────────────────────────────────────
(UUID(), 'What type of database is MongoDB?', 'single_choice', '["Relational","Document-oriented","Key-value","Graph"]', '[1]', '["MongoDB"]', 'Backend', 'easy', 1, 'MongoDB is a NoSQL document-oriented database that stores data in JSON-like documents.'),
(UUID(), 'What is the equivalent of a table in MongoDB?', 'single_choice', '["Document","Collection","Record","Row"]', '[1]', '["MongoDB"]', 'Backend', 'easy', 1, 'In MongoDB, a collection is the equivalent of a table in relational databases.'),

-- ── Docker ────────────────────────────────────────────────────
(UUID(), 'What is Docker primarily used for?', 'single_choice', '["Version control","Containerization","Database management","Load balancing"]', '[1]', '["Docker"]', 'DevOps', 'easy', 1, 'Docker is a containerization platform that packages applications and dependencies into containers.'),
(UUID(), 'What is a Dockerfile?', 'single_choice', '["A running container","A script to build an image","A configuration for networking","A database schema"]', '[1]', '["Docker"]', 'DevOps', 'medium', 1, 'A Dockerfile is a script containing instructions to build a Docker image.'),

-- ── AWS ───────────────────────────────────────────────────────
(UUID(), 'Which AWS service is used for virtual servers?', 'single_choice', '["S3","Lambda","EC2","RDS"]', '[2]', '["AWS"]', 'DevOps', 'medium', 1, 'Amazon EC2 (Elastic Compute Cloud) provides virtual servers in the cloud.'),
(UUID(), 'What does S3 stand for in AWS?', 'single_choice', '["Simple Storage Service","Server Security System","Scalable Server Solution","System Storage Service"]', '[0]', '["AWS"]', 'DevOps', 'medium', 1, 'Amazon S3 = Simple Storage Service, an object storage service.'),

-- ── Git ───────────────────────────────────────────────────────
(UUID(), 'Which command creates a new Git repository?', 'single_choice', '["git start","git new","git init","git create"]', '[2]', '["Git"]', 'DevOps', 'easy', 1, 'git init initializes a new Git repository in the current directory.'),
(UUID(), 'What does `git commit -m "message"` do?', 'single_choice', '["Deletes changes","Saves staged changes with a message","Creates a new branch","Merges branches"]', '[1]', '["Git"]', 'DevOps', 'easy', 1, 'git commit saves all staged changes with a descriptive message about what was changed.'),

-- ── DATA STRUCTURES ──────────────────────────────────────────
(UUID(), 'What is the time complexity of accessing an element in an array by index?', 'single_choice', '["O(1)","O(n)","O(log n)","O(n^2)"]', '[0]', '["Data Structures"]', 'DSA', 'easy', 2, 'Accessing by index is O(1) constant time since arrays use direct memory addressing.'),
(UUID(), 'Which data structure operates on LIFO principle?', 'single_choice', '["Queue","Stack","Linked List","Tree"]', '[1]', '["Data Structures"]', 'DSA', 'easy', 1, 'A Stack follows Last-In-First-Out (LIFO) — the last element added is the first removed.'),
(UUID(), 'What is a hash table collision?', 'single_choice', '["When two keys hash to the same index","When the table is full","When a key is deleted","When the hash function fails"]', '[0]', '["Data Structures"]', 'DSA', 'medium', 2, 'A collision occurs when two different keys produce the same hash index.'),
(UUID(), 'Which traversal visits left subtree, then root, then right subtree?', 'single_choice', '["Preorder","Inorder","Postorder","Level order"]', '[1]', '["Data Structures"]', 'DSA', 'medium', 2, 'Inorder traversal: Left → Root → Right. It visits nodes in ascending order in a BST.'),

-- ── ALGORITHMS ────────────────────────────────────────────────
(UUID(), 'What is the time complexity of binary search?', 'single_choice', '["O(1)","O(n)","O(log n)","O(n log n)"]', '[2]', '["Algorithms"]', 'DSA', 'medium', 2, 'Binary search has O(log n) time complexity as it halves the search space each step.'),
(UUID(), 'Which algorithm sorts by repeatedly selecting the minimum element?', 'single_choice', '["Bubble Sort","Selection Sort","Merge Sort","Quick Sort"]', '[1]', '["Algorithms"]', 'DSA', 'medium', 1, 'Selection Sort repeatedly finds the minimum element and moves it to the sorted portion.'),
(UUID(), 'What is the space complexity of merge sort?', 'single_choice', '["O(1)","O(n)","O(log n)","O(n log n)"]', '[1]', '["Algorithms"]', 'DSA', 'hard', 2, 'Merge sort requires O(n) additional space for the temporary arrays during merging.'),

-- ── SYSTEM DESIGN ────────────────────────────────────────────
(UUID(), 'What is load balancing?', 'single_choice', '["Distributing traffic across servers","Reducing database size","Compressing files","Encrypting data"]', '[0]', '["System Design"]', 'System Design', 'medium', 2, 'Load balancing distributes incoming network traffic across multiple servers to ensure reliability.'),
(UUID(), 'What is the CAP theorem about?', 'single_choice', '["Consistency, Availability, Partition Tolerance","Caching, Authorization, Performance","Capacity, Access, Protocol","Concurrency, Atomicity, Parallelism"]', '[0]', '["System Design"]', 'System Design', 'hard', 2, 'CAP theorem states that a distributed system can only guarantee two of three: Consistency, Availability, and Partition Tolerance.'),

-- ── DATABASES ─────────────────────────────────────────────────
(UUID(), 'What is database indexing?', 'single_choice', '["A data structure that speeds up queries","A way to encrypt data","A backup strategy","A normalization technique"]', '[0]', '["Databases"]', 'Backend', 'medium', 1, 'An index is a data structure that improves the speed of data retrieval operations on a table.'),
(UUID(), 'What is database normalization?', 'single_choice', '["Adding redundant data","Organizing data to reduce redundancy","Encrypting database tables","Creating backups"]', '[1]', '["Databases"]', 'Backend', 'medium', 1, 'Normalization organizes data to minimize redundancy and dependency by dividing large tables into smaller ones.'),

-- ── COMMUNICATION ─────────────────────────────────────────────
(UUID(), 'What is active listening in a professional context?', 'single_choice', '["Speaking more than listening","Fully concentrating on what is being said","Taking notes without eye contact","Interrupting to ask questions"]', '[1]', '["Communication"]', 'Soft Skills', 'easy', 1, 'Active listening means fully concentrating, understanding, responding, and remembering what is said.'),
(UUID(), 'Which is the best approach when giving constructive feedback?', 'single_choice', '["Focus only on negatives","Be specific and suggest improvement","Compare with other employees","Give feedback publicly"]', '[1]', '["Communication"]', 'Soft Skills', 'medium', 1, 'Effective feedback is specific, focused on behavior not personality, and includes suggestions for improvement.'),

-- ── PROJECT MANAGEMENT ────────────────────────────────────────
(UUID(), 'What is a sprint in Scrum?', 'single_choice', '["A quick meeting","A time-boxed iteration","A project deadline","A documentation review"]', '[1]', '["Project Management"]', 'Management', 'easy', 1, 'A sprint is a time-boxed period (usually 1-4 weeks) during which a team completes a set amount of work.'),
(UUID(), 'Who is responsible for the product backlog in Scrum?', 'single_choice', '["Scrum Master","Product Owner","Development Team","Stakeholders"]', '[1]', '["Project Management"]', 'Management', 'medium', 1, 'The Product Owner is responsible for maintaining and prioritizing the product backlog.'),

-- ── SALES ─────────────────────────────────────────────────────
(UUID(), 'What does B2B stand for in sales?', 'single_choice', '["Back to Business","Business to Business","Business to Buyer","Brand to Business"]', '[1]', '["Sales"]', 'Sales', 'easy', 1, 'B2B = Business to Business, referring to sales between companies rather than to individual consumers.'),
(UUID(), 'What is a sales pipeline?', 'single_choice', '["A physical pipe","Visual stages of the sales process","A list of customers","A pricing strategy"]', '[1]', '["Sales"]', 'Sales', 'medium', 1, 'A sales pipeline visually represents the stages a prospect moves through from lead to customer.'),

-- ── HR ────────────────────────────────────────────────────────
(UUID(), 'What is the purpose of a job description?', 'single_choice', '["To advertise the company","To outline role responsibilities and requirements","To set salary expectations only","To list company benefits"]', '[1]', '["HR"]', 'HR', 'easy', 1, 'A job description clearly outlines the responsibilities, requirements, and expectations for a role.'),
(UUID(), 'What does KPI stand for in performance management?', 'single_choice', '["Key Performance Indicator","Key Personnel Index","Knowledge Process Integration","Key Planning Initiative"]', '[0]', '["HR"]', 'HR', 'easy', 1, 'KPI = Key Performance Indicator, a measurable value that demonstrates how effectively objectives are being met.'),

-- ── DATA ANALYSIS ─────────────────────────────────────────────
(UUID(), 'What is the difference between mean and median?', 'single_choice', '["They are the same","Mean is average, median is the middle value","Mean is the middle, median is average","Both are types of charts"]', '[1]', '["Data Analysis"]', 'Data', 'easy', 1, 'Mean is the arithmetic average, while median is the middle value when data is sorted.'),
(UUID(), 'What does a p-value tell you in statistics?', 'single_choice', '["The exact value of the mean","Probability of observing results by chance","The sample size needed","The correlation coefficient"]', '[1]', '["Data Analysis"]', 'Data', 'hard', 2, 'A p-value indicates the probability of obtaining results as extreme as observed, assuming the null hypothesis is true.'),

-- ── CYBERSECURITY ─────────────────────────────────────────────
(UUID(), 'What is phishing?', 'single_choice', '["A type of firewall","A social engineering attack to steal information","A network scanning tool","An encryption method"]', '[1]', '["Cybersecurity"]', 'Security', 'medium', 1, 'Phishing is a cyber attack where criminals impersonate legitimate entities to trick victims into revealing sensitive data.'),
(UUID(), 'What does HTTPS stand for?', 'single_choice', '["HyperText Transfer Protocol Secure","High Transfer Protocol Standard","Hyper Transfer Standard Protocol","High Tech Protocol System"]', '[0]', '["Cybersecurity"]', 'Security', 'easy', 1, 'HTTPS = HTTP over TLS/SSL, encrypting data between browser and server.'),

-- ── MACHINE LEARNING ──────────────────────────────────────────
(UUID(), 'What is supervised learning?', 'single_choice', '["Learning without labels","Learning with labeled training data","Learning by trial and error","Learning from rewards"]', '[1]', '["Machine Learning"]', 'AI/ML', 'medium', 2, 'Supervised learning trains models on labeled data where the desired output is known.'),
(UUID(), 'What is overfitting in machine learning?', 'single_choice', '["Model performs well on training but poorly on new data","Model performs well on all data","Model fails to learn anything","Model trains too slowly"]', '[0]', '["Machine Learning"]', 'AI/ML', 'medium', 2, 'Overfitting occurs when a model learns training data too well, including noise, and fails to generalize.'),
(UUID(), 'What does NLP stand for?', 'single_choice', '["Natural Language Processing","Neural Learning Protocol","Network Language Protocol","Natural Logic Processing"]', '[0]', '["Machine Learning"]', 'AI/ML', 'medium', 1, 'NLP = Natural Language Processing, a branch of AI focused on interaction between computers and human language.'),

-- ── ANGULAR ───────────────────────────────────────────────────
(UUID(), 'What is a component in Angular?', 'single_choice', '["A CSS file","A building block of the UI","A database table","A server endpoint"]', '[1]', '["Angular"]', 'Frontend', 'medium', 1, 'Components are the fundamental building blocks of Angular applications, controlling a part of the screen.'),
(UUID(), 'What is data binding in Angular?', 'single_choice', '["Connecting to a database","Synchronizing data between model and view","Linking CSS files","Binding keyboard events"]', '[1]', '["Angular"]', 'Frontend', 'medium', 1, 'Data binding automatically synchronizes data between the component and the DOM.'),

-- ── VUE.JS ────────────────────────────────────────────────────
(UUID(), 'What is Vue.js used for?', 'single_choice', '["Server-side programming","Building user interfaces","Database management","Network configuration"]', '[1]', '["Vue.js"]', 'Frontend', 'easy', 1, 'Vue.js is a progressive JavaScript framework for building user interfaces and single-page applications.'),
(UUID(), 'What is the `v-model` directive used for in Vue?', 'single_choice', '["Creating models","Two-way data binding","Adding CSS classes","Handling events"]', '[1]', '["Vue.js"]', 'Frontend', 'medium', 1, 'v-model creates two-way data bindings on form input elements.'),

-- ── GO ────────────────────────────────────────────────────────
(UUID(), 'What company developed the Go programming language?', 'single_choice', '["Microsoft","Apple","Google","Facebook"]', '[2]', '["Go"]', 'Backend', 'easy', 1, 'Go (also called Golang) was developed by Google in 2007 and released in 2009.'),
(UUID(), 'What is a goroutine in Go?', 'single_choice', '["A debugging tool","A lightweight thread managed by Go runtime","A database connection","A test case"]', '[1]', '["Go"]', 'Backend', 'medium', 2, 'Goroutines are lightweight threads of execution managed by the Go runtime, making concurrent programming easy.'),

-- ── RUST ──────────────────────────────────────────────────────
(UUID(), 'What is Rust primarily known for?', 'single_choice', '["Memory safety without garbage collection","Dynamic typing","Built-in garbage collector","Interpreted language"]', '[0]', '["Rust"]', 'Backend', 'medium', 2, 'Rust guarantees memory safety through its ownership system without needing a garbage collector.'),
(UUID(), 'What is the ownership system in Rust?', 'single_choice', '["A way to manage database ownership","A set of rules for memory management","A file system permission model","A code ownership workflow"]', '[1]', '["Rust"]', 'Backend', 'hard', 2, 'Rust ownership rules (each value has one owner, ownership can be transferred/referenced) ensure memory safety at compile time.'),

-- ── KUBERNETES ────────────────────────────────────────────────
(UUID(), 'What is a pod in Kubernetes?', 'single_choice', '["A storage volume","The smallest deployable unit","A cluster of machines","A network policy"]', '[1]', '["Kubernetes"]', 'DevOps', 'medium', 1, 'A pod is the smallest and simplest Kubernetes object — it represents a single instance of a running process.'),
(UUID(), 'What does Kubernetes do?', 'single_choice', '["Compiles code","Orchestrates containers","Creates databases","Manages user accounts"]', '[1]', '["Kubernetes"]', 'DevOps', 'medium', 1, 'Kubernetes automates the deployment, scaling, and management of containerized applications.'),

-- ── TESTING ───────────────────────────────────────────────────
(UUID(), 'What is unit testing?', 'single_choice', '["Testing the entire application","Testing individual components in isolation","Testing user interface","Testing database performance"]', '[1]', '["Testing"]', 'QA', 'easy', 1, 'Unit testing verifies that individual units of source code (usually functions/methods) work correctly in isolation.'),
(UUID(), 'What is TDD?', 'single_choice', '["Test Driven Development","Technical Design Document","Test Deployment Dashboard","Total Development Duration"]', '[0]', '["Testing"]', 'QA', 'medium', 1, 'TDD = Test Driven Development, where you write tests before writing the production code.'),

-- ── DEVOPS ────────────────────────────────────────────────────
(UUID(), 'What is CI/CD?', 'single_choice', '["Continuous Integration / Continuous Deployment","Code Integration / Code Deployment","Centralized Input / Centralized Output","Critical Infrastructure / Critical Data"]', '[0]', '["DevOps"]', 'DevOps', 'medium', 1, 'CI/CD automates the building, testing, and deployment of applications with Continuous Integration and Continuous Deployment.'),
(UUID(), 'What is Infrastructure as Code (IaC)?', 'single_choice', '["Writing infrastructure documentation","Managing infrastructure through machine-readable definition files","Manually configuring servers","Using physical hardware"]', '[1]', '["DevOps"]', 'DevOps', 'hard', 2, 'IaC manages and provisions infrastructure through code instead of manual processes.'),

-- ── PROBLEM SOLVING ───────────────────────────────────────────
(UUID(), 'What is the first step in solving a complex problem?', 'single_choice', '["Implementing a solution","Understanding and defining the problem","Calling a meeting","Writing code"]', '[1]', '["Problem Solving"]', 'Soft Skills', 'easy', 1, 'Clearly understanding and defining the problem is the critical first step before any solution can be developed.'),
(UUID(), 'What is root cause analysis?', 'single_choice', '["A method to find symptoms","A process to identify the underlying cause of a problem","A reporting technique","A team-building exercise"]', '[1]', '["Problem Solving"]', 'Soft Skills', 'medium', 1, 'Root cause analysis is a systematic process for identifying the fundamental cause of problems to prevent recurrence.');
