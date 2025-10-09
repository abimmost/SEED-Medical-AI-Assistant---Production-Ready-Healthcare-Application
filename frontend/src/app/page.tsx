"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Upload,
  Copy,
  Search,
  ChevronDown,
  ChevronUp,
  Languages,
  AlertTriangle,
  Send,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { Sora } from "next/font/google";

// Centralized API imports
import {
  chat as apiChat,
  analyzeImage as apiAnalyzeImage,
  research as apiResearch,
  type AnalysisResponse,
  type ResearchResult,
} from "@/lib/api";

const sora = Sora({ subsets: ["latin"], weight: ["700"] });
const nunito = Sora({ subsets: ["latin"], weight: ["600"] });

type TabKey = "welcome" | "chat" | "analysis" | "research";

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function getSourceBadge(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("pubmed")) return "PubMed";
  if (u.includes("who.int") || u.includes("who.")) return "WHO";
  if (u.includes("cdc.gov")) return "CDC";
  return "Source";
}

export default function HomePage() {
  // Language toggle persisted
  const [lang, setLang] = useState<"en" | "fr">("en");
  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "fr") setLang(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const [active, setActive] = useState<TabKey>("welcome");

  // Localized tab labels
  const tabs = useMemo<{ key: TabKey; label: string }[]>(
    () => [
      { key: "welcome", label: lang === "fr" ? "Accueil" : "Welcome" },
      { key: "chat", label: lang === "fr" ? "Discussion" : "Chat" },
      { key: "analysis", label: lang === "fr" ? "Analyse" : "Analysis" },
      { key: "research", label: lang === "fr" ? "Recherche" : "Research" },
    ],
    [lang]
  );

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string; id: string }[]
  >([]);

  const chatSuggestions = useMemo(
    () => [
      lang === "fr" ? "Symptômes du paludisme ?" : "Symptoms of malaria?",
      lang === "fr"
        ? "Quelles sont les causes des maux de tête ?"
        : "What causes headaches?",
      lang === "fr"
        ? "Conseils pour gérer le diabète"
        : "Diabetes management tips",
    ],
    [lang]
  );

  async function sendChat(message: string) {
    if (!message.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", text: message, id: crypto.randomUUID() },
    ]);
    setChatInput("");
    setChatLoading(true);
    try {
      const data = await apiChat(message, lang);
      setMessages((m) => [
        ...m,
        { role: "ai", text: data.response, id: crypto.randomUUID() },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg || "Chat failed");
    } finally {
      setChatLoading(false);
    }
  }

  // Analysis state
  const [imageLoading, setImageLoading] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleAnalyzeImage(file: File) {
    setImageLoading(true);
    setExtractedText(null);
    setAnalysis(null);
    try {
      const data = await apiAnalyzeImage(file, {
        language: lang,
        extract_text_only: false,
      });
      setExtractedText(data.extracted_text);
      setAnalysis(data.analysis);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg || "Image analysis failed");
    } finally {
      setImageLoading(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      if (!f.type.startsWith("image/")) {
        toast.error(
          lang === "fr"
            ? "Le fichier doit être une image"
            : "File must be an image"
        );
        return;
      }
      void handleAnalyzeImage(f);
    }
  }

  // Research state
  const [query, setQuery] = useState("");
  const [researchLoading, setResearchLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [results, setResults] = useState<ResearchResult[]>([]);

  async function runResearch(q: string) {
    if (!q.trim()) return;
    setResearchLoading(true);
    setSummary(null);
    setResults([]);
    try {
      const data = await apiResearch(q, { max_results: 5, language: lang });
      setSummary(data.summary);
      setResults(data.results || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg || "Research failed");
    } finally {
      setResearchLoading(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success(lang === "fr" ? "Copié" : "Copied"),
      () => toast.error(lang === "fr" ? "Échec de la copie" : "Copy failed")
    );
  }

  return (
    <main className="min-h-dvh bg-white text-slate-900">
      <Toaster position="top-right" />

      {/* Top Disclaimer banner across all tabs */}
      <div
        className="w-full bg-slate-100 border-b border-slate-200 text-slate-700 text-sm flex items-center gap-2 px-4 py-2"
        role="note"
        aria-label="medical-disclaimer"
      >
        <AlertTriangle className="size-4 text-orange-500" aria-hidden="true" />
        <span className="font-bold">
          {lang === "fr"
            ? "À titre informatif uniquement - Consultez toujours des professionnels de santé"
            : "For informational purposes only - Always consult healthcare professionals"}
        </span>
      </div>

      {/* Header with Title and Tabs */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* <div className="size-9 rounded-md bg-blue-600" aria-hidden="true" /> */}
            <div>
              <div className="space-y-1">
                <h1
                  className={`${sora.className} text-xl bg-gradient-to-r from-blue-800 to-orange-500 bg-clip-text text-transparent drop-shadow-sm`}
                >
                  MediCare AI
                </h1>
              </div>
              <p className="text-xs text-slate-500">
                {lang === "fr"
                  ? "Cameroun · LangChain + Gemini"
                  : "Cameroon · LangChain + Gemini"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <nav
            className="hidden md:flex gap-6 relative"
            role="tablist"
            aria-label="primary-tabs"
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={active === t.key}
                aria-controls={`panel-${t.key}`}
                className={classNames(
                  nunito.className,
                  "pb-2 text-sm font-medium",
                  active === t.key
                    ? "text-blue-800"
                    : "text-slate-500 hover:text-slate-700"
                )}
                onClick={() => setActive(t.key)}
              >
                {t.label}
                {active === t.key && (
                  <motion.div
                    layoutId="tab-underline"
                    className="h-0.5 bg-blue-600 rounded-full"
                    style={{ position: "relative", top: 8 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden border-t border-slate-200">
          <div className="flex" role="tablist" aria-label="primary-tabs-mobile">
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={active === t.key}
                aria-controls={`panel-${t.key}`}
                className={classNames(
                  nunito.className,
                  "flex-1 py-3 text-sm font-medium",
                  active === t.key
                    ? "text-blue-800 border-b-2 border-blue-600"
                    : "text-slate-600"
                )}
                onClick={() => setActive(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        {active === "welcome" && (
          <motion.div
            id="panel-welcome"
            role="tabpanel"
            aria-labelledby="welcome"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            <div className="rounded-xl p-8 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                {lang === "fr"
                  ? "Votre Assistant Médical Personnel et Coach de Santé"
                  : "Your Personal Medical Assistant & Health Coach"}
              </h2>
              <p className="text-white/90 max-w-2xl">
                {lang === "fr"
                  ? "Analysez les textes et images cliniques, discutez avec l'IA, et explorez des recherches médicales."
                  : "Analyze clinical text and images, chat with AI, and explore medical research."}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setActive("chat")}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-md text-white font-medium"
                >
                  {lang === "fr" ? "Commencer" : "Get Started"}
                </button>
                <a
                  href="https://seed-medicare-ai-assistant.onrender.com/docs"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-md text-white font-medium"
                >
                  API Docs
                </a>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {(lang === "fr"
                ? ["Discussion", "Analyse", "Recherche"]
                : ["Chat", "Analysis", "Research"]
              ).map((title, i) => (
                <div
                  key={title}
                  className="rounded-lg border border-slate-200 p-4 bg-white"
                >
                  <h3 className="font-semibold text-blue-800 mb-2">{title}</h3>
                  <p className="text-sm text-slate-600">
                    {i === 0
                      ? lang === "fr"
                        ? "Posez des questions médicales en anglais ou en français."
                        : "Ask medical questions in English or French."
                      : i === 1
                        ? lang === "fr"
                          ? "Téléversez une image médicale pour extraire le texte et obtenir une analyse structurée."
                          : "Upload a medical image to extract text and get structured analysis."
                        : lang === "fr"
                          ? "Recherchez des sources fiables (OMS, CDC, PubMed) et recevez un résumé."
                          : "Search reliable sources (WHO, CDC, PubMed) and get a summary."}
                  </p>
                </div>
              ))}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                WHO
              </span>
              <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                CDC
              </span>
              <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                PubMed
              </span>
            </div>
          </motion.div>
        )}

        {active === "chat" && (
          <motion.div
            id="panel-chat"
            role="tabpanel"
            aria-labelledby="chat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-rows-[1fr_auto] h-[calc(100dvh-180px)] gap-3"
          >
            {/* Messages */}
            <div className="overflow-y-auto rounded-lg border border-slate-200 p-4 bg-white space-y-3">
              {messages.length === 0 && !chatLoading && (
                <p className="text-slate-500 text-sm">
                  {lang === "fr"
                    ? "Commencez la conversation en sélectionnant une suggestion ou en saisissant un message."
                    : "Start chatting by selecting a suggestion or typing a message."}
                </p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={classNames(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm flex items.start gap-2",
                    m.role === "user"
                      ? "ml-auto bg-orange-500 text-white"
                      : "mr-auto bg-blue-600 text-white"
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <button
                    className="opacity-80 hover:opacity-100"
                    onClick={() => copy(m.text)}
                    aria-label={
                      lang === "fr" ? "Copier le message" : "Copy message"
                    }
                    title={lang === "fr" ? "Copier" : "Copy"}
                  >
                    <Copy className="size-4" />
                  </button>
                </div>
              ))}
              {chatLoading && <ChatBubbleSkeleton role="ai" />}
            </div>

            {/* Input + suggestions */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {chatSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendChat(s)}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="chat-input" className="sr-only">
                  {lang === "fr" ? "Message" : "Message"}
                </label>
                <input
                  id="chat-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendChat(chatInput);
                    }
                  }}
                  placeholder={
                    lang === "fr" ? "Écrire un message..." : "Type a message..."
                  }
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  aria-label={
                    lang === "fr" ? "Entrer un message" : "Enter a message"
                  }
                />
                <button
                  onClick={() => sendChat(chatInput)}
                  disabled={chatLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Send className="size-4" />
                  {lang === "fr" ? "Envoyer" : "Send"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {active === "analysis" && (
          <motion.div
            id="panel-analysis"
            role="tabpanel"
            aria-labelledby="analysis"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Upload / Camera */}
            <div className="grid md:grid-cols-2 gap-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 p-6 text-center"
                aria-label={
                  lang === "fr" ? "Zone de dépôt d'image" : "Image dropzone"
                }
              >
                <Upload
                  className="size-6 inline-block text-slate-600 mb-2"
                  aria-hidden="true"
                />
                <p className="font-medium text-slate-800">
                  {lang === "fr"
                    ? "Glissez-déposez une image"
                    : "Drag & drop an image"}
                </p>
                <p className="text-xs text-slate-500">
                  {lang === "fr" ? "ou" : "or"}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  {lang === "fr" ? "Téléverser" : "Upload"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (!f.type.startsWith("image/")) {
                        toast.error(
                          lang === "fr"
                            ? "Le fichier doit être une image"
                            : "File must be an image"
                        );
                        return;
                      }
                      void handleAnalyzeImage(f);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>

              <div className="rounded-lg border border-slate-200 p-6 bg-white text-center">
                <Camera
                  className="size-6 inline-block text-slate-600 mb-2"
                  aria-hidden="true"
                />
                <p className="font-medium text-slate-800">
                  {lang === "fr" ? "Prendre une photo" : "Capture from camera"}
                </p>
                <p className="text-xs text-slate-500">
                  {lang === "fr"
                    ? "Utilisez l'appareil photo pour capturer une image médicale"
                    : "Use camera to capture a medical image"}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  id="camera-input"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (!f.type.startsWith("image/")) {
                        toast.error(
                          lang === "fr"
                            ? "Le fichier doit être une image"
                            : "File must be an image"
                        );
                        return;
                      }
                      void handleAnalyzeImage(f);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <label
                  htmlFor="camera-input"
                  className="mt-2 inline-block px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
                >
                  {lang === "fr" ? "Ouvrir la caméra" : "Open Camera"}
                </label>
              </div>
            </div>

            {imageLoading && (
              <div className="space-y-3">
                <CardSkeleton title widthTitle="w-40" lines={3} />
                <CardSkeleton title widthTitle="w-56" lines={5} />
              </div>
            )}

            {extractedText && (
              <div className="rounded-lg border border-slate-200 p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-blue-800">
                    {lang === "fr" ? "Texte extrait" : "Extracted Text"}
                  </h3>
                  <button
                    onClick={() => copy(extractedText)}
                    className="text-slate-600 hover:text-slate-800"
                    aria-label={lang === "fr" ? "Copier le texte" : "Copy text"}
                  >
                    <Copy className="size-4" />
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {extractedText}
                </p>
              </div>
            )}

            {analysis && (
              <div className="space-y-3">
                <Accordion
                  title={lang === "fr" ? "Résumé" : "Summary"}
                  content={
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {analysis.summary}
                    </p>
                  }
                />
                <Accordion
                  title={lang === "fr" ? "Points clés" : "Key Findings"}
                  content={
                    <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                      {analysis.key_findings.map((k, i) => (
                        <li key={i}>{k}</li>
                      ))}
                    </ul>
                  }
                />
                <Accordion
                  title={lang === "fr" ? "Recommandations" : "Recommendations"}
                  content={
                    <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                      {analysis.recommendations.map((k, i) => (
                        <li key={i}>{k}</li>
                      ))}
                    </ul>
                  }
                />
                <Accordion
                  title={lang === "fr" ? "Prochaines étapes" : "Next Steps"}
                  content={
                    <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                      {analysis.next_steps.map((k, i) => (
                        <li key={i}>{k}</li>
                      ))}
                    </ul>
                  }
                />
                <p className="text-xs text-slate-500">{analysis.disclaimer}</p>
              </div>
            )}
          </motion.div>
        )}

        {active === "research" && (
          <motion.div
            id="panel-research"
            role="tabpanel"
            aria-labelledby="research"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search
                  className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <label htmlFor="research-input" className="sr-only">
                  {lang === "fr" ? "Rechercher" : "Search"}
                </label>
                <input
                  id="research-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void runResearch(query);
                  }}
                  placeholder={
                    lang === "fr"
                      ? "Rechercher un sujet médical"
                      : "Search a medical topic"
                  }
                  className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  aria-label={
                    lang === "fr" ? "Rechercher un sujet" : "Search a topic"
                  }
                />
              </div>
              <button
                onClick={() => runResearch(query)}
                disabled={researchLoading}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {lang === "fr" ? "Rechercher" : "Search"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(lang === "fr"
                ? [
                    "Recommandations diabète",
                    "Traitement hypertension",
                    "Prévention du paludisme",
                  ]
                : [
                    "Diabetes guidelines",
                    "Hypertension treatment",
                    "Malaria prevention",
                  ]
              ).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s);
                    void runResearch(s);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  {s}
                </button>
              ))}
            </div>

            {researchLoading && (
              <div className="space-y-3">
                <CardSkeleton title widthTitle="w-28" lines={3} color="blue" />
                <div className="grid md:grid-cols-2 gap-4">
                  <CardSkeleton title widthTitle="w-48" lines={5} />
                  <CardSkeleton title widthTitle="w-56" lines={5} />
                </div>
              </div>
            )}

            {summary && (
              <div className="rounded-lg border border-blue-200 p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-blue-800">
                    {lang === "fr" ? "Résumé IA" : "AI Summary"}
                  </h3>
                  <button
                    onClick={() => copy(summary)}
                    className="text-blue-700 hover:text-blue-900"
                    aria-label={
                      lang === "fr" ? "Copier le résumé" : "Copy summary"
                    }
                  >
                    <Copy className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-blue-900 whitespace-pre-wrap">
                  {summary}
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {results.map((r, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 p-4 bg-white space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-semibold text-blue-800 hover:underline"
                    >
                      {r.title}
                    </a>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {getSourceBadge(r.url)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-5 whitespace-pre-wrap">
                    {r.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Score: {r.score.toFixed(2)}</span>
                    <button
                      onClick={() =>
                        copy(`${r.title}\n${r.url}\n\n${r.content}`)
                      }
                      className="text-slate-600 hover:text-slate-800"
                      aria-label={
                        lang === "fr" ? "Copier le résultat" : "Copy result"
                      }
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} abimmost ·{" "}
          {lang === "fr" ? "Tous droits réservés" : "All rights reserved"}
        </div>
      </footer>

      {/* Floating language toggle */}
      <button
        onClick={() => setLang((l) => (l === "en" ? "fr" : "en"))}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-lg bg-white border border-slate-200 hover:bg-slate-50"
        title={lang === "fr" ? "Basculer la langue" : "Toggle language"}
        aria-label={lang === "fr" ? "Basculer la langue" : "Toggle language"}
      >
        <Languages className="size-4 text-slate-700" />
        <span className="text-sm font-medium">
          {lang === "fr" ? "Français 🇫🇷" : "English 🇬🇧"}
        </span>
      </button>
    </main>
  );
}

function Accordion({
  title,
  content,
}: {
  title: string;
  content: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="font-medium text-slate-800">{title}</span>
        {open ? (
          <ChevronUp className="size-4 text-slate-600" />
        ) : (
          <ChevronDown className="size-4 text-slate-600" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{content}</div>}
    </div>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={classNames(
        "h-3 rounded bg-slate-200 animate-pulse",
        className
      )}
    />
  );
}

function CardSkeleton({
  title,
  widthTitle = "w-32",
  lines = 4,
  color,
}: {
  title?: boolean;
  widthTitle?: string;
  lines?: number;
  color?: "blue" | "default";
}) {
  return (
    <div
      className={classNames(
        "rounded-lg border p-4",
        color === "blue"
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-white"
      )}
    >
      {title && <SkeletonLine className={classNames("mb-3", widthTitle)} />}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            key={i}
            className={
              i % 3 === 0 ? "w-11/12" : i % 3 === 1 ? "w-4/5" : "w-9/12"
            }
          />
        ))}
      </div>
    </div>
  );
}

function ChatBubbleSkeleton({ role }: { role: "user" | "ai" }) {
  return (
    <div
      className={classNames(
        "max-w-[85%] rounded-lg px-3 py-2 text-sm flex items-start gap-2",
        role === "user" ? "ml-auto bg-orange-500/60" : "mr-auto bg-blue-600/60"
      )}
    >
      <SkeletonLine className="w-10/12 bg-white/60" />
      <SkeletonLine className="w-3/12 bg-white/60" />
    </div>
  );
}
