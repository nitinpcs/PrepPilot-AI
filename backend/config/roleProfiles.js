const baseRubric = ['Technical depth and correctness', 'Practical trade-offs', 'Communication clarity', 'Problem solving'];

const profile = (domains, weights, strategy = 'balanced') => ({
  requiredDomains: domains,
  skillWeights: weights,
  difficultyProgression: { start: 'selected', promoteAt: 7, recoverBelow: 4, cadence: 'answer-by-answer' },
  interviewStrategy: strategy,
  evaluationRubric: baseRubric,
  followUpStrategy: 'Probe gaps after weak answers; ask for constraints, trade-offs, and production examples after strong answers.',
});

// This is intentionally data-only: add a role here without changing controllers or prompts.
export const ROLE_PROFILES = {
  'SDE Intern': profile(['Data Structures', 'Algorithms', 'OOP', 'DBMS', 'Operating Systems', 'Computer Networks'], { 'Data Structures': 30, Algorithms: 25, OOP: 15, DBMS: 15, 'Operating Systems': 8, 'Computer Networks': 7 }, 'fundamentals-first'),
  'Software Engineer': profile(['Data Structures', 'Algorithms', 'System Design', 'Databases', 'APIs'], { 'Data Structures': 25, Algorithms: 25, 'System Design': 20, Databases: 15, APIs: 15 }),
  'SDE-1': profile(['Data Structures', 'Algorithms', 'OOP', 'DBMS', 'APIs'], { 'Data Structures': 30, Algorithms: 25, OOP: 15, DBMS: 15, APIs: 15 }, 'implementation-focused'),
  'SDE-2': profile(['Data Structures', 'System Design', 'Databases', 'Distributed Systems', 'Leadership'], { 'Data Structures': 15, 'System Design': 30, Databases: 20, 'Distributed Systems': 20, Leadership: 15 }, 'architecture-and-ownership'),
  'Backend Developer': profile(['Java/Spring Boot or Node.js', 'DBMS', 'SQL', 'Operating Systems', 'Computer Networks', 'System Design', 'REST APIs', 'Authentication', 'Caching'], { Backend: 25, DBMS: 15, SQL: 15, 'System Design': 15, APIs: 10, Authentication: 10, Caching: 10 }),
  'Frontend Developer': profile(['HTML', 'CSS', 'JavaScript', 'React', 'Browser APIs', 'Performance', 'State Management', 'Accessibility'], { JavaScript: 25, React: 25, HTML: 10, CSS: 10, Performance: 10, 'State Management': 10, Accessibility: 10 }),
  'Full Stack Developer': profile(['Frontend', 'Backend', 'Database', 'Authentication', 'Deployment', 'System Design'], { Frontend: 20, Backend: 25, Database: 20, Authentication: 15, Deployment: 10, 'System Design': 10 }),
  'Java Developer': profile(['Java', 'OOP', 'Collections', 'Concurrency', 'JVM', 'SQL'], { Java: 35, OOP: 15, Collections: 15, Concurrency: 15, JVM: 10, SQL: 10 }),
  'Spring Boot Developer': profile(['Java', 'Spring Boot', 'JPA', 'REST APIs', 'Spring Security', 'Microservices', 'SQL'], { 'Spring Boot': 30, Java: 20, JPA: 15, APIs: 15, Security: 10, Microservices: 10 }),
  'Node.js Developer': profile(['JavaScript', 'Node.js', 'Express', 'Databases', 'REST APIs', 'Authentication', 'Async Programming'], { JavaScript: 25, 'Node.js': 30, Databases: 15, APIs: 15, Authentication: 15 }),
  'React Developer': profile(['JavaScript', 'React', 'State Management', 'Performance', 'Testing', 'Accessibility'], { React: 35, JavaScript: 25, 'State Management': 15, Performance: 10, Testing: 8, Accessibility: 7 }),
  'Python Developer': profile(['Python', 'OOP', 'Data Structures', 'APIs', 'Databases', 'Testing'], { Python: 35, OOP: 15, 'Data Structures': 15, APIs: 15, Databases: 10, Testing: 10 }),
  'C++ Developer': profile(['C++', 'Data Structures', 'Algorithms', 'Memory Management', 'OOP', 'Concurrency'], { 'C++': 30, 'Data Structures': 25, Algorithms: 20, 'Memory Management': 15, Concurrency: 10 }),
  'DevOps Engineer': profile(['Linux', 'CI/CD', 'Docker', 'Kubernetes', 'Infrastructure as Code', 'Monitoring', 'Networking'], { 'CI/CD': 20, Docker: 15, Kubernetes: 20, 'Infrastructure as Code': 15, Monitoring: 15, Linux: 15 }),
  'Cloud Engineer': profile(['Cloud Architecture', 'AWS/Azure/GCP', 'Networking', 'Security', 'Containers', 'Infrastructure as Code', 'Cost Optimization'], { 'Cloud Architecture': 25, 'AWS/Azure/GCP': 25, Networking: 15, Security: 15, Containers: 10, 'Infrastructure as Code': 10 }),
  'Data Analyst': profile(['SQL', 'Statistics', 'Excel/BI', 'Data Visualization', 'Python', 'Business Metrics'], { SQL: 30, Statistics: 20, 'Data Visualization': 20, Python: 15, 'Business Metrics': 15 }, 'business-case-focused'),
  'Data Scientist': profile(['Python', 'Statistics', 'Machine Learning', 'SQL', 'Experimentation', 'Data Visualization'], { Python: 20, Statistics: 25, 'Machine Learning': 25, SQL: 15, Experimentation: 15 }),
  'Machine Learning Engineer': profile(['Python', 'Statistics', 'Machine Learning', 'Deep Learning', 'SQL', 'Data Structures', 'MLOps', 'NLP', 'Computer Vision', 'Generative AI'], { Python: 15, Statistics: 15, 'Machine Learning': 25, 'Deep Learning': 15, MLOps: 10, SQL: 10, 'Generative AI': 10 }),
  'AI Engineer': profile(['Python', 'Generative AI', 'LLMs', 'RAG', 'Prompt Engineering', 'Evaluation', 'MLOps'], { Python: 15, 'Generative AI': 25, LLMs: 20, RAG: 20, Evaluation: 10, MLOps: 10 }),
  'Deep Learning Engineer': profile(['Python', 'Deep Learning', 'PyTorch/TensorFlow', 'Optimization', 'Computer Vision', 'NLP'], { 'Deep Learning': 30, 'PyTorch/TensorFlow': 25, Optimization: 15, Python: 15, 'Computer Vision': 8, NLP: 7 }),
  'NLP Engineer': profile(['Python', 'NLP', 'Transformers', 'LLMs', 'Information Retrieval', 'Evaluation'], { NLP: 30, Transformers: 20, LLMs: 20, Python: 15, 'Information Retrieval': 10, Evaluation: 5 }),
  'Computer Vision Engineer': profile(['Python', 'Computer Vision', 'Deep Learning', 'OpenCV', 'Model Deployment'], { 'Computer Vision': 30, 'Deep Learning': 25, Python: 20, OpenCV: 15, 'Model Deployment': 10 }),
  'Prompt Engineer': profile(['Prompt Engineering', 'LLMs', 'RAG', 'Evaluation', 'Safety', 'Python'], { 'Prompt Engineering': 30, LLMs: 25, RAG: 15, Evaluation: 15, Safety: 10, Python: 5 }),
  'MLOps Engineer': profile(['MLOps', 'CI/CD', 'Model Deployment', 'Docker', 'Kubernetes', 'Monitoring', 'Cloud'], { MLOps: 25, 'Model Deployment': 20, 'CI/CD': 15, Kubernetes: 15, Monitoring: 15, Cloud: 10 }),
  'Cyber Security Analyst': profile(['Networking', 'Security Fundamentals', 'Threat Detection', 'Incident Response', 'Web Security', 'Linux'], { Networking: 20, 'Security Fundamentals': 25, 'Threat Detection': 20, 'Incident Response': 15, 'Web Security': 10, Linux: 10 }),
  'QA Automation Engineer': profile(['Testing Fundamentals', 'Automation', 'Selenium/Cypress', 'API Testing', 'CI/CD', 'Programming'], { Automation: 30, 'Testing Fundamentals': 20, 'Selenium/Cypress': 20, 'API Testing': 15, Programming: 10, 'CI/CD': 5 }),
  'Android Developer': profile(['Kotlin/Java', 'Android SDK', 'Jetpack Compose', 'Architecture', 'Networking', 'Testing'], { 'Kotlin/Java': 25, 'Android SDK': 25, 'Jetpack Compose': 15, Architecture: 15, Networking: 10, Testing: 10 }),
  'Flutter Developer': profile(['Dart', 'Flutter', 'State Management', 'Mobile Architecture', 'APIs', 'Testing'], { Flutter: 30, Dart: 25, 'State Management': 15, 'Mobile Architecture': 15, APIs: 10, Testing: 5 }),
  'Product Manager': profile(['Product Strategy', 'User Research', 'Analytics', 'Prioritization', 'Execution', 'Stakeholder Management'], { 'Product Strategy': 25, 'User Research': 15, Analytics: 20, Prioritization: 20, Execution: 10, 'Stakeholder Management': 10 }, 'product-case-and-behavioral'),
};

export const getRoleProfile = (role) => ROLE_PROFILES[role] || null;
export const listRoleProfiles = () => Object.entries(ROLE_PROFILES).map(([name, config]) => ({ name, ...config }));
