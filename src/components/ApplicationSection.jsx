import React, { useState, useRef, useEffect } from "react";
import { useSwipeable } from "react-swipeable";

const QUALITY_BY_DIR = {
  Up: "Impatience",
  Down: "Presence",
  Left: "Reactivity",
  Right: "Compassion",
};

const QUALITY_BY_ACT = {
  1: "Impatience",
  2: "Presence",
  3: "Reactivity",
  4: "Compassion",
};

const WORD_TO_NUM = {
  one: 1,
  first: 1,
  two: 2,
  second: 2,
  three: 3,
  third: 3,
  four: 4,
  fourth: 4,
};

function isPerpendicular(first, second) {
  if (!first || !second) return false;
  const firstVertical = first === "Up" || first === "Down";
  const secondVertical = second === "Up" || second === "Down";
  return firstVertical !== secondVertical;
}

export function ApplicationSection() {
  const [firstSwipe, setFirstSwipe] = useState(null);
  const [awaitingSecond, setAwaitingSecond] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  const [stats, setStats] = useState({
    Impatience: { caught: 12, missed: 8 },
    Presence: { caught: 15, missed: 5 },
    Reactivity: { caught: 9, missed: 11 },
    Compassion: { caught: 18, missed: 3 },
  });

  // --- shared logging logic (used by gestures + voice) ---
  const registerEvent = (quality, result, meta = {}) => {
    if (!quality) return;
    setStats((prev) => {
      const current = prev[quality] || { caught: 0, missed: 0 };
      const key = result === "success" ? "caught" : "missed";
      return {
        ...prev,
        [quality]: {
          ...current,
          [key]: current[key] + 1,
        },
      };
    });

    setLastEvent({
      phase: "complete",
      quality,
      result,
      ...meta,
    });
  };

  // --- gesture handling (as before, plus key support) ---
  const handleDirection = (dir) => {
    if (!dir || !QUALITY_BY_DIR[dir]) return;

    if (!awaitingSecond) {
      setFirstSwipe(dir);
      setAwaitingSecond(true);
      setLastEvent({
        phase: "first",
        direction: dir,
        quality: QUALITY_BY_DIR[dir],
      });
    } else {
      const perpendicular = isPerpendicular(firstSwipe, dir);
      const quality = QUALITY_BY_DIR[firstSwipe];
      const result = perpendicular ? "success" : "fail";

      registerEvent(quality, result, {
        trigger: firstSwipe,
        response: dir,
        source: "gesture",
      });

      setFirstSwipe(null);
      setAwaitingSecond(false);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwiped: ({ dir }) => handleDirection(dir),
    trackTouch: true,
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  const onKeyDown = (e) => {
    const map = {
      ArrowUp: "Up",
      ArrowDown: "Down",
      ArrowLeft: "Left",
      ArrowRight: "Right",
    };
    const dir = map[e.key];
    if (dir) {
      e.preventDefault();
      handleDirection(dir);
    }
  };

  // --- voice recognition section ---
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [lastTranscript, setLastTranscript] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleVoiceCommand(transcript);
    };

    rec.onerror = () => {
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
    };

    recognitionRef.current = rec;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setVoiceSupported(false);
      return;
    }
    if (!listening) {
      setLastTranscript("");
      setListening(true);
      recognitionRef.current.start();
    } else {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const handleVoiceCommand = (raw) => {
    const transcript = raw.toLowerCase().trim();
    setLastTranscript(transcript);

    // expecting things like:
    // "yo unity act one plus"
    // "act 2 minus"
    // "unity act three success"
    // "act four fail"
    const words = transcript.split(/\s+/);

    let actNum = null;
    // find the token "act" and look at next word
    const actIndex = words.indexOf("act");
    if (actIndex !== -1 && words[actIndex + 1]) {
      const next = words[actIndex + 1];
      const num = parseInt(next, 10);
      if (!isNaN(num)) {
        actNum = num;
      } else if (WORD_TO_NUM[next]) {
        actNum = WORD_TO_NUM[next];
      }
    }

    const plus =
      transcript.includes("plus") ||
      transcript.includes("caught") ||
      transcript.includes("success");
    const minus =
      transcript.includes("minus") ||
      transcript.includes("missed") ||
      transcript.includes("fail") ||
      transcript.includes("failed");

    if (!actNum || (!plus && !minus)) {
      // couldn't parse
      setLastEvent({
        phase: "voice-error",
        transcript,
      });
      return;
    }

    const quality = QUALITY_BY_ACT[actNum];
    const result = plus ? "success" : "fail";

    registerEvent(quality, result, {
      source: "voice",
      actNum,
      transcript,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Gesture tracker */}
      <section>
        <div className="text-[10px] uppercase tracking-[0.24em] text-white/50 mb-2">
          Gesture Tracker (mock logic)
        </div>
        <div
          {...swipeHandlers}
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="relative rounded-3xl border border-white/10 bg-white/5/5 bg-gradient-to-b from-white/5 to-white/0 px-4 py-6 flex flex-col items-center justify-center text-center select-none touch-pan-y outline-none focus:ring-2 focus:ring-white/20"
        >
          <div className="text-xs text-white/60 mb-1">
            {awaitingSecond
              ? "Second swipe / arrow key: perpendicular = caught, same axis = missed"
              : "First swipe or use arrow keys to log an event"}
          </div>
          <div className="text-[11px] text-white/40 mb-4">
            (Drag, swipe, or use ↑ ↓ ← → inside this box)
          </div>

          <div className="relative w-40 h-40">
            <div className="absolute inset-0 rounded-3xl border border-white/12" />
            <div className="absolute left-1/2 -top-3 -translate-x-1/2 text-[11px] text-white/70">
              Up = Impatience
            </div>
            <div className="absolute left-1/2 -bottom-3 -translate-x-1/2 text-[11px] text-white/70">
              Down = Presence
            </div>
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 text-[11px] text-white/70">
              Left = Reactivity
            </div>
            <div className="absolute -right-16 top-1/2 -translate-y-1/2 text-[11px] text-white/70">
              Right = Compassion
            </div>
          </div>

          <div className="mt-5 text-xs text-white/70 min-h-[1.5rem]">
            {lastEvent ? (
              lastEvent.phase === "first" ? (
                <>
                  Logged{" "}
                  <span className="font-semibold">
                    {lastEvent.quality}
                  </span>{" "}
                  — now choose a <span className="font-semibold">
                    perpendicular
                  </span>{" "}
                  direction to mark caught/missed.
                </>
              ) : lastEvent.phase === "voice-error" ? (
                <>
                  Didn&apos;t understand that voice command. Try something like:{" "}
                  <span className="font-semibold">
                    &quot;act one plus&quot;
                  </span>{" "}
                  or{" "}
                  <span className="font-semibold">
                    &quot;act three minus&quot;
                  </span>
                  .
                </>
              ) : lastEvent.source === "voice" ? (
                <>
                  Voice: Act {lastEvent.actNum} •{" "}
                  <span className="font-semibold">{lastEvent.quality}</span>{" "}
                  {lastEvent.result === "success" ? "caught" : "missed"} (
                  {lastEvent.transcript})
                </>
              ) : (
                <>
                  {lastEvent.result === "success" ? (
                    <>
                      Caught a{" "}
                      <span className="font-semibold">
                        {lastEvent.quality.toLowerCase()}
                      </span>{" "}
                      moment: {lastEvent.trigger} → {lastEvent.response}
                    </>
                  ) : (
                    <>
                      Missed the{" "}
                      <span className="font-semibold">
                        {lastEvent.quality.toLowerCase()}
                      </span>{" "}
                      cue: {lastEvent.trigger} → {lastEvent.response} (same
                      axis)
                    </>
                  )}
                </>
              )
            ) : (
              "No gestures logged yet."
            )}
          </div>
        </div>
      </section>

      {/* Voice logging */}
      <section>
        <div className="text-[10px] uppercase tracking-[0.24em] text-white/50 mb-2">
          Voice Logging (experimental)
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5/5 bg-gradient-to-b from-white/5 to-white/0 px-5 py-4 text-xs flex flex-col gap-3">
          {!voiceSupported ? (
            <div className="text-white/60">
              Browser doesn&apos;t support speech recognition. (Chrome desktop
              is usually fine.)
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleListening}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-2 ${
                    listening
                      ? "bg-rose-500 text-white"
                      : "bg-white text-bgEnd"
                  }`}
                >
                  <span>{listening ? "Listening…" : "Tap & speak"}</span>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                </button>
                <div className="text-[11px] text-white/70">
                  Example:{" "}
                  <span className="font-semibold">
                    &quot;yo unity, act one plus&quot;
                  </span>{" "}
                  or{" "}
                  <span className="font-semibold">
                    &quot;act three minus&quot;
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-white/60">
                Last heard:{" "}
                <span className="font-mono">
                  {lastTranscript || "—"}
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Weekly stats */}
      <section>
        <div className="text-[10px] uppercase tracking-[0.24em] text-white/50 mb-2">
          This Week (mock + live)
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5/5 bg-gradient-to-b from-white/5 to-white/0 px-5 py-4 text-xs leading-relaxed">
          {Object.entries(stats).map(([quality, { caught, missed }]) => (
            <div key={quality} className="flex justify-between gap-4">
              <span className="text-white/80">{quality}:</span>
              <span className="text-white/70">
                {caught} caught / {missed} missed
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
