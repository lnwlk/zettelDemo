import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { config } from './config';
import { validateDocument } from './utils/textMatcher';
import './App.css';

function App() {
  const [state, setState] = useState('initial'); // initial, processing, success, error
  const [capturedImage, setCapturedImage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [matchPercentage, setMatchPercentage] = useState(0);
  const fileInputRef = useRef(null);

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create image preview URL
    const imageUrl = URL.createObjectURL(file);
    setCapturedImage(imageUrl);

    // Start processing
    setState('processing');
    setProgress(0);

    try {
      // Initialize Tesseract worker
      const worker = await createWorker('deu', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      // Perform OCR
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      console.log('Extracted text:', text);

      // Validate document
      const result = validateDocument(text, config.referenceText, config.matchThreshold);
      setMatchPercentage(Math.round(result.percentage * 100));

      console.log('Match result:', result);

      if (result.isMatch) {
        setState('success');
      } else {
        setState('error');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      setState('error');
    }

    // Reset file input
    event.target.value = '';
  };

  const handleReset = () => {
    setState('initial');
    setCapturedImage(null);
    setProgress(0);
    setMatchPercentage(0);
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Zettel OCR Scanner</h1>
      </header>

      <main className="app-content">
        {state === 'initial' && (
          <div className="screen initial-screen">
            <div className="icon">📄</div>
            <h2>Scan Your Document</h2>
            <p className="instructions">
              Place your document on a flat surface and ensure good lighting for best results.
            </p>
            <button className="primary-button" onClick={handleScanClick}>
              Scan Document
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {state === 'processing' && (
          <div className="screen processing-screen">
            {capturedImage && (
              <div className="image-preview">
                <img src={capturedImage} alt="Captured document" />
              </div>
            )}
            <div className="spinner"></div>
            <h2>Processing document...</h2>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="progress-text">{progress}%</p>
          </div>
        )}

        {state === 'success' && (
          <div className="screen success-screen">
            <div className="icon success-icon">✓</div>
            <h2>Document Recognized!</h2>
            <p className="match-info">Match: {matchPercentage}%</p>
            <div className="result-box">
              <h3>Plain Language Version:</h3>
              <p className="plain-text">{config.plainLanguageVersion}</p>
            </div>
            <button className="primary-button" onClick={handleReset}>
              Scan Another
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="screen error-screen">
            <div className="icon error-icon">✕</div>
            <h2>Document Not Recognized</h2>
            <p className="error-message">
              The scanned document doesn't match our reference. Please try again with better
              lighting or a clearer image.
            </p>
            {matchPercentage > 0 && (
              <p className="match-info">Match: {matchPercentage}% (minimum 70% required)</p>
            )}
            <button className="primary-button" onClick={handleReset}>
              Try Again
            </button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Mobile Document Scanner with OCR</p>
      </footer>
    </div>
  );
}

export default App;
