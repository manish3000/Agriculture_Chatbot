export type PmKisanIntent = "status" | "documents" | "eligibility" | "benefit" | "overview" | "general";

export function isPmKisanQuery(query: string): boolean {
  return /\bpm\s*[-.]?\s*kis(?:a{1,2}|h)?an\b|pmkisan|kisan samman(?: nidhi)?|samman nidhi|प्रधानमंत्री किसान|पीएम किसान|किसान सम्मान निधि/i.test(query);
}

export function detectPmKisanIntent(query: string): PmKisanIntent {
  const lower = query.toLowerCase();
  if (/status|payment status|payment not|not received|पैसा नहीं|किस्त नहीं|स्टेटस|भुगतान स्थिति|आया नहीं|नहीं आया/.test(lower)) return "status";
  if (/document|paper|required|registration|register|apply|आवश्यक दस्तावेज|कौन से कागज|कौनसे कागज|कागजात|पंजीकरण|रजिस्ट्रेशन|आवेदन|क्या चाहिए/.test(lower)) return "documents";
  if (/age|eligib| पात्र|आयु|उम्र|योग्यता|पात्रता/.test(lower)) return "eligibility";
  if (/6000|2000|installment|कितना|राशि|amount|how much|किस्त|kist|kitna|kitni|paisa|benefit/.test(lower)) return "benefit";
  if (/what is pm\s*[- ]?\s*kis[ah]n|pm\s*[- ]?\s*kis[ah]n kya hai|pm-kisan क्या है/i.test(lower)) return "overview";
  return "general";
}
