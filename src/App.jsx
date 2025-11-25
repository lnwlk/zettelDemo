import { useState, useRef } from "react";
import { createWorker } from "tesseract.js";
import { config } from "./config";
import { validateDocument, validateWithFuzzyKeywords } from "./utils/textMatcher";
import { resizeImage } from "./utils/imageUtils";

function App() {
  const [state, setState] = useState("initial"); // initial, processing, success, error
  const [capturedImage, setCapturedImage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [matchPercentage, setMatchPercentage] = useState(0);
  const [ocrTime, setOcrTime] = useState(0);
  const [matchTime, setMatchTime] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("de");
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const fileInputRef = useRef(null);

  const languages = [
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },
    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
    { code: "uk", name: "Українська", flag: "🇺🇦" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "fa", name: "فارسی", flag: "🇮🇷" },
    { code: "fr", name: "français", flag: "🇫🇷" },
    { code: "ro", name: "română", flag: "🇷🇴" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
  ];

  const translations = {
    de: {
      title: "Unser Ziel",
      description: "Unsere App hilft dir, schwierigen Briefe zu verstehen.",
      items: [
        "Die App erklärt Briefe in einfacher Sprache.",
        "Die App hilft beim Ausfüllen von Formularen",
        "Die App sortiert deine Dokumente.",
      ],
    },
    en: {
      title: "Our Goal",
      description: "Our app helps you understand difficult letters.",
      items: [
        "The app explains letters in simple language.",
        "The app helps you fill out forms",
        "The app organizes your documents.",
      ],
    },
    ar: {
      title: "هدفنا",
      description: "تساعدك تطبيقنا على فهم الرسائل الصعبة.",
      items: [
        "يشرح التطبيق الرسائل بلغة بسيطة.",
        "يساعد التطبيق في ملء النماذج",
        "ينظم التطبيق مستنداتك.",
      ],
    },
    tr: {
      title: "Hedefimiz",
      description: "Uygulamamız zor mektupları anlamanıza yardımcı olur.",
      items: [
        "Uygulama mektupları basit bir dille açıklar.",
        "Uygulama formları doldurmanıza yardımcı olur",
        "Uygulama belgelerinizi düzenler.",
      ],
    },
    uk: {
      title: "Наша мета",
      description: "Наш додаток допомагає розуміти складні листи.",
      items: [
        "Додаток пояснює листи простою мовою.",
        "Додаток допомагає заповнювати форми",
        "Додаток сортує ваші документи.",
      ],
    },
    ru: {
      title: "Наша цель",
      description: "Наше приложение помогает понимать сложные письма.",
      items: [
        "Приложение объясняет письма простым языком.",
        "Приложение помогает заполнять формы",
        "Приложение сортирует ваши документы.",
      ],
    },
    fa: {
      title: "هدف ما",
      description: "برنامه ما به شما کمک می‌کند نامه‌های دشوار را درک کنید.",
      items: [
        "برنامه نامه‌ها را به زبان ساده توضیح می‌دهد.",
        "برنامه به پر کردن فرم‌ها کمک می‌کند",
        "برنامه اسناد شما را مرتب می‌کند.",
      ],
    },
    fr: {
      title: "Notre objectif",
      description:
        "Notre application vous aide à comprendre les lettres difficiles.",
      items: [
        "L'application explique les lettres dans un langage simple.",
        "L'application aide à remplir les formulaires",
        "L'application organise vos documents.",
      ],
    },
    ro: {
      title: "Scopul nostru",
      description:
        "Aplicația noastră te ajută să înțelegi scrisorile dificile.",
      items: [
        "Aplicația explică scrisorile într-un limbaj simplu.",
        "Aplicația ajută la completarea formularelor",
        "Aplicația organizează documentele tale.",
      ],
    },
    zh: {
      title: "我们的目标",
      description: "我们的应用帮助您理解困难的信件。",
      items: [
        "该应用用简单的语言解释信件。",
        "该应用帮助填写表格",
        "该应用整理您的文档。",
      ],
    },
  };

  // Check if current language is RTL
  const isRTL = selectedLanguage === "ar" || selectedLanguage === "fa";

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
      // Resize image for faster OCR (max 1600px width)
      console.log(`Original image size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      const resizedFile = await resizeImage(file, 1600, 0.9);
      console.log(`Resized image size: ${(resizedFile.size / 1024 / 1024).toFixed(2)}MB`);

      // Initialize Tesseract worker
      const worker = await createWorker("deu", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      // Perform OCR with resized image
      const ocrStartTime = performance.now();
      const {
        data: { text },
      } = await worker.recognize(resizedFile);
      await worker.terminate();
      const ocrEndTime = performance.now();
      const ocrDuration = Math.round(ocrEndTime - ocrStartTime);
      setOcrTime(ocrDuration);
      console.log(`⏱️ OCR took: ${ocrDuration}ms`);

      console.log("Extracted text:", text);

      // Validate document using fuzzy keyword matching or traditional method
      const matchStartTime = performance.now();
      let result;
      if (config.fuzzyMatchingEnabled && config.keywords) {
        // Use fuzzy keyword matching
        result = validateWithFuzzyKeywords(
          text,
          config.keywords,
          config.similarityThreshold,
          config.minKeywordsRequired
        );
        setMatchPercentage(Math.round(result.percentage * 100));
        const matchEndTime = performance.now();
        const matchDuration = Math.round(matchEndTime - matchStartTime);
        setMatchTime(matchDuration);
        console.log(`⚡ Fuzzy matching took: ${matchDuration}ms`);
        console.log("Fuzzy keyword match result:", result);
        console.log("Matched keywords:", result.matches.filter(m => m.isMatch).map(m =>
          `${m.keyword} → ${m.bestMatch} (${Math.round(m.similarity * 100)}%)`
        ));
      } else {
        // Use traditional full-text matching
        result = validateDocument(
          text,
          config.referenceText,
          config.matchThreshold
        );
        setMatchPercentage(Math.round(result.percentage * 100));
        const matchEndTime = performance.now();
        const matchDuration = Math.round(matchEndTime - matchStartTime);
        setMatchTime(matchDuration);
        console.log(`⚡ Traditional matching took: ${matchDuration}ms`);
        console.log("Traditional match result:", result);
      }

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
    setOcrTime(0);
    setMatchTime(0);
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
          <div className="w-full  gap-16  px-4 flex justify-center items-center flex-col   text-center">
            <h2 className="  text-3xl mb-4">
              Du möchtest einen <strong>schwierigen Text</strong> besser{" "}
              <strong>verstehen</strong>?
            </h2>
            <div className="text-6xl w-40 h-40 bg-white rounded-full flex justify-center items-center  mb-4">
              📄
            </div>
            <button
              className="bg-black-800 text-white border-0 rounded-full py-4 px-8 text-xl  cursor-pointer transition-colors w-full max-w-xs shadow-md hover:bg-black/80 active:translate-y-px"
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
              <div className="mb-6 max-h-[300px] mx-auto flex aspect-[3/4] shrink items-center justify-center  rounded-lg  overflow-hidden shadow-lg">
                <img
                  src={capturedImage}
                  alt="Captured document"
                  className=" object-cover"
                />
              </div>
            )}
            <div className="border-4 border-gray-200 border-t-blue-500 rounded-full w-12 h-12 animate-spin mx-auto mb-4"></div>
            <h2 className="text-slate-800 text-xl mb-4">Dokument lesen...</h2>
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
          <div className="w-full flex flex-col  gap-12  text-xl">
            <div className="w-full flex flex-col px-2 gap-4  text-xl">
              <div className="flex gap-4  w-full max-w-md mx-auto items-center">
                <img
                  className="h-32 bg-white  border-2 rounded-xl shadow-2xl -rotate-2"
                  src={capturedImage}
                  alt="Vorschau deines Dokuments"
                />
                <div>
                  <h1 className="text-3xl font-semibold pb-2">Dein Dokument</h1>
                  <div className="flex gap-3 text-blue-400 items-center ">
                    <div className="flex gap-1">
                      <div className="h-4 w-4 bg-black/5 rounded-full">
                        <div className="h-4 w-2 bg-blue-400 rounded-l-full"></div>
                      </div>
                      <div className="h-4 w-4 bg-black/5 rounded-full"></div>
                      <div className="h-4 w-4 bg-black/5 rounded-full"></div>
                    </div>
                    <p>einfach</p>
                  </div>
                  <div className="flex gap-3 text-red-400 items-center ">
                    <div className="flex gap-1">
                      <div className="h-4 w-4 bg-red-400 rounded-full"></div>
                      <div className="h-4 w-4 bg-red-400 rounded-full"></div>
                      <div className="h-4 w-4 bg-black/5 rounded-full">
                        <div className="h-4 w-2 bg-red-400 rounded-l-full"></div>
                      </div>
                    </div>
                    <p>wichtig</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4">
              <div className="w-full max-w-md mx-auto flex pb-4 items-center justify-between gap-4 ">
                <h2 className="text-xl font-semibold text-center ">
                  Das wird gesagt
                </h2>
                <div className="relative">
                  <button
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    className="h-12 w-12 rounded-full flex justify-center items-center bg-white shadow-2xl hover:bg-gray-50 transition-colors text-2xl cursor-pointer "
                  >
                    {
                      languages.find((lang) => lang.code === selectedLanguage)
                        ?.flag
                    }
                  </button>
                  {showLanguageMenu && (
                    <div className="absolute top-14 right-0 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-10 min-w-[200px]">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setSelectedLanguage(lang.code);
                            setShowLanguageMenu(false);
                          }}
                          className={`w-full flex  items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors ${
                            selectedLanguage === lang.code ? "bg-blue-50" : ""
                          }`}
                        >
                          <span className="text-2xl">{lang.flag}</span>
                          <span className="text-lg">{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="rotate-3 rounded-2xl border">
                <div className="flex -rotate-5  relative bg-sand-100  border-black border w-full p-6 py-16 rounded-2xl max-w-md mx-auto flex-col gap-6">
                  <div
                    className=" flex shrink-0 rotate-2 flex-col gap-6"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <div className="flex  flex-col gap-1">
                      <h3 className="font-semibold">
                        {translations[selectedLanguage].title}
                      </h3>
                      <p>{translations[selectedLanguage].description}</p>
                    </div>
                    <ul className="text-xl flex flex-col gap-3">
                      {translations[selectedLanguage].items.map(
                        (item, index) => (
                          <li
                            key={index}
                            className="flex gap-4 shrink-0 items-center"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="21"
                              viewBox="0 0 24 21"
                              fill="none"
                              className="shrink-0"
                              style={isRTL ? { transform: "scaleX(-1) " } : {}}
                            >
                              <path
                                d="M14.25 1.41431L23 10.1643M23 10.1643L14.25 18.9143M23 10.1643H1"
                                stroke="#66A5F4"
                                strokeWidth="2"
                                strokeLinecap="square"
                                strokeLinejoin="round"
                              />
                            </svg>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className=" justify-center mb-12 w-full max-w-xs flex flex-col gap-2 text-base items-center  mx-auto">
              <h2 className="font-semibold ">Dir gefällt die Idee?</h2>
              <div className="flex flex-col gap-2 w-full ">
                <a
                  className="rounded-full  text-center bg-black-800 text-white py-3 px-6 hover:bg-black-800/90"
                  href="https://www.zetteln.app/AppWaitlist"
                >
                  App testen
                </a>
                <a
                  className="rounded-full text-center  border-solid border-black-800 border-1 hover:bg-black-800/10  py-3 px-6 "
                  href="https://www.zetteln.app/"
                >
                  Mehr über zetteln
                </a>
              </div>
              {(ocrTime > 0 || matchTime > 0) && (
                <p className="text-xs mt-4 text-gray-400">
                  ⏱️ OCR: {(ocrTime / 1000).toFixed(1)}s | ⚡ Matching: {matchTime}ms
                </p>
              )}
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
              <div className="text-gray-500 text-sm my-4">
                <p>
                  {config.fuzzyMatchingEnabled ? (
                    <>Match: {matchPercentage}% ({config.minKeywordsRequired} of {config.keywords.length} keywords required)</>
                  ) : (
                    <>Match: {matchPercentage}% (minimum {Math.round(config.matchThreshold * 100)}% required)</>
                  )}
                </p>
                {(ocrTime > 0 || matchTime > 0) && (
                  <p className="text-xs mt-2 text-gray-400">
                    ⏱️ OCR: {(ocrTime / 1000).toFixed(1)}s | ⚡ Matching: {matchTime}ms
                  </p>
                )}
              </div>
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
