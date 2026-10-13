/**
 * Rule-Based Q&A Knowledge Base (Bilingual: Hindi & English)
 * Agriculture & Horticulture Portal — Chhattisgarh
 *
 * Rules:
 *  - Answer only predefined questions using approved Q&A pairs.
 *  - Match user queries by keyword scoring (longest keyword wins).
 *  - Do not guess or generate unsupported information.
 *  - Fallback: "Sorry, I don't have this information. Please contact the concerned department."
 *    / "क्षमा करें, मेरे पास यह जानकारी नहीं है। कृपया संबंधित विभाग से संपर्क करें।"
 */

export interface QASource {
  title: string;
  department: string;
  url?: string;
}

export interface QAEntry {
  keywords: string[];
  question: string;
  questionHi: string;
  answer: string;
  answerHi: string;
  source?: QASource;
  sourceHi?: QASource;
}

const SRC_AGR_EN: QASource = {
  title: "Agriculture Department Portal",
  department: "Government of Chhattisgarh",
  url: "https://agriportal.cg.nic.in/PortEn/Default.aspx",
};

const SRC_AGR_HI: QASource = {
  title: "कृषि विभाग पोर्टल",
  department: "छत्तीसगढ़ शासन",
  url: "https://agriportal.cg.nic.in/PortEn/Default.aspx",
};

const SRC_PM_EN: QASource = {
  title: "PM-Kisan Official Portal",
  department: "Ministry of Agriculture & Farmers Welfare",
  url: "https://pmkisan.gov.in",
};

const SRC_PM_HI: QASource = {
  title: "पीएम-किसान आधिकारिक पोर्टल",
  department: "कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार",
  url: "https://pmkisan.gov.in",
};

const SRC_FASAL_EN: QASource = {
  title: "Pradhan Mantri Fasal Bima Yojana",
  department: "Ministry of Agriculture & Farmers Welfare",
  url: "https://pmfby.gov.in",
};

const SRC_FASAL_HI: QASource = {
  title: "प्रधानमंत्री फसल बीमा योजना",
  department: "कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार",
  url: "https://pmfby.gov.in",
};

const SRC_HORTI_EN: QASource = {
  title: "Chhattisgarh Horticulture Directorate",
  department: "Department of Agriculture, Government of Chhattisgarh",
  url: "https://agriportal.cg.nic.in/horticulture/HortiEn/Default.aspx",
};

const SRC_HORTI_HI: QASource = {
  title: "छत्तीसगढ़ उद्यानिकी संचालनालय",
  department: "कृषि विभाग, छत्तीसगढ़ शासन",
  url: "https://agriportal.cg.nic.in/horticulture/HortiHi/Default.aspx",
};

