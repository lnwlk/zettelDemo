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
    <div className="min-h-screen max-w-screen overflow-hidden  bg-sand-100 flex justify-between flex-col">
      <header className="pt-4 text-center mb-8">
        <h1 className="text-2xl ">zetteln</h1>
      </header>

      <main className="flex-1 flex px-2 w-full mx-auto items-center justify-center ">
        {state === "initial" && (
          <div className="w-full  gap-16 max-w-md px-16 flex justify-center items-center flex-col   text-center">
            <h2 className="text-slate-800 text-xl mb-4">
              Du möchtest ein schwierigen Text besser verstehen.
            </h2>
            <div className="text-6xl w-40 h-40 bg-white rounded-full flex justify-center items-center  mb-4">
              📄
            </div>
            <button
              className="bg-black-800 text-white border-0 rounded-full py-4 px-8 text-lg font-semibold cursor-pointer transition-colors w-full max-w-xs shadow-md hover:bg-black/80 active:translate-y-px"
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
          <div className="w-full max-w-md  text-center">
            {capturedImage && (
              <div className="mb-6  rounded-lg overflow-hidden shadow-lg">
                <img
                  src={capturedImage}
                  alt="Captured document"
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              </div>
            )}
            <div className="border-4 border-gray-200 border-t-blue-500 rounded-full w-12 h-12 animate-spin mx-auto mb-4"></div>
            <h2 className="text-slate-800 text-2xl mb-4">Dokument lesen...</h2>
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
          <div className="w-full flex flex-col  gap-4  text-xl">
            <div className="w-full max-w-md mx-auto ">
              <h1 className="text-4xl text-center">Dein Dokument</h1>
            </div>
            <div className="flex bg-white max-w-md w-full mx-auto  m-4 p-4 rounded-2xl flex-col text-lg gap-2">
              <div className="flex  justify-between">
                <p>Wie schwierig?</p>
                <div className="flex gap-2">
                  <div className="h-6 w-6 bg-gray-200 rounded-full">
                    <div className="h-6 w-3 bg-blue-400 rounded-l-full"></div>
                  </div>
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                </div>
              </div>
              <div className="flex  justify-between">
                <p>Ist es wichtig?</p>
                <div className="flex gap-2">
                  <div className="h-6 w-6 bg-blue-400 rounded-full"></div>
                  <div className="h-6 w-6 bg-blue-400 rounded-full"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded-full">
                    <div className="h-6 w-3 bg-blue-400 rounded-l-full"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full max-w-md mx-auto flex items-center gap-4 ">
              <div className="h-12 w-12 rounded-full flex justify-center items-center bg-white">
                🇩🇪
              </div>
              <h2 className="text-2xl text-center ">Das wird gesagt</h2>
            </div>
            <div className="flex rotate-2 relative bg-white w-full p-12 py-16 rounded-2xl max-w-md mx-auto flex-col gap-6">
              <div className="absolute top-0 right-0 bg-sand-100 rounded-rt-2xl border border-sand-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                  fill="none"
                >
                  <path
                    d="M4 56H56L0 0V52C0 54.2091 1.79086 56 4 56Z"
                    fill="#28292D"
                  />
                </svg>
              </div>
              <div className="-rotate-2 flex flex-col gap-6">
                <div className="flex  flex-col gap-1">
                  <h3 className="font-semibold">Unser Ziel</h3>
                  <p>Unsere App hilft dir, schwierigen Briefe zu verstehen.</p>
                </div>
                <ul className="text-xl flex flex-col gap-3">
                  <li className="flex gap-4 items-center">
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
                    Die App erklärt Briefe in einfacher Sprache.
                  </li>
                  <li className="flex gap-4 items-center">
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
                    Die App hilft beim Ausfüllen von Formularen
                  </li>
                  <li className="flex gap-4 items-center">
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
                    Die App sortiert deine Dokumente.
                  </li>
                </ul>
              </div>
            </div>
            <div className="  flex flex-col gap-2 items-center p-4 w-screen">
              <h2>Dir gefällt die App ?</h2>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                <a
                  className="rounded-full  text-center bg-black-800 text-white py-4 px-8 hover:bg-black-800/90"
                  href="https://www.zetteln.app/AppWaitlist"
                >
                  App testen
                </a>
                <a
                  className="rounded-full text-center border-solid border-black-800 border-1 hover:bg-black-800/10  py-4 px-8 "
                  href="https://www.zetteln.app/"
                >
                  Mehr über zetteln
                </a>
              </div>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="text-red-600 text-4xl w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              ✕
            </div>
            <h2 className="text-slate-800 text-xl mb-4">
              Ohje, das kann ich noch nicht lesen.
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-6">
              Dies ist eine Demo-Version mit der nur freigegebenen Dokumente
              gesannt werden können.{" "}
              <a className="font-semibold" href="mailto:lena@zetteln.app">
                Schreibe uns
              </a>{" "}
              und erzähle uns von deinem Anwendungsfall!
            </p>
            {matchPercentage > 0 && (
              <p className="text-gray-500 text-sm my-4">
                Match: {matchPercentage}% (minimum 70% required)
              </p>
            )}
            <button
              className="rounded-full text-center bg-black-800 text-white py-4 px-8 hover:bg-black-800/90"
              onClick={handleReset}
            >
              Neues Dokument scannen
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
