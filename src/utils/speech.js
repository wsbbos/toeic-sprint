// src/utils/speech.js

/**
 * Checks if SpeechSynthesis is supported by the user's browser.
 * @returns {boolean} Support status
 */
export function isSpeechSupported() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

/**
 * Speaks the given English text using SpeechSynthesis.
 * @param {string} text Plaintext to read aloud
 * @param {number} rate Speed of pronunciation (e.g. 1.0 is normal, 0.7 is slower)
 * @param {(() => void)|null} onEnd Optional callback executed when voice completes
 * @returns {boolean} Success status
 */
export function speakText(text, rate = 1.0, onEnd = null) {
  if (!isSpeechSupported()) {
    return false;
  }

  try {
    // Stop any active narration instantly
    window.speechSynthesis.cancel();

    // Clean text by stripping brackets and tags
    const cleaned = text.trim();
    if (!cleaned) return false;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'en-US';
    utterance.rate = rate;

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = () => onEnd(); // Fallback on error to clear active state
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('SpeechSynthesis Failed:', err);
    return false;
  }
}

/**
 * Cancels all currently speaking and queued vocalizations.
 */
export function stopSpeaking() {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Extracts raw transcript script from the listening question field enclosed in brackets.
 * Format: "Look at the mock photo. [Audio transcript: (A) A man... (B) ...] Choose the best."
 * @param {string} text The listening question text
 * @returns {string} Extracted speech transcript or original text as fallback
 */
export function extractAudioTranscript(text) {
  if (!text) return '';
  const match = text.match(/\[Audio transcript:\s*([^\]]+)\]/i);
  return match ? match[1] : text;
}
