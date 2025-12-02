          {/* Breathing ring with ripple */}
          <div style={{ position: "relative", marginTop: "2rem" }}>
            <BreathingRing
              breathPattern={patternForBreath}
              onTap={handleAccuracyTap}
            />

            {/* Tap ripple - expands outward on successful tap */}
            {ripple && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "20px",
                height: "20px",
                border: "2px solid #fcd34d",
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                animation: "rippleExpand 0.6s ease-out forwards",
                pointerEvents: "none"
              }} />
            )}
          </div>

          {/* Timer with progress ring */}
          <div className="mt-6 text-center relative">
            {/* Progress ring SVG */}
            <svg style={{ position: "absolute", top: "-65px", left: "50%", transform: "translateX(-50%)", width: "120px", height: "120px" }}>
              {/* Background circle */}
              <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(253, 224, 71, 0.1)" strokeWidth="2" />
              {/* Progress arc */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="#fcd34d"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px", transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>

            <div style={{ fontSize: "1.25rem", fontFamily: "Cinzel, serif", letterSpacing: "0.2em", color: "rgba(253, 251, 245, 0.6)" }}>
              {mm}:{ss}
            </div>
            <button
              onClick={handleStop}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1.5rem",
                fontFamily: "Cinzel, serif",
                fontSize: "0.625rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                border: "1px solid rgba(253, 224, 71, 0.3)",
                color: "rgba(253, 251, 245, 0.8)",
                background: "transparent",
                borderRadius: "9999px",
                cursor: "pointer",
              }}
            >
              End
            </button>
          </div>

          {/* Tap tracker section */}
          <div className="mt-8 w-full max-w-sm">
            <button
              className="w-full h-16 rounded-2xl border border-white/30 bg-white/5 text-[11px] text-white/80 flex items-center justify-center active:bg-white/10"
              onClick={handleAccuracyTap}
            >
              <span
                style={{
                  fontFamily: "Crimson Pro, serif",
                  fontSize: "0.8125rem",
                  color: "rgba(253, 251, 245, 0.6)",
                  letterSpacing: "0.03em"
                }}
              >
                Tap at the peak of each breath
              </span>
            </button>

            {/* Tap stats */}
            {tapCount > 0 && (
              <div className="mt-3 space-y-1 text-[10px] text-white/60">
                <div className="flex justify-between">
                  <span>Taps recorded</span>
                  <span>{tapCount}</span>
                </div>
                {avgErrorMs != null && (
                  <div className="flex justify-between">
                    <span>Average offset</span>
                    <span>{avgErrorMs}ms</span>
                  </div>
                )}
                {bestErrorMs != null && (
                  <div className="flex justify-between">
                    <span>Best</span>
                    <span>{bestErrorMs}ms</span>
                  </div>
                )}
                {lastSignedErrorMs != null && (
                  <div className="flex justify-between">
                    <span>Last tap</span>
                    <span style={{
                      color: lastSignedErrorMs === 0
                        ? '#fcd34d'
                        : lastSignedErrorMs > 0
                          ? '#ff8c00'
                          : '#4dd4d4'
                    }}>
                      {lastSignedErrorMs === 0
                        ? "on beat"
                        : `${Math.abs(lastSignedErrorMs)}ms ${lastSignedErrorMs > 0 ? "late" : "early"
                        }`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Accuracy visual */}
            {accuracyView === "pulse" ? (
              <div className="mt-4">
                <AccuracyPulse avgErrorMs={avgErrorMs} bestErrorMs={bestErrorMs} />
              </div>
            ) : (
              <div className="mt-4">
                <AccuracyPetals avgErrorMs={avgErrorMs} tapCount={tapCount} />
              </div>
            )}
          </div>
        </div>
        );
  }

        return (
        <div className="w-full max-w-md mx-auto mt-6">
          <div className="rounded-3xl border border-white/15 bg-black/40 backdrop-blur-xl px-4 py-4 space-y-4 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
            {/* TOP ROW: practice + duration */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.24em] text-white/50">
                  Practice
                </div>
                <div className="mt-1 flex gap-1 rounded-full bg-white/5 p-1 border border-white/10">
                  {PRACTICES.map((name) => {
                    const active = practice === name;
                    return (
                      <button
                        key={name}
                        className={
                          "flex-1 rounded-full px-2 py-1 text-[10px] " +
                          (active
                            ? "bg-white text-bgEnd"
                            : "text-white/70 hover:text-white")
                        }
                        onClick={() => {
                          setPractice(name);
                          if (name !== "Breathing") {
                            setTapErrors([]);
                            setLastErrorMs(null);
                            setLastSignedErrorMs(null);
                          }
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-[84px]">
                <div className="text-[10px] uppercase tracking-[0.24em] text-white/50">
                  Duration
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {DURATIONS_MIN.map((min) => {
                    const active = durationMin === min;
                    return (
                      <button
                        key={min}
                        className={
                          "flex-1 rounded-full px-2 py-1 text-[10px] " +
                          (active
                            ? "bg-white text-bgEnd"
                            : "text-white/70 hover:text-white")
                        }
                        onClick={() => {
                          setDurationMin(min);
                          setRemainingSec(min * 60);
                        }}
                      >
                        {min}m
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* TIMER + STATUS */}
            <div className="flex items-center justify-between">
              <div className="text-[32px] tabular-nums font-light text-white tracking-[0.12em]">
                {mm}:{ss}
              </div>
              <div className="flex gap-2">
                {!isRunning ? (
                  <button
                    className="px-4 py-2 rounded-full bg-emerald-400 text-bgEnd text-[11px] font-semibold tracking-[0.14em] uppercase shadow-lg shadow-emerald-400/40"
                    onClick={startTimer}
                  >
                    Start
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 rounded-full border border-white/40 text-white/90 text-[11px] tracking-[0.14em] uppercase"
                    onClick={handleStop}
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>

            {/* BREATHING SETTINGS */}
            {practice === "Breathing" && (
              <div className="space-y-4 border-t border-white/10 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-white/50">
                      Pattern
                    </div>
                    <div className="text-[11px] text-white/80 mt-1">
                      {patternSummary}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Object.keys(PATTERN_PRESETS).map((name) => {
                      const active = selectedPreset === name;
                      return (
                        <button
                          key={name}
                          className={
                            "px-2 py-1 rounded-full text-[10px] border " +
                            (active
                              ? "bg-white text-bgEnd border-white"
                              : "border-white/25 text-white/70 hover:text-white")
                          }
                          onClick={() => applyPreset(name)}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom inputs */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase tracking-[0.18em] text-white/40">
                      Inhale
                    </label>
                    <input
                      className="bg-white/5 border border-white/20 rounded-xl px-2 py-1 text-[11px] text-white/90 outline-none focus:border-white/70"
                      value={pattern.inhale}
                      onChange={(e) =>
                        updateField("inhale", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase tracking-[0.18em] text-white/40">
                      Hold 1
                    </label>
                    <input
                      className="bg-white/5 border border-white/20 rounded-xl px-2 py-1 text-[11px] text-white/90 outline-none focus:border-white/70"
                      value={pattern.hold1}
                      onChange={(e) =>
                        updateField("hold1", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase tracking-[0.18em] text-white/40">
                      Exhale
                    </label>
                    <input
                      className="bg-white/5 border border-white/20 rounded-xl px-2 py-1 text-[11px] text-white/90 outline-none focus:border-white/70"
                      value={pattern.exhale}
                      onChange={(e) =>
                        updateField("exhale", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase tracking-[0.18em] text-white/40">
                      Hold 2
                    </label>
                    <input
                      className="bg-white/5 border border-white/20 rounded-xl px-2 py-1 text-[11px] text-white/90 outline-none focus:border-white/70"
                      value={pattern.hold2}
                      onChange={(e) =>
                        updateField("hold2", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAP-BASED ACCURACY (only really meaningful for Breathing) */}
            {practice === "Breathing" && (
              <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
                <button
                  className="w-full h-16 rounded-2xl border border-white/30 bg-white/5 text-[11px] text-white/80 flex items-center justify-center active:bg-white/10"
                  onClick={handleAccuracyTap}
                >
                  Tap in time when the breath feels at its fullest and
                  emptiest.
                </button>

                {tapCount > 0 && (
                  <div className="text-[10px] text-white/60 space-y-1">
                    <div>Tap attempts: {tapCount}</div>
                    {avgErrorMs != null && bestErrorMs != null && (
                      <div>
                        Average offset: {avgErrorMs} ms . Best:{" "}
                        {bestErrorMs} ms
                      </div>
                    )}
                    {lastSignedErrorMs != null && (
                      <div>
                        Last tap:{" "}
                        <span
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            color:
                              lastSignedErrorMs === 0
                                ? "#fcd34d" // Gold for perfect
                                : Math.abs(lastSignedErrorMs) <= 20
                                  ? "#34d399" // Emerald for good (±20ms)
                                  : lastSignedErrorMs > 0
                                    ? "#ff8c00" // Orange for late
                                    : "#4dd4d4", // Cyan for early
                          }}
                        >
                          {lastSignedErrorMs === 0
                            ? "on beat"
                            : `${Math.abs(lastSignedErrorMs)} ms ${lastSignedErrorMs > 0 ? "late" : "early"
                            }`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Accuracy visual toggle */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                      Accuracy Visual
                    </span>
                    <div className="inline-flex rounded-full bg-white/5 p-0.5 border border-white/10">
                      {["pulse", "petals"].map((mode) => {
                        const active = mode === accuracyView;
                        return (
                          <button
                            key={mode}
                            onClick={() => setAccuracyView(mode)}
                            className={
                              "px-3 py-0.5 rounded-full text-[10px] capitalize " +
                              (active
                                ? "bg-white text-bgEnd"
                                : "text-white/70 hover:text-white")
                            }
                          >
                            {mode}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {accuracyView === "pulse" ? (
                    <AccuracyPulse
                      avgErrorMs={avgErrorMs}
                      bestErrorMs={bestErrorMs}
                    />
                  ) : (
                    <AccuracyPetals
                      avgErrorMs={avgErrorMs}
                      tapCount={tapCount}
                    />
                  )}
                </div>
              </div>
            )}

            {/* FOOTNOTE */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] text-white/45 flex items-center justify-between">
                <span>
                  {practice} * {durationMin} min
                </span>
                <span>Immanence OS Â· Practice engine</span>
              </div>
            </div>
          </div>
        </div>
        );
}
