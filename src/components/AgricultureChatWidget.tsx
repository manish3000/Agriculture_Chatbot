import {
  BookOpen,
  ChevronDown,
  Database,
  ExternalLink,
  FileText,
  Landmark,
  Leaf,
  Mic,
  Minimize2,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Sprout,
  Square,
  X,
} from "lucide-react";
import BilingualTranslateIcon from "./BilingualTranslateIcon";
import {
  FormEvent,
  KeyboardEvent,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import mascot from "../assets/friendly-wheat-mascot.png";
import type { Language } from "../translations";
import { translations } from "../translations";
import {
  FALLBACK_ANSWER_EN,
  FALLBACK_ANSWER_HI,
  findAnswer,
  isDevanagari,
} from "./qaKnowledgeBase";
import "./AgricultureChatWidget.css";

const ChatPanel = lazy(() => import("./AgricultureChatPanel"));

export function formatDeliveryTime(date: Date = new Date()): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export interface WidgetMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  time?: string;                  // e.g. "02:46 PM"
  detectedLang?: string;          // "hi" | "hinglish" | "en"
  domainLabel?: string;           // e.g. "🌾 Fasal Salah"
  sources?: Array<{
    title: string;
    department: string;
    url?: string;
  }>;
  source?: {
    title: string;
    department: string;
    url?: string;
  };
  retrievalMethod?: string;       // "hybrid" | "bm25_only" | "rule_based"
  usedOllama?: boolean;
  guardrailTriggered?: boolean;
}

export const agricultureSuggestionsEn = [
  {
    label: "Crop guidance",
    icon: Sprout,
    question: "Crop guidance",
  },
  {
    label: "Government schemes",
    icon: Landmark,
    question: "Government schemes",
  },
  {
    label: "Crop insurance",
    icon: ShieldCheck,
    question: "Crop insurance",
  },
  {
    label: "Farmer helpline",
    icon: Phone,
    question: "Farmer helpline",
  },
];

export const agricultureSuggestionsHi = [
  {
    label: "फसल मार्गदर्शन",
    icon: Sprout,
    question: "फसल मार्गदर्शन",
  },
  {
    label: "सरकारी योजनाएं",
    icon: Landmark,
    question: "सरकारी योजनाएं",
  },
  {
    label: "फसल बीमा",
    icon: ShieldCheck,
    question: "फसल बीमा",
  },
  {
    label: "किसान हेल्पलाइन",
    icon: Phone,
    question: "किसान हेल्पलाइन",
  },
];

export interface AgricultureChatWidgetProps {
  lang?: Language;
  onToggleLang?: () => void;
  onOpenKnowledgeBase?: () => void;
}

