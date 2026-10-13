import React, { useState, useEffect } from "react";
import {
  Database,
  RefreshCw,
  FileText,
  Globe,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Layers,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  X,
  Loader2,
  BookOpen,
  Building2,
} from "lucide-react";

interface IngestionProgress {
  stage: string;
  progressPercent: number;
  message: string;
  totalChunks?: number;
  chunksProcessed?: number;
}

interface IngestionStats {
  totalChunks: number;
  domains: Record<string, number>;
  embeddingDimensions: number;
  lastUpdated: string;
  fileSizeKB: number;
  sources: Array<{ title: string; url: string; count: number }>;
}

interface IngestionStatusResponse {
  running: boolean;
  progress: IngestionProgress;
  lastResult: any;
  stats: IngestionStats;
}

interface ChunkItem {
  id: string;
  title: string;
  url: string;
  domain: string;
  contextHeader: string;
  preview: string;
  charCount: number;
  addedAt: string;
}

interface KnowledgeIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: "en" | "hi";
}

export default function KnowledgeIngestionModal({
  isOpen,
  onClose,
  lang = "en",
}: KnowledgeIngestionModalProps) {
  const [status, setStatus] = useState<IngestionStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "sources" | "chunks" | "add">("overview");

  // Chunk inspection state
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [chunkFilter, setChunkFilter] = useState("");

  // Add source state
  const [addUrl, setAddUrl] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addDomain, setAddDomain] = useState("government_schemes");
  const [addMessage, setAddMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [addingSource, setAddingSource] = useState(false);

  // Fetch ingestion status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ingest/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch ingestion status:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chunks
  const fetchChunks = async () => {
    try {
      setLoadingChunks(true);
      const res = await fetch("/api/ingest/chunks?limit=50");
      if (res.ok) {
        const data = await res.json();
        setChunks(data.chunks || []);
      }
    } catch (err) {
      console.error("Failed to fetch chunks:", err);
    } finally {
      setLoadingChunks(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      if (activeTab === "chunks") {
        fetchChunks();
      }
    }
  }, [isOpen, activeTab]);

  // Polling when ingestion is running
  useEffect(() => {
    if (!isOpen || !status?.running) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, status?.running]);

  // Trigger full ingestion
  const handleTriggerIngestion = async () => {
    try {
      setTriggering(true);
      const res = await fetch("/api/ingest/run", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        // Polling will take over
        fetchStatus();
      } else {
        alert(data.message || "Failed to start ingestion");
      }
    } catch (err: any) {
      alert("Error starting ingestion: " + err.message);
    } finally {
      setTriggering(false);
    }
  };

  // Handle adding custom URL
  const handleAddCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUrl.trim()) return;

    try {
      setAddingSource(true);
      setAddMessage(null);
      const res = await fetch("/api/ingest/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: addUrl.trim(),
          title: addTitle.trim() || undefined,
          domain: addDomain,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAddMessage({
          type: "success",
          text: `Successfully ingested source! Added ${data.chunksAdded} chunks. Total in store: ${data.totalInStore}.`,
        });
        setAddUrl("");
        setAddTitle("");
        fetchStatus();
      } else {
        setAddMessage({
          type: "error",
          text: data.error || "Failed to ingest URL.",
        });
      }
    } catch (err: any) {
      setAddMessage({ type: "error", text: err.message || "Network error" });
    } finally {
      setAddingSource(false);
    }
  };

  if (!isOpen) return null;

  const totalChunks = status?.stats?.totalChunks ?? 0;
  const isRunning = status?.running ?? false;
  const progress = status?.progress;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-emerald-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-6 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <Database className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  {lang === "hi" ? "सरकारी ज्ञान आधार एवं इनजेशन पाइपलाइन" : "Government Knowledge Base & Ingestion"}
                </h2>
                <span className="text-xs bg-emerald-500/30 text-emerald-100 px-2.5 py-0.5 rounded-full font-medium border border-emerald-400/30">
                  Live Vector Store
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                {lang === "hi"
                  ? "pmkisan.gov.in, agriportal.cg.nic.in, nfsm.gov.in और आधिकारिक PDF से वास्तविक निष्कर्षण"
                  : "Verified knowledge extracted from pmkisan.gov.in, agriportal.cg.nic.in, nfsm.gov.in & official PDFs"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 px-6 gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-emerald-600 text-emerald-800 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            {lang === "hi" ? "अवलोकन एवं स्थिति" : "Overview & Pipeline"}
          </button>
          <button
            onClick={() => setActiveTab("sources")}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "sources"
                ? "border-emerald-600 text-emerald-800 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Globe className="w-4 h-4" />
            {lang === "hi" ? "सरकारी स्रोत (वेबसाइट और PDF)" : "Government Sources & PDFs"}
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
              {status?.stats?.sources?.length ?? 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("chunks")}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "chunks"
                ? "border-emerald-600 text-emerald-800 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            {lang === "hi" ? "वेक्टर चंक्स का निरीक्षण" : "Inspect Chunks"}
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.2 rounded-full">
              {totalChunks}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "add"
                ? "border-emerald-600 text-emerald-800 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Plus className="w-4 h-4" />
            {lang === "hi" ? "नया स्रोत जोड़ें" : "Add Source"}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW & PIPELINE */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Ingestion Control Card */}
              <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/60 rounded-xl p-5 border border-emerald-200/80 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-base">
                        {lang === "hi" ? "लाइव इनजेशन स्थिति" : "Live Pipeline Status"}
                      </span>
                      {isRunning ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {lang === "hi" ? "इनजेशन प्रगति पर है..." : "Extracting & Embedding..."}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {lang === "hi" ? "वेक्टर स्टोर तैयार" : "Vector Store Active"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 max-w-xl">
                      {isRunning
                        ? progress?.message || "Processing documents..."
                        : `${totalChunks} verified agriculture chunks indexed with 384-dimensional semantic embeddings ready for instant hybrid retrieval.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchStatus}
                      disabled={loading}
                      className="p-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400 text-xs font-medium transition-colors"
                      title="Refresh status"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>

                    <button
                      onClick={handleTriggerIngestion}
                      disabled={isRunning || triggering}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {lang === "hi" ? "प्रक्रिया जारी है..." : "Running Ingestion..."}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-emerald-200" />
                          {lang === "hi" ? "पूर्ण इनजेशन चलाएं" : "Run Ingestion Pipeline"}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress Bar when running */}
                {isRunning && progress && (
                  <div className="mt-4 pt-4 border-t border-emerald-200/60">
                    <div className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1.5">
                      <span>{progress.message}</span>
                      <span>{progress.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 rounded-full"
                        style={{ width: `${progress.progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* KPI Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-xs text-gray-500 font-medium">Total Chunks</div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">{totalChunks}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Deduplicated & indexed</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-xs text-gray-500 font-medium">Sources Indexed</div>
                  <div className="text-2xl font-bold text-teal-700 mt-1">
                    {status?.stats?.sources?.length ?? 0}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Portals & PDFs</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-xs text-gray-500 font-medium">Vector Dimensions</div>
                  <div className="text-2xl font-bold text-indigo-700 mt-1">384-D</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Dense semantic vectors</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-xs text-gray-500 font-medium">Store File Size</div>
                  <div className="text-2xl font-bold text-amber-700 mt-1">
                    {status?.stats?.fileSizeKB ? `${(status.stats.fileSizeKB / 1024).toFixed(1)} MB` : "0 MB"}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">vectorStore.json on disk</div>
                </div>
              </div>

              {/* Domain Breakdown */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Knowledge Domain Coverage
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {status?.stats?.domains &&
                    Object.entries(status.stats.domains).map(([domain, count]) => (
                      <div
                        key={domain}
                        className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between"
                      >
                        <span className="text-xs text-gray-700 font-medium capitalize">
                          {domain.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Extraction Pipeline Architecture */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-2">
                  Multi-Tier Extraction Architecture
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 mt-3">
                  <div className="bg-white p-3.5 rounded-lg border border-gray-200">
                    <div className="font-semibold text-emerald-800 mb-1 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> 1. Live Web Scraper
                    </div>
                    Targeted scraping with Cheerio of verified Indian government domains: PM-KISAN, CG Agriportal, NFSM, ICAR, and Soil Health.
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-gray-200">
                    <div className="font-semibold text-teal-800 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> 2. PDF Text Extractor
                    </div>
                    Downloads and parses official guidelines PDFs using pdf-parse v2: PM-KISAN FAQs, NFSNM FY 2025-26 (99 pages), CG Agri Vision.
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-gray-200">
                    <div className="font-semibold text-indigo-800 mb-1 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" /> 3. Hybrid Vector Search
                    </div>
                    Chunks documents with Anthropic contextual headers, generates 384-D dense embeddings, and combines with BM25 keyword matching.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOVERNMENT SOURCES & PDFS */}
          {activeTab === "sources" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  Official government sources currently indexed in the active vector store:
                </p>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {status?.stats?.sources?.length ?? 0} Verified Sources
                </span>
              </div>

              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                {status?.stats?.sources && status.stats.sources.length > 0 ? (
                  status.stats.sources.map((src, idx) => {
                    const isPdf = src.url.toLowerCase().endsWith(".pdf") || src.url.includes("\\pdfs\\");
                    return (
                      <div
                        key={idx}
                        className="p-4 hover:bg-gray-50/80 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2 rounded-lg mt-0.5 ${isPdf ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                            {isPdf ? <FileText className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {src.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 truncate max-w-md font-mono">
                                {src.url}
                              </span>
                              {src.url.startsWith("http") && (
                                <a
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-600 hover:text-emerald-800"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                            {src.count} chunks
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-sm text-gray-500">
                    No sources loaded yet. Click &quot;Run Ingestion Pipeline&quot; to extract data.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CHUNKS INSPECTOR */}
          {activeTab === "chunks" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={chunkFilter}
                    onChange={(e) => setChunkFilter(e.target.value)}
                    placeholder="Search in chunks (e.g., kisan, insurance, subsidy)..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  onClick={fetchChunks}
                  className="px-3 py-2 text-xs font-medium border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingChunks ? "animate-spin" : ""}`} />
                </button>
              </div>

              {loadingChunks ? (
                <div className="p-12 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  Loading chunks from vector store...
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {chunks
                    .filter(
                      (c) =>
                        !chunkFilter ||
                        c.title.toLowerCase().includes(chunkFilter.toLowerCase()) ||
                        c.preview.toLowerCase().includes(chunkFilter.toLowerCase()) ||
                        c.contextHeader.toLowerCase().includes(chunkFilter.toLowerCase())
                    )
                    .map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-xs hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span className="font-semibold text-emerald-800">{c.title}</span>
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] capitalize">
                            {c.domain.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 italic mb-1.5 font-medium">
                          {c.contextHeader}
                        </div>
                        <p className="text-xs text-gray-800 leading-relaxed font-sans bg-gray-50/60 p-2 rounded-lg border border-gray-100">
                          {c.preview}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2">
                          <span className="font-mono truncate max-w-xs">{c.url}</span>
                          <span>{c.charCount} characters</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ADD SOURCE */}
          {activeTab === "add" && (
            <div className="max-w-xl mx-auto space-y-5 py-2">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {lang === "hi" ? "नया कृषि वेब पेज या PDF इनजेस्ट करें" : "Ingest New Agriculture Web Page or PDF"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Enter an official portal URL or PDF document link to immediately extract its text and index into the vector store.
                </p>
              </div>

              {addMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                    addMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {addMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{addMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleAddCustomUrl} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Source URL (Web Page or .pdf) *
                  </label>
                  <input
                    type="url"
                    required
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    placeholder="https://pmkisan.gov.in/Documents/... or https://..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Display Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    placeholder="e.g. PM-KISAN 23rd Installment Operational Circular"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Domain Category
                  </label>
                  <select
                    value={addDomain}
                    onChange={(e) => setAddDomain(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="government_schemes">Government Schemes (PM-KISAN, NFSM, RKVY)</option>
                    <option value="crop_insurance">Crop Insurance (PMFBY)</option>
                    <option value="crop_practices">Crop Practices & Advisories</option>
                    <option value="soil_and_fertilizer">Soil Health & Fertilizer</option>
                    <option value="market_and_msp">Market Prices & MSP (e-NAM)</option>
                    <option value="helpline_and_emergency">Helplines & Support</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={addingSource}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {addingSource ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading & Vectorizing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Extract & Add to Knowledge Base
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hybrid Cosine Vector Retrieval Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            {lang === "hi" ? "बंद करें" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
