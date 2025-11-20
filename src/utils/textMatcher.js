/**
 * Normalizes text by converting to lowercase and removing punctuation
 * @param {string} text - The text to normalize
 * @returns {string[]} - Array of normalized words
 */
export function normalizeText(text) {
  // Convert to lowercase
  const lowerCase = text.toLowerCase();

  // Remove punctuation and special characters, keep only letters, numbers, and spaces
  const noPunctuation = lowerCase.replace(/[^\w\säöüß]/g, " ");

  // Split into words and filter out empty strings
  const words = noPunctuation.split(/\s+/).filter((word) => word.length > 0);

  return words;
}

/**
 * Calculates the percentage of matching words between extracted and reference text
 * @param {string} extractedText - Text extracted from OCR
 * @param {string} referenceText - Reference text to compare against
 * @returns {number} - Match percentage (0-1)
 */
export function calculateMatchPercentage(extractedText, referenceText) {
  const extractedWords = normalizeText(extractedText);
  const referenceWords = normalizeText(referenceText);

  if (referenceWords.length === 0) {
    return 0;
  }

  // Count how many reference words appear in extracted text
  let matchCount = 0;

  for (const refWord of referenceWords) {
    if (extractedWords.includes(refWord)) {
      matchCount++;
    }
  }

  // Calculate percentage: (matching words / total reference words)
  const matchPercentage = matchCount / referenceWords.length;

  return matchPercentage;
}

/**
 * Validates if extracted text matches reference text above threshold
 * @param {string} extractedText - Text extracted from OCR
 * @param {string} referenceText - Reference text to compare against
 * @param {number} threshold - Minimum match percentage required (0-1)
 * @returns {object} - { isMatch: boolean, percentage: number }
 */
export function validateDocument(
  extractedText,
  referenceText,
  threshold = 0.6
) {
  const percentage = calculateMatchPercentage(extractedText, referenceText);

  return {
    isMatch: percentage >= threshold,
    percentage: percentage,
  };
}
