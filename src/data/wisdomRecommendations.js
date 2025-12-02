// src/data/wisdomRecommendations.js
// WISDOM RECOMMENDATIONS MAPPING (DRAFT)
// Based on Immanence OS treatise structure
// Purpose: Functional testing of recommendation logic
// To be refined based on user feedback and actual chapter content verification

export const wisdomCategories = {
  "focus-presence": {
    label: "Focus & Presence",
    description: "For scattered energy, attention fragmentation, overstimulation",
    chapters: [
      {
        title: "The Four Modes - Why Evolution Requires All Four",
        reasoning: "Choose the mode that matches your current need. Scattered energy often needs MODE 1 (grounding) or MODE 4 (channeling).",
        chapterRef: "chapter-44-the-four-modes-why-evolution-requires-all-four"
      },
      {
        title: "The Bridge of Breath/Resonance",
        reasoning: "Breath is the anchor between thought and body. Returns attention to present moment.",
        chapterRef: "chapter-14-the-bridge-of-breath-resonance"
      },
      {
        title: "The Nature of Thoughts—Why Thinking About Your Thoughts Doesn't Work",
        reasoning: "Scattered attention often comes from over-thinking. This explains why metacognition fails and what actually works.",
        chapterRef: "chapter-15-the-nature-of-thoughtswhy-thinking-about-your-thoughts-doesnt-work"
      }
    ]
  },

  "emotional-regulation": {
    label: "Emotional Regulation",
    description: "For dysregulation, mood instability, feeling overwhelmed",
    chapters: [
      {
        title: "The Resonant Symphony",
        reasoning: "Your emotions are not random. They're an orchestra following patterns. Understanding the structure lets you conduct it.",
        chapterRef: "chapter-42-the-resonant-symphony"
      },
      {
        title: "Feeling as Knowing - The Intelligence of Emotion",
        reasoning: "Emotions aren't problems to solve. They're signals. This chapter teaches you to read them as data, not noise.",
        chapterRef: "chapter-13-feeling-as-knowing-the-intelligence-of-emotion"
      },
      {
        title: "The Living Current - Understanding Your Energy Body",
        reasoning: "Dysregulation lives in your energy centers. This maps where emotions physically lodge and how to shift them.",
        chapterRef: "chapter-10-the-living-current-understanding-your-energy-body"
      },
      {
        title: "The Inner Ensemble - Working with Archetypal Energies as Conscious Practice",
        reasoning: "Meet the different parts of yourself that are in conflict. Orchestra becomes conscious collaboration.",
        chapterRef: "chapter-47-the-inner-ensemble-working-with-archetypal-energies-as-conscious-practice"
      }
    ]
  },

  "grounding-safety": {
    label: "Grounding & Safety",
    description: "For anxiety, disconnection, rootlessness, feeling unmoored",
    chapters: [
      {
        title: "The Sacred Ego - Boundary, Tool, and Divine Instrument",
        reasoning: "The ego's job is to create boundaries and maintain safety. This reclaims it as sacred function, not enemy.",
        chapterRef: "chapter-9-the-sacred-ego-boundary-tool-and-divine-instrument"
      },
      {
        title: "The Living Current - Understanding Your Energy Body",
        reasoning: "Root center work. Physical grounding practices. Where safety lives in your body.",
        chapterRef: "chapter-10-the-living-current-understanding-your-energy-body"
      },
      {
        title: "MIND/BODY/SPIRIT: The Three Interfaces of Immanent Being",
        reasoning: "Grounding requires integrating all three. Purely mental or spiritual bypasses don't create real safety.",
        chapterRef: "chapter-16-mindbodyspirit-the-three-interfaces-of-immanent-being"
      },
      {
        title: "Practical Applications - The Modes in Daily Life",
        reasoning: "MODE 1 is the grounding mode. This shows how to activate it moment-to-moment.",
        chapterRef: "chapter-46-practical-applications-the-modes-in-daily-life"
      }
    ]
  },

  "shadow-integration": {
    label: "Shadow & Integration",
    description: "For recurring patterns, shame, denied parts of yourself, self-sabotage",
    chapters: [
      {
        title: "Shadow as Curriculum - The Architecture of the Unchosen Self",
        reasoning: "Your shadow isn't pathology. It's curriculum. The parts you were trained to hide often contain your medicine.",
        chapterRef: "chapter-x-shadow-as-curriculum-the-architecture-of-the-unchosen-self"
      },
      {
        title: "The Inner Ensemble - Working with Archetypal Energies as Conscious Practice",
        reasoning: "Shadow work means meeting these parts as collaborators, not enemies. Orchestrate them consciously.",
        chapterRef: "chapter-47-the-inner-ensemble-working-with-archetypal-energies-as-conscious-practice"
      },
      {
        title: "The Architecture of Integration",
        reasoning: "Integration isn't dissolving the shadow. It's making conscious what was unconscious.",
        chapterRef: "chapter-43-the-architecture-of-integration"
      },
      {
        title: "The Sacred Ego - Boundary, Tool, and Divine Instrument",
        reasoning: "Understand what your ego is hiding and why. Conscious ego can integrate shadow.",
        chapterRef: "chapter-9-the-sacred-ego-boundary-tool-and-divine-instrument"
      }
    ]
  },

  "expression-voice": {
    label: "Expression & Voice",
    description: "For suppressed creativity, difficulty speaking truth, blocked communication, creative stagnation",
    chapters: [
      {
        title: "The Bridge of Breath/Resonance",
        reasoning: "Breath moves from heart to throat. This is how unspoken truth becomes articulated.",
        chapterRef: "chapter-14-the-bridge-of-breath-resonance"
      },
      {
        title: "The Nature of Thoughts—Why Thinking About Your Thoughts Doesn't Work",
        reasoning: "Blocked expression often comes from overthinking. This shows why and what creates flow instead.",
        chapterRef: "chapter-15-the-nature-of-thoughtswhy-thinking-about-your-thoughts-doesnt-work"
      },
      {
        title: "Language & Geometry as Cosmic Expression",
        reasoning: "Language itself is sacred geometry. This unlocks the creative power of words and expression.",
        chapterRef: "language-geometry-as-cosmic-expression"
      },
      {
        title: "The Sacred Dance - Divine Masculine and Feminine",
        reasoning: "Expression requires balance between the impulse to speak (masculine) and the wisdom of what to speak (feminine).",
        chapterRef: "chapter-11-the-sacred-dance-divine-masculine-and-feminine"
      }
    ]
  },

  "heart-connection": {
    label: "Heart & Connection",
    description: "For isolation, relationship difficulty, closed heart, loneliness, difficulty with intimacy",
    chapters: [
      {
        title: "Love: The Invisible Reconciler",
        reasoning: "Love isn't sentiment. It's the recognition of value in that which is not yourself. This is how connection works.",
        chapterRef: "chapter-40-love-the-invisible-reconciler"
      },
      {
        title: "The Sacred Dance - Divine Masculine and Feminine",
        reasoning: "Relationships require polarity. Healthy connection means understanding your masculine/feminine dance.",
        chapterRef: "chapter-11-the-sacred-dance-divine-masculine-and-feminine"
      },
      {
        title: "The Living Current - Understanding Your Energy Body",
        reasoning: "Heart center work. Where love gets blocked and how to open it.",
        chapterRef: "chapter-10-the-living-current-understanding-your-energy-body"
      },
      {
        title: "The Sacred Cycle - Birth, Death, and Continuity of Consciousness (Part 1)",
        reasoning: "Deep intimacy requires understanding that all connection involves cycles of meeting and separating.",
        chapterRef: "chapter-20-the-sacred-cycle-birth-death-and-continuity-of-consciousness-part-1"
      }
    ]
  },

  "resonance-alignment": {
    label: "Resonance & Alignment",
    description: "For understanding why their life is structured the way it is, frequency work, attracting what they want",
    chapters: [
      {
        title: "The Resonant Symphony",
        reasoning: "Your inner frequency broadcasts outward and structures your reality. This maps how.",
        chapterRef: "chapter-42-the-resonant-symphony"
      },
      {
        title: "As Above, So Below: The Architecture of Resonance",
        reasoning: "Your inner state = your outer reality. This shows the mechanics of that relationship.",
        chapterRef: "chapter-12-as-above-so-below-the-architecture-of-resonance"
      },
      {
        title: "Practical Applications - The Modes in Daily Life",
        reasoning: "Align your moment-to-moment choices with your desired frequency.",
        chapterRef: "chapter-46-practical-applications-the-modes-in-daily-life"
      },
      {
        title: "The Dance of the Modes & Integration",
        reasoning: "Integration means your inner orchestra plays in harmony, which radiates coherent frequency.",
        chapterRef: "chapter-45-the-dance-of-the-modes-integration"
      }
    ]
  },

  "self-knowledge": {
    label: "Self-Knowledge",
    description: "For deeper understanding of your particular nature and context, who you actually are, your purpose",
    chapters: [
      {
        title: "The Architecture of Integration / Before You Practice",
        reasoning: "Foundation for all self-knowledge work. Maps how consciousness knows itself.",
        chapterRef: "chapter-41-the-architecture-and-reality-of-integration"
      },
      {
        title: "The Resonant Symphony",
        reasoning: "Your self is the orchestration. Knowing your 'symphony' is knowing yourself.",
        chapterRef: "chapter-42-the-resonant-symphony"
      },
      {
        title: "Sacred Cartography - Jyotish as Navigational Consciousness",
        reasoning: "Your particular nature (birth chart) shows your gifts, challenges, and navigational compass.",
        chapterRef: "chapter-48-sacred-cartography-jyotish-as-navigational-consciousness"
      },
      {
        title: "The Four Modes - Why Evolution Requires All Four",
        reasoning: "Self-knowledge requires knowing which modes you naturally default to and which you're avoiding.",
        chapterRef: "chapter-44-the-four-modes-why-evolution-requires-all-four"
      },
      {
        title: "When the Dance of Creation Becomes a Knife Fight",
        reasoning: "Self-knowledge includes understanding conflict patterns and how your particular psychology creates them.",
        chapterRef: "chapter-19-when-the-dance-of-creation-becomes-a-knife-fight"
      }
    ]
  }
};

// Helper function to get recommendations for a given category
export function getRecommendations(categoryKey) {
  return wisdomCategories[categoryKey] || null;
}

// Helper to get all categories for UI dropdown/buttons
export function getAllCategories() {
  return Object.entries(wisdomCategories).map(([key, data]) => ({
    key,
    label: data.label,
    description: data.description
  }));
}

// Helper to get a specific chapter across all categories
export function findChapterInRecommendations(chapterRef) {
  const results = [];
  Object.entries(wisdomCategories).forEach(([categoryKey, data]) => {
    const found = data.chapters.find(ch => ch.chapterRef === chapterRef || ch.chapterRef === String(chapterRef));
    if (found) {
      results.push({
        category: categoryKey,
        categoryLabel: data.label,
        chapter: found
      });
    }
  });
  return results;
}