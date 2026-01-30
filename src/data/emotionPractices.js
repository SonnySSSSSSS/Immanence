// src/data/emotionPractices.js
// Emotion practice modes with minimal and guided prompt variations

export const EMOTION_PRACTICES = {
  discomfort: {
    label: 'Discomfort',
    oneLineFrame: 'Observe difficulty without judgment.',
    closingLine: 'You held space for what was hard.',
    prompts: {
      minimal: [
        'Notice the discomfort.',
        'Where does it live in your body?',
        'What texture does it have?',
        'Breathe into the sensation.',
        'It is allowed to be here.',
        'You are not your discomfort.',
        'Return whenever you drift.',
      ],
      guided: [
        'Settle into your natural breath. Feel the weight of your body supported.',
        'Bring gentle attention to any discomfort present right now.',
        'Rather than pushing it away, invite curiosity. What do you notice?',
        'Does it have edges? A center? A movement or pulse?',
        'What happens when you breathe directly into this sensation?',
        'The discomfort is not something wrong with you—it is information.',
        'Can you extend kindness to this part of yourself that is struggling?',
        'When your mind drifts, gently return. This is the practice.',
        'Your willingness to feel is your strength.',
      ],
    },
  },
  fear: {
    label: 'Fear',
    oneLineFrame: 'Meet fear with steady presence.',
    closingLine: 'Your courage was in the meeting.',
    prompts: {
      minimal: [
        'Notice fear without naming it.',
        'It is a messenger.',
        'What is it protecting?',
        'Feel your feet on the ground.',
        'You are safe right now.',
        'Fear and presence can coexist.',
        'Stay with this moment.',
      ],
      guided: [
        'Let your body be heavy, rooted, held by the earth below.',
        'Allow any fear that is present to surface without hiding.',
        'Fear is not a sign of weakness—it is a sign of caring, of mattering.',
        'What is this fear trying to protect you from? Listen without judgment.',
        'Feel your heartbeat. Feel the air moving in and out.',
        'You have survived everything you have faced so far.',
        'In this moment, right now, you are safe. Can you feel that?',
        'When fear rises, your steadiness is the reply.',
        'Your presence here is enough.',
      ],
    },
  },
  pleasure: {
    label: 'Pleasure',
    oneLineFrame: 'Receive joy without guilt.',
    closingLine: 'You allowed yourself to feel good.',
    prompts: {
      minimal: [
        'What brings pleasure right now?',
        'Notice it without pushing away.',
        'Warmth. Ease. Lightness.',
        'You deserve to feel good.',
        'Let it stay for a moment.',
        'No apology needed.',
        'Simple delight.',
      ],
      guided: [
        'Begin by noticing something that brings you ease or delight right now.',
        'It might be warmth, comfort, stillness, or beauty you sense.',
        'Without guilt, without earning it, simply receive this good feeling.',
        'What is the quality of it? Is it warm, light, soft, gentle?',
        'Notice how pleasure feels in your body without reaching for more.',
        'Pleasure is not indulgence—it is data about what nourishes you.',
        'You do not need to justify joy or earn your own well-being.',
        'The practice is to simply receive, with gratitude.',
        'This capacity to feel good is yours.',
      ],
    },
  },
  neutrality: {
    label: 'Neutrality',
    oneLineFrame: 'Rest in the space between reactions.',
    closingLine: 'You found the still point.',
    prompts: {
      minimal: [
        'What is here without drama?',
        'Neither clinging nor pushing.',
        'Space between heartbeats.',
        'Bare awareness.',
        'Nothing to fix.',
        'Simply present.',
        'The natural state.',
      ],
      guided: [
        'Settle into stillness. Not empty, but full of potential.',
        'Notice how the mind and body can rest without stimulation.',
        'You do not need to react to everything. You can simply witness.',
        'Some moments are neutral—neither good nor bad. This is not numbness.',
        'In neutrality, there is a kind of freedom. No urgency. No burden.',
        'Can you feel the difference between passivity and clear, rested presence?',
        'The practice is to rest here, without needing it to be anything else.',
        'This is the still point that holds all other feelings.',
        'You are complete right now, exactly as it is.',
      ],
    },
  },
  care: {
    label: 'Care',
    oneLineFrame: 'Let love move through you.',
    closingLine: 'You opened your heart.',
    prompts: {
      minimal: [
        'Feel the impulse to care.',
        'For someone you love.',
        'For yourself.',
        'For those who struggle.',
        'Love is not weakness.',
        'It connects us all.',
        'Let it flow.',
      ],
      guided: [
        'Bring to mind someone you naturally care about—a person, a place, or even an animal.',
        'Feel the warmth that arises when you think of their well-being.',
        'Care is not pity. It is a wish for happiness, for ease, for peace.',
        'Can you feel this same care turning toward yourself?',
        'Your own struggle matters. Your own well-being matters.',
        'Now expand this: extend care to those you do not know, to all who suffer.',
        'Care is the thread that connects all beings.',
        'Let it be large, unguarded, and true.',
        'This is how love works—it moves without needing permission.',
      ],
    },
  },
  compassion: {
    label: 'Compassion',
    oneLineFrame: 'Meet suffering with steady witness.',
    closingLine: 'You chose to see clearly.',
    prompts: {
      minimal: [
        'Witness suffering clearly.',
        'Not your own. Not alone.',
        'It is everywhere.',
        'Compassion is brave.',
        'You do not turn away.',
        'You see and you stay.',
        'This is love in action.',
      ],
      guided: [
        'Bring to mind a person who is suffering. Someone you know or have heard of.',
        'Rather than looking away, compassion asks you to see clearly.',
        'You do not fix their pain. You do not take it on. You witness it.',
        'In your witnessing, they are not alone.',
        'Now see your own suffering with this same clear, gentle eye.',
        'You too deserve compassion. You too deserve to be seen.',
        'This capacity to meet pain without fleeing—this is the strongest part of you.',
        'Compassion is not soft. It is fierce and awake.',
        'In seeing suffering and staying present, you change something.',
      ],
    },
  },
  notknowing: {
    label: 'Not Knowing',
    oneLineFrame: 'Dwell in uncertainty without fear.',
    closingLine: 'You rested in the mystery.',
    prompts: {
      minimal: [
        'You do not have to know.',
        'Uncertainty is not failure.',
        'The path reveals itself.',
        'Trust the unfolding.',
        'Not knowing is not emptiness.',
        'It is fullness without answers.',
        'This is the real practice.',
      ],
      guided: [
        'Notice how much of life asks you to be certain. To have answers.',
        'But what if you rested here, in not knowing?',
        'Not knowing is not ignorance—it is openness.',
        'Everything you know had to be discovered. Unknown before it was known.',
        'Uncertainty is where all growth begins.',
        'Can you sit with a question about your life without rushing to answer?',
        'Feel the quality of this not knowing. Is it anxious? Or is it peaceful?',
        'The deepest wisdom often hides in not knowing.',
        'Your willingness to not have it figured out is your freedom.',
      ],
    },
  },
};

// Helper to get prompts for an emotion mode
export const getEmotionPrompts = (mode, promptMode = 'minimal') => {
  const effectiveMode = mode || 'discomfort'; // Default to discomfort if mode is undefined
  const practice = EMOTION_PRACTICES[effectiveMode];
  if (!practice) return [];
  return practice.prompts[promptMode] || practice.prompts.minimal;
};

// Helper to get closing line for an emotion mode
export const getEmotionClosingLine = (mode) => {
  const effectiveMode = mode || 'discomfort';
  const practice = EMOTION_PRACTICES[effectiveMode];
  return practice ? practice.closingLine : 'You completed your practice.';
};

// Helper to get label for an emotion mode
export const getEmotionLabel = (mode) => {
  const effectiveMode = mode || 'discomfort';
  const practice = EMOTION_PRACTICES[effectiveMode];
  return practice ? practice.label : 'Emotion';
};
