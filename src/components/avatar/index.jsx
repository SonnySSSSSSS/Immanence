// src/components/avatar/index.jsx
// FIVE-LAYER AVATAR STACK:
// 0) Luminous field (canvas rings)
// 1) Breathing aura (practice only)
// 2) Rune ring (PNG, rotating)
// 3) Inner sigil core (PNG, stage-aware)
// 4) Metrics text
// 5) HaloGate (static navigation labels, Hub only)

import React, { useEffect, useState, useCallback } from "react";
import "../Avatar.css";
import { LABELS, STAGE_GLOW_COLORS, getMandalaState } from "./constants";
import { AvatarContainer } from "./AvatarContainer";
import HaloGate from "./HaloGate";

export function Avatar({
    mode,
    breathPattern,
    breathState,
    onStageChange,
    stage: controlledStage,
    path = null,
    showCore = true,
    attention = 'vigilance',
    isPracticing = false,
    // HaloGate props
    showHaloGates = false,
    onGateSelect,
}) {
    const label = LABELS[mode] || "Center";

    const [mandalaSnapshot, setMandalaSnapshot] = useState(null);
    const [stageIndex, setStageIndex] = useState(2);
    const [variationIndex, setVariationIndex] = useState(0);
    const [maxVariations, setMaxVariations] = useState(1);

    // HaloGate state
    const [haloState, setHaloState] = useState("idle");

    const STAGE_NAMES = ["seedling", "ember", "flame", "beacon", "stellar"];
    const internalStage = STAGE_NAMES[stageIndex];
    const currentStage = controlledStage ? controlledStage.toLowerCase() : internalStage;

    // Ring speed: 1.0 normal, 0.4 when armed
    const ringSpeedMultiplier = haloState === "armed" ? 0.4 : 1.0;

    useEffect(() => {
        if (!path || showCore || !attention || attention === 'none') {
            setMaxVariations(1);
            setVariationIndex(0);
            return;
        }
        const stageLower = currentStage.toLowerCase();
        const pathLower = path.toLowerCase();
        const attentionLower = attention.toLowerCase();

        const checkVariation = (index) => {
            return new Promise((resolve) => {
                const img = new Image();
                const variationSuffix = `_0000${index + 1}_`;
                img.src = `${import.meta.env.BASE_URL}avatars/avatar-${stageLower}-${pathLower}-${attentionLower}${variationSuffix}.png`;
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
            });
        };

        Promise.all([...Array(10)].map((_, i) => checkVariation(i)))
            .then(results => {
                const foundCount = results.filter(Boolean).length;
                setMaxVariations(foundCount > 0 ? foundCount : 1);
                setVariationIndex(0);
            });
    }, [currentStage, path, attention, showCore]);

    useEffect(() => {
        if (onStageChange) {
            const stageColors = STAGE_GLOW_COLORS[currentStage];
            const stageName = currentStage.charAt(0).toUpperCase() + currentStage.slice(1);
            onStageChange(stageColors, stageName);
        }
    }, [currentStage, onStageChange]);

    useEffect(() => {
        function refresh() {
            const state = getMandalaState();
            setMandalaSnapshot(state || null);
        }
        refresh();
        const id = setInterval(refresh, 2000);
        return () => clearInterval(id);
    }, []);

    const mandalaData = mandalaSnapshot || {};
    const avgAccuracy = mandalaData.avgAccuracy || 0;
    const weeklyConsistency = mandalaData.weeklyConsistency || 0;
    const weeklyPracticeLog = mandalaData.weeklyPracticeLog || [false, false, false, false, false, false, false];

    const safePattern = breathPattern || {};
    const patternForBreath = {
        inhale: typeof safePattern.inhale === "number" ? safePattern.inhale : 4,
        holdTop: typeof safePattern.hold1 === "number" ? safePattern.hold1 : 4,
        exhale: typeof safePattern.exhale === "number" ? safePattern.exhale : 4,
        holdBottom: typeof safePattern.hold2 === "number" ? safePattern.hold2 : 2,
    };

    const handleSigilClick = () => {
        // If HaloGates are enabled, clicking avatar arms them instead of cycling stage
        if (showHaloGates) {
            setHaloState(prev => prev === "idle" ? "armed" : "idle");
            return;
        }

        if (maxVariations > 1) {
            setVariationIndex((prev) => (prev + 1) % maxVariations);
        } else if (controlledStage && onStageChange) {
            const currentIndex = STAGE_NAMES.indexOf(currentStage);
            const nextIndex = (currentIndex + 1) % STAGE_NAMES.length;
            const nextStage = STAGE_NAMES[nextIndex];
            const stageColors = STAGE_GLOW_COLORS[nextStage];
            const stageName = nextStage.charAt(0).toUpperCase() + nextStage.slice(1);
            onStageChange(stageColors, stageName);
        } else {
            setStageIndex((prev) => (prev + 1) % STAGE_NAMES.length);
        }
    };

    return (
        <div className="relative flex flex-col items-center cursor-pointer overflow-visible" onClick={handleSigilClick}>
            <AvatarContainer
                mode={mode}
                breathPattern={patternForBreath}
                stage={currentStage}
                path={path}
                showCore={showCore}
                attention={attention}
                variationIndex={variationIndex}
                hasVariations={maxVariations > 1}
                weeklyConsistency={weeklyConsistency}
                weeklyPracticeLog={weeklyPracticeLog}
                breathState={breathState}
                isPracticing={isPracticing}
                ringSpeedMultiplier={ringSpeedMultiplier}
            />
            <HaloGate
                enabled={showHaloGates}
                haloState={haloState}
                setHaloState={setHaloState}
                onGateSelect={onGateSelect}
                ringRadiusPx={132}
                gateOffsetPx={28}
            />
        </div>
    );
}
