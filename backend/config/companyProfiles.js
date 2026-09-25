const criteria = ['Problem solving and correctness', 'Communication and structured thinking', 'Technical depth', 'Role fit'];

const profile = ({ rounds, topics, difficulty, style, codingRatio, behavioral, evaluationCriteria = criteria }) => ({
  interviewRounds: rounds,
  preferredTopics: topics,
  questionDifficulty: difficulty,
  interviewStyle: style,
  codingTheoryRatio: { coding: codingRatio, theory: 100 - codingRatio },
  behavioralEmphasis: behavioral,
  evaluationCriteria,
  followUpStrategy: 'Use each answer to probe assumptions, edge cases, trade-offs, and the candidate’s individual contribution before moving on.',
});

// Data-only company catalog. Add a company here; the API, session creation, and prompts adapt automatically.
export const COMPANY_PROFILES = {
  Google: profile({ rounds: ['Recruiter screen', 'Technical coding', 'Technical coding', 'System design / domain depth', 'Googliness & leadership'], topics: ['Algorithms', 'Data Structures', 'Scalability', 'Problem Solving'], difficulty: 'Advanced', style: 'Collaborative, ambiguity-tolerant problem solving', codingRatio: 75, behavioral: 'Moderate', evaluationCriteria: ['Algorithmic reasoning', 'Code quality', 'Scalability', 'Collaborative communication'] }),
  Microsoft: profile({ rounds: ['Recruiter screen', 'Coding', 'Design / domain depth', 'Behavioral'], topics: ['Algorithms', 'Object Oriented Design', 'System Design', 'Cloud'], difficulty: 'Intermediate to Advanced', style: 'Practical engineering with clear communication', codingRatio: 65, behavioral: 'Moderate' }),
  Amazon: profile({ rounds: ['Online assessment', 'Coding', 'System design', 'Bar raiser'], topics: ['Algorithms', 'System Design', 'Leadership Principles', 'Databases'], difficulty: 'Advanced', style: 'Data-driven, ownership-focused', codingRatio: 55, behavioral: 'High', evaluationCriteria: ['Leadership Principles', 'Problem solving', 'Ownership', 'Delivering results'] }),
  Meta: profile({ rounds: ['Coding screen', 'Coding', 'System design', 'Behavioral'], topics: ['Algorithms', 'Data Structures', 'Product / System Design'], difficulty: 'Advanced', style: 'Fast-paced and solution-oriented', codingRatio: 75, behavioral: 'Moderate' }),
  Apple: profile({ rounds: ['Technical screen', 'Role deep dive', 'Cross-functional / behavioral'], topics: ['Role expertise', 'Performance', 'Quality', 'Product thinking'], difficulty: 'Advanced', style: 'Deep domain expertise and attention to detail', codingRatio: 55, behavioral: 'Moderate' }),
  Netflix: profile({ rounds: ['Hiring manager', 'Technical depth', 'Culture / values'], topics: ['System Design', 'Role expertise', 'Ownership', 'Business impact'], difficulty: 'Advanced', style: 'Senior-level judgment and candid trade-offs', codingRatio: 40, behavioral: 'High' }),
  Uber: profile({ rounds: ['Coding', 'System design', 'Behavioral'], topics: ['Algorithms', 'Distributed Systems', 'Marketplace / Product thinking'], difficulty: 'Advanced', style: 'Pragmatic systems and operational thinking', codingRatio: 60, behavioral: 'Moderate' }),
  Atlassian: profile({ rounds: ['Coding', 'System design', 'Values / collaboration'], topics: ['Algorithms', 'Design', 'Collaboration', 'Product thinking'], difficulty: 'Intermediate to Advanced', style: 'Collaborative and customer-centric', codingRatio: 55, behavioral: 'High' }),
  Adobe: profile({ rounds: ['Technical screen', 'Coding / domain depth', 'Behavioral'], topics: ['Algorithms', 'Role expertise', 'Product quality', 'Design'], difficulty: 'Intermediate to Advanced', style: 'Creative, quality-focused engineering', codingRatio: 60, behavioral: 'Moderate' }),
  Salesforce: profile({ rounds: ['Technical screen', 'Coding', 'Architecture', 'Values'], topics: ['Cloud', 'APIs', 'System Design', 'Customer success'], difficulty: 'Intermediate to Advanced', style: 'Customer-focused enterprise engineering', codingRatio: 50, behavioral: 'High' }),
  Oracle: profile({ rounds: ['Technical screen', 'Coding / database depth', 'Managerial round'], topics: ['Databases', 'Java', 'Algorithms', 'Systems'], difficulty: 'Intermediate to Advanced', style: 'Fundamentals and enterprise-scale depth', codingRatio: 60, behavioral: 'Moderate' }),
  EPAM: profile({ rounds: ['Technical assessment', 'Client-facing technical round', 'HR'], topics: ['Role stack', 'Design Patterns', 'Communication', 'Delivery'], difficulty: 'Intermediate', style: 'Consulting-oriented practical delivery', codingRatio: 50, behavioral: 'High' }),
  TCS: profile({ rounds: ['Aptitude / technical', 'Technical interview', 'HR'], topics: ['Programming fundamentals', 'OOP', 'DBMS', 'Communication'], difficulty: 'Beginner to Intermediate', style: 'Fundamentals and employability focused', codingRatio: 45, behavioral: 'Moderate' }),
  Infosys: profile({ rounds: ['Online assessment', 'Technical round', 'HR'], topics: ['Programming', 'OOP', 'DBMS', 'Projects'], difficulty: 'Beginner to Intermediate', style: 'Structured fundamentals and project discussion', codingRatio: 45, behavioral: 'Moderate' }),
  Accenture: profile({ rounds: ['Assessment', 'Technical / client round', 'HR'], topics: ['Role stack', 'Problem solving', 'Communication', 'Projects'], difficulty: 'Intermediate', style: 'Client-ready practical engineering', codingRatio: 45, behavioral: 'High' }),
  Deloitte: profile({ rounds: ['Case / technical screen', 'Technical round', 'Behavioral'], topics: ['Problem solving', 'Analytics', 'Communication', 'Client impact'], difficulty: 'Intermediate', style: 'Consulting case and stakeholder-focused', codingRatio: 35, behavioral: 'High' }),
  Wipro: profile({ rounds: ['Assessment', 'Technical round', 'HR'], topics: ['Programming fundamentals', 'Aptitude', 'Projects', 'Communication'], difficulty: 'Beginner to Intermediate', style: 'Core concepts and professional readiness', codingRatio: 40, behavioral: 'Moderate' }),
  Cognizant: profile({ rounds: ['Assessment', 'Technical round', 'Managerial / HR'], topics: ['Programming', 'Databases', 'Projects', 'Communication'], difficulty: 'Beginner to Intermediate', style: 'Practical delivery and client communication', codingRatio: 45, behavioral: 'High' }),
  'Other / Custom': profile({ rounds: ['Technical screen', 'Role interview', 'Behavioral'], topics: ['Role profile domains', 'Projects', 'Problem solving'], difficulty: 'Selected', style: 'Balanced company-style interview', codingRatio: 50, behavioral: 'Moderate' }),
};

export const getCompanyProfile = (company) => COMPANY_PROFILES[company] || null;
export const listCompanyProfiles = () => Object.entries(COMPANY_PROFILES).map(([name, config]) => ({ name, ...config }));
