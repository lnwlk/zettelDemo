import { useState, useRef } from "react";
import { createWorker } from "tesseract.js";
import { config } from "./config";
import { validateDocument } from "./utils/textMatcher";

function App() {
  const [state, setState] = useState("initial"); // initial, processing, success, error
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
    setState("processing");
    setProgress(0);

    try {
      // Initialize Tesseract worker
      const worker = await createWorker("deu", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      // Perform OCR
      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();

      console.log("Extracted text:", text);

      // Validate document
      const result = validateDocument(
        text,
        config.referenceText,
        config.matchThreshold
      );
      setMatchPercentage(Math.round(result.percentage * 100));

      console.log("Match result:", result);

      if (result.isMatch) {
        setState("success");
      } else {
        setState("error");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      setState("error");
    }

    // Reset file input
    event.target.value = "";
  };

  const handleReset = () => {
    setState("initial");
    setCapturedImage(null);
    setProgress(0);
    setMatchPercentage(0);
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
  };

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col">
      <header className=" p-4 text-center ">
        <h1 className="text-2xl font-semibold">zetteln</h1>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {state === "initial" && (
          <div className="w-full gap-16 px-16 flex justify-center items-center flex-col   text-center">
            <h2 className="text-slate-800 text-2xl mb-4">
              Du möchtest ein schwierigen Text besser verstehen.
            </h2>
            <div className="text-6xl w-40 h-40 bg-white rounded-full flex justify-center items-center  mb-4">
              📄
            </div>
            <button
              className="bg-black-950 text-white border-0 rounded-full py-4 px-8 text-lg font-semibold cursor-pointer transition-colors w-full max-w-xs shadow-md hover:bg-black/80 active:translate-y-px"
              onClick={handleScanClick}
            >
              Foto machen
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

        {state === "processing" && (
          <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-lg text-center">
            {capturedImage && (
              <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={capturedImage}
                  alt="Captured document"
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              </div>
            )}
            <div className="border-4 border-gray-200 border-t-blue-500 rounded-full w-12 h-12 animate-spin mx-auto mb-4"></div>
            <h2 className="text-slate-800 text-2xl mb-4">
              Processing document...
            </h2>
            <div className="w-full h-2 bg-gray-200 rounded overflow-hidden my-4">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-gray-500 text-sm mt-2">{progress}%</p>
          </div>
        )}

        {state === "success" && (
          <div className="w-full flex flex-col gap-12 text-xl">
            <div>
              <h1 className="">Brief</h1>
              <h2 className=" text-4xl mb-4">
                Projekt <br />
                Beschreibung
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-2xl">Unser Ziel</h3>
              <p className=" ">
                Unsere App hilft dir,
                <br />
                schwierigen Briefe zu verstehen.
              </p>
              <ul className="text-xl flex flex-col gap-4">
                <li className="flex gap-2 items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="21"
                    viewBox="0 0 24 21"
                    fill="none"
                  >
                    <path
                      d="M14.25 1.41431L23 10.1643M23 10.1643L14.25 18.9143M23 10.1643H1"
                      stroke="#66A5F4"
                      stroke-width="2"
                      stroke-linecap="square"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Sie erklärt Briefe in einfacher Sprache.
                </li>
                <li className="flex gap-2 items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="21"
                    viewBox="0 0 24 21"
                    fill="none"
                  >
                    <path
                      d="M14.25 1.41431L23 10.1643M23 10.1643L14.25 18.9143M23 10.1643H1"
                      stroke="#66A5F4"
                      stroke-width="2"
                      stroke-linecap="square"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Sie hilft beim Ausfüllen von Formularen
                </li>
                <li className="flex gap-2 items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="21"
                    viewBox="0 0 24 21"
                    fill="none"
                  >
                    <path
                      d="M14.25 1.41431L23 10.1643M23 10.1643L14.25 18.9143M23 10.1643H1"
                      stroke="#66A5F4"
                      stroke-width="2"
                      stroke-linecap="square"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Sie sortiert deine Dokumente.
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-4 max-w-sm">
              <a
                className="rounded-full text-center bg-black-950 text-white py-4 px-8 hover:bg-black-950/90"
                href="https://www.zetteln.app/AppWaitlist"
              >
                App nutzen
              </a>
              <a
                className="rounded-full text-center border-solid border-black-950 border-1 hover:bg-black-950/10  py-4 px-8 "
                href="https://www.zetteln.app/"
              >
                Mehr über zetteln
              </a>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="text-red-600 text-4xl w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              ✕
            </div>
            <h2 className="text-slate-800 text-2xl mb-4">
              Document Not Recognized
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-6">
              The scanned document doesn't match our reference. Please try again
              with better lighting or a clearer image.
            </p>
            {matchPercentage > 0 && (
              <p className="text-gray-500 text-sm my-4">
                Match: {matchPercentage}% (minimum 70% required)
              </p>
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

      <footer className="bg-white text-gray-400 p-4 text-center text-sm">
        <p className="m-0">
          Mehr erfahren auf{" "}
          <a href="https://www.zetteln.app/">www.zetteln.app</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
