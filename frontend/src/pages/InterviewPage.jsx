import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mic, MicOff, Send, Loader, AlertTriangle, Volume2, VolumeX, Radio } from 'lucide-react';

const QUESTION_TIME_SEC = 120;
const BAR_COUNT = 24;

const InterviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getHeaders, apiUrl } = useAuth();
  const stateData = location.state || {};

  const [topic, setTopic] = useState(stateData.topic || 'Interview Session');
  const [type, setType] = useState(stateData.type || 'topic');
  const [question, setQuestion] = useState(stateData.firstQuestion || stateData.question || '');
  const [questionIndex, setQuestionIndex] = useState(stateData.questionIndex ?? 0);
  const [totalQuestions, setTotalQuestions] = useState(stateData.totalQuestions || 10);

  const [displayedQuestion, setDisplayedQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(true);
  const [isHoldingPtt, setIsHoldingPtt] = useState(false);

  const AI_PROGRESS_STAGES = [
    'Analyzing response...',
    'Evaluating technical depth...',
    'Scoring answer accuracy...',
    'Generating next question...',
    'Calibrating difficulty...',
  ];

  useEffect(() => {
    let interval;
    if (submitting) {
      setAiStep(0);
      interval = setInterval(() => {
        setAiStep((prev) => (prev + 1) % AI_PROGRESS_STAGES.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [submitting]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SEC);

  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const timerRef = useRef(null);
  const answerRef = useRef(answer);
  answerRef.current = answer;
  const speechSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const [barHeights, setBarHeights] = useState(() => Array(BAR_COUNT).fill(20));

  const wordCount = useMemo(() => {
    const t = answer.trim();
    return t ? t.split(/\s+/).filter(Boolean).length : 0;
  }, [answer]);

  const charCount = answer.length;
  const progressPercent = Math.round((questionIndex / totalQuestions) * 100);
  const ringCircumference = 2 * Math.PI * 42;
  const ringOffset = ringCircumference * (1 - timeLeft / QUESTION_TIME_SEC);

  const loadInterview = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/interview/sessions/${id}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setTopic(data.interview.topic);
        setType(data.interview.type);
        setTotalQuestions(10);
        if (data.interview.status === 'completed') {
          navigate(`/report/${id}`);
          return;
        }
        const qCount = data.interview.questions.length;
        if (qCount > 0) {
          setQuestion(data.interview.questions[qCount - 1].questionText);
          setQuestionIndex(qCount - 1);
        }
      } else {
        setError('Could not locate interview session');
      }
    } catch {
      setError('Connection failure retrieving session');
    }
  };

  useEffect(() => {
    if (!stateData.firstQuestion && !stateData.question) loadInterview();
  }, [id]);

  useEffect(() => {
    if (!question) return;
    setDisplayedQuestion('');
    let i = 0;
    const tick = setInterval(() => {
      i += 1;
      setDisplayedQuestion(question.slice(0, i));
      if (i >= question.length) clearInterval(tick);
    }, 18);
    return () => clearInterval(tick);
  }, [question]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) {
          setAnswer((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
        }
      };
      rec.onerror = (event) => {
        setIsListening(false);
        setIsHoldingPtt(false);
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setError('Microphone access was interrupted. You can continue by typing your answer.');
        }
      };
      rec.onend = () => {
        setIsListening(false);
        setIsHoldingPtt(false);
      };
      recognitionRef.current = rec;
    }
    return () => recognitionRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!question || !aiVoiceEnabled || !speechSynthesisSupported) return undefined;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      if (utteranceRef.current === utterance) setIsSpeaking(false);
    };
    utterance.onerror = () => {
      if (utteranceRef.current === utterance) setIsSpeaking(false);
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    return () => {
      if (utteranceRef.current === utterance) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };
  }, [question, aiVoiceEnabled, speechSynthesisSupported]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  useEffect(() => {
    setTimeLeft(QUESTION_TIME_SEC);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitAnswer(answerRef.current.trim() || 'No response provided (timeout).');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [questionIndex]);

  useEffect(() => {
    const anim = setInterval(() => {
      setBarHeights(
        Array(BAR_COUNT)
          .fill(0)
          .map((_, idx) => {
            const base = isListening ? 35 + Math.random() * 55 : 12 + Math.sin(Date.now() / 200 + idx) * 8 + Math.random() * 10;
            return Math.min(90, Math.max(8, base));
          })
      );
    }, 120);
    return () => clearInterval(anim);
  }, [isListening]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const toggleListening = () => (isListening ? stopListening() : startListening());

  const startPushToTalk = (event) => {
    event.preventDefault();
    if (!speechSupported || submitting) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsHoldingPtt(true);
    if (!isListening) startListening();
  };

  const stopPushToTalk = (event) => {
    event.preventDefault();
    setIsHoldingPtt(false);
    if (isListening) stopListening();
  };

  const replayQuestion = () => {
    if (!speechSynthesisSupported || !question) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const submitAnswer = async (answerValue) => {
    if (submitting) return;
    setError('');
    setSubmitting(true);
    setIsListening(false);
    recognitionRef.current?.stop();

    try {
      const res = await fetch(`${apiUrl}/api/interview/sessions/${id}/answers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ answer: answerValue }),
      });
      const data = await res.json();
      if (data.success) {
        setAnswer('');
        if (data.status === 'completed') {
          navigate(`/report/${id}`);
        } else {
          setQuestion(data.nextQuestion);
          setQuestionIndex(data.questionIndex);
        }
      } else {
        setError(data.message || 'Failed to submit response');
      }
    } catch {
      setError('Connection failure sending answer');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="war-room">
      <header className="war-header glass-panel">
        <div>
          <span className="war-badge">{type === 'resume' ? 'Resume-Based' : 'Topic-Based'}</span>
          <h1>{topic}</h1>
        </div>
        <div className="war-progress">
          <span>Q{questionIndex + 1} / {totalQuestions}</span>
          <div className="war-progress-track"><div style={{ width: `${progressPercent}%` }} /></div>
        </div>
        <div className="timer-pill-float">
          <svg width="52" height="52" viewBox="0 0 100 100" className="timer-ring">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={timeLeft < 20 ? '#ef4444' : '#22d3ee'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <span className={timeLeft < 20 ? 'urgent' : ''}>{formatTime(timeLeft)}</span>
        </div>
      </header>

      <div className="war-grid">
        <aside className="war-panel war-viz glass-panel">
          <p className="panel-label">Live Audio</p>
          <div className="waveform">
            {barHeights.map((h, i) => (
              <div key={i} className="wave-bar" style={{ height: `${h}%` }} />
            ))}
          </div>
          <p className="viz-status">{isListening ? (isHoldingPtt ? 'Recording — release to stop' : 'Listening…') : 'Standby — dictate or type'}</p>
          {speechSupported && (
            <>
              <button type="button" className={`mic-btn ${isListening && !isHoldingPtt ? 'active' : ''}`} onClick={toggleListening} disabled={submitting}>
                {isListening && !isHoldingPtt ? <MicOff size={18} /> : <Mic size={18} />}
                {isListening && !isHoldingPtt ? 'Stop dictation' : 'Dictate answer'}
              </button>
              <button
                type="button"
                className={`ptt-btn ${isHoldingPtt ? 'active' : ''}`}
                onPointerDown={startPushToTalk}
                onPointerUp={stopPushToTalk}
                onPointerCancel={stopPushToTalk}
                onLostPointerCapture={stopPushToTalk}
                disabled={submitting}
                aria-label="Hold to talk"
              >
                <Radio size={16} /> Hold to talk
              </button>
            </>
          )}
          {!speechSupported && <p className="voice-fallback">Speech-to-text is unavailable in this browser. Text answers are ready to use.</p>}
        </aside>

        <section className="war-panel war-question glass-panel">
          <div className="interviewer-heading">
            <p className="panel-label">Interviewer</p>
            {speechSynthesisSupported && (
              <div className="voice-actions">
                <button type="button" className="voice-icon-btn" onClick={replayQuestion} title="Replay question" aria-label="Replay question">
                  <Volume2 size={17} />
                </button>
                <button
                  type="button"
                  className={`voice-icon-btn ${aiVoiceEnabled ? 'enabled' : ''}`}
                  onClick={() => setAiVoiceEnabled((enabled) => !enabled)}
                  title={aiVoiceEnabled ? 'Turn off automatic interviewer voice' : 'Turn on automatic interviewer voice'}
                  aria-label={aiVoiceEnabled ? 'Turn off automatic interviewer voice' : 'Turn on automatic interviewer voice'}
                >
                  {aiVoiceEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
                </button>
              </div>
            )}
          </div>
          {isSpeaking && <p className="speaking-status">AI interviewer is speaking</p>}
          <h2 className="typewriter">
            {displayedQuestion || (question ? '' : 'Loading question…')}
            {displayedQuestion.length < question.length && <span className="cursor">|</span>}
          </h2>
        </section>

        <aside className="war-panel war-answer glass-panel">
          <p className="panel-label">Your response</p>
          {error && (
            <div className="war-error">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
          <textarea
            className="answer-area"
            placeholder="Structure your answer: definition, approach, complexity, trade-offs…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={submitting}
          />
          <div className="counters">
            <span>{charCount} characters</span>
            <span>{wordCount} words</span>
          </div>
        </aside>
      </div>

      <footer className="war-submit-bar glass-panel">
        <p>Honest scoring — depth and accuracy matter more than length.</p>
        <button
          type="button"
          className="btn-accent war-submit-btn"
          disabled={submitting || !answer.trim()}
          onClick={() => submitAnswer(answer.trim())}
        >
          {submitting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader className="animate-spin" size={18} />
              {AI_PROGRESS_STAGES[aiStep]}
            </span>
          ) : (
            <>Submit answer <Send size={18} /></>
          )}
        </button>
      </footer>

      <style>{`
        .war-room {
          height: calc(100vh - 70px);
          max-height: calc(100vh - 70px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 12px 16px 0;
          gap: 12px;
          background: var(--bg-dark);
        }
        .war-header {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: 16px;
          padding: 14px 20px;
          flex-shrink: 0;
        }
        .war-header h1 { font-size: 20px; color: #fff; margin-top: 4px; }
        .war-badge {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          border: 1px solid var(--border-glass);
          padding: 3px 8px;
          border-radius: 999px;
        }
        .war-progress { min-width: 180px; font-size: 12px; color: var(--text-secondary); }
        .war-progress-track {
          height: 4px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          margin-top: 6px;
          overflow: hidden;
        }
        .war-progress-track div {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--accent));
          transition: width 0.4s ease;
        }
        .timer-pill-float {
          position: relative;
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .timer-pill-float span {
          position: absolute;
          font-size: 11px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: #22d3ee;
        }
        .timer-pill-float span.urgent { color: #ef4444; }
        .timer-ring { position: absolute; inset: 0; }
        .war-grid {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: 220px 1fr 320px;
          gap: 12px;
        }
        @media (max-width: 1024px) {
          .war-grid { grid-template-columns: 1fr; grid-template-rows: auto 1fr auto; }
          .war-room { overflow-y: auto; height: auto; max-height: none; }
        }
        .war-panel {
          padding: 18px;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .panel-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-bottom: 12px;
        }
        .waveform {
          flex: 1;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 4px;
          min-height: 160px;
          padding: 8px 0;
        }
        .wave-bar {
          width: 6px;
          border-radius: 3px;
          background: linear-gradient(180deg, #22d3ee, #6366f1);
          transition: height 0.12s ease;
        }
        .viz-status { font-size: 12px; color: var(--text-secondary); text-align: center; margin: 8px 0; }
        .mic-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid var(--border-glass);
          background: rgba(255,255,255,0.04);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
        }
        .mic-btn.active {
          border-color: #22d3ee;
          color: #22d3ee;
          background: rgba(34,211,238,0.1);
        }
        .ptt-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          width: 100%;
          margin-top: 8px;
          padding: 9px;
          border-radius: 10px;
          border: 1px solid rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.1);
          color: #c4b5fd;
          font-size: 12px;
          font-weight: 700;
          touch-action: none;
          user-select: none;
        }
        .ptt-btn.active { background: rgba(239,68,68,0.18); border-color: #f87171; color: #fecaca; }
        .mic-btn:disabled, .ptt-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .voice-fallback { margin: 10px 0 0; font-size: 12px; line-height: 1.45; color: var(--text-muted); text-align: center; }
        .interviewer-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .interviewer-heading .panel-label { margin-bottom: 12px; }
        .voice-actions { display: flex; gap: 6px; }
        .voice-icon-btn {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border-glass);
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          color: var(--text-secondary);
        }
        .voice-icon-btn.enabled { color: #22d3ee; border-color: rgba(34,211,238,0.45); }
        .speaking-status { margin: -4px 0 10px; color: #67e8f9; font-size: 12px; }
        .typewriter {
          font-size: clamp(20px, 2.2vw, 28px);
          line-height: 1.45;
          color: #fff;
          font-weight: 600;
          flex: 1;
          overflow-y: auto;
        }
        .cursor {
          animation: blink 1s step-end infinite;
          color: var(--accent);
          margin-left: 2px;
        }
        @keyframes blink { 50% { opacity: 0; } }
        .war-error {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 13px;
          color: #fca5a5;
          margin-bottom: 8px;
        }
        .answer-area {
          flex: 1;
          min-height: 120px;
          resize: none;
          border: 1px solid var(--border-glass);
          border-radius: 12px;
          background: rgba(0,0,0,0.25);
          color: #fff;
          padding: 14px;
          line-height: 1.55;
          font-size: 14px;
        }
        .answer-area:focus { outline: none; border-color: var(--primary); }
        .counters {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 8px;
        }
        .war-submit-bar {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 20px;
          margin-bottom: 12px;
        }
        .war-submit-bar p { font-size: 13px; color: var(--text-secondary); }
        .war-submit-btn {
          min-width: 220px;
          height: 48px;
          justify-content: center;
          font-size: 15px;
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default InterviewPage;
