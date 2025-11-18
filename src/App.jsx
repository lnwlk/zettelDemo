import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { config } from './config';
import { validateDocument } from './utils/textMatcher';

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
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-700 text-white p-4 text-center shadow-md">
        <h1 className="text-2xl font-semibold">Zettel OCR Scanner</h1>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {state === 'initial' && (
          <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-slate-800 text-2xl mb-4">Scan Your Document</h2>
            <p className="text-gray-500 text-base leading-relaxed mb-8">
              Place your document on a flat surface and ensure good lighting for best results.
            </p>
            <button
              className="bg-blue-500 text-white border-0 rounded-lg py-4 px-8 text-lg font-semibold cursor-pointer transition-colors w-full max-w-xs shadow-md hover:bg-blue-600 active:translate-y-px"
              onClick={handleScanClick}
            >
              Scan Document
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {state === 'processing' && (
          <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-lg text-center">
            {capturedImage && (
              <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
                <img src={capturedImage} alt="Captured document" className="w-full h-auto max-h-[300px] object-contain" />
              </div>
            )}
            <div className="border-4 border-gray-200 border-t-blue-500 rounded-full w-12 h-12 animate-spin mx-auto mb-4"></div>
            <h2 className="text-slate-800 text-2xl mb-4">Processing document...</h2>
            <div className="w-full h-2 bg-gray-200 rounded overflow-hidden my-4">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-gray-500 text-sm mt-2">{progress}%</p>
          </div>
        )}

        {state === 'success' && (
          <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="text-green-600 text-4xl w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">✓</div>
            <h2 className="text-slate-800 text-2xl mb-4">Document Recognized!</h2>
            <p className="text-gray-500 text-sm my-4">Match: {matchPercentage}%</p>
            <div className="bg-gray-50 rounded-lg p-6 my-6 text-left">
              <h3 className="text-slate-800 text-lg mb-4">Plain Language Version:</h3>
              <p className="text-slate-700 text-lg leading-relaxed">{config.plainLanguageVersion}</p>
            </div>
            <button
              className="bg-blue-500 text-white border-0 rounded-lg py-4 px-8 text-lg font-semibold cursor-pointer transition-colors w-full max-w-xs shadow-md hover:bg-blue-600 active:translate-y-px"
              onClick={handleReset}
            >
              Scan Another
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="text-red-600 text-4xl w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">✕</div>
            <h2 className="text-slate-800 text-2xl mb-4">Document Not Recognized</h2>
            <p className="text-gray-500 text-base leading-relaxed mb-6">
              The scanned document doesn't match our reference. Please try again with better
              lighting or a clearer image.
            </p>
            {matchPercentage > 0 && (
              <p className="text-gray-500 text-sm my-4">Match: {matchPercentage}% (minimum 70% required)</p>
            )}
            <button
              className="bg-blue-500 text-white border-0 rounded-lg py-4 px-8 text-lg font-semibold cursor-pointer transition-colors w-full max-w-xs shadow-md hover:bg-blue-600 active:translate-y-px"
              onClick={handleReset}
            >
              Try Again
            </button>
          </div>
        )}
      </main>

      <footer className="bg-slate-700 text-gray-400 p-4 text-center text-sm">
        <p className="m-0">Mobile Document Scanner with OCR</p>
      </footer>
    </div>
  );
}

export default App;
