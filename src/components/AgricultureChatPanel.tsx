import type { Language } from "../translations";
import { translations } from "../translations";
import {
  ChatComposer,
  ChatHeader,
  Conversation,
  WelcomeContent,
  type WidgetMessage,
} from "./AgricultureChatWidget";

interface AgricultureChatPanelProps {
  minimized: boolean;
  messages: WidgetMessage[];
  isTyping: boolean;
  lang: Language;
  onToggleLang: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onSend: (question: string) => void;
  onStop?: () => void;
  onOpenKnowledgeBase?: () => void;
}

export default function AgricultureChatPanel({
  minimized,
  messages,
  isTyping,
  lang,
  onToggleLang,
  onClose,
  onMinimize,
  onSend,
  onStop,
  onOpenKnowledgeBase,
}: AgricultureChatPanelProps) {
  const t = translations[lang];

  return (
    <section
      className={`cgai-panel ${minimized ? "cgai-panel-minimized" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-label={t.chatTitle}
    >
      <ChatHeader
        minimized={minimized}
        lang={lang}
        onToggleLang={onToggleLang}
        onClose={onClose}
        onMinimize={onMinimize}
        onOpenKnowledgeBase={onOpenKnowledgeBase}
      />
      {!minimized && (
        <>
          <main className="cgai-body">
            {messages.length === 0 ? (
              <WelcomeContent lang={lang} onSuggestion={onSend} />
            ) : (
              <Conversation
                messages={messages}
                isTyping={isTyping}
                lang={lang}
                onStop={onStop}
              />
            )}
          </main>
          <ChatComposer
            onSend={onSend}
            onStop={onStop}
            isTyping={isTyping}
            disabled={false}
            lang={lang}
          />
        </>
      )}
    </section>
  );
}
