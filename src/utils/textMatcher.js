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
 * Calculates Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance (number of single-character changes needed)
 */
export function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  // Initialize first column and row
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculates similarity ratio between two strings (0-1)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity ratio (1 = identical, 0 = completely different)
 */
export function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Finds the best fuzzy match for a keyword in the OCR text
 * @param {string} keyword - The keyword to search for
 * @param {string} ocrText - The OCR extracted text
 * @param {number} similarityThreshold - Minimum similarity required (0-1)
 * @returns {object} - { isMatch: boolean, bestMatch: string, similarity: number }
 */
export function findFuzzyMatch(keyword, ocrText, similarityThreshold = 0.80) {
  const normalizedKeyword = keyword.toLowerCase();
  const ocrWords = normalizeText(ocrText);
  const keywordLength = normalizedKeyword.length;

  let bestMatch = null;
  let bestSimilarity = 0;

  for (const word of ocrWords) {
    // Quick exact match check first (no Levenshtein needed)
    if (word === normalizedKeyword) {
      return {
        isMatch: true,
        bestMatch: word,
        similarity: 1.0,
        keyword: keyword
      };
    }

    // Length filter: Skip words that are too different in length
    // For 70% similarity, length difference can't be more than 30%
    const lengthDiff = Math.abs(word.length - keywordLength);
    const maxLengthDiff = Math.ceil(keywordLength * 0.3);
    if (lengthDiff > maxLengthDiff) {
      continue; // Skip this word
    }

    // Now do the expensive Levenshtein calculation
    const similarity = calculateSimilarity(normalizedKeyword, word);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = word;

      // Early termination: if we found a very good match, stop searching
      if (bestSimilarity >= 0.95) {
        break;
      }
    }
  }

  return {
    isMatch: bestSimilarity >= similarityThreshold,
    bestMatch: bestMatch,
    similarity: bestSimilarity,
    keyword: keyword
  };
}

/**
 * Validates document using fuzzy keyword matching
 * @param {string} extractedText - Text extracted from OCR
 * @param {string[]} keywords - Array of keywords to search for
 * @param {number} similarityThreshold - Minimum similarity for each keyword (0-1)
 * @param {number} minKeywordsRequired - Minimum number of keywords that must match
 * @returns {object} - { isMatch: boolean, matchedCount: number, totalKeywords: number, matches: array, percentage: number }
 */
export function validateWithFuzzyKeywords(
  extractedText,
  keywords,
  similarityThreshold = 0.80,
  minKeywordsRequired = 3
) {
  const matches = [];
  let matchedCount = 0;

  // Early termination: stop checking once we have enough matches
  for (const keyword of keywords) {
    const match = findFuzzyMatch(keyword, extractedText, similarityThreshold);
    matches.push(match);

    if (match.isMatch) {
      matchedCount++;

      // Stop early if we've found enough matching keywords
      if (matchedCount >= minKeywordsRequired) {
        // Add remaining keywords as not checked (for completeness)
        const remainingKeywords = keywords.slice(matches.length);
        for (const remainingKeyword of remainingKeywords) {
          matches.push({
            isMatch: false,
            bestMatch: null,
            similarity: 0,
            keyword: remainingKeyword
          });
        }
        break;
      }
    }
  }

  const percentage = matchedCount / keywords.length;

  return {
    isMatch: matchedCount >= minKeywordsRequired,
    matchedCount: matchedCount,
    totalKeywords: keywords.length,
    matches: matches,
    percentage: percentage
  };
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
