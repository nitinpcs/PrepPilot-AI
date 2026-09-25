import { readFile } from 'node:fs/promises';
import { ValidationError } from '../errors/ApiError.js';

export const DOMAINS = ['Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window', 'Binary Search', 'Stack', 'Queue', 'Linked List', 'Trees', 'BST', 'Heap', 'Graphs', 'Backtracking', 'Greedy', 'Dynamic Programming', 'Tries', 'Bit Manipulation', 'Math'];

export const LANGUAGES = {
  javascript: { label: 'JavaScript', monaco: 'javascript', judge0: 102 },
  python: { label: 'Python', monaco: 'python', judge0: 100 },
  java: { label: 'Java', monaco: 'java', judge0: 62 },
  cpp: { label: 'C++', monaco: 'cpp', judge0: 54 },
};

let problemsCache;
export const getProblemRepository = async () => {
  if (!problemsCache) {
    const raw = await readFile(new URL('../data/codingProblems.json', import.meta.url), 'utf8');
    problemsCache = JSON.parse(raw);
  }
  return problemsCache;
};

const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };
const recommendedDifficulty = (history = []) => {
  const completed = history.filter((entry) => entry.submitted);
  if (!completed.length) return 'Easy';
  const average = completed.slice(-3).reduce((sum, entry) => sum + (entry.score || 0), 0) / Math.min(3, completed.length);
  const current = difficultyOrder[completed.at(-1)?.difficulty] || 1;
  return Object.entries(difficultyOrder).find(([, value]) => value === Math.max(1, Math.min(3, current + (average >= 7 ? 1 : average < 4 ? -1 : 0))))?.[0] || 'Medium';
};

export const selectCodingProblem = async ({ role = '', domain = '', difficulty = '', resume = '', progress = 0, history = [] } = {}) => {
  const repository = await getProblemRepository();
  const usedIds = new Set(history.map((entry) => entry.problemId));
  const targetDifficulty = difficulty || recommendedDifficulty(history);
  const available = repository.filter((problem) => !usedIds.has(problem.id));
  if (!available.length) throw new ValidationError('Every available problem has already been used in this interview. Start a new interview to reset the pool.');
  const context = `${role} ${resume}`.toLowerCase();
  const ranked = available.map((problem) => {
    const domainMatch = domain && problem.topic === domain ? 8 : 0;
    const roleMatch = problem.tags.some((tag) => context.includes(tag.toLowerCase())) ? 3 : 0;
    const difficultyMatch = problem.difficulty === targetDifficulty ? 5 : -Math.abs((difficultyOrder[problem.difficulty] || 2) - (difficultyOrder[targetDifficulty] || 2));
    const coverageBonus = progress && !history.some((entry) => entry.topic === problem.topic) ? 2 : 0;
    return { problem, score: domainMatch + roleMatch + difficultyMatch + coverageBonus + Math.random() };
  }).sort((a, b) => b.score - a.score);
  return { problem: ranked[0].problem, recommendedDifficulty: targetDifficulty, remaining: available.length - 1 };
};

const literal = (value, language) => {
  if (language === 'python') return JSON.stringify(value).replace(/true/g, 'True').replace(/false/g, 'False').replace(/null/g, 'None');
  if (language === 'java') {
    if (Array.isArray(value)) return `new int[]{${value.join(', ')}}`;
    return String(value);
  }
  if (language === 'cpp') return Array.isArray(value) ? `{${value.join(', ')}}` : String(value);
  return JSON.stringify(value);
};

const outputExpression = (language, call) => {
  if (language === 'javascript') return `console.log(JSON.stringify(${call}));`;
  if (language === 'python') return `print(json.dumps(${call}, separators=(',', ':')))`;
  if (language === 'java') return `System.out.println(java.util.Arrays.toString(${call}));`;
  return `std::cout << ${call} << std::endl;`;
};

const runnerFor = (problem, language, tests) => {
  const invocations = tests.map((test) => `${problem.functionName}(${test.args.map((arg) => literal(arg, language)).join(', ')})`);
  if (language === 'javascript') return `\n${invocations.map((call) => outputExpression(language, call)).join('\n')}`;
  if (language === 'python') return `\nimport json\n${invocations.map((call) => outputExpression(language, call)).join('\n')}`;
  if (language === 'java') return `\nclass Main { public static void main(String[] args) { ${invocations.map((call) => outputExpression(language, `Solution.${call}`)).join(' ')} } }`;
  return `\nint main() { ${invocations.map((call) => outputExpression(language, call)).join(' ')} return 0; }`;
};

const normalize = (value) => String(value).replace(/\s/g, '').replace(/^\[/, '[').replace(/\]$/, ']');
const sameOutput = (actual, expected) => normalize(actual) === normalize(JSON.stringify(expected));
const executionStatus = (payload) => payload.status?.description || 'Unknown';

export const runCodingSubmission = async ({ problemId, language, code, includeHidden = false }) => {
  const config = LANGUAGES[language];
  if (!config) throw new ValidationError('Unsupported coding language');
  if (typeof code !== 'string' || !code.trim() || code.length > 30000) throw new ValidationError('Code must be between 1 and 30,000 characters');
  const problem = (await getProblemRepository()).find((entry) => entry.id === problemId);
  if (!problem) throw new ValidationError('Coding problem not found');
  const tests = [...problem.visibleTestCases, ...(includeHidden ? problem.hiddenTestCases : [])];
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 18000);
  let payload;
  try {
    const response = await fetch(process.env.JUDGE0_URL || 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: abort.signal,
      body: JSON.stringify({ source_code: `${code}\n${runnerFor(problem, language, tests)}`, language_id: config.judge0, cpu_time_limit: 5, wall_time_limit: 10, memory_limit: 128000 }),
    });
    if (!response.ok) throw new Error(`Runner returned ${response.status}`);
    payload = await response.json();
  } catch (error) {
    throw new ValidationError(error.name === 'AbortError' ? 'Code execution timed out' : 'Code runner is currently unavailable');
  } finally { clearTimeout(timeout); }
  const stdout = payload.stdout || '';
  const stderr = payload.stderr || payload.compile_output || payload.message || '';
  const lines = stdout.trim() ? stdout.trim().split(/\r?\n/) : [];
  const testResults = tests.map((test, index) => ({ id: test.id, label: includeHidden && test.hidden ? 'Hidden test' : test.label, hidden: Boolean(test.hidden), input: test.input, expected: test.hidden ? undefined : JSON.stringify(test.expected), actual: test.hidden ? undefined : (lines[index] || 'No output'), passed: sameOutput(lines[index] || '', test.expected) }));
  const status = executionStatus(payload);
  return { problem, testResults, passedCount: testResults.filter((test) => test.passed).length, totalCount: testResults.length, stdout, stderr, status, compilationError: /compilation error/i.test(status), runtimeError: /runtime error/i.test(status), timeLimitExceeded: /time limit/i.test(status), memoryLimitExceeded: /memory limit/i.test(status) };
};
