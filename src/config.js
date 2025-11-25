export const config = {
  referenceText:
    "Zielsetzung: Im Rahmen der digitalen Transformation entwickeln wir eine mobile Applikation, deren primäre Zielsetzung in der Vereinfachung des Zugangs zu behördlicher Kommunikation liegt. zetteln ist eine Applikation die offizielle Texte in verständliche Sprache wiedergibt. Die Applikation erläutert amtliche Schriftstücke durch Kontextualisierung und bietet eine adaptive Ausfüllhilfen für Antragsverfahren. Nutzer und Nutzerinnen können unterstützt durch die Applikation strukturiert analoge Dokumente sortieren, bearbeiten und digitalisieren. Der Text ist schwierig? Teste die App auf demo.zetteln.app",
  matchThreshold: 0.6,

  // Fuzzy keyword matching configuration
  keywords: [
    "zetteln",          // App name - highly distinctive
    "Zielsetzung",      // Long word appearing twice
    "behördlicher",     // Contains umlauts - distinctive
    "Applikation",      // Key term appearing multiple times
    "digitalisieren"    // Long distinctive word
  ],
  fuzzyMatchingEnabled: true,        // Use fuzzy keyword matching
  similarityThreshold: 0.80,          // 80% similarity required for keyword match
  minKeywordsRequired: 3,             // Need 3 out of 5 keywords to validate
};