export default function AgricultureChatWidget({
  lang: controlledLang,
  onToggleLang: controlledToggleLang,
  onOpenKnowledgeBase,
}: AgricultureChatWidgetProps = {}) {
  const [internalLang, setInternalLang] = useState<Language>("en");
  const lang = controlledLang ?? internalLang;
  const toggleLang =
    controlledToggleLang ??
    (() => setInternalLang((prev) => (prev === "en" ? "hi" : "en")));

  const t = translations[lang];

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const scrollPosition = useRef(0);
  const nextMessageId = useRef(1);
  const typingTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopAll = (resetTyping = true) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (resetTyping) {
      setIsTyping(false);
    }
  };

  const handleStop = () => {
    if (!isTyping) return;
    stopAll(true);
    setMessages((current) => [
      ...current,
      {
        id: nextMessageId.current++,
        role: "assistant",
        text: t.chatGenerationStopped,
        time: formatDeliveryTime(),
        detectedLang: lang,
      },
    ]);
  };

  const openWidget = () => {
    scrollPosition.current = window.scrollY;
    setOpen(true);
    setMinimized(false);
  };

  const closeWidget = () => {
    stopAll(true);
    setOpen(false);
    setMinimized(false);
    requestAnimationFrame(() =>
      window.scrollTo({ top: scrollPosition.current, behavior: "instant" }),
    );
  };

  useEffect(() => {
    return () => {
      stopAll(true);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const media = window.matchMedia("(max-width: 768px)");
    const updateScrollLock = () => {
      document.documentElement.classList.toggle(
        "cgai-mobile-chat-open",
        media.matches,
      );
    };

    updateScrollLock();
    media.addEventListener("change", updateScrollLock);
    return () => {
      media.removeEventListener("change", updateScrollLock);
      document.documentElement.classList.remove("cgai-mobile-chat-open");
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeWidget();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const sendMessage = async (question: string) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;

    // Cleanly cancel previous in-flight generation if user is asking a follow-up
    stopAll(false);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessage: WidgetMessage = {
      id: nextMessageId.current++,
      role: "user",
      text: cleanQuestion,
      time: formatDeliveryTime(),
    };

    setMessages((current) => [...current, userMessage]);
    setIsTyping(true);

    // Try backend RAG API first
    try {
      const { sendQueryApi } = await import("../services/apiClient");
      const response = await sendQueryApi(
        cleanQuestion,
        lang,
        undefined,
        controller.signal,
      );

      if (controller.signal.aborted) {
        return;
      }

      // Handle rate limit error
      if (!response.success && response.retryAfter) {
        const errText =
          lang === "hi" && response.messageHi
            ? response.messageHi
            : response.message ||
              `Rate limit reached. Try again in ${response.retryAfter}s.`;
        setMessages((current) => [
          ...current,
          {
            id: nextMessageId.current++,
            role: "assistant",
            text: errText,
            time: formatDeliveryTime(),
          },
        ]);
        setIsTyping(false);
        return;
      }

      if (response.success && response.answer) {
        if (controller.signal.aborted) return;
        // Extract sources from RAG response
        const sources = (response as any).sources as Array<{
          title: string;
          department: string;
          url?: string;
        }> | undefined;

        setMessages((current) => [
          ...current,
          {
            id: nextMessageId.current++,
            role: "assistant",
            text: response.answer,
            time: formatDeliveryTime(),
            detectedLang: (response as any).detectedLang,
            domainLabel: (response as any).domainLabel,
            sources: sources?.length ? sources : undefined,
            source: response.source as { title: string; department: string; url?: string } | undefined,
            retrievalMethod: (response as any).retrieval?.method,
            usedOllama: (response as any).retrieval?.usedOllama,
            guardrailTriggered: (response as any).guardrail?.triggered,
          },
        ]);
        setIsTyping(false);
        return;
      }
    } catch (apiErr: any) {
      if (apiErr?.name === "AbortError" || controller.signal.aborted) {
        // Cancelled by user — stop silently
        return;
      }
      // API unavailable — fall through to local rule-based
    }

    if (controller.signal.aborted) return;

    // Local fallback (offline / API error)
    typingTimerRef.current = window.setTimeout(() => {
      if (controller.signal.aborted) return;
      const match = findAnswer(cleanQuestion, lang);
      const fallback =
        lang === "hi" || isDevanagari(cleanQuestion)
          ? FALLBACK_ANSWER_HI
          : FALLBACK_ANSWER_EN;

      setMessages((current) => [
        ...current,
        {
          id: nextMessageId.current++,
          role: "assistant",
          text: match ? match.answer : fallback,
          time: formatDeliveryTime(),
          source: match?.source,
        },
      ]);
      setIsTyping(false);
    }, 380);
  };

  return (
    <div className="cgai-widget-root">
      {!open && (
        <div className="cgai-launcher-wrap">
          <button
            onClick={openWidget}
            className="cgai-launcher"
            aria-label={`${t.chatTitle} - ${lang === "hi" ? "चैट शुरू करें" : "Open chat"}`}
          >
            <img src={mascot} alt={t.chatLauncherAlt} />
          </button>
        </div>
      )}

      {open && (
        <Suspense fallback={null}>
          <ChatPanel
            minimized={minimized}
            messages={messages}
            isTyping={isTyping}
            lang={lang}
            onToggleLang={toggleLang}
            onClose={closeWidget}
            onMinimize={() => setMinimized((current) => !current)}
            onSend={sendMessage}
            onStop={handleStop}
            onOpenKnowledgeBase={onOpenKnowledgeBase}
          />
        </Suspense>
      )}
    </div>
  );
}

export function ChatHeader({
  minimized,
  lang,
  onToggleLang,
  onClose,
  onMinimize,
  onOpenKnowledgeBase,
}: {
  minimized: boolean;
  lang: Language;
  onToggleLang: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onOpenKnowledgeBase?: () => void;
}) {
  const t = translations[lang];

  return (
    <header className="cgai-header">
      <div className="cgai-header-avatar">
        <img src={mascot} alt="" />
        <span />
      </div>
      <div className="cgai-header-copy">
        <strong>{t.chatTitle}</strong>
        <span>{t.chatSubtitle}</span>
      </div>
      <div className="cgai-header-actions">
        {onOpenKnowledgeBase && (
          <button
            type="button"
            onClick={onOpenKnowledgeBase}
            className="cgai-minimize"
            aria-label="Government Knowledge Base"
            title={lang === "hi" ? "सरकारी ज्ञान आधार एवं इनजेशन" : "Government Knowledge Base & Ingestion"}
          >
            <Database size={15} />
          </button>
        )}
        <button
          type="button"
          onClick={onToggleLang}
          className="cgai-lang-toggle"
          aria-label={t.langSwitchLabel}
          title={t.langSwitchLabel}
        >
          <BilingualTranslateIcon size={16} />
          <span>{lang === "en" ? "हिन्दी" : "English"}</span>
        </button>
        <button
          onClick={onMinimize}
          aria-label={minimized ? t.chatRestoreAria : t.chatMinimizeAria}
          className="cgai-minimize"
        >
          <Minimize2 />
        </button>
        <button onClick={onClose} aria-label={t.chatCloseAria}>
          <X />
          <span>{lang === "hi" ? "बंद करें" : "Close"}</span>
        </button>
      </div>
    </header>
  );
}

export function WelcomeContent({
  lang,
  onSuggestion,
}: {
  lang: Language;
  onSuggestion: (question: string) => void;
}) {
  const t = translations[lang];
  const suggestions =
    lang === "hi" ? agricultureSuggestionsHi : agricultureSuggestionsEn;

  return (
    <section className="cgai-welcome">
      <div className="cgai-welcome-icon">
        <img src={mascot} alt={t.chatLauncherAlt} />
      </div>
      <span className="cgai-official-badge">
        <ShieldCheck /> {t.chatOfficialBadge}
      </span>
      <h2>{t.chatGreeting}</h2>
      <p>{t.chatWelcomeDesc}</p>
      <div className="cgai-capabilities">
        <span>
          <Leaf /> {t.chatCap1}
        </span>
        <span>
          <FileText /> {t.chatCap2}
        </span>
        <span>
          <BookOpen /> {t.chatCap3}
        </span>
      </div>
      <div className="cgai-suggestion-heading">
        <strong>{t.chatHelpQuestion}</strong>
        <span>{t.chatHelpSub}</span>
      </div>
      <div className="cgai-suggestions">
        {suggestions.map(({ label, icon: Icon, question }) => (
          <button key={label} onClick={() => onSuggestion(question)}>
            <span>
              <Icon />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function Conversation({
  messages,
  isTyping,
  lang,
  onStop,
}: {
  messages: WidgetMessage[];
  isTyping: boolean;
  lang: Language;
  onStop?: () => void;
}) {
  const t = translations[lang];
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Language badge display
  const getLangBadge = (detectedLang?: string) => {
    if (!detectedLang) return null;
    const badges: Record<string, string> = {
      hi: "🇮🇳 हिंदी",
      hinglish: "🌐 Hinglish",
      en: "🔤 English",
    };
    return badges[detectedLang] || null;
  };

  return (
    <div className="cgai-conversation" aria-live="polite">
      <div className="cgai-conversation-intro">
        <img src={mascot} alt="" />
        <div>
          <strong>{t.chatIntroTitle}</strong>
          <span>{t.chatIntroSub}</span>
        </div>
      </div>
      {messages.map((message) => (
        <div
          className={`cgai-message cgai-message-${message.role}`}
          key={message.id}
        >
          {message.role === "assistant" && (
            <img className="cgai-message-avatar" src={mascot} alt="" />
          )}
          <div>
            {/* Domain category badge */}
            {message.domainLabel && (
              <div className="cgai-domain-badge">
                <span>{message.domainLabel}</span>
                {message.usedOllama && (
                  <span className="cgai-rag-badge">✨ AI</span>
                )}
              </div>
            )}

            <p>{message.text}</p>

            {/* Multi-source citations from RAG */}
            {message.sources && message.sources.length > 0 && (
              <details className="cgai-source">
                <summary>
                  <ShieldCheck />
                  {t.chatSourceVerified}
                  <ChevronDown />
                </summary>
                <div className="cgai-sources-list">
                  {message.sources.map((src, i) => (
                    <div key={i} className="cgai-source-item">
                      <strong>{src.title}</strong>
                      <span>{src.department}</span>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t.chatSourcePortal} <ExternalLink />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Legacy single source fallback */}
            {!message.sources && message.source && (
              <details className="cgai-source">
                <summary>
                  <ShieldCheck />
                  {t.chatSourceVerified}
                  <ChevronDown />
                </summary>
                <div>
                  <strong>{message.source.title}</strong>
                  <span>{message.source.department}</span>
                  {message.source.url && (
                    <a
                      href={message.source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t.chatSourcePortal} <ExternalLink />
                    </a>
                  )}
                </div>
              </details>
            )}

            {/* Language & retrieval info */}
            <div className="cgai-message-meta">
              <time>{message.time || formatDeliveryTime()}</time>
              {getLangBadge(message.detectedLang) && (
                <span className="cgai-lang-badge">
                  {getLangBadge(message.detectedLang)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      {isTyping && (
        <div className="cgai-typing" role="status">
          <img src={mascot} alt="" />
          <div>
            <span />
            <span />
            <span />
          </div>
          <small>{t.chatTyping}</small>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

export function ChatComposer({
  onSend,
  onStop,
  isTyping = false,
  disabled = false,
  lang,
}: {
  onSend: (question: string) => void;
  onStop?: () => void;
  isTyping?: boolean;
  disabled?: boolean;
  lang: Language;
}) {
  const t = translations[lang];
  const [input, setInput] = useState("");

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (isTyping && !input.trim()) {
      onStop?.();
      return;
    }
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const isStopAction = isTyping && !input.trim();

  return (
    <footer className="cgai-composer-area">
      <form className="cgai-composer" onSubmit={submit}>
        <textarea
          rows={1}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            isTyping
              ? lang === "hi"
                ? "अगला प्रश्न लिखें…"
                : "Type your follow-up question…"
              : t.chatPlaceholder
          }
          aria-label={t.chatAriaInput}
          disabled={disabled}
        />
        <button
          type="button"
          aria-label={t.chatVoiceAria}
          disabled={disabled || isTyping}
        >
          <Mic />
        </button>

        <button
          type={isStopAction ? "button" : "submit"}
          className={`cgai-send ${isStopAction ? "cgai-send-stop" : ""}`}
          onClick={isStopAction ? onStop : undefined}
          disabled={!isTyping && !input.trim()}
          aria-label={isStopAction ? t.chatStopGeneration : t.chatSendAria}
          title={isStopAction ? t.chatStopGeneration : t.chatSendAria}
        >
          {isStopAction ? (
            <Square style={{ width: 12, height: 12, fill: "white", color: "white" }} />
          ) : (
            <Send style={{ width: 14, height: 14, color: "white" }} />
          )}
        </button>
      </form>
      <p>
        <Sparkles />
        {t.chatDisclaimer}
      </p>
    </footer>
  );
}