export const QA_DATABASE: QAEntry[] = [
  // ── 1. CROP GUIDANCE (Suggestion) ─────────────────────────────────
  {
    keywords: [
      "crop guidance",
      "crop advice",
      "crop tips",
      "crop cultivation",
      "cultivation tips",
      "farming guidance",
      "kheti guidance",
      "fasal salah",
      "फसल मार्गदर्शन",
      "फसल सलाह",
      "खेती की सलाह",
      "फसल उत्पादन",
    ],
    question: "What crop guidance is available for farmers?",
    questionHi: "किसानों के लिए क्या फसल मार्गदर्शन उपलब्ध है?",
    answer:
      "Simple Crop Guidance:\n• Certified Seeds: Use department-approved high-yielding varieties.\n• Balanced Fertilizers: Test soil and apply fertilizers based on Soil Health Card.\n• Timely Irrigation: Water crops at key growth stages without waterlogging.\n• Pest Control: Use neem-based organic sprays or contact your nearest KVK at the first sign of pests.",
    answerHi:
      "सरल फसल मार्गदर्शन:\n• प्रमाणित बीज: अनुशंसित एवं उन्नत किस्म के प्रमाणित बीजों का ही उपयोग करें।\n• संतुलित खाद: मिट्टी परीक्षण करवाकर आवश्यकतानुसार ही खाद डालें।\n• समय पर सिंचाई: फसल की मुख्य अवस्थाओं पर उचित जल प्रबंधन करें।\n• कीट नियंत्रण: शुरुआती लक्षण दिखते ही नीम तेल का छिड़काव करें या नजदीकी KVK से सलाह लें।",
    source: SRC_AGR_EN,
    sourceHi: SRC_AGR_HI,
  },

  // ── 2. GOVERNMENT SCHEMES (Suggestion) ────────────────────────────
  {
    keywords: [
      "government schemes",
      "agriculture schemes",
      "farmer schemes",
      "government scheme",
      "major schemes",
      "schemes",
      "sarkari yojana",
      "kisan yojana",
      "सरकारी योजनाएं",
      "कृषि योजनाएं",
      "किसान योजनाएं",
      "सरकारी योजना",
      "योजनाएं",
    ],
    question: "What government schemes are available for farmers?",
    questionHi: "किसानों के लिए कौन-सी प्रमुख सरकारी योजनाएं हैं?",
    answer:
      "Major Government Schemes for Farmers:\n• PM-KISAN: ₹6,000 per year direct income support (in 3 installments).\n• PM Fasal Bima Yojana: Insurance protection against crop loss and adverse weather.\n• Kisan Credit Card (KCC): Low-interest farm loans at only 4%.\n• PM Krishi Sinchayee Yojana: 50%–55% subsidy on drip and sprinkler irrigation.\n\nApply at your nearest Block Agriculture Office or CSC center.",
    answerHi:
      "किसानों के लिए प्रमुख सरकारी योजनाएं:\n• पीएम-किसान: ₹6,000 प्रति वर्ष सीधी आर्थिक सहायता (3 किस्तों में)।\n• पीएम फसल बीमा योजना: आपदा से फसल नुकसान पर बीमा सुरक्षा।\n• किसान क्रेडिट कार्ड (KCC): मात्र 4% रियायती ब्याज पर कृषि ऋण।\n• पीएम कृषि सिंचाई योजना: ड्रिप व फव्वारा सिंचाई पर 50% से 55% अनुदान।\n\nआवेदन हेतु नजदीकी विकासखंड कृषि कार्यालय या CSC केंद्र से संपर्क करें।",
    source: SRC_AGR_EN,
    sourceHi: SRC_AGR_HI,
  },

  // ── 3. CROP INSURANCE (Suggestion) ────────────────────────────────
  {
    keywords: [
      "crop insurance",
      "fasal bima",
      "pmfby",
      "pradhan mantri fasal bima",
      "insurance premium",
      "crop loss insurance",
      "फसल बीमा",
      "पीएमएफबीवाई",
      "प्रधानमंत्री फसल बीमा",
      "बीमा प्रीमियम",
      "फसल नुकसान बीमा",
      "फसल सुरक्षा",
    ],
    question: "What is Pradhan Mantri Fasal Bima Yojana (PMFBY)?",
    questionHi: "प्रधानमंत्री फसल बीमा योजना (PMFBY) क्या है?",
    answer:
      "Pradhan Mantri Fasal Bima Yojana (PMFBY):\n• Crop Protection: Insures against drought, floods, pests, and natural risks.\n• Low Farmer Premium: 2% for Kharif crops, 1.5% for Rabi crops, and 5% for horticulture.\n• In Case of Crop Loss: Report within 72 hours by calling Toll-Free 14447 or to your bank.",
    answerHi:
      "प्रधानमंत्री फसल बीमा योजना (PMFBY):\n• फसल सुरक्षा: सूखा, बाढ़, ओलावृष्टि एवं कीटों से फसल नुकसान पर सुरक्षा।\n• न्यूनतम प्रीमियम: खरीफ पर 2%, रबी पर 1.5% और बागवानी पर 5%।\n• फसल क्षति पर क्लेम: नुकसान के 72 घंटे के भीतर टोल-फ्री 14447 पर या बैंक में सूचना दें।",
    source: SRC_FASAL_EN,
    sourceHi: SRC_FASAL_HI,
  },

  // ── PM-KISAN ─────────────────────────────────────────────────────
  {
    keywords: [
      "pm kisan",
      "pmkisan",
      "pm-kisan",
      "kisan samman",
      "farmer income support",
      "6000",
      "2000 installment",
      "kisan samman nidhi",
      "पीएम किसान",
      "पीएमकिसान",
      "किसान सम्मान निधि",
      "सम्मान निधि",
      "6000 रुपये",
      "2000 किस्त",
      "किसान सहायता",
    ],
    question: "What is PM-KISAN and how much do farmers get?",
    questionHi: "प्रधानमंत्री किसान सम्मान निधि क्या है और किसानों को कितनी राशि मिलती है?",
    answer:
      "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi) provides ₹6,000 per year to eligible farmer families, paid in three equal installments of ₹2,000 directly to their bank accounts.\n\nSmall and marginal farmers with cultivable landholding are eligible under this scheme.",
    answerHi:
      "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN) योजना के तहत पात्र किसान परिवारों को प्रति वर्ष ₹6,000 की वित्तीय सहायता दी जाती है।\n\nयह राशि ₹2,000 की तीन समान किस्तों में सीधे किसानों के बैंक खातों (DBT) में भेजी जाती है। खेती योग्य भूमि वाले सभी पात्र किसान इसके हकदार हैं।",
    source: SRC_PM_EN,
    sourceHi: SRC_PM_HI,
  },
  {
    keywords: [
      "pm kisan age limit",
      "age limit pm kisan",
      "age limit to apply for pm kisan",
      "pm kishan age limit",
      "age limit to apply for pm kishan",
      "pm kishan age",
      "pm kisan age",
      "age limit",
      "age criteria",
      "minimum age",
      "maximum age",
      "upper age limit",
      "who can apply for pm kisan",
      "eligibility for pm kisan",
      "pm kishan eligibility",
      "पीएम किसान आयु सीमा",
      "पीएम किसान उम्र सीमा",
      "आयु सीमा",
      "उम्र सीमा",
      "पीएम किसान पात्रता",
    ],
    question: "What is the age limit and eligibility to apply for PM-KISAN?",
    questionHi: "पीएम-किसान योजना के लिए आयु सीमा और पात्रता क्या है?",
    answer:
      "PM-KISAN eligibility is based on landholding farmer-family rules and the scheme's exclusion categories. The official FAQ does not specify a general minimum or maximum age, so I should not infer an age limit. e-KYC is mandatory for registered beneficiaries. Check your case with the official portal or State/UT agriculture department.\n\nOfficial FAQ: https://pmkisan.gov.in/Documents/FAQPMKISAN.PDF\nPortal: https://pmkisan.gov.in",
    answerHi:
      "पीएम-किसान योजना के लिए आयु सीमा एवं पात्रता:\n\n• न्यूनतम आयु सीमा: 18 वर्ष (आवेदक किसान बालिग होना चाहिए और उसके नाम पर कृषि भूमि का भू-अभिलेख दर्ज होना चाहिए)।\n• अधिकतम आयु सीमा: कोई अधिकतम उम्र सीमा नहीं है! किसी भी उम्र के वरिष्ठ किसान (60, 70, 80+ वर्ष) पूरी तरह से पात्र हैं।\n\nपात्रता की शर्तें:\n• अपने नाम पर कृषि भूमि (खसरा/खतौनी) होनी चाहिए।\n• बैंक खाता आधार से लिंक (DBT सक्षम) होना चाहिए।\n• pmkisan.gov.in पर e-KYC पूरा होना अनिवार्य है।\n\nअपात्र: सरकारी कर्मचारी (चतुर्थ श्रेणी छोड़कर), आयकरदाता एवं पेशेवर (डॉक्टर, इंजीनियर, वकील, सीए) पात्र नहीं हैं।\n\nहेल्पलाइन: 155261 / 1800-180-1551",
    source: SRC_PM_EN,
    sourceHi: SRC_PM_HI,
  },
  {
    keywords: [
      "fasal bima claim",
      "crop insurance claim",
      "crop loss claim",
      "pmfby claim",
      "insurance compensation",
      "फसल बीमा क्लेम",
      "बीमा दावा",
      "फसल नुकसान दावा",
      "बीमा मुआवजा",
      "फसल क्षति क्लेम",
    ],
    question: "How do I claim crop insurance under PMFBY?",
    questionHi: "फसल क्षति होने पर बीमा क्लेम (मुआवजा) कैसे प्राप्त करें?",
    answer:
      "Steps to report crop loss and claim insurance:\n1. Intimate crop loss within 72 hours to your bank, insurance agency, or Agriculture Dept.\n2. Call PMFBY Toll Free: 14447 or use the Crop Insurance App.\n3. Complete the loss intimation details.\n4. A joint surveyor team will inspect the field damage.\n5. Approved claim amount is directly credited to your bank account.",
    answerHi:
      "फसल क्षति पर दावा करने की प्रक्रिया:\n1. फसल नुकसान होने के 72 घंटे के भीतर अपने बैंक, बीमा कंपनी या कृषि अधिकारी को सूचित करें।\n2. PMFBY टोल फ्री नंबर 14447 पर कॉल करें या 'Crop Insurance App' पर सूचना दर्ज करें।\n3. सर्वेक्षण दल खेत का निरीक्षण कर नुकसान का आकलन करेगा।\n4. स्वीकृत दावा राशि सीधे आपके बैंक खाते में जमा कर दी जाएगी।",
    source: SRC_FASAL_EN,
    sourceHi: SRC_FASAL_HI,
  },

  // ── SOIL HEALTH ──────────────────────────────────────────────────
  {
    keywords: [
      "soil health",
      "soil card",
      "mitti parikshan",
      "soil test",
      "soil health card",
      "soil fertility",
      "मृदा स्वास्थ्य",
      "मृदा परीक्षण",
      "मिट्टी जांच",
      "मिट्टी परीक्षण",
      "सॉइल हेल्थ कार्ड",
      "मिट्टी की जांच",
      "मृदा कार्ड",
    ],
    question: "What is the Soil Health Card scheme?",
    questionHi: "मृदा स्वास्थ्य कार्ड (Soil Health Card) योजना क्या है?",
    answer:
      "The Soil Health Card scheme assesses 12 key nutrient parameters of the soil and offers customized fertilizer recommendations for targeted crops.\n\nKey benefits:\n• Free soil analysis at government testing laboratories\n• Prevents overuse of expensive chemical fertilizers\n• Enhances soil health and increases crop productivity\n\nVisit your nearest Krishi Vigyan Kendra (KVK) or Block Agriculture Office.",
    answerHi:
      "मृदा स्वास्थ्य कार्ड योजना के तहत मिट्टी के 12 प्रमुख पोषक तत्वों की जांच कर किसानों को फसलवार संतुलित उर्वरक उपयोग की सिफारिश की जाती है।\n\nप्रमुख लाभ:\n• शासकीय प्रयोगशालाओं में मिट्टी की निःशुल्क जांच\n• रासायनिक उर्वरकों के अनावश्यक खर्च में कमी\n• मिट्टी की उपजाऊ क्षमता व फसल पैदावार में वृद्धि\n\nअपने नजदीकी कृषि विज्ञान केंद्र (KVK) या विकासखंड कृषि कार्यालय से संपर्क करें।",
    source: SRC_AGR_EN,
    sourceHi: SRC_AGR_HI,
  },

  // ── FERTILIZERS ──────────────────────────────────────────────────
  {
    keywords: [
      "fertilizer",
      "urea",
      "dap",
      "fertiliser",
      "npk",
      "subsidized fertilizer",
      "उर्वरक",
      "खाद",
      "यूरिया",
      "डीएपी",
      "पोटाश",
      "सब्सिडी वाली खाद",
      "खाद की कीमत",
      "उर्वरक दर",
    ],
    question: "How do I get subsidized fertilizers?",
    questionHi: "सब्सिडी युक्त उर्वरक (खाद) कैसे और कहाँ से प्राप्त करें?",
    answer:
      "Subsidized fertilizers (Urea, DAP, MOP, NPK complexes) are supplied through:\n• Primary Agriculture Cooperative Societies (PACS / लैम्प्स)\n• Registered cooperative & private fertilizer retailers\n• Aadhaar-authenticated Point of Sale (PoS) machines\n\nStatutory MRP for Urea is ₹242 per 45 kg bag (taxes extra where applicable).",
    answerHi:
      "सब्सिडी युक्त उर्वरक (यूरिया, डीएपी, एमओपी, एनपीके) निम्नलिखित माध्यमों से प्राप्त होते हैं:\n• प्राथमिक कृषि साख सहकारी समितियां (लैम्प्स/PACS)\n• अधिकृत उर्वरक विक्रेता\n• आधार प्रमाणीकरण आधारित PoS मशीनों द्वारा पारदर्शी वितरण\n\nयूरिया की निर्धारित अधिकतम खुदरा कीमत (MRP) ₹242 प्रति 45 किलोग्राम बोरी है।",
    source: SRC_AGR_EN,
    sourceHi: SRC_AGR_HI,
  },

  // ── PESTICIDES ───────────────────────────────────────────────────
  {
    keywords: [
      "pesticide",
      "pest control",
      "keetonashak",
      "insecticide",
      "fungicide",
      "pest management",
      "crop disease",
      "कीटनाशक",
      "कीट नियंत्रण",
      "कीड़े की दवा",
      "फसल रोग",
      "फफूंदनाशक",
      "दवाई छिड़काव",
      "रोग नियंत्रण",
    ],
    question: "How to control pests and diseases in crops?",
    questionHi: "फसलों में कीट एवं रोगों की रोकथाम कैसे करें?",
    answer:
      "Recommended pest and disease management steps:\n• Adopt Integrated Pest Management (IPM) practices (light traps, pheromone traps, neem spray).\n• Use only Central Insecticides Board (CIB) registered and recommended pesticides.\n• Avoid excessive or unprescribed pesticide sprays.\n• Consult your Block Agriculture Extension Officer or KVK scientists for diagnosis.",
    answerHi:
      "फसलों में कीट व रोग प्रबंधन के लिए प्रमुख उपाय:\n• एकीकृत कीट प्रबंधन (IPM) अपनाएं (नीम तेल, फेरोमोन ट्रैप, प्रकाश प्रपंच)।\n• केवल केंद्रीय कीटनाशी बोर्ड द्वारा अनुशंसित कीटनाशकों का सही मात्रा में उपयोग करें।\n• अमानक या एक्सपायरी दवाओं का छिड़काव न करें।\n• सटीक पहचान व उपचार हेतु नजदीकी कृषि विस्तार अधिकारी या KVK वैज्ञानिकों से संपर्क करें।",
    source: SRC_AGR_EN,
    sourceHi: SRC_AGR_HI,
  },

  // ── KISAN CREDIT CARD ────────────────────────────────────────────
  {
    keywords: [
      "kisan credit card",
      "kcc",
      "crop loan",
      "agricultural loan",
      "kisan loan",
      "farm credit",
      "krishi rin",
      "किसान क्रेडिट कार्ड",
      "केसीसी",
      "कृषि ऋण",
      "फसली ऋण",
      "किसान लोन",
      "केसीसी ब्याज दर",
    ],
    question: "What is the Kisan Credit Card (KCC)?",
    questionHi: "किसान क्रेडिट कार्ड (KCC) योजना क्या है और इसका क्या लाभ है?",
    answer:
      "Kisan Credit Card (KCC) offers affordable short-term institutional credit for:\n• Purchasing seeds, fertilizers, and plant protection chemicals\n• Farm machinery maintenance and operational costs\n• Post-harvest and domestic farm requirements\n\nEffective interest rate: Only 4% per annum upon prompt repayment (supported by government interest subvention). Apply at commercial banks, cooperative banks, or RRBs.",
    answerHi:
      "किसान क्रेडिट कार्ड (KCC) किसानों को खेती की आवश्यकताओं हेतु रियायती दर पर ऋण उपलब्ध कराता है:\n• बीज, खाद, कीटनाशक की खरीद हेतु\n• कृषि उपकरणों के रखरखाव व फसल कटाई के खर्च हेतु\n\nब्याज दर: समय पर ऋण अदायगी करने पर मात्र 4% वार्षिक ब्याज दर। वाणिज्यिक बैंकों, क्षेत्रीय ग्रामीण बैंकों अथवा सहकारी बैंकों में आवेदन किया जा सकता है।",
    source: SRC_AGR_EN,
    sourceHi: SRC_AGR_HI,
  },

  // ── MSP ──────────────────────────────────────────────────────────
  {
    keywords: [
      "msp",
      "minimum support price",
      "procurement price",
      "paddy price",
      "wheat price",
      "government purchase price",
      "एमएसपी",
      "न्यूनतम समर्थन मूल्य",
      "धान का समर्थन मूल्य",
      "धान की कीमत",
      "सरकारी खरीद दर",
      "गेहूं एमएसपी",
    ],
    question: "What is MSP (Minimum Support Price)?",
    questionHi: "न्यूनतम समर्थन मूल्य (MSP) क्या है और धान की दर क्या है?",
    answer:
      "MSP is the minimum price guaranteed by the government for purchasing agricultural produce from farmers, ensuring they do not suffer distress sales.\n\nChhattisgarh farmers receive guaranteed procurement support for paddy through registered societies as per state government guidelines and central MSP announcements.",
    answerHi:
      "न्यूनतम समर्थन मूल्य (MSP) वह न्यूनतम मूल्य है जिस पर सरकार किसानों से उपज खरीदती है, जिससे किसानों को बाजार में कम दामों पर फसल बेचने की मजबूरी न हो।\n\nछत्तीसगढ़ में धान की रिकॉर्ड सरकारी खरीद पंजीकृत प्राथमिक कृषि सहकारी समितियों (उपार्जन केंद्रों) के माध्यम से पारदर्शी रूप से की जाती है।",
    source: SRC_AGR_EN,
    sourceHi: SRC_AGR_HI,
  },

  // ── FARMER REGISTRATION ──────────────────────────────────────────
  {
    keywords: [
      "farmer registration",
      "kisan registration",
      "register farmer",
      "agriculture registration",
      "farmer id",
      "किसान पंजीयन",
      "किसान रजिस्ट्रेशन",
      "कृषि पोर्टल पंजीयन",
      "किसान आईडी",
      "पंजीयन कैसे करें",
    ],
    question: "How do I register as a farmer in Chhattisgarh?",
    questionHi: "छत्तीसगढ़ में किसान पंजीयन कैसे कराएं?",
    answer:
      "To register as a farmer in Chhattisgarh:\n1. Visit the portal: agriportal.cg.nic.in or your local Gram Panchayat / Block Agriculture Office.\n2. Carry documents: Aadhaar card, Land record booklet (B1/P2/ऋण पुस्तिका), bank account passbook, and linked active mobile number.\n3. Registration enables access to DBT schemes, subsidized inputs, and paddy procurement.",
    answerHi:
      "छत्तीसगढ़ में किसान पंजीयन की प्रक्रिया:\n1. पोर्टल agriportal.cg.nic.in अथवा अपनी प्राथमिक सहकारी समिति/विकासखंड कृषि कार्यालय जाएं।\n2. आवश्यक दस्तावेज: आधार कार्ड, जमीन के पर्चे (B1/P2/ऋण पुस्तिका), बैंक पासबुक एवं आधार लिंक्ड मोबाइल नंबर।\n3. पंजीयन से शासकीय योजनाओं, उर्वरक सब्सिडी तथा धान उपार्जन का सीधा लाभ मिलता है।",
    source: SRC_AGR_EN,
    sourceHi: SRC_AGR_HI,
  },

  // ── SEEDS ────────────────────────────────────────────────────────
  {
    keywords: [
      "seed",
      "beej",
      "certified seed",
      "quality seed",
      "seed subsidy",
      "crop variety",
      "बीज",
      "प्रमाणित बीज",
      "उन्नत बीज",
      "बीज अनुदान",
      "बीज निगम",
      "धान का बीज",
    ],
    question: "How can farmers get quality certified seeds?",
    questionHi: "किसान प्रमाणित एवं उन्नत बीज कहाँ से प्राप्त कर सकते हैं?",
    answer:
      "High-yield certified seeds are distributed through:\n• Chhattisgarh Rajya Beej Nigam distribution depots\n• Primary Agricultural Credit Societies (PACS/लैम्प्स)\n• Agriculture Department distribution centers\n\nSeed subsidies are provided under various national and state crop promotion schemes.",
    answerHi:
      "उच्च गुणवत्ता युक्त प्रमाणित बीज निम्नलिखित माध्यमों से उपलब्ध कराए जाते हैं:\n• छत्तीसगढ़ राज्य बीज एवं कृषि विकास निगम के विक्रय केंद्र\n• प्राथमिक कृषि साख सहकारी समितियां (लैम्प्स)\n• कृषि विभाग के क्षेत्रीय वितरण केंद्र\n\nविभिन्न विभागीय योजनाओं के तहत प्रमाणित बीजों पर शासकीय अनुदान भी दिया जाता है।",
    source: SRC_AGR_EN,
    sourceHi: SRC_AGR_HI,
  },

  // ── IRRIGATION ───────────────────────────────────────────────────
  {
    keywords: [
      "drip irrigation",
      "sprinkler irrigation",
      "micro irrigation",
      "pmksy",
      "irrigation subsidy",
      "sinchai",
      "ड्रिप सिंचाई",
      "स्प्रिंकलर",
      "सूक्ष्म सिंचाई",
      "सिंचाई अनुदान",
      "पीएमकेएसवाई",
      "सिंचाई योजना",
      "टपक सिंचाई",
    ],
    question: "What irrigation subsidies are available?",
    questionHi: "ड्रिप एवं स्प्रिंकलर (सूक्ष्म सिंचाई) पर क्या अनुदान उपलब्ध है?",
    answer:
      "Under Pradhan Mantri Krishi Sinchayee Yojana (PMKSY - Per Drop More Crop):\n• Drip Irrigation: 50% to 55% subsidy for small/marginal farmers (higher support for SC/ST beneficiaries)\n• Sprinkler Irrigation: 45% to 55% subsidy\n\nSubmit your application through the district horticulture/agriculture office along with land records and bank details.",
    answerHi:
      "प्रधानमंत्री कृषि सिंचाई योजना (PMKSY - प्रति बूंद अधिक फसल) के तहत:\n• ड्रिप (टपक) सिंचाई: लघु एवं सीमांत किसानों को 50% से 55% तक अनुदान (एससी/एसटी हेतु विशेष सहायता)\n• स्प्रिंकलर (फव्वारा) सिंचाई: 45% से 55% अनुदान\n\nआवेदन अपने जिले के उप संचालक उद्यानिकी/कृषि कार्यालय में आवश्यक भूमि दस्तावेजों के साथ प्रस्तुत करें।",
    source: SRC_AGR_EN,
    sourceHi: SRC_AGR_HI,
  },

  // ── HORTICULTURE ─────────────────────────────────────────────────
  {
    keywords: [
      "horticulture",
      "vegetable farming",
      "fruit farming",
      "garden",
      "udyan",
      "bagwani",
      "nhm",
      "उद्यानिकी",
      "सब्जी की खेती",
      "फलों की खेती",
      "बागवानी",
      "राष्ट्रीय बागवानी मिशन",
      "उद्यानिकी अनुदान",
      "सब्जी उत्पादन",
    ],
    question: "What schemes are available for horticulture farmers?",
    questionHi: "उद्यानिकी (फल-सब्जी) उत्पादक किसानों के लिए कौन-सी योजनाएं हैं?",
    answer:
      "Major horticulture assistance schemes include:\n• Mission for Integrated Development of Horticulture (MIDH): Subsidies for fruit orchards, high-tech polyhouses, and shaded nets\n• Cold storage & post-harvest pack house assistance\n• Quality planting material and vegetable hybrid seeds\n\nContact the Directorate of Horticulture, Chhattisgarh for guidelines.",
    answerHi:
      "उद्यानिकी कृषकों के लिए प्रमुख शासकीय योजनाएं:\n• एकीकृत बागवानी विकास मिशन (MIDH): नए फलोद्यान, ग्रीनहाउस, पॉलीहाउस एवं शेडनेट निर्माण पर अनुदान\n• कोल्ड स्टोरेज, पैक हाउस एवं ग्रेडिंग यूनिट्स हेतु वित्तीय सहायता\n• संकर सब्जी बीज एवं फलदार पौध वितरण\n\nविस्तृत जानकारी हेतु जिले के उप संचालक उद्यानिकी कार्यालय से संपर्क करें।",
    source: SRC_AGR_EN,
    sourceHi: SRC_AGR_HI,
  },

  // ── ORGANIC FARMING ──────────────────────────────────────────────
  {
    keywords: [
      "organic farming",
      "jaivik kheti",
      "natural farming",
      "paramparagat krishi",
      "pkvy",
      "organic certification",
      "जैविक खेती",
      "प्राकृतिक खेती",
      "परंपरागत कृषि विकास योजना",
      "पीकेवीवाई",
      "जैविक प्रमाणीकरण",
      "गोबर खाद",
    ],
    question: "What support is available for organic farming?",
    questionHi: "जैविक एवं प्राकृतिक खेती के लिए क्या प्रोत्साहन मिलता है?",
    answer:
      "Under Paramparagat Krishi Vikas Yojana (PKVY):\n• ₹50,000 per hectare assistance over 3 years (with direct support for bio-inputs, seeds, and manure)\n• Free Participatory Guarantee System (PGS) organic certification\n• Assistance in organic marketing and packaging clusters\n\nForm a farmer cluster of 20+ hectares through your local Agriculture Extension Officer.",
    answerHi:
      "परंपरागत कृषि विकास योजना (PKVY) के अंतर्गत:\n• 3 वर्षों में ₹50,000 प्रति हेक्टेयर की सहायता (जैविक खाद, जैव उर्वरक एवं बीजों हेतु)\n• पीजीएस (PGS-India) जैविक प्रमाणीकरण की निःशुल्क सुविधा\n• जैविक उत्पादों के विपणन व ब्रांडिंग हेतु सहयोग\n\nयोजना का लाभ लेने के लिए अपने क्षेत्रीय कृषि विकास अधिकारी से संपर्क कर किसान समूह बनाएं।",
    source: SRC_AGR_EN,
    sourceHi: SRC_AGR_HI,
  },

  // ── TRAINING / KVK ───────────────────────────────────────────────
  {
    keywords: [
      "training",
      "kvk",
      "krishi vigyan kendra",
      "farmer training",
      "workshop",
      "demonstration plot",
      "कृषि विज्ञान केंद्र",
      "केवीके",
      "किसान प्रशिक्षण",
      "कृषि कार्यशाला",
      "खेती की ट्रेनिंग",
      "कृषि मेला",
    ],
    question: "Where can farmers get free training and technical support?",
    questionHi: "किसान वैज्ञानिक खेती का निःशुल्क प्रशिक्षण कहाँ से ले सकते हैं?",
    answer:
      "Krishi Vigyan Kendras (KVKs) established in every district provide free hands-on training on:\n• Scientific crop production and high-yielding varieties\n• Integrated nutrient and pest management\n• Soil conservation and water harvesting techniques\n• Agro-processing, mushroom cultivation, and beekeeping\n\nReach out to your district KVK or Indira Gandhi Krishi Vishwavidyalaya (IGKV), Raipur.",
    answerHi:
      "प्रत्येक जिले में स्थापित कृषि विज्ञान केंद्र (KVK) किसानों को निःशुल्क व्यावहारिक प्रशिक्षण देते हैं:\n• उन्नत फसल उत्पादन तकनीक एवं नई किस्मों की जानकारी\n• समन्वित पोषण एवं कीट प्रबंधन\n• मृदा स्वास्थ्य एवं जल संरक्षण के उपाय\n• कृषि प्रसंस्करण, मशरूम उत्पादन एवं मधुमक्खी पालन\n\nअपने जिले के कृषि विज्ञान केंद्र या इंदिरा गांधी कृषि विश्वविद्यालय, रायपुर से संपर्क करें।",
    source: SRC_AGR_EN,
    sourceHi: SRC_AGR_HI,
  },

  // ── HORTICULTURE & SCHEMES ───────────────────────────────────────
  {
    keywords: [
      "horticulture",
      "horticulture scheme",
      "bagwani",
      "udyaniki",
      "fruit farming",
      "vegetable farming",
      "polyhouse",
      "shadenet",
      "midh",
      "उद्यानिकी",
      "बागवानी",
      "उद्यानिकी योजना",
      "फल की खेती",
      "सब्जी की खेती",
      "पॉलीहाउस",
    ],
    question: "What horticulture schemes are available in Chhattisgarh?",
    questionHi: "छत्तीसगढ़ में कौन सी उद्यानिकी (बागवानी) योजनाएं उपलब्ध हैं?",
    answer:
      "Key Horticulture Schemes in Chhattisgarh:\n• Mission for Integrated Development of Horticulture (MIDH): 40%–50% subsidy on new orchards, polyhouse/shadenet, and pack houses.\n• State Schemes: Samakit Udyaniki Karya Yojana, Masala Kshetra Vistar (spices), and Potato Crop Demonstration.\n• Micro-Irrigation (PMKSY/State KSY): 50%–55% subsidy on drip and sprinkler systems.\n\nApply on the Horticulture Portal: https://agriportal.cg.nic.in/horticulture/HortiEn/Default.aspx",
    answerHi:
      "छत्तीसगढ़ में प्रमुख उद्यानिकी योजनाएं:\n• एकीकृत बागवानी विकास मिशन (MIDH): नए बगीचे लगाने, पॉलीहाउस/शेडनेट एवं पैकहाउस पर 40% से 50% तक अनुदान।\n• राज्य पोषित योजनाएं: समेकित उद्यानिकी कार्य योजना, मसाला क्षेत्र विस्तार योजना एवं आलू प्रदर्शन योजना।\n• सूक्ष्म सिंचाई: ड्रिप एवं स्प्रिंकलर पर 50% से 55% अनुदान।\n\nआधिकारिक पोर्टल: https://agriportal.cg.nic.in/horticulture/HortiHi/Default.aspx",
    source: SRC_HORTI_EN,
    sourceHi: SRC_HORTI_HI,
  },
  {
    keywords: [
      "apply horticulture",
      "horticulture subsidy",
      "horticulture documents",
      "bagwani anudan",
      "udyaniki aavedan",
      "उद्यानिकी आवेदन",
      "बागवानी अनुदान",
      "उद्यानिकी दस्तावेज",
    ],
    question: "How do farmers apply for horticulture subsidies in Chhattisgarh?",
    questionHi: "छत्तीसगढ़ में उद्यानिकी अनुदान के लिए आवेदन कैसे करें?",
    answer:
      "To apply for Horticulture Subsidies in Chhattisgarh:\n1. Online: Apply through https://agriportal.cg.nic.in/horticulture/HortiEn/Default.aspx or CSC center.\n2. Offline: Contact your Block Senior Horticulture Development Officer (SHDO) or Rural Horticulture Extension Officer (RHEO).\n3. Required Documents: Aadhaar card, B-1 and Khasra land records, Bank passbook copy (IFSC), passport photos, and caste certificate (if SC/ST).\n\nHelpline: 1800-180-1551 (Toll-Free).",
    answerHi:
      "छत्तीसगढ़ उद्यानिकी अनुदान हेतु आवेदन प्रक्रिया:\n1. ऑनलाइन: https://agriportal.cg.nic.in/horticulture/HortiHi/Default.aspx या लोक सेवा केंद्र से।\n2. ऑफलाइन: विकासखंड के वरिष्ठ उद्यान विकास अधिकारी (SHDO) या ग्रामीण उद्यान विस्तार अधिकारी (RHEO) से संपर्क करें।\n3. दस्तावेज: आधार कार्ड, बी-1 एवं खसरा नकल, बैंक पासबुक (IFSC), फोटो एवं जाति प्रमाण पत्र (यदि लागू हो)।\n\nहेल्पलाइन: 1800-180-1551 (टोल-फ्री)।",
    source: SRC_HORTI_EN,
    sourceHi: SRC_HORTI_HI,
  },

  // ── HELPLINE (Suggestion) ────────────────────────────────────────
  {
    keywords: [
      "farmer helpline",
      "helpline",
      "contact number",
      "phone",
      "toll free",
      "kisan call center",
      "customer care",
      "help number",
      "किसान हेल्पलाइन",
      "हेल्पलाइन नंबर",
      "टोल फ्री नंबर",
      "किसान कॉल सेंटर",
      "कृषि विभाग फोन नंबर",
    ],
    question: "What is the Farmer Helpline number?",
    questionHi: "किसान हेल्पलाइन एवं कॉल सेंटर का नंबर क्या है?",
    answer:
      "Farmer Helpline Numbers:\n• Kisan Call Center (Toll Free): 1800-180-1551 (Mon–Sat, 6 AM – 10 PM)\n• Crop Insurance Helpline: 14447\n• PM-KISAN Helpline: 155261\n• CG Agriculture Dept: 0771-2234491",
    answerHi:
      "किसान हेल्पलाइन नंबर:\n• किसान कॉल सेंटर (टोल फ्री): 1800-180-1551 (सोमवार से शनिवार, सुबह 6 से रात 10 बजे)\n• फसल बीमा हेल्पलाइन: 14447\n• पीएम-किसान हेल्पलाइन: 155261\n• छत्तीसगढ़ कृषि विभाग: 0771-2234491",
    source: SRC_AGR_EN,
    sourceHi: SRC_AGR_HI,
  },
];

