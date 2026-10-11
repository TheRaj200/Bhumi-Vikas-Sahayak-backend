// Fixed strings from docs/API_CONTRACT.md. Do not reword without a contract change.

export const STRINGS = {
  not_found: {
    en: 'Not found in the provided sources (MP Bhumi Vikas Rules 2012, consolidated to 6 Mar 2025).',
    hi: 'दिए गए स्रोतों में नहीं मिला (म.प्र. भूमि विकास नियम 2012, 6 मार्च 2025 तक संशोधित)।',
  },
  manual_review: {
    en: 'Manual review required.',
    hi: 'मैनुअल समीक्षा आवश्यक है।',
  },
  disclaimer: {
    en: 'Preliminary check only. This points to the rules; it is not legal advice or official approval. The authorised officer decides.',
    hi: 'यह केवल प्रारंभिक जाँच है। यह नियमों का संदर्भ है, कानूनी सलाह या आधिकारिक स्वीकृति नहीं। अंतिम निर्णय अधिकृत अधिकारी का है।',
  },
  version_badge: {
    en: 'Rules consolidated to 6 March 2025',
    hi: '6 मार्च 2025 तक संशोधित नियम',
  },
  evidence_only: {
    en: 'The AI explanation is unavailable right now. The most relevant rule passages are shown below — please read them directly.',
    hi: 'अभी AI व्याख्या उपलब्ध नहीं है। सबसे प्रासंगिक नियम अंश नीचे दिए गए हैं — कृपया उन्हें सीधे पढ़ें।',
  },
};

export const REPORT_LIMITATIONS = {
  en: [
    'Only a small set of encoded rules is checked. A result here is not overall compliance or approval.',
    'The rulebook used is consolidated to 6 March 2025. Later amendments (e.g. Rule 2(5)(c), 28 Aug 2026) may change the answer.',
    'Rules that are not human-verified are shown as "Manual review required" and are never used for a definitive result.',
    'The Development Plan of the town may set different FAR, density or land-use norms (Rule 61 footnote, Rule 103).',
    'Electricity Rules, NBC and other documents referred to by the rules are not part of the sources.',
  ],
  hi: [
    'केवल कुछ एन्कोड किए गए नियमों की जाँच होती है। यहाँ का परिणाम पूर्ण अनुपालन या स्वीकृति नहीं है।',
    'उपयोग की गई नियम पुस्तिका 6 मार्च 2025 तक संशोधित है। बाद के संशोधन (जैसे नियम 2(5)(c), 28 अगस्त 2026) उत्तर बदल सकते हैं।',
    'जो नियम मानव द्वारा सत्यापित नहीं हैं, वे "मैनुअल समीक्षा आवश्यक" दिखते हैं और निश्चित परिणाम के लिए कभी उपयोग नहीं होते।',
    'नगर की विकास योजना अलग FAR, घनत्व या भूमि उपयोग मानक तय कर सकती है (नियम 61 टिप्पणी, नियम 103)।',
    'विद्युत नियम, NBC और नियमों में उल्लिखित अन्य दस्तावेज़ स्रोतों में शामिल नहीं हैं।',
  ],
};
