/**
 * Agriculture Knowledge Base — Verified Chunks
 *
 * All content sourced from:
 * - PM-KISAN: pmkisan.gov.in
 * - PMFBY: pmfby.gov.in
 * - RKVY: rkvy.nic.in
 * - NFSM: nfsm.gov.in
 * - CG Agriculture Portal: agriportal.cg.nic.in
 * - KCC: nafscob.org / RBI guidelines
 * - Soil Health Card: soilhealth.dac.gov.in
 * - PKVY / Organic: pgsindia-ncof.gov.in
 * - Kisan Call Center: mkisan.gov.in
 *
 * Each chunk is structured for hybrid BM25 + semantic retrieval.
 */

export interface KBChunk {
  id: string;
  domain: string;      // matches AgriDomain
  title: string;
  titleHi: string;
  content: string;     // English content
  contentHi: string;   // Hindi content
  contentHinglish: string; // Romanized Hindi content
  keywords: string[];  // for BM25 scoring
  source: {
    title: string;
    url: string;
    department: string;
    lastVerified: string; // Month-Year
  };
  embedding?: number[]; // populated at startup by ragEngine
}

export const KNOWLEDGE_BASE: KBChunk[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // PM-KISAN
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "pmkisan-overview",
    domain: "government_schemes",
    title: "PM-KISAN: Overview & Benefits",
    titleHi: "पीएम-किसान योजना: परिचय एवं लाभ",
    content:
      "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi) provides ₹6,000 per year to eligible farmer families, paid in 3 installments of ₹2,000 each directly to their Aadhaar-linked bank account via DBT (Direct Benefit Transfer).\n\nEligibility: All landholding farmer families (small, marginal, and other categories) are eligible, subject to exclusion criteria.\n\nExcluded categories: Institutional land holders, farmer families with constitutional positions, serving/retired government employees (above Class IV), income tax payers, and registered doctors/engineers/lawyers/CAs.\n\nInstallment schedule: April–July, August–November, December–March.",
    contentHi:
      "पीएम-किसान (प्रधानमंत्री किसान सम्मान निधि) योजना के तहत पात्र किसान परिवारों को प्रतिवर्ष ₹6,000 की वित्तीय सहायता दी जाती है। यह राशि ₹2,000 की तीन समान किस्तों में सीधे आधार-लिंक्ड बैंक खाते में DBT के माध्यम से भेजी जाती है।\n\nपात्रता: सभी भूमिधारी किसान परिवार (लघु, सीमांत एवं अन्य श्रेणी)।\n\nअपात्र: संवैधानिक पद धारक, सेवारत/सेवानिवृत्त सरकारी कर्मचारी (चतुर्थ श्रेणी से ऊपर), आयकरदाता, पंजीकृत डॉक्टर, इंजीनियर, वकील, CA।\n\nकिस्त अवधि: अप्रैल–जुलाई, अगस्त–नवंबर, दिसंबर–मार्च।",
    contentHinglish:
      "PM-KISAN yojana mein patra kisan parivar ko har saal ₹6,000 milte hain. Yeh ₹2,000 ki teen kiston mein seedha bank account mein aata hai (DBT se).\n\nPatra kaun: Sabhi zameen wale kisan parivar (chhote, seemant, aur doosre).\n\nApatra: Sarkar ke uchch posts wale, income tax bharane wale, doctor/engineer/vakeel/CA.\n\nKist ka samay: April–July, August–November, December–March.",
    keywords: [
      "pm kisan", "pmkisan", "kisan samman nidhi", "6000", "2000 installment",
      "dbt", "direct benefit", "farmer income support", "पीएम किसान",
      "किसान सम्मान निधि", "6000 रुपये", "डीबीटी",
    ],
    source: {
      title: "PM-KISAN Official Portal",
      url: "https://pmkisan.gov.in",
      department: "Ministry of Agriculture & Farmers Welfare, GoI",
      lastVerified: "October 2025",
    },
  },
  {
    id: "pmkisan-registration",
    domain: "farmer_registration",
    title: "PM-KISAN: How to Register & Check Status",
    titleHi: "पीएम-किसान: पंजीयन एवं स्थिति जांच कैसे करें",
    content:
      "How to register for PM-KISAN:\n1. Visit pmkisan.gov.in → 'Farmers Corner' → 'New Farmer Registration'\n2. Enter Aadhaar number, mobile number, and state\n3. Fill land and bank details; submit OTP verification\n4. Visit nearest CSC or Block Agriculture Office for assisted registration\n\nStatus check: pmkisan.gov.in → Farmers Corner → Beneficiary Status → Enter Aadhaar/mobile/account\n\nPM-KISAN Helpline: 155261 or 011-24300606",
    contentHi:
      "पीएम-किसान में पंजीयन कैसे करें:\n1. pmkisan.gov.in → 'Farmers Corner' → 'New Farmer Registration'\n2. आधार नंबर, मोबाइल, और राज्य दर्ज करें\n3. भूमि एवं बैंक विवरण भरें; OTP सत्यापन करें\n4. नजदीकी CSC या विकासखंड कृषि कार्यालय में सहायता लें\n\nस्थिति जांच: pmkisan.gov.in → Beneficiary Status → आधार/मोबाइल/खाता नंबर डालें\n\nPM-KISAN हेल्पलाइन: 155261 या 011-24300606",
    contentHinglish:
      "PM-KISAN mein register kaise karein:\n1. pmkisan.gov.in → Farmers Corner → New Farmer Registration\n2. Aadhaar number, mobile, aur state daalo\n3. Zameen aur bank details bharo; OTP se verify karo\n4. Najdeeki CSC ya Block Krishi Karyalay mein jaao\n\nStatus dekhne ke liye: pmkisan.gov.in → Beneficiary Status → Aadhaar/mobile dalo\n\nHelpline: 155261",
    keywords: [
      "pm kisan registration", "pmkisan register", "beneficiary status",
      "kisan portal", "csc registration", "155261", "pm kishan register",
      "पीएम किसान पंजीयन", "लाभार्थी स्थिति",
    ],
    source: {
      title: "PM-KISAN Official Portal",
      url: "https://pmkisan.gov.in",
      department: "Ministry of Agriculture & Farmers Welfare, GoI",
      lastVerified: "October 2025",
    },
  },
  {
    id: "pmkisan-eligibility-age",
    domain: "government_schemes",
    title: "PM-KISAN: Age Limit, Eligibility & Criteria",
    titleHi: "पीएम-किसान: आयु सीमा, पात्रता एवं नियम",
    content:
      "Age Limit & Eligibility for PM-KISAN (Pradhan Mantri Kisan Samman Nidhi):\n\n• Minimum Age: 18 years (applicant must be a major/adult farmer with cultivable land registered in their name).\n• Maximum / Upper Age Limit: THERE IS NO UPPER AGE LIMIT. Senior citizens and elderly farmers (60+, 70+, 80+ years) are fully eligible to apply.\n\nEligibility Criteria:\n1. Land Ownership: Must have cultivable landholding in own name (documented in Khasra / B-1 / Jamabandi land records).\n2. Bank Account: Bank account must be Aadhaar-seeded and active for DBT transfer.\n3. e-KYC: Mandatory via OTP on pmkisan.gov.in or biometric at CSC.\n\nExcluded / Ineligible Categories:\n• Institutional landholders\n• Serving or retired government employees / officers (excluding Class IV / MTS)\n• Income tax payers in the previous assessment year\n• Professionals (Doctors, Engineers, Lawyers, Chartered Accountants)\n• Pensioners receiving monthly pension of ₹10,000 or more (excluding Class IV)\n\nNote: For PM Kisan Maandhan Yojana (the separate voluntary pension scheme), the entry age is 18 to 40 years to receive ₹3,000/month after age 60.\n\nHelpline: 155261 / 1800-180-1551 | Official Portal: https://pmkisan.gov.in",
    contentHi:
      "पीएम-किसान (PM-KISAN) योजना हेतु आयु सीमा एवं पात्रता नियम:\n\n• न्यूनतम आयु: 18 वर्ष (आवेदक किसान बालिग होना चाहिए और उसके नाम पर कृषि भूमि दर्ज होनी चाहिए)।\n• अधिकतम आयु सीमा: कोई अधिकतम उम्र सीमा नहीं है! किसी भी आयु के वरिष्ठ किसान (60, 70, 80+ वर्ष) पूरी तरह पात्र हैं।\n\nपात्रता शर्तें:\n1. भूमि स्वामित्व: अपने नाम पर खेती योग्य जमीन (खसरा/बी-1 में दर्ज) होनी चाहिए।\n2. बैंक खाता: बैंक खाता आधार से लिंक और DBT सक्रिय होना चाहिए।\n3. e-KYC: pmkisan.gov.in पर या CSC केंद्र से e-KYC पूर्ण होना अनिवार्य है।\n\nअपात्र श्रेणियां:\n• संस्थागत भूमिधारक\n• सेवारत या सेवानिवृत्त सरकारी कर्मचारी (चतुर्थ श्रेणी को छोड़कर)\n• पिछले वर्ष आयकर (Income Tax) देने वाले\n• पेशेवर: डॉक्टर, इंजीनियर, वकील, चार्टर्ड अकाउंटेंट (CA)\n• ₹10,000 से अधिक मासिक पेंशन पाने वाले (चतुर्थ श्रेणी छोड़कर)\n\nविशेष: पीएम किसान मानधन पेंशन योजना में जुड़ने की आयु 18 से 40 वर्ष है।\n\nहेल्पलाइन: 155261 / 1800-180-1551 | आधिकारिक पोर्टल: https://pmkisan.gov.in",
    contentHinglish:
      "PM-KISAN scheme ke liye Age Limit aur Eligibility rules:\n\n• Minimum Age: 18 saal (kisan baalig hona chahiye aur zameen unke naam honi chahiye).\n• Maximum Age: KOI MAXIMUM AGE LIMIT NAHI HAI. Kisi bhi umar ke bujurg kisan (60, 70, 80+ saal) bhi apply kar sakte hain.\n\nEligibility:\n• Apne naam par kheti ki zameen (Khasra/B-1 record) honi chahiye\n• Bank account Aadhaar-linked aur DBT-enabled hona chahiye\n• e-KYC complete hona zaroori hai\n\nKaun apply nahi kar sakta:\n• Sarkari naukri wale ya pension wale (Class 4 chhodkar)\n• Income tax bharne wale\n• Doctor, engineer, lawyer, CA\n\nPM Kisan Maandhan Pension yojana mein joining age 18 se 40 saal hai.\n\nHelpline: 155261 | Portal: pmkisan.gov.in",
    keywords: [
      "pm kisan age limit", "age limit pm kisan", "age limit to apply for pm kisan",
      "pm kishan age limit", "age limit to apply for pm kishan", "pm kishan age",
      "age limit", "age criteria", "maximum age", "minimum age", "upper age limit",
      "eligibility pm kisan", "pm kisan eligibility", "patrata", "who can apply",
      "pm kishan", "pmkisan age", "18 years", "no age limit", "pm kisan maandhan",
      "उम्र सीमा", "आयु सीमा", "पात्रता", "पीएम किसान आयु सीमा", "पीएम किसान उम्र सीमा",
    ],
    source: {
      title: "PM-KISAN Official Guidelines & Eligibility",
      url: "https://pmkisan.gov.in",
      department: "Ministry of Agriculture & Farmers Welfare, GoI",
      lastVerified: "October 2025",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PMFBY — Crop Insurance
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "pmfby-overview",
    domain: "crop_insurance",
    title: "PMFBY: Pradhan Mantri Fasal Bima Yojana — Overview",
    titleHi: "पीएमएफबीवाई: प्रधानमंत्री फसल बीमा योजना — परिचय",
    content:
      "Pradhan Mantri Fasal Bima Yojana (PMFBY) protects farmers against crop losses due to drought, flood, hailstorm, pest attack, landslide, and other natural calamities.\n\nPremium rates (farmer's share):\n• Kharif crops: 2% of sum insured\n• Rabi crops: 1.5% of sum insured\n• Annual commercial/horticulture crops: 5% of sum insured\n\nThe remaining premium is shared equally by Central and State governments.\n\nEnrollment: Through banks (if crop loan availed) or voluntary via CSC/pmfby.gov.in app.",
    contentHi:
      "प्रधानमंत्री फसल बीमा योजना (PMFBY) किसानों को सूखा, बाढ़, ओलावृष्टि, कीट हमला, भूस्खलन जैसी प्राकृतिक आपदाओं से फसल क्षति पर बीमा सुरक्षा देती है।\n\nप्रीमियम दर (किसान का हिस्सा):\n• खरीफ फसलें: बीमित राशि का 2%\n• रबी फसलें: बीमित राशि का 1.5%\n• वार्षिक बागवानी फसलें: बीमित राशि का 5%\n\nशेष प्रीमियम केंद्र एवं राज्य सरकार द्वारा समान रूप से वहन किया जाता है।",
    contentHinglish:
      "PMFBY mein fasal ko prakritik aapda se bachaya jata hai (sukha, baadh, olavrishti, keet attack).\n\nPremium (kisan ka hissa):\n• Kharif: 2% of insured amount\n• Rabi: 1.5%\n• Horticulture: 5%\n\nBaaki premium central aur state sarkar milke bharte hain.",
    keywords: [
      "pmfby", "fasal bima", "crop insurance", "pradhan mantri fasal bima",
      "kharif insurance", "rabi insurance", "2%", "1.5%",
      "फसल बीमा", "पीएमएफबीवाई", "प्रीमियम",
    ],
    source: {
      title: "PMFBY Official Portal",
      url: "https://pmfby.gov.in",
      department: "Ministry of Agriculture & Farmers Welfare, GoI",
      lastVerified: "October 2025",
    },
  },
  {
    id: "pmfby-claim",
    domain: "crop_insurance",
    title: "PMFBY: Crop Loss Reporting & Claim Process",
    titleHi: "पीएमएफबीवाई: फसल क्षति सूचना एवं दावा प्रक्रिया",
    content:
      "Steps to claim crop insurance under PMFBY:\n1. Report crop loss within 72 hours of damage occurrence\n2. How to report: Call PMFBY Toll-Free 14447, or use 'Crop Insurance' mobile app, or inform your bank/insurance agent\n3. Fill crop loss intimation form with: survey number, area affected, crop, damage cause\n4. A joint surveyor team (insurance company + agriculture dept) will inspect\n5. Approved claim amount is credited directly to your bank account via NEFT\n\nImportant: For localized losses (hailstorm, landslide, inundation in specific fields), report within 72 hours. For widespread calamity, state government declares the event.",
    contentHi:
      "PMFBY के अंतर्गत दावा प्रक्रिया:\n1. फसल क्षति होने के 72 घंटों के भीतर सूचना दें\n2. सूचना कैसे दें: टोल फ्री 14447 पर कॉल करें, 'Crop Insurance App' पर दर्ज करें, या अपने बैंक/बीमा एजेंट को बताएं\n3. सर्वे नंबर, प्रभावित क्षेत्र, फसल, क्षति का कारण भरें\n4. संयुक्त सर्वेक्षण दल (बीमा कंपनी + कृषि विभाग) निरीक्षण करेगा\n5. स्वीकृत राशि सीधे बैंक खाते में NEFT द्वारा जमा होगी",
    contentHinglish:
      "PMFBY claim kaise karein:\n1. Fasal damage hone ke 72 ghante ke andar khabar deni hoti hai\n2. Kahan report karein: Toll-free 14447 pe call, Crop Insurance App, ya bank/insurance agent\n3. Survey number, affected area, fasal ka naam, aur nuksan ka karan batao\n4. Joint surveyor team aayegi dekhne\n5. Approved amount seedha bank account mein aayega",
    keywords: [
      "pmfby claim", "crop loss claim", "fasal bima claim", "72 hour",
      "14447", "crop insurance claim", "loss intimation", "surveyor",
      "फसल बीमा क्लेम", "बीमा दावा", "72 घंटे",
    ],
    source: {
      title: "PMFBY Official Portal",
      url: "https://pmfby.gov.in",
      department: "Ministry of Agriculture & Farmers Welfare, GoI",
      lastVerified: "October 2025",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RKVY — Rashtriya Krishi Vikas Yojana
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "rkvy-overview",
    domain: "government_schemes",
    title: "RKVY: Rashtriya Krishi Vikas Yojana — Holistic Agriculture Development",
    titleHi: "आरकेवीवाई: राष्ट्रीय कृषि विकास योजना",
    content:
      "Rashtriya Krishi Vikas Yojana (RKVY) is a Centrally Sponsored Scheme aimed at achieving 4% annual growth in the agriculture sector by incentivizing state governments to increase public investment.\n\nKey components:\n• Infrastructure development (cold storage, warehouses, pack houses)\n• Farm mechanization (tractors, harvesters, power tillers)\n• Soil health improvement and micro-irrigation\n• Crop diversification and horticulture promotion\n• Agri-startups and innovation (RAFTAAR sub-scheme)\n\nFunding pattern: 60:40 (Centre:State); 90:10 for NE and hill states.\n\nIn Chhattisgarh: Contact the Directorate of Agriculture or visit agriportal.cg.nic.in for state-specific projects.",
    contentHi:
      "राष्ट्रीय कृषि विकास योजना (RKVY) एक केंद्र प्रायोजित योजना है जो कृषि क्षेत्र में 4% वार्षिक विकास के लक्ष्य को प्राप्त करने के लिए राज्यों को प्रोत्साहित करती है।\n\nप्रमुख घटक:\n• आधारभूत संरचना (कोल्ड स्टोरेज, गोदाम, पैक हाउस)\n• फार्म मशीनीकरण (ट्रैक्टर, हार्वेस्टर)\n• मृदा स्वास्थ्य एवं सूक्ष्म सिंचाई\n• फसल विविधीकरण एवं बागवानी संवर्धन\n• कृषि स्टार्टअप (RAFTAAR उप-योजना)",
    contentHinglish:
      "RKVY ek government scheme hai jo agriculture ka 4% har saal badhane ke liye hai.\n\nIsmein kya milta hai:\n• Cold storage, warehouse, pack house\n• Tractor, harvester ki subsidy\n• Drip irrigation\n• Fasal badlav aur bagwani\n• Agri-startup support (RAFTAAR)\n\nFunding: 60% central, 40% state.",
    keywords: [
      "rkvy", "rashtriya krishi vikas", "agricultural development",
      "cold storage subsidy", "farm mechanization rkvy",
      "आरकेवीवाई", "राष्ट्रीय कृषि विकास",
    ],
    source: {
      title: "RKVY Official Portal",
      url: "https://rkvy.nic.in",
      department: "Department of Agriculture & Farmers Welfare, GoI",
      lastVerified: "October 2025",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NFSM — National Food Security Mission
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "nfsm-overview",
    domain: "government_schemes",
    title: "NFSM: National Food Security Mission",
    titleHi: "एनएफएसएम: राष्ट्रीय खाद्य सुरक्षा मिशन",
    content:
      "National Food Security Mission (NFSM) aims to increase production of rice, wheat, pulses, coarse cereals, and commercial crops through area expansion and productivity enhancement.\n\nAssistance provided under NFSM:\n• Certified/HYV seeds at subsidized rates\n• Demonstration of improved varieties and technologies\n• Farm machinery (seed drills, zero-till machines, weeders)\n• Soil ameliorants (gypsum, lime) for acidic soils\n• Balanced fertilization guidance\n• Crop cluster development\n\nBeneficiary states: Chhattisgarh is a priority state for NFSM-Rice and NFSM-Pulses.\n\nApply through: Block Agriculture Office or District Agriculture Office.",
    contentHi:
      "राष्ट्रीय खाद्य सुरक्षा मिशन (NFSM) का उद्देश्य चावल, गेहूं, दलहन, मोटे अनाज एवं वाणिज्यिक फसलों के उत्पादन में वृद्धि करना है।\n\nNFSM से सहायता:\n• सब्सिडी पर प्रमाणित/उन्नत बीज\n• उन्नत किस्मों का प्रदर्शन\n• कृषि यंत्र (सीड ड्रिल, जीरो-टिल मशीन)\n• अम्लीय भूमि सुधार\n• संतुलित उर्वरक मार्गदर्शन\n\nछत्तीसगढ़: NFSM-चावल एवं NFSM-दलहन में प्राथमिकता प्रदेश है।",
    contentHinglish:
      "NFSM ek scheme hai jo dhan, gehun, dal, aur doosri fasal ka production badhane ke liye hai.\n\nKya milta hai:\n• Saste mein certified beej\n• Improved variety ka demonstration\n• Yantra (seed drill, zero-till)\n• Mitti sudhaar ke liye gypsum/lime\n\nChhattisgarh NFSM-Rice aur NFSM-Pulses mein priority state hai.",
    keywords: [
      "nfsm", "national food security mission", "food security",
      "rice production", "wheat production", "pulses production",
      "एनएफएसएम", "राष्ट्रीय खाद्य सुरक्षा", "दलहन उत्पादन",
    ],
    source: {
      title: "NFSM Official Portal",
      url: "https://nfsm.gov.in",
      department: "Department of Agriculture & Farmers Welfare, GoI",
      lastVerified: "October 2025",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Kisan Credit Card (KCC)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "kcc-overview",
    domain: "kisan_credit_and_loans",
    title: "Kisan Credit Card (KCC): Short-term Agricultural Credit",
    titleHi: "किसान क्रेडिट कार्ड (KCC): अल्पकालीन कृषि ऋण",
    content:
      "Kisan Credit Card (KCC) provides flexible and affordable short-term credit to farmers for agricultural operations.\n\nKey features:\n• Interest rate: 7% per annum; 3% interest subvention by GoI → effective rate: 4% on prompt repayment\n• Credit limit: Based on cultivated area, crop, and scale of finance fixed by district SLBC\n• Uses: Seeds, fertilizers, pesticides, farm labor, land preparation, post-harvest expenses\n• Coverage: Crop insurance (PMFBY) and asset insurance included\n• Repayment: Flexible — aligned with crop harvest/marketing season\n\nEligible: Individual/joint farmers, tenant farmers, share croppers, SHG/JLG members.\n\nApply at: Any commercial bank, cooperative bank, or Regional Rural Bank (RRB). Also available through Common Service Centers (CSC).",
    contentHi:
      "किसान क्रेडिट कार्ड (KCC) किसानों को कृषि कार्यों हेतु लचीली एवं किफायती ऋण सुविधा देता है।\n\nमुख्य विशेषताएं:\n• ब्याज दर: 7% वार्षिक; सरकार 3% ब्याज सब्सिडी → समय पर भुगतान पर 4% प्रभावी दर\n• ऋण सीमा: जोत क्षेत्र, फसल एवं SLBC द्वारा निर्धारित वित्त मान के अनुसार\n• उपयोग: बीज, खाद, कीटनाशक, श्रम, भूमि तैयारी, फसलोत्तर खर्च\n• बीमा: PMFBY एवं संपत्ति बीमा शामिल\n• आवेदन: वाणिज्यिक बैंक, सहकारी बैंक, RRB, या CSC केंद्र",
    contentHinglish:
      "KCC mein kisan ko kheti ke liye sasta loan milta hai.\n\nFaida:\n• 7% byaj, sarkar 3% deti hai → timely repayment pe sirf 4% lagta hai\n• Loan limit: aapki zameen aur fasal ke hisaab se\n• Use: Beej, khad, keetnaashak, mazdoori\n• Bima bhi saath mein milti hai (PMFBY)\n\nKahan apply karein: Koi bhi bank, sahakari bank, ya RRB mein.",
    keywords: [
      "kisan credit card", "kcc", "crop loan", "agricultural loan",
      "4 percent", "4%", "kisan loan", "interest subvention",
      "किसान क्रेडिट कार्ड", "केसीसी", "कृषि ऋण", "4% ब्याज",
    ],
    source: {
      title: "Kisan Credit Card — NAFSCOB & RBI Guidelines",
      url: "https://nafscob.org",
      department: "Ministry of Agriculture & Farmers Welfare / RBI",
      lastVerified: "October 2025",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Soil Health Card
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "soil-health-card",
    domain: "soil_and_fertilizer",
    title: "Soil Health Card Scheme: Free Soil Testing & Fertilizer Recommendations",
    titleHi: "मृदा स्वास्थ्य कार्ड योजना: निःशुल्क मिट्टी जांच एवं उर्वरक अनुशंसा",
    content:
      "The Soil Health Card Scheme tests 12 soil parameters and provides crop-specific fertilizer recommendations.\n\n12 parameters tested: N, P, K, S, Zn, Fe, Cu, Mn, B, pH, EC, OC\n\nBenefits:\n• Free soil testing at government laboratories\n• Balanced fertilization reduces input costs\n• Improves soil health and long-term crop productivity\n\nHow to get: Contact Block Agriculture Officer or nearest Krishi Vigyan Kendra (KVK). Soil sample collection happens every 2 years.\n\nOnline check: soilhealth.dac.gov.in",
    contentHi:
      "मृदा स्वास्थ्य कार्ड योजना के तहत 12 पोषक तत्वों की जांच कर फसलवार उर्वरक अनुशंसा की जाती है।\n\n12 मापदंड: N, P, K, S, Zn, Fe, Cu, Mn, B, pH, EC, OC\n\nलाभ:\n• शासकीय प्रयोगशाला में निःशुल्क मिट्टी जांच\n• संतुलित उर्वरक से लागत में कमी\n• मिट्टी की उर्वरकता एवं उत्पादकता में सुधार\n\nकैसे प्राप्त करें: ब्लॉक कृषि अधिकारी या नजदीकी KVK से संपर्क करें।",
    contentHinglish:
      "Soil Health Card scheme mein mitti ki jaanch free mein hoti hai (12 cheezen check hoti hain).\n\nFaida:\n• Free soil test government lab mein\n• Sahi khad daalne se kharcha kam hoga\n• Mitti aur fasal dono better rahenge\n\nKahan jaayein: Block Krishi Adhikari ya KVK.\n\nOnline: soilhealth.dac.gov.in",
    keywords: [
      "soil health card", "soil test", "mitti jaanch", "mitti parikshan",
      "fertilizer recommendation", "12 parameters", "npk test",
      "मृदा स्वास्थ्य कार्ड", "मिट्टी जांच", "उर्वरक अनुशंसा",
    ],
    source: {
      title: "Soil Health Card Portal",
      url: "https://soilhealth.dac.gov.in",
      department: "Department of Agriculture & Farmers Welfare, GoI",
      lastVerified: "October 2025",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PKVY — Organic Farming
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "pkvy-organic",
    domain: "organic_farming",
    title: "PKVY: Paramparagat Krishi Vikas Yojana — Organic Farming Support",
    titleHi: "पीकेवीवाई: परंपरागत कृषि विकास योजना — जैविक खेती सहायता",
    content:
      "Paramparagat Krishi Vikas Yojana (PKVY) promotes organic farming through cluster-based approach.\n\nAssistance:\n• ₹50,000 per hectare over 3 years (₹31,000 for bio-inputs, ₹8,800 for packaging, ₹3,000 for transport)\n• Free PGS-India organic certification (Participatory Guarantee System)\n• Assistance for organic marketing, branding, and e-commerce\n\nHow to join:\n• Form a farmer cluster of minimum 20 hectares\n• Contact Block Agriculture Extension Officer\n• Cluster registered under PKVY receives unified benefits",
    contentHi:
      "परंपरागत कृषि विकास योजना (PKVY) जैविक खेती को बढ़ावा देने के लिए क्लस्टर आधारित दृष्टिकोण अपनाती है।\n\nसहायता:\n• ₹50,000 प्रति हेक्टेयर (3 वर्षों में) — जैव इनपुट, पैकेजिंग, परिवहन हेतु\n• PGS-India निःशुल्क जैविक प्रमाणीकरण\n• जैविक उत्पाद विपणन एवं ई-कॉमर्स सहायता",
    contentHinglish:
      "PKVY se jaivik kheti ko support milta hai.\n\nKya milta hai:\n• ₹50,000 per hectare 3 saalon mein (bio-input, packaging, transport ke liye)\n• Free PGS-India organic certification\n• Organic product bechne mein madad\n\nKaise join karein:\n• 20+ hectare ka farmer group banao\n• Block Krishi Adhikari se sampark karo",
    keywords: [
      "pkvy", "paramparagat krishi vikas", "organic farming",
      "jaivik kheti", "organic certification", "pgs",
      "पीकेवीवाई", "जैविक खेती", "परंपरागत कृषि विकास",
    ],
    source: {
      title: "PKVY / PGS-India Portal",
      url: "https://pgsindia-ncof.gov.in",
      department: "Department of Agriculture & Farmers Welfare, GoI",
      lastVerified: "October 2025",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CG Agriculture Portal — State Schemes
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "cg-agri-portal",
    domain: "government_schemes",
    title: "Chhattisgarh Agriculture Portal — State Schemes & Services",
    titleHi: "छत्तीसगढ़ कृषि पोर्टल — राज्य की योजनाएं एवं सेवाएं",
    content:
      "Chhattisgarh Agriculture Department provides various state-specific schemes and services:\n\n• Paddy procurement at MSP through registered Primary Agriculture Cooperative Societies (PACS/LAMPS)\n• Subsidized seeds through CG State Seed & Agricultural Development Corporation\n• Fertilizer distribution via PACS with Aadhaar-linked PoS biometric authentication\n• Rajiv Gandhi Kisan Nyay Yojana: Input subsidy support for paddy, maize, sugarcane, and kodo-kutki farmers\n• Godhan Nyay Yojana: ₹2/kg for cow dung to support organic input production\n• Kisan Suvidha App: Real-time fertilizer stock, weather, market prices\n\nPortal: agriportal.cg.nic.in\nHelpline: 0771-2234491",
    contentHi:
      "छत्तीसगढ़ कृषि विभाग की प्रमुख राज्य योजनाएं:\n\n• MSP पर धान उपार्जन — पंजीकृत सहकारी समितियों (लैम्प्स) के माध्यम से\n• CG राज्य बीज निगम द्वारा सब्सिडी पर बीज वितरण\n• आधार-लिंक्ड PoS से उर्वरक वितरण\n• राजीव गांधी किसान न्याय योजना: धान, मक्का, गन्ना, कोदो-कुटकी पर इनपुट सब्सिडी\n• गोधन न्याय योजना: ₹2/किलो में गोबर की खरीद\n\nपोर्टल: agriportal.cg.nic.in\nहेल्पलाइन: 0771-2234491",
    contentHinglish:
      "Chhattisgarh sarkar ke khas kisan schemes:\n\n• MSP pe dhan kharidi — PACS/LAMPS ke through\n• Subsidy pe beej — CG Beej Nigam se\n• Rajiv Gandhi Kisan Nyay Yojana: dhan, makka, ganna, kodo-kutki pe input subsidy\n• Godhan Nyay Yojana: ₹2/kg mein gaay ka gobar kharida jata hai\n\nPortal: agriportal.cg.nic.in\nHelpline: 0771-2234491",
    keywords: [
      "chhattisgarh agriculture", "cg agri portal", "agriportal",
      "rajiv gandhi kisan nyay", "godhan nyay", "cg scheme",
      "paddy procurement cg", "lamps pacs cg",
      "छत्तीसगढ़ कृषि", "राजीव गांधी किसान न्याय", "गोधन न्याय",
    ],
    source: {
      title: "CG Agriculture Portal",
      url: "https://agriportal.cg.nic.in",
      department: "Agriculture Department, Govt. of Chhattisgarh",
      lastVerified: "October 2025",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MSP — Market Prices
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "msp-paddy",
    domain: "market_and_msp",
    title: "MSP — Minimum Support Price for Paddy & Major Crops",
    titleHi: "MSP — धान एवं प्रमुख फसलों का न्यूनतम समर्थन मूल्य",
    content:
      "The Government of India announces Minimum Support Price (MSP) for 23 major crops annually through CACP (Commission for Agricultural Costs & Prices).\n\nMSP for major Kharif crops (2024-25):\n• Common Paddy (Grade A): ₹2,300/quintal\n• Maize: ₹2,225/quintal\n• Soyabean: ₹4,892/quintal\n• Cotton (medium staple): ₹7,121/quintal\n• Groundnut: ₹6,783/quintal\n\nMSP for major Rabi crops (2024-25):\n• Wheat: ₹2,275/quintal\n• Mustard: ₹5,650/quintal\n• Gram (Chana): ₹5,440/quintal\n• Masoor (Lentil): ₹6,425/quintal\n\nNote: MSP is the floor price. Farmers should check current mandi rates via e-NAM (enam.gov.in) or Agmarknet.",
    contentHi:
      "भारत सरकार प्रतिवर्ष CACP की सिफारिश पर 23 प्रमुख फसलों का MSP (न्यूनतम समर्थन मूल्य) घोषित करती है।\n\nखरीफ फसलें (2024-25):\n• धान (सामान्य/ग्रेड A): ₹2,300/क्विंटल\n• मक्का: ₹2,225/क्विंटल\n• सोयाबीन: ₹4,892/क्विंटल\n• कपास (मध्यम रेशा): ₹7,121/क्विंटल\n\nरबी फसलें (2024-25):\n• गेहूं: ₹2,275/क्विंटल\n• सरसों: ₹5,650/क्विंटल\n• चना: ₹5,440/क्विंटल",
    contentHinglish:
      "Sarkar 23 faslein ke liye MSP (minimum support price) har saal announce karti hai.\n\nKharif 2024-25:\n• Dhan (paddy): ₹2,300/quintal\n• Makka: ₹2,225/quintal\n• Soyabean: ₹4,892/quintal\n\nRabi 2024-25:\n• Gehun: ₹2,275/quintal\n• Sarson: ₹5,650/quintal\n• Chana: ₹5,440/quintal\n\nLive mandi rate: enam.gov.in ya Agmarknet pe dekho.",
    keywords: [
      "msp", "minimum support price", "paddy price", "wheat msp",
      "dhan ka bhav", "msp 2024", "msp 2025", "cacp",
      "न्यूनतम समर्थन मूल्य", "धान का समर्थन मूल्य", "गेहूं एमएसपी",
    ],
    source: {
      title: "CACP / Ministry of Agriculture MSP Announcements",
      url: "https://cacp.dacnet.nic.in",
      department: "Commission for Agricultural Costs & Prices, GoI",
      lastVerified: "October 2025",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Fertilizer Subsidy & Urea MRP
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "fertilizer-subsidy",
    domain: "soil_and_fertilizer",
    title: "Subsidized Fertilizers: Urea, DAP, NPK — MRP & Distribution",
    titleHi: "सब्सिडी युक्त उर्वरक: यूरिया, DAP, NPK — MRP एवं वितरण",
    content:
      "Subsidized fertilizers are distributed to farmers at controlled Maximum Retail Prices (MRP) through Aadhaar-authenticated Point of Sale (PoS) systems.\n\nCurrent MRP (Government controlled):\n• Urea: ₹242 per 45 kg bag (most common nitrogen fertilizer)\n• DAP: ₹1,350 per 50 kg bag (NBS-subsidized)\n• MOP (Muriate of Potash): ₹1,700 per 50 kg\n• NPK (10:26:26): ₹1,470 per 50 kg\n• SSP (Single Super Phosphate): ₹475 per 50 kg\n\nDistribution points:\n• PACS/LAMPS (Primary Agriculture Cooperative Societies)\n• Registered private fertilizer dealers\n• Online: Fertilizer companies like IFFCO, KRIBHCO, RCF\n\nNote: Fertilizer must be sold at or below MRP. Report overpricing to Agriculture Department.",
    contentHi:
      "सरकारी सब्सिडी वाले उर्वरक आधार-प्रमाणित PoS प्रणाली से निर्धारित MRP पर वितरित किए जाते हैं।\n\nवर्तमान MRP:\n• यूरिया: ₹242 प्रति 45 किलो बोरी\n• DAP: ₹1,350 प्रति 50 किलो बोरी\n• पोटाश (MOP): ₹1,700 प्रति 50 किलो\n• NPK (10:26:26): ₹1,470 प्रति 50 किलो\n• SSP: ₹475 प्रति 50 किलो\n\nवितरण: लैम्प्स/PACS, अधिकृत विक्रेता।",
    contentHinglish:
      "Sarkari subsidy wale urvarak/khad ke daam (MRP):\n• Urea: ₹242 per 45 kg bag\n• DAP: ₹1,350 per 50 kg\n• Potash (MOP): ₹1,700 per 50 kg\n• NPK: ₹1,470 per 50 kg\n• SSP: ₹475 per 50 kg\n\nKahan milega: PACS/LAMPS ya registered dealer se.",
    keywords: [
      "fertilizer subsidy", "urea price", "dap price", "urea mrp",
      "242 rupees urea", "khad ka daam", "subsidized fertilizer",
      "यूरिया MRP", "डीएपी कीमत", "सब्सिडी खाद",
    ],
    source: {
      title: "Department of Fertilizers, GoI",
      url: "https://fert.nic.in",
      department: "Department of Fertilizers, Ministry of Chemicals & Fertilizers",
      lastVerified: "October 2025",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Kisan Helpline
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "kisan-helplines",
    domain: "helpline_and_emergency",
    title: "Farmer Helplines & Contact Numbers",
    titleHi: "किसान हेल्पलाइन एवं संपर्क नंबर",
    content:
      "Key helpline numbers for farmers:\n\n• Kisan Call Center (KCC): 1800-180-1551 (Toll Free, Mon–Sat, 6 AM – 10 PM) — Agriculture advisory in local language\n• PM-KISAN Helpline: 155261 or 011-24300606\n• PMFBY Crop Insurance: 14447 (Toll Free)\n• PM Kisan Maandhan (Pension): 1800-267-6888\n• Soil Health Card: 1800-180-1551\n• e-NAM Market Help: 1800-270-0224\n• CG Agriculture Dept: 0771-2234491\n• National Farmer Portal: mkisan.gov.in\n• Emergency: 112",
    contentHi:
      "किसानों के लिए प्रमुख हेल्पलाइन नंबर:\n\n• किसान कॉल सेंटर: 1800-180-1551 (टोल फ्री, सोमवार–शनिवार, सुबह 6 से रात 10 बजे)\n• पीएम-किसान हेल्पलाइन: 155261\n• पीएमएफबीवाई बीमा: 14447\n• पीएम किसान मानधन (पेंशन): 1800-267-6888\n• छत्तीसगढ़ कृषि विभाग: 0771-2234491\n• आपातकाल: 112",
    contentHinglish:
      "Kisan helpline numbers:\n\n• Kisan Call Center: 1800-180-1551 (Toll Free, Monday–Saturday, 6am–10pm)\n• PM-KISAN: 155261\n• Fasal Bima (PMFBY): 14447\n• CG Krishi Vibhag: 0771-2234491\n• Emergency: 112",
    keywords: [
      "helpline", "1800-180-1551", "toll free", "kisan call center",
      "14447", "155261", "farmer helpline", "contact number",
      "हेल्पलाइन", "टोल फ्री", "किसान कॉल सेंटर",
    ],
    source: {
      title: "Kisan Call Center — mkisan.gov.in",
      url: "https://mkisan.gov.in",
      department: "Ministry of Agriculture & Farmers Welfare, GoI",
      lastVerified: "October 2025",
    },
  },
  // ══════════════════════════════════════════════════════════════════════════
  // Chhattisgarh Horticulture & Farm Forestry (Official agriportal.cg.nic.in)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "cg-horticulture-overview",
    domain: "horticulture",
    title: "Chhattisgarh Horticulture: Crops, Status & Potential",
    titleHi: "छत्तीसगढ़ उद्यानिकी: प्रमुख फसलें, स्थिति एवं संभावनाएं",
    content:
      "Directorate of Horticulture and Farm Forestry, Government of Chhattisgarh promotes high-value horticulture crops across the state.\n\nMajor Fruit Crops: Mango (आम), Guava (अमरूद), Lime (नींबू), Litchi (लीची), Cashew-nut (काजू), Chiku (चीकू). Minor fruits: Sitafal/Custard Apple (सीताफल), Bael (बेल), Ber (बेर), Aonla (आंवला).\n\nMajor Vegetable Crops: Tomato, Brinjal, Okra, Cabbage, Cauliflower, Pointed Gourd, Cowpea, Potato, and green leafy vegetables.\n\nSpices & Plantation: Ginger, Turmeric, Garlic, Chilli, Coriander, Cashew, and Oil Palm.\n\nFocus Areas: Polyhouse/shadenet farming, hybrid vegetable seed distribution, nursery development, micro-irrigation, cold storage and pack houses.\n\nOfficial Portal: https://agriportal.cg.nic.in/horticulture/HortiEn/Default.aspx",
    contentHi:
      "संचालनालय उद्यानिकी एवं प्रक्षेत्र वानिकी, छत्तीसगढ़ शासन द्वारा राज्य में उच्च मूल्य वाली उद्यानिकी फसलों को बढ़ावा दिया जा रहा है।\n\nप्रमुख फल फसलें: आम, अमरूद, नींबू, लीची, काजू, चीकू। लघु फल: सीताफल, बेल, बेर, आंवला।\n\nप्रमुख सब्जी फसलें: टमाटर, बैंगन, भिंडी, पत्तागोभी, फूलगोभी, परवल, बरबट्टी, आलू एवं हरी पत्तेदार सब्जियां।\n\nमसाला फसलें: अदरक, हल्दी, लहसुन, मिर्च, धनिया।\n\nमुख्य प्राथमिकताएं: पॉलीहाउस/शेडनेट खेती, संकर सब्जी बीज वितरण, नर्सरी विकास, ड्रिप/स्प्रिंकलर सूक्ष्म सिंचाई, कोल्ड स्टोरेज एवं पैक हाउस।\n\nआधिकारिक पोर्टल: https://agriportal.cg.nic.in/horticulture/HortiHi/Default.aspx",
    contentHinglish:
      "Directorate Horticulture Chhattisgarh udyaniki phaslon ko promote karta hai.\n\nMain Fruits: Aam, Amrood, Nimbu, Litchi, Kaju, Chiku, Sitafal, Ber, Aonla.\n\nMain Vegetables: Tamatar, Baingan, Bhindi, Gobhi, Parwal, Aloo.\n\nSpices: Adrak, Haldi, Lahsun, Mirch, Dhaniya.\n\nSchemes focus on polyhouse, shadenet, drip sinchai, aur hybrid vegetable seeds.\n\nOfficial Portal: https://agriportal.cg.nic.in/horticulture/HortiEn/Default.aspx",
    keywords: [
      "horticulture", "chhattisgarh horticulture", "udyaniki", "bagwani",
      "fruits", "mango", "guava", "vegetables", "tomato", "potato",
      "spices", "ginger", "turmeric", "agriportal.cg.nic.in",
      "उद्यानिकी", "बागवानी", "फल", "सब्जी", "मसाला",
    ],
    source: {
      title: "Directorate of Horticulture, Chhattisgarh",
      url: "https://agriportal.cg.nic.in/horticulture/HortiEn/aboutus.htm",
      department: "Department of Agriculture, Government of Chhattisgarh",
      lastVerified: "February 2026",
    },
  },
  {
    id: "cg-horticulture-state-schemes",
    domain: "horticulture",
    title: "Chhattisgarh State Schemes for Horticulture",
    titleHi: "छत्तीसगढ़ राज्य पोषित उद्यानिकी योजनाएं",
    content:
      "Key State-Sponsored Horticulture Schemes in Chhattisgarh:\n\n1. Samakit Udyaniki Karya Yojana (समेकित उद्यानिकी कार्य योजना / Integrated Horticulture Action Plan): Subsidies for fruit plantation, community water harvesting ponds, pack houses, and vegetable minikits.\n\n2. Masala Kshetra Vistar Protsahan Yojana (मसाला क्षेत्र विस्तार प्रोत्साहन योजना / Scheme for Promoting Spice Cultivation): Financial assistance and certified rhizome/seed support for cultivating ginger, turmeric, garlic, chilli, and coriander.\n\n3. Potato Crop Demonstration & Development Scheme (आलू फसल प्रदर्शन एवं विकास योजना): High-yielding seed tuber demonstration, cold storage linkage, and input subsidies in potato growing clusters (e.g., Mainpat, Surguja, Jashpur).\n\n4. State Krishi Sinchayee Yojana (State KSY - Micro Irrigation): State top-up subsidy on drip and sprinkler irrigation installations for horticulture crops.",
    contentHi:
      "छत्तीसगढ़ राज्य पोषित प्रमुख उद्यानिकी योजनाएं:\n\n1. समेकित उद्यानिकी कार्य योजना: फलदार वृक्षारोपण, सामुदायिक जल संचयन तालाब, पैक हाउस एवं संकर सब्जी मिनीकिट पर अनुदान।\n\n2. मसाला क्षेत्र विस्तार प्रोत्साहन योजना: अदरक, हल्दी, लहसुन, मिर्च और धनिया की व्यावसायिक खेती हेतु प्रमाणित बीज एवं अनुदान सहायता।\n\n3. आलू फसल प्रदर्शन एवं विकास योजना: मुख्य रूप से सरगुजा, मैनपाट, जशपुर क्षेत्रों में उन्नत आलू बीज कंद प्रदर्शन एवं इनपुट अनुदान।\n\n4. राज्य कृषि सिंचाई योजना (State KSY): उद्यानिकी फसलों में ड्रिप एवं स्प्रिंकलर सूक्ष्म सिंचाई प्रणाली पर राज्य अतिरिक्त अनुदान।",
    contentHinglish:
      "Chhattisgarh state ki mukhya horticulture schemes:\n\n1. Samakit Udyaniki Karya Yojana: Fruit plantation, water pond, pack house, hybrid vegetable minikit par subsidy.\n\n2. Masala Kshetra Vistar Yojana: Adrak, haldi, lahsun, mirchi aur dhaniya kheti ke liye anudan.\n\n3. Aloo Fasal Pradarshan Yojana: Surguja, Mainpat aur Jashpur me unnat aloo beej aur input support.\n\n4. State KSY: Drip aur sprinkler par state subsidy.",
    keywords: [
      "state scheme", "samakit udyaniki", "masala yojana", "aloo yojana",
      "spice cultivation", "potato scheme", "state ksy", "chhattisgarh horticulture",
      "समेकित उद्यानिकी", "मसाला क्षेत्र विस्तार", "आलू फसल योजना",
    ],
    source: {
      title: "State Schemes — Chhattisgarh Horticulture",
      url: "https://agriportal.cg.nic.in/horticulture/HortiEn/StateScheme.html",
      department: "Directorate of Horticulture & Farm Forestry, Chhattisgarh",
      lastVerified: "February 2026",
    },
  },
  {
    id: "cg-horticulture-central-schemes",
    domain: "horticulture",
    title: "Central Sponsored Horticulture Schemes in Chhattisgarh (MIDH, RKVY, PMKSY)",
    titleHi: "छत्तीसगढ़ में केंद्र पोषित उद्यानिकी योजनाएं (एकीकृत बागवानी मिशन, आरकेवीवाई, पीएमकेएसवाई)",
    content:
      "Central Government Sponsored Horticulture Schemes implemented in Chhattisgarh:\n\n1. Mission for Integrated Development of Horticulture (MIDH / एकीकृत बागवानी विकास मिशन): Financial assistance up to 40%–50% for high-density fruit orchards, protected cultivation (polyhouse, shadenet), post-harvest management (packhouse, cold room), and mushroom production.\n\n2. Rashtriya Krishi Vikas Yojana (RKVY - Horticulture Stream): Infrastructure development, vegetable clusters near urban centers, organic horticulture inputs, and farm-gate processing.\n\n3. Pradhan Mantri Krishi Sinchayee Yojana (PMKSY - Per Drop More Crop): 50% to 55% subsidy on drip and sprinkler irrigation installations for fruits and vegetables (higher subsidy for small/marginal and SC/ST farmers).\n\n4. National Mission on Edible Oils - Oil Palm (NMEO-OP): Planting material subsidy, maintenance assistance for 4 years, and assured market price.",
    contentHi:
      "छत्तीसगढ़ में क्रियान्वित केंद्र पोषित प्रमुख उद्यानिकी योजनाएं:\n\n1. एकीकृत बागवानी विकास मिशन (MIDH): सघन फलदार बागवानी, पॉलीहाउस, शेडनेट हाउस, पैकहाउस एवं मशरूम उत्पादन पर 40% से 50% तक अनुदान।\n\n2. राष्ट्रीय कृषि विकास योजना (RKVY): शहरी क्षेत्रों के निकट सब्जी क्लस्टर विकास, जैविक उद्यानिकी और बुनियादी ढांचा।\n\n3. प्रधानमंत्री कृषि सिंचाई योजना (PMKSY - प्रति बूंद अधिक फसल): फल एवं सब्जी फसलों के लिए ड्रिप एवं स्प्रिंकलर सूक्ष्म सिंचाई पर 50% से 55% अनुदान (लघु/सीमांत एवं अ.जा./अ.ज.जा. किसानों को प्राथमिकता)।\n\n4. राष्ट्रीय खाद्य तेल मिशन - पाम आयल: रोपण सामग्री एवं रखरखाव हेतु 4 वर्ष तक सहायता।",
    contentHinglish:
      "Chhattisgarh me central sponsored horticulture schemes:\n\n1. MIDH (Integrated Horticulture Mission): Polyhouse, shadenet, naye baag lagane aur cold storage par 40-50% subsidy.\n\n2. RKVY: Vegetable cluster aur agri-infrastructure support.\n\n3. PMKSY (Per Drop More Crop): Drip aur sprinkler sinchai par 50%-55% anudan.\n\n4. Oil Palm Mission: Paudha aur dekhbhal ke liye financial help.",
    keywords: [
      "midh", "rkvy", "pmksy horticulture", "per drop more crop", "polyhouse subsidy",
      "micro irrigation subsidy", "oil palm", "integrated horticulture development",
      "एकीकृत बागवानी विकास मिशन", "आरकेवीवाई", "पॉलीहाउस अनुदान", "ड्रिप सिंचाई",
    ],
    source: {
      title: "Central Schemes — Chhattisgarh Horticulture",
      url: "https://agriportal.cg.nic.in/horticulture/HortiEn/CentralScheme.html",
      department: "Ministry of Agriculture, GoI & CG Horticulture Directorate",
      lastVerified: "February 2026",
    },
  },
  {
    id: "cg-horticulture-application-process",
    domain: "horticulture",
    title: "How to Apply for Chhattisgarh Horticulture Schemes & Subsidies",
    titleHi: "छत्तीसगढ़ उद्यानिकी योजनाओं में आवेदन कैसे करें एवं आवश्यक दस्तावेज",
    content:
      "Procedure to Apply for Horticulture Subsidies in Chhattisgarh:\n\n1. Online Registration: Apply on the Chhattisgarh Horticulture Farmer Portal / Agriportal (https://agriportal.cg.nic.in/horticulture/HortiEn/Default.aspx) or through nearest CSC / Lok Sewa Kendra.\n\n2. Offline Application: Visit your Block Senior Horticulture Development Officer (वरिष्ठ उद्यान विकास अधिकारी / SHDO) or Rural Horticulture Extension Officer (RHEO) at the block office, or the District Assistant Director of Horticulture.\n\n3. Required Documents:\n• Aadhaar Card (आधार कार्ड)\n• Land Records: B-1 and Khasra P-II (बी-1 एवं खसरा नकल)\n• Bank Passbook copy with IFSC code (Aadhaar linked account)\n• Caste Certificate (for SC/ST farmers to claim enhanced subsidy)\n• Passport size photographs and Mobile Number\n• Water source proof (for drip/sprinkler irrigation applications).\n\nHelpline: Kisan Call Center 1800-180-1551 (Toll-Free).",
    contentHi:
      "छत्तीसगढ़ उद्यानिकी अनुदान एवं योजनाओं में आवेदन प्रक्रिया:\n\n1. ऑनलाइन आवेदन: राज्य उद्यानिकी किसान पोर्टल (https://agriportal.cg.nic.in/horticulture/HortiHi/Default.aspx) या नजदीकी लोक सेवा केंद्र (CSC) के माध्यम से।\n\n2. ऑफलाइन आवेदन: विकासखंड स्तर पर वरिष्ठ उद्यान विकास अधिकारी (SHDO) या ग्रामीण उद्यान विस्तार अधिकारी (RHEO), अथवा जिला स्तर पर सहायक संचालक उद्यानिकी कार्यालय से संपर्क करें।\n\n3. आवश्यक दस्तावेज:\n• आधार कार्ड\n• भूमि दस्तावेज: बी-1 एवं खसरा नकल\n• बैंक पासबुक (आधार लिंक्ड बैंक खाता एवं IFSC कोड)\n• जाति प्रमाण पत्र (अ.जा./अ.ज.जा. अतिरिक्त अनुदान हेतु)\n• पासपोर्ट साइज फोटो एवं मोबाइल नंबर\n• जल स्रोत प्रमाण (ड्रिप/स्प्रिंकलर सिंचाई हेतु)\n\nहेल्पलाइन: किसान कॉल सेंटर 1800-180-1551 (टोल-फ्री)।",
    contentHinglish:
      "Chhattisgarh udyaniki scheme mein apply karne ka tarika:\n\n1. Online: Official portal (https://agriportal.cg.nic.in/horticulture/HortiEn/Default.aspx) ya CSC/Lok Sewa Kendra se form bharein.\n\n2. Offline: Block ke Senior Horticulture Development Officer (SHDO) ya RHEO se mil kar form jama karein.\n\n3. Jaruri Documents: Aadhaar card, B-1/Khasra nakal, Bank passbook copy (IFSC), Photo, Mobile number, aur Caste certificate (agar applicable ho).\n\nHelpline: 1800-180-1551 (Toll Free).",
    keywords: [
      "horticulture application", "how to apply horticulture", "documents required",
      "rheo", "shdo", "horticulture subsidy apply", "khasra b1", "chhattisgarh udyaniki apply",
      "उद्यानिकी आवेदन", "आवश्यक दस्तावेज", "बी-1 खसरा", "अनुदान आवेदन",
    ],
    source: {
      title: "Horticulture Farmer Portal — Government of Chhattisgarh",
      url: "https://agriportal.cg.nic.in/horticulture/HortiEn/Default.aspx",
      department: "Directorate of Horticulture & Farm Forestry, Chhattisgarh",
      lastVerified: "February 2026",
    },
  },
];

/**
 * Get a chunk by ID
 */
export function getChunkById(id: string): KBChunk | undefined {
  return KNOWLEDGE_BASE.find((c) => c.id === id);
}

/**
 * Get all chunks for a specific domain
 */
export function getChunksByDomain(domain: string): KBChunk[] {
  return KNOWLEDGE_BASE.filter((c) => c.domain === domain);
}

/**
 * Returns all chunk IDs (used to trigger embedding at startup)
 */
export function getAllChunkIds(): string[] {
  return KNOWLEDGE_BASE.map((c) => c.id);
}
