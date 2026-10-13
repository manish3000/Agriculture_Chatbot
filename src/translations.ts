export type Language = "en" | "hi";

export interface PortalTranslations {
  // Top bar
  govtTitle: string;
  skipContent: string;
  accessibility: string;
  langSwitchLabel: string;
  currentLangLabel: string;

  // Header
  deptTitle: string;
  deptSub: string;
  helplineLabel: string;
  helplineNumber: string;
  menuAria: string;

  // Nav
  navHome: string;
  navAgriculture: string;
  navHorticulture: string;
  navSchemes: string;
  navServices: string;
  navContact: string;

  // Hero
  heroEyebrow: string;
  heroTitle: string;
  heroDesc: string;
  heroPrimaryBtn: string;
  heroSecondaryBtn: string;
  trustOfficial: string;
  trustDesc: string;

  // Quick Services
  servicesTitle: string;
  service1Title: string;
  service1Text: string;
  service2Title: string;
  service2Text: string;
  service3Title: string;
  service3Text: string;
  service4Title: string;
  service4Text: string;

  // Schemes
  schemesKicker: string;
  schemesHeading: string;
  schemesDesc: string;
  schemesViewAll: string;
  scheme1Badge: string;
  scheme1Title: string;
  scheme1Text: string;
  scheme2Badge: string;
  scheme2Title: string;
  scheme2Text: string;
  scheme3Badge: string;
  scheme3Title: string;
  scheme3Text: string;
  schemeDetailsLink: string;

  // Crop Information
  cropKicker: string;
  cropHeading: string;
  cropDesc: string;
  cropPractice1: string;
  cropPractice2: string;
  cropPractice3: string;
  cropKnowledgeBtn: string;
  crop1Title: string;
  crop1Note: string;
  crop2Title: string;
  crop2Note: string;
  crop3Title: string;
  crop3Note: string;
  crop4Title: string;
  crop4Note: string;

  // Resources
  resourcesKicker: string;
  resourcesHeading: string;
  resourcesDesc: string;
  resource1Title: string;
  resource1Text: string;
  resource2Title: string;
  resource2Text: string;
  resource3Title: string;
  resource3Text: string;

  // Footer
  footerAbout: string;
  footerContact: string;
  footerPrivacy: string;
  footerAccessibility: string;
  footerCopyright: string;
  footerUpdated: string;

  // Chatbot widget UI
  chatTitle: string;
  chatSubtitle: string;
  chatOfficialBadge: string;
  chatGreeting: string;
  chatWelcomeDesc: string;
  chatCap1: string;
  chatCap2: string;
  chatCap3: string;
  chatHelpQuestion: string;
  chatHelpSub: string;
  chatIntroTitle: string;
  chatIntroSub: string;
  chatPlaceholder: string;
  chatAriaInput: string;
  chatVoiceAria: string;
  chatSendAria: string;
  chatDisclaimer: string;
  chatTyping: string;
  chatStopGeneration: string;
  chatGenerationStopped: string;
  chatSourceVerified: string;
  chatSourcePortal: string;
  chatCloseAria: string;
  chatMinimizeAria: string;
  chatRestoreAria: string;
  chatTimeJustNow: string;
  chatLauncherLabel: string;
  chatLauncherAlt: string;
}