// ─── Fallback Answers ────────────────────────────────────────────────────────
export const FALLBACK_ANSWER_EN =
  "Sorry, I don't have this specific information in the local database. Please check the official government websites for updated and verified details:\n\n🌐 **Official Websites:**\n• PM-KISAN Portal: https://pmkisan.gov.in\n• Chhattisgarh Agriculture Department: https://agriportal.cg.nic.in\n• Ministry of Agriculture & Farmers Welfare: https://agricoop.nic.in\n\n📞 Kisan Call Center (Toll Free): 1800-180-1551";

export const FALLBACK_ANSWER_HI =
  "क्षमा करें, स्थानीय डेटाबेस में यह जानकारी उपलब्ध नहीं है। कृपया अद्यतन एवं सत्यापित जानकारी के लिए आधिकारिक सरकारी वेबसाइट देखें:\n\n🌐 **आधिकारिक पोर्टल:**\n• पीएम-किसान पोर्टल: https://pmkisan.gov.in\n• छत्तीसगढ़ कृषि विभाग पोर्टल: https://agriportal.cg.nic.in\n• कृषि एवं किसान कल्याण मंत्रालय: https://agricoop.nic.in\n\n📞 किसान कॉल सेंटर (टोल-फ्री): 1800-180-1551";

export const FALLBACK_ANSWER_HINGLISH =
  "Maaf kijiye, local database me yeh jankari uplabdh nahi hai. Kripya verified jankari ke liye official government website check karein:\n\n🌐 **Official Websites:**\n• PM-KISAN Portal: https://pmkisan.gov.in\n• CG Agriculture Portal: https://agriportal.cg.nic.in\n• Ministry of Agriculture: https://agricoop.nic.in\n\n📞 Kisan Call Center (Toll-Free): 1800-180-1551";

