// src/components/avatar/index.jsx
// FOUR-LAYER AVATAR STACK:
// 0) Luminous field (canvas rings)
// 1) Breathing aura (practice only)
// 2) Rune ring (PNG, rotating)
// 3) Inner sigil core (PNG, stage-aware)
// 4) Metrics text

import React, { useEffect, useState, useCallback } from "react";
import "../Avatar.css";
import { LABELS, STAGE_GLOW_COLORS, getMandalaState } from "./constants";
import { AvatarContainer } from "./AvatarContainer";
import { useSettingsStore } from "../../../state/settingsStore";
import { AvatarV2 } from "../../../components/avatarV2/AvatarV2.jsx";

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
}) {
    const label = LABELS[mode] || "Center";

    // Get avatar naming preference from settings
    const useNewAvatars = useSettingsStore(s => s.useNewAvatars);

    const [mandalaSnapshot, setMandalaSnapshot] = useState(null);
    const [stageIndex, setStageIndex] = useState(2);
    const [variationIndex, setVariationIndex] = useState(0);
    const [maxVariations, setMaxVariations] = useState(1);

    const STAGE_NAMES = ["seedling", "ember", "flame", "beacon", "stellar"];
    const internalStage = STAGE_NAMES[stageIndex];
    const currentStage = controlledStage ? controlledStage.toLowerCase() : internalStage;

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

                // Construct path based on naming convention
                let imagePath;
                if (useNewAvatars) {
                    // New naming: avatar-{stage}-{path}-{attention}_0000{n}_.png
                    const variationSuffix = `_0000${index + 1}_`;
                    imagePath = `${import.meta.env.BASE_URL}avatars/avatar-${stageLower}-${pathLower}-${attentionLower}${variationSuffix}.png`;
                } else {
                    // Old naming: {Stage}-{Path}.png (capitalize first letter)
                    const stageCapitalized = stageLower.charAt(0).toUpperCase() + stageLower.slice(1);
                    const pathCapitalized = pathLower.charAt(0).toUpperCase() + pathLower.slice(1);
                    imagePath = `${import.meta.env.BASE_URL}avatars/${stageCapitalized}-${pathCapitalized}.png`;
                }

                img.src = imagePath;
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
            });
        };

        // For old avatars, only check index 0 (single file)
        const maxChecks = useNewAvatars ? 10 : 1;
        Promise.all([...Array(maxChecks)].map((_, i) => checkVariation(i)))
            .then(results => {
                const foundCount = results.filter(Boolean).length;
                setMaxVariations(foundCount > 0 ? foundCount : 1);
                setVariationIndex(0);
            });
    }, [currentStage, path, attention, showCore, useNewAvatars]);

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
    const phase = mandalaData.phase || 'foundation';
    const { focus = 0, clarity = 0, distortion = 0 } = mandalaData.transient || {};

    const accLabel =
        avgAccuracy >= 0.85 ? 'ex' :
        avgAccuracy >= 0.7 ? 'gd' :
        avgAccuracy >= 0.5 ? 'ok' : 'wk';
    const accPct = Math.round(avgAccuracy * 100);

    const wkLabel =
        weeklyConsistency >= 0.85 ? 'ex' :
        weeklyConsistency >= 0.7 ? 'gd' :
        weeklyConsistency >= 0.5 ? 'ok' : 'wk';
    const wkPct = Math.round(weeklyConsistency * 100);

    const safePattern = breathPattern || {};
    const patternForBreath = {
        inhale: typeof safePattern.inhale === "number" ? safePattern.inhale : 4,
        holdTop: typeof safePattern.hold1 === "number" ? safePattern.hold1 : 4,
        exhale: typeof safePattern.exhale === "number" ? safePattern.exhale : 4,
        holdBottom: typeof safePattern.hold2 === "number" ? safePattern.hold2 : 2,
    };

    const handleSigilClick = () => {
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
        <div className="flex flex-col items-center">
            <div className="relative w-56 h-56 flex items-center justify-center">
                <div className="relative w-48 h-48">
                    <AvatarV2 />
                </div>
            </div>

            <div className="mt-3 text-[10px] text-white/70 text-center space-y-0.5">
                <div>
                    acc {accPct} ({accLabel}) · wk {wkPct} ({wkLabel}) · phase {phase}
                </div>
                <div>
                    live f {Math.round(focus * 100)} · c {Math.round(clarity * 100)} · d{" "}
                    {Math.round(distortion * 100)}
                </div>
            </div>
        </div>
    );
}
