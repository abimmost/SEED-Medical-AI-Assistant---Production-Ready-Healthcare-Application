// Centralized API client for MediCare AI frontend
// Uses NEXT_PUBLIC_API_BASE_URL and provides typed helpers for all endpoints.

const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://seed-medicare-ai-assistant.onrender.com";

export type Language = "en" | "fr";

export type ChatResponse = {
  response: string;
  language: string;
  timestamp: string;
};

export type AnalysisResponse = {
  summary: string;
  key_findings: string[];
  recommendations: string[];
  next_steps: string[];
  disclaimer: string;
  language: string;
  timestamp: string;
};

export type ImageAnalysisResponse = {
  extracted_text: string;
  analysis: AnalysisResponse;
};

export type ExtractTextResponse = {
  extracted_text: string;
  timestamp: string;
};

export type ResearchResult = {
  title: string;
  url: string;
  content: string;
  score: number;
};

export type ResearchResponse = {
  query: string;
  results: ResearchResult[];
  summary: string;
  timestamp: string;
};

function getStringField(obj: unknown, key: string): string | undefined {
  if (typeof obj !== "object" || obj === null) return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "string" ? v : undefined;
}

async function handleJSON<T>(res: Response): Promise<T> {
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok) {
    const msg =
      getStringField(payload, "detail") ??
      getStringField(payload, "message") ??
      res.statusText ??
      "Request failed";
    throw new Error(msg);
  }
  return payload as T;
}

function withTimeout<T>(p: Promise<T>, ms = 60000): Promise<T> {
  // Note: We do not pass AbortController.signal to fetch here; this is a soft timeout wrapper.
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return new Promise<T>((resolve, reject) => {
    p.then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(t));
  });
}

export async function chat(
  message: string,
  language: Language = "en"
): Promise<ChatResponse> {
  const res = await withTimeout(
    fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, language }),
    })
  );
  return handleJSON<ChatResponse>(res);
}

export async function analyzeText(
  text: string,
  opts: { context?: string; language?: Language } = {}
): Promise<AnalysisResponse> {
  const { context = "", language = "en" } = opts;
  const res = await withTimeout(
    fetch(`${BASE}/api/analyze-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, context, language }),
    })
  );
  return handleJSON<AnalysisResponse>(res);
}

export async function analyzeImage(
  file: File,
  opts: { language?: Language; extract_text_only?: boolean } = {}
): Promise<ImageAnalysisResponse> {
  const { language = "en", extract_text_only = false } = opts;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("language", language);
  fd.append("extract_text_only", String(extract_text_only));
  const res = await withTimeout(
    fetch(`${BASE}/api/analyze-image`, { method: "POST", body: fd })
  );
  return handleJSON<ImageAnalysisResponse>(res);
}

export async function extractText(file: File): Promise<ExtractTextResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await withTimeout(
    fetch(`${BASE}/api/extract-text`, { method: "POST", body: fd })
  );
  return handleJSON<ExtractTextResponse>(res);
}

export async function research(
  query: string,
  opts: { max_results?: number; language?: Language } = {}
): Promise<ResearchResponse> {
  const { max_results = 5, language = "en" } = opts;
  const res = await withTimeout(
    fetch(`${BASE}/api/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, max_results, language }),
    })
  );
  return handleJSON<ResearchResponse>(res);
}