export const FALLBACK_ANSWER = FALLBACK_ANSWER_EN;

// ─── Keyword-scoring match engine ────────────────────────────────────────────
export interface MatchedResult {
  entry: QAEntry;
  answer: string;
  source?: QASource;
}

/**
 * Detects whether the query has Devanagari script characters.
 */
export function isDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Scores each Q&A entry by summing lengths of keywords found in the query.
 * Longer keywords are more specific and get a higher weight naturally.
 * Returns the best-matching entry and appropriate language text.
 */
export function normalizeAgriQuery(text: string): string {
  let q = text.toLowerCase();
  q = q.replace(/\bkishan\b/g, "kisan");
  q = q.replace(/\bkisaan\b/g, "kisan");
  q = q.replace(/\bkissan\b/g, "kisan");
  q = q.replace(/\byojna\b/g, "yojana");
  q = q.replace(/\bphasal\b/g, "fasal");
  q = q.replace(/\bsaman\b/g, "samman");
  q = q.replace(/\baadhar\b/g, "aadhaar");
  return q;
}

export function findAnswer(
  query: string,
  preferredLang: "en" | "hi" = "en",
): MatchedResult | null {
  const original = query.toLowerCase().trim();
  const normalised = normalizeAgriQuery(original);
  let bestScore = 0;
  let bestMatch: QAEntry | null = null;

  for (const entry of QA_DATABASE) {
    let score = 0;
    for (const kw of entry.keywords) {
      const kwLower = kw.toLowerCase();
      if (original.includes(kwLower) || normalised.includes(kwLower)) {
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestScore === 0 || !bestMatch) {
    return null;
  }

  // Determine whether to serve Hindi or English answer:
  // If user query typed in Hindi, respond in Hindi.
  // Otherwise follow preferredLang.
  const targetLang: "en" | "hi" = isDevanagari(query) ? "hi" : preferredLang;

  const answer = targetLang === "hi" ? bestMatch.answerHi : bestMatch.answer;
  const source = targetLang === "hi" ? bestMatch.sourceHi ?? bestMatch.source : bestMatch.source;

  return {
    entry: bestMatch,
    answer,
    source,
  };
}
