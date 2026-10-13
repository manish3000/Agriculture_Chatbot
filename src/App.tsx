import { useEffect, useState } from "react";
import {
  Accessibility,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Database,
  FileCheck2,
  FileText,
  Flower2,
  Landmark,
  Leaf,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  Sprout,
  Tractor,
  UserRound,
  Wheat,
  X,
} from "lucide-react";
import BilingualTranslateIcon from "./components/BilingualTranslateIcon";
import AgricultureChatWidget from "./components/AgricultureChatWidget";
import KnowledgeIngestionModal from "./components/KnowledgeIngestionModal";
import type { Language } from "./translations";
import { translations } from "./translations";

const heroImage =
  "https://images.unsplash.com/photo-1528693404014-b13ebe6e723e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1800";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState<Language>("en");
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [chunkCount, setChunkCount] = useState<number>(422);

  const toggleLang = () => {
    setLang((prev) => (prev === "en" ? "hi" : "en"));
  };

  const t = translations[lang];

  useEffect(() => {
    fetch("/api/rag/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.vectorStoreChunks) {
          setChunkCount(data.vectorStoreChunks);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.title =
      lang === "hi"
        ? "कृषि AI सहायक | Agriculture AI Assistant"
        : "Agriculture AI Assistant";

    let link = document.querySelector(
      "link[rel~='icon']",
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/png";
    link.href = "/cheerful-wheat-mascot.png";
  }, [lang]);

  const navigation = [
    { label: t.navHome, href: "#" },
    { label: t.navAgriculture, href: "#agriculture" },
    { label: t.navHorticulture, href: "#agriculture" },
    { label: t.navSchemes, href: "#schemes" },
    { label: t.navServices, href: "#farmer-services" },
    { label: t.navContact, href: "#contact" },
  ];

  const services = [
    {
      icon: FileCheck2,
      title: t.service1Title,
      text: t.service1Text,
    },
    {
      icon: UserRound,
      title: t.service2Title,
      text: t.service2Text,
    },
    {
      icon: FileText,
      title: t.service3Title,
      text: t.service3Text,
    },
    {
      icon: BookOpen,
      title: t.service4Title,
      text: t.service4Text,
    },
  ];

  const schemes = [
    {
      label: t.scheme1Badge,
      title: t.scheme1Title,
      text: t.scheme1Text,
    },
    {
      label: t.scheme2Badge,
      title: t.scheme2Title,
      text: t.scheme2Text,
    },
    {
      label: t.scheme3Badge,
      title: t.scheme3Title,
      text: t.scheme3Text,
    },
  ];

  const crops = [
    { icon: Wheat, title: t.crop1Title, note: t.crop1Note },
    { icon: Sprout, title: t.crop2Title, note: t.crop2Note },
    { icon: Leaf, title: t.crop3Title, note: t.crop3Note },
    { icon: Flower2, title: t.crop4Title, note: t.crop4Note },
  ];

  return (
    <div className="portal-page">
      <div className="portal-top-strip">
        <div className="portal-container">
          <span>{t.govtTitle}</span>
          <div>
            <a href="#main-content">{t.skipContent}</a>
            <button aria-label={t.accessibility}>
              <Accessibility /> {t.accessibility}
            </button>
            <button
              onClick={() => setIsKnowledgeModalOpen(true)}
              aria-label="Government Knowledge Base"
              title="Official Government Agriculture Knowledge Base & Ingestion"
              style={{
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(255, 255, 255, 0.15)",
                padding: "2px 8px",
                borderRadius: "4px",
                border: "1px solid rgba(255, 255, 255, 0.25)",
              }}
            >
              <Database size={13} />
              <span>{lang === "hi" ? "सरकारी ज्ञान आधार" : "Gov Knowledge Base"}</span>
              <span
                style={{
                  background: "#10b981",
                  color: "#fff",
                  fontSize: "9px",
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: "10px",
                }}
              >
                {chunkCount} Chunks
              </span>
            </button>
            <button
              onClick={toggleLang}
              aria-label={t.langSwitchLabel}
              title={t.langSwitchLabel}
              style={{ fontWeight: 600, cursor: "pointer" }}
            >
              <BilingualTranslateIcon size={14} /> {t.currentLangLabel}
            </button>
          </div>
        </div>
      </div>

      <header className="portal-header">
        <div className="portal-container portal-brand-row">
          <a
            className="portal-brand"
            href="#"
            aria-label={t.deptTitle}
          >
            <span className="portal-emblem" aria-hidden="true">
              <Landmark />
            </span>
            <span>
              <strong>{t.deptTitle}</strong>
              <small>{t.deptSub}</small>
            </span>
          </a>
          <div className="portal-header-actions">
            <div className="portal-helpline">
              <Phone />
              <span>
                <small>{t.helplineLabel}</small>
                <strong>{t.helplineNumber}</strong>
              </span>
            </div>
            <button className="portal-icon-button" aria-label="Notifications">
              <Bell />
            </button>
            <button className="portal-icon-button" aria-label="Search website">
              <Search />
            </button>
            <button
              className="portal-menu-button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-expanded={menuOpen}
              aria-label={t.menuAria}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <nav
          className={`portal-nav ${menuOpen ? "portal-nav-open" : ""}`}
          aria-label="Main navigation"
        >
          <div className="portal-container">
            {navigation.map((item, index) => (
              <a
                className={index === 0 ? "active" : ""}
                href={item.href}
                key={item.label}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
                {index > 0 && index < 5 && <ChevronDown />}
              </a>
            ))}
            <div className="portal-mobile-menu-footer">
              <a href="tel:18001801551" className="portal-mobile-helpline">
                <Phone />
                <div>
                  <small>{t.helplineLabel} (Toll Free)</small>
                  <strong>{t.helplineNumber}</strong>
                </div>
              </a>
              <div className="portal-mobile-actions">
                <button aria-label={t.accessibility}>
                  <Accessibility /> {t.accessibility}
                </button>
                <button
                  onClick={() => {
                    toggleLang();
                    setMenuOpen(false);
                  }}
                  aria-label={t.langSwitchLabel}
                >
                  <BilingualTranslateIcon size={14} /> {t.currentLangLabel}
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section className="portal-hero" aria-labelledby="portal-hero-title">
          <img src={heroImage} alt="Farmer standing in a green field" />
          <div className="portal-hero-shade" />
          <div className="portal-container portal-hero-content">
            <span className="portal-eyebrow">
              <Sprout /> {t.heroEyebrow}
            </span>
            <h1 id="portal-hero-title">{t.heroTitle}</h1>
            <p>{t.heroDesc}</p>
            <div className="portal-hero-actions">
              <a href="#farmer-services" className="portal-primary-button">
                {t.heroPrimaryBtn} <ArrowRight />
              </a>
              <a href="#schemes" className="portal-secondary-button">
                {t.heroSecondaryBtn}
              </a>
            </div>
            <div className="portal-trust-note">
              <ShieldCheck />
              <span>
                <strong>{t.trustOfficial}</strong> {t.trustDesc}
              </span>
            </div>
          </div>
        </section>

        <section className="portal-service-section" id="farmer-services">
          <div className="portal-container">
            <div className="portal-service-grid">
              {services.map(({ icon: Icon, title, text }) => (
                <a href="#" className="portal-service-card" key={title}>
                  <span>
                    <Icon />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                  <ArrowRight />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="portal-section" id="schemes">
          <div className="portal-container">
            <div className="portal-section-heading">
              <div>
                <span className="portal-kicker">{t.schemesKicker}</span>
                <h2>{t.schemesHeading}</h2>
                <p>{t.schemesDesc}</p>
              </div>
              <button className="portal-text-button">
                {t.schemesViewAll} <ArrowRight />
              </button>
            </div>
            <div className="portal-scheme-grid">
              {schemes.map((scheme, index) => (
                <article className="portal-scheme-card" key={scheme.title}>
                  <div className="portal-scheme-icon">
                    {index === 0 ? (
                      <Landmark />
                    ) : index === 1 ? (
                      <ShieldCheck />
                    ) : (
                      <Sprout />
                    )}
                  </div>
                  <span>{scheme.label}</span>
                  <h3>{scheme.title}</h3>
                  <p>{scheme.text}</p>
                  <a href="#">
                    {t.schemeDetailsLink} <ArrowRight />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="portal-section portal-crop-section" id="agriculture">
          <div className="portal-container portal-crop-layout">
            <div className="portal-crop-copy">
              <span className="portal-kicker">{t.cropKicker}</span>
              <h2>{t.cropHeading}</h2>
              <p>{t.cropDesc}</p>
              <ul>
                <li>
                  <CheckCircle2 /> {t.cropPractice1}
                </li>
                <li>
                  <CheckCircle2 /> {t.cropPractice2}
                </li>
                <li>
                  <CheckCircle2 /> {t.cropPractice3}
                </li>
              </ul>
              <button className="portal-outline-button">
                {t.cropKnowledgeBtn} <ArrowRight />
              </button>
            </div>
            <div className="portal-crop-grid">
              {crops.map(({ icon: Icon, title, note }) => (
                <a href="#" key={title}>
                  <Icon />
                  <span>
                    <strong>{title}</strong>
                    <small>{note}</small>
                  </span>
                  <ArrowRight />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="portal-section portal-resources-section">
          <div className="portal-container portal-resources-layout">
            <div className="portal-resource-heading">
              <span className="portal-kicker">{t.resourcesKicker}</span>
              <h2>{t.resourcesHeading}</h2>
              <p>{t.resourcesDesc}</p>
            </div>
            <div className="portal-resource-links">
              <a href="#">
                <FileText />
                <span>
                  <strong>{t.resource1Title}</strong>
                  <small>{t.resource1Text}</small>
                </span>
                <ArrowRight />
              </a>
              <a href="#">
                <CalendarDays />
                <span>
                  <strong>{t.resource2Title}</strong>
                  <small>{t.resource2Text}</small>
                </span>
                <ArrowRight />
              </a>
              <a href="#">
                <Tractor />
                <span>
                  <strong>{t.resource3Title}</strong>
                  <small>{t.resource3Text}</small>
                </span>
                <ArrowRight />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="portal-footer" id="contact">
        <div className="portal-container portal-footer-main">
          <div className="portal-footer-brand">
            <span className="portal-emblem">
              <Landmark />
            </span>
            <div>
              <strong>{t.deptTitle}</strong>
              <p>{t.deptSub}</p>
            </div>
          </div>
          <div className="portal-footer-links">
            <a href="#">{t.footerAbout}</a>
            <a href="#">{t.footerContact}</a>
            <a href="#">{t.footerPrivacy}</a>
            <a href="#">{t.footerAccessibility}</a>
          </div>
        </div>
        <div className="portal-footer-bottom">
          <div className="portal-container">
            <span>{t.footerCopyright}</span>
            <span>{t.footerUpdated}</span>
          </div>
        </div>
      </footer>

      <AgricultureChatWidget
        lang={lang}
        onToggleLang={toggleLang}
        onOpenKnowledgeBase={() => setIsKnowledgeModalOpen(true)}
      />

      <KnowledgeIngestionModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