export const translations: Record<Language, PortalTranslations> = {
  en: {
    // Top bar
    govtTitle: "Government of Chhattisgarh",
    skipContent: "Skip to main content",
    accessibility: "Accessibility",
    langSwitchLabel: "Switch to हिन्दी",
    currentLangLabel: "हिन्दी",

    // Header
    deptTitle: "Agriculture Development & Farmer Welfare Department",
    deptSub: "Government of Chhattisgarh",
    helplineLabel: "Farmer Helpline",
    helplineNumber: "1800-180-1551",
    menuAria: "Toggle navigation",

    // Nav
    navHome: "Home",
    navAgriculture: "Agriculture",
    navHorticulture: "Horticulture",
    navSchemes: "Schemes",
    navServices: "Farmer Services",
    navContact: "Contact",

    // Hero
    heroEyebrow: "Supporting every farmer, every season",
    heroTitle: "Growing prosperity through sustainable agriculture",
    heroDesc:
      "Access government schemes, scientific crop guidance and digital services from the Agriculture Department.",
    heroPrimaryBtn: "Explore farmer services",
    heroSecondaryBtn: "View agriculture schemes",
    trustOfficial: "Official Government Portal",
    trustDesc: "Information and services for the farmers of Chhattisgarh",

    // Quick Services
    servicesTitle: "Farmer Services",
    service1Title: "Apply for Schemes",
    service1Text: "Access agriculture and farmer welfare scheme applications.",
    service2Title: "Farmer Registration",
    service2Text: "Register or update farmer and landholding information.",
    service3Title: "Government Orders",
    service3Text: "View circulars, notifications and departmental guidelines.",
    service4Title: "Agriculture Library",
    service4Text: "Read crop guides, publications and extension resources.",

    // Schemes
    schemesKicker: "FARMER WELFARE",
    schemesHeading: "Major schemes and programmes",
    schemesDesc:
      "Explore important government initiatives supporting agriculture and farmer livelihoods.",
    schemesViewAll: "View all schemes",
    scheme1Badge: "Income Support",
    scheme1Title: "PM-KISAN Samman Nidhi",
    scheme1Text:
      "Central sector scheme providing income support of ₹6,000 per year to eligible farmer families.",
    scheme2Badge: "Crop Protection",
    scheme2Title: "Pradhan Mantri Fasal Bima Yojana",
    scheme2Text:
      "Comprehensive crop insurance against natural calamities, pests, and adverse weather risks.",
    scheme3Badge: "Sustainable Farming",
    scheme3Title: "National Mission for Sustainable Agriculture",
    scheme3Text:
      "Promoting climate-resilient, water-efficient and sustainable agricultural practices.",
    schemeDetailsLink: "View scheme details",

    // Crop Information
    cropKicker: "CROP INFORMATION",
    cropHeading: "Knowledge for better cultivation",
    cropDesc:
      "Practical, department-reviewed information to support informed farming decisions through the crop cycle.",
    cropPractice1: "Package of practices",
    cropPractice2: "Soil and nutrient management",
    cropPractice3: "Integrated pest management",
    cropKnowledgeBtn: "Visit knowledge centre",
    crop1Title: "Paddy",
    crop1Note: "Seasonal cultivation guidance",
    crop2Title: "Pulses",
    crop2Note: "Seed and crop management",
    crop3Title: "Oilseeds",
    crop3Note: "Production best practices",
    crop4Title: "Horticulture",
    crop4Note: "Fruit and vegetable resources",

    // Resources
    resourcesKicker: "INFORMATION & RESOURCES",
    resourcesHeading: "Farmer resources",
    resourcesDesc:
      "Important documents, updates and useful links from the department.",
    resource1Title: "Latest notifications",
    resource1Text: "Department orders, circulars and notices",
    resource2Title: "Seasonal advisories",
    resource2Text: "Crop calendars, weather advisories and guidelines",
    resource3Title: "Farm mechanization",
    resource3Text: "Machinery, equipment schemes and custom hiring centers",

    // Footer
    footerAbout: "About Department",
    footerContact: "Contact Directory",
    footerPrivacy: "Privacy Policy",
    footerAccessibility: "Accessibility",
    footerCopyright: "© 2025 Government of Chhattisgarh. All rights reserved.",
    footerUpdated: "Last updated: 20 February 2025",

    // Chatbot widget UI
    chatTitle: "Agriculture AI Assistant",
    chatSubtitle: "Government Agriculture Assistant",
    chatOfficialBadge: "Official information assistant",
    chatGreeting: "Namaste!",
    chatWelcomeDesc:
      "Ask me about agriculture, horticulture, government schemes, crops, farmer services and verified guidelines.",
    chatCap1: "Crop cultivation",
    chatCap2: "Government services",
    chatCap3: "Verified guidance",
    chatHelpQuestion: "How can I help you today?",
    chatHelpSub: "Choose a topic or ask your own question",
    chatIntroTitle: "Namaste! How can I help?",
    chatIntroSub: "You can ask in हिन्दी, English or Hinglish.",
    chatPlaceholder: "Ask your agriculture question…",
    chatAriaInput: "Ask your agriculture question",
    chatVoiceAria: "Start voice input",
    chatSendAria: "Send question",
    chatDisclaimer: "AI responses should be verified with official sources.",
    chatTyping: "Agriculture AI is checking sources…",
    chatStopGeneration: "Stop generating",
    chatGenerationStopped: "Query generation stopped by user. Ask your next question.",
    chatSourceVerified: "Verified source",
    chatSourcePortal: "View official portal",
    chatCloseAria: "Close Agriculture AI Assistant",
    chatMinimizeAria: "Minimize chatbot",
    chatRestoreAria: "Restore chatbot",
    chatTimeJustNow: "Just now",
    chatLauncherLabel: "Ask AI",
    chatLauncherAlt: "Cheerful Wheat Chatbot Mascot",
  },

  hi: {
    // Top bar
    govtTitle: "छत्तीसगढ़ शासन",
    skipContent: "मुख्य सामग्री पर जाएं",
    accessibility: "सुगमता (Accessibility)",
    langSwitchLabel: "Switch to English",
    currentLangLabel: "English",

    // Header
    deptTitle: "कृषि विकास एवं किसान कल्याण विभाग",
    deptSub: "छत्तीसगढ़ शासन",
    helplineLabel: "किसान हेल्पलाइन",
    helplineNumber: "1800-180-1551",
    menuAria: "नेविगेशन मेन्यू खोलें",

    // Nav
    navHome: "मुख्य पृष्ठ",
    navAgriculture: "कृषि",
    navHorticulture: "उद्यानिकी",
    navSchemes: "योजनाएं",
    navServices: "किसान सेवाएं",
    navContact: "संपर्क",

    // Hero
    heroEyebrow: "हर मौसम, हर किसान का विश्वसनीय साथी",
    heroTitle: "सतत कृषि से समृद्ध किसान, खुशहाल छत्तीसगढ़",
    heroDesc:
      "कृषि विभाग से सरकारी योजनाओं, वैज्ञानिक फसल सलाह और डिजिटल सेवाओं का सीधा लाभ उठाएं।",
    heroPrimaryBtn: "किसान सेवाएं देखें",
    heroSecondaryBtn: "कृषि योजनाएं देखें",
    trustOfficial: "आधिकारिक शासकीय पोर्टल",
    trustDesc: "छत्तीसगढ़ के किसान भाइयों के लिए प्रामाणिक जानकारी एवं सेवाएं",

    // Quick Services
    servicesTitle: "किसान सेवाएं",
    service1Title: "योजनाओं हेतु आवेदन",
    service1Text: "कृषि एवं कृषक कल्याणकारी योजनाओं के लिए सीधा आवेदन करें।",
    service2Title: "किसान पंजीयन",
    service2Text: "किसान एवं कृषि भूमि विवरण का नया पंजीयन या संशोधन करें।",
    service3Title: "शासकीय आदेश",
    service3Text: "विभागीय परिपत्र, अधिसूचनाएं एवं दिशा-निर्देश देखें।",
    service4Title: "कृषि पुस्तकालय",
    service4Text: "फसल मार्गदर्शिकाएं, प्रकाशन एवं विस्तार सामग्री पढ़ें।",

    // Schemes
    schemesKicker: "किसान कल्याण",
    schemesHeading: "प्रमुख योजनाएं एवं कार्यक्रम",
    schemesDesc:
      "कृषि एवं किसानों की आजीविका को सशक्त बनाने वाली महत्वपूर्ण सरकारी पहलें।",
    schemesViewAll: "सभी योजनाएं देखें",
    scheme1Badge: "आय सहायता",
    scheme1Title: "प्रधानमंत्री किसान सम्मान निधि",
    scheme1Text:
      "पात्र किसान परिवारों को प्रति वर्ष ₹6,000 की सुनिश्चित आर्थिक सहायता (तीन किस्तों में ₹2,000)।",
    scheme2Badge: "फसल सुरक्षा",
    scheme2Title: "प्रधानमंत्री फसल बीमा योजना",
    scheme2Text:
      "प्राकृतिक आपदाओं, कीट एवं प्रतिकूल मौसम से फसल क्षति पर किसानों को व्यापक बीमा सुरक्षा।",
    scheme3Badge: "सतत खेती",
    scheme3Title: "राष्ट्रीय सतत कृषि मिशन",
    scheme3Text:
      "जलवायु अनुकूल, जल कुशल तथा पर्यावरण-अनुकूल प्राकृतिक व टिकाऊ खेती को प्रोत्साहन।",
    schemeDetailsLink: "योजना विवरण देखें",

    // Crop Information
    cropKicker: "फसल जानकारी",
    cropHeading: "उन्नत खेती के लिए तकनीकी ज्ञान",
    cropDesc:
      "फसल चक्र के दौरान सही निर्णय लेने के लिए विभाग द्वारा प्रमाणित व्यावहारिक जानकारी।",
    cropPractice1: "उन्नत कृषि कार्यमाला एवं विधियां",
    cropPractice2: "मृदा एवं पोषण प्रबंधन",
    cropPractice3: "एकीकृत कीट एवं रोग नियंत्रण",
    cropKnowledgeBtn: "ज्ञान केंद्र देखें",
    crop1Title: "धान",
    crop1Note: "मौसमी खेती व उन्नत किस्में",
    crop2Title: "दलहन",
    crop2Note: "बीज उपचार एवं उत्पादन प्रबंधन",
    crop3Title: "तिलहन",
    crop3Note: "उत्पादन की उन्नत तकनीक",
    crop4Title: "उद्यानिकी",
    crop4Note: "फल एवं सब्जी उत्पादन मार्गदर्शन",

    // Resources
    resourcesKicker: "सूचना एवं संसाधन",
    resourcesHeading: "किसान संसाधन केंद्र",
    resourcesDesc:
      "विभाग के महत्वपूर्ण दस्तावेज, नवीनतम आदेश और उपयोगी लिंक्स।",
    resource1Title: "नवीनतम सूचनाएं",
    resource1Text: "विभागीय आदेश, परिपत्र एवं आवश्यक सूचनाएं",
    resource2Title: "मौसमी कृषि परामर्श",
    resource2Text: "फसल कैलेंडर, मौसम सलाह एवं समसामयिक दिशा-निर्देश",
    resource3Title: "कृषि यंत्रीकरण",
    resource3Text: "कृषि यंत्र, कस्टम हायरिंग सेंटर एवं उपकरण अनुदान",

    // Footer
    footerAbout: "विभाग के बारे में",
    footerContact: "संपर्क निर्देशिका",
    footerPrivacy: "गोपनीयता नीति",
    footerAccessibility: "सुगमता (Accessibility)",
    footerCopyright: "© 2025 छत्तीसगढ़ शासन। सर्वाधिकार सुरक्षित।",
    footerUpdated: "अंतिम अद्यतन: 20 फरवरी 2025",

    // Chatbot widget UI
    chatTitle: "कृषि AI सहायक",
    chatSubtitle: "शासकीय कृषि सहायक",
    chatOfficialBadge: "प्रामाणिक शासकीय सूचना सहायक",
    chatGreeting: "नमस्ते!",
    chatWelcomeDesc:
      "कृषि, उद्यानिकी, सरकारी योजनाओं, फसलों, किसान सेवाओं एवं प्रमाणित दिशा-निर्देशों के बारे में मुझसे पूछें।",
    chatCap1: "फसल उत्पादन",
    chatCap2: "शासकीय सेवाएं",
    chatCap3: "प्रमाणित मार्गदर्शन",
    chatHelpQuestion: "आज मैं आपकी क्या सहायता कर सकता हूँ?",
    chatHelpSub: "कोई विषय चुनें या अपना प्रश्न पूछें",
    chatIntroTitle: "नमस्ते! मैं आपकी क्या सहायता कर सकता हूँ?",
    chatIntroSub: "आप हिन्दी, English या हिंग्लिश में प्रश्न पूछ सकते हैं।",
    chatPlaceholder: "अपना कृषि संबंधी प्रश्न यहाँ पूछें…",
    chatAriaInput: "अपना कृषि संबंधी प्रश्न दर्ज करें",
    chatVoiceAria: "वॉइस इनपुट शुरू करें",
    chatSendAria: "प्रश्न भेजें",
    chatDisclaimer: "AI उत्तरों को आधिकारिक स्रोतों से सत्यापित किया जाना चाहिए।",
    chatTyping: "कृषि AI आधिकारिक जानकारी खोज रहा है…",
    chatStopGeneration: "उत्तर निर्माण रोकें",
    chatGenerationStopped: "उत्तर निर्माण रोक दिया गया। आप अपना अगला प्रश्न पूछ सकते हैं।",
    chatSourceVerified: "प्रमाणित स्रोत",
    chatSourcePortal: "आधिकारिक पोर्टल देखें",
    chatCloseAria: "कृषि AI सहायक बंद करें",
    chatMinimizeAria: "चैटबॉट छोटा करें",
    chatRestoreAria: "चैटबॉट पुनः खोलें",
    chatTimeJustNow: "अभी-अभी",
    chatLauncherLabel: "AI से पूछें",
    chatLauncherAlt: "हंसमुख गेहूं कृषि AI मैस्कॉट",
  },
};
