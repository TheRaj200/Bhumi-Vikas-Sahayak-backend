// Status model from PRD §8 and docs/API_CONTRACT.md.

export const CHECK_STATUSES = ['pass', 'potential_issue', 'needs_information', 'manual_review', 'calculated', 'reference'];

export const QUESTION_STATUSES = ['answered', 'not_found', 'needs_information', 'manual_review', 'evidence_only'];

export const STATUS_META = [
  { key: 'pass', label_en: 'Pass', label_hi: 'पास', description_en: 'Satisfies this specific verified encoded check. Not overall legal approval.', description_hi: 'इस सत्यापित एन्कोडेड जाँच को पूरा करता है। यह पूर्ण कानूनी स्वीकृति नहीं है।' },
  { key: 'potential_issue', label_en: 'Potential issue', label_hi: 'संभावित समस्या', description_en: 'The entered value appears not to satisfy a verified encoded constraint.', description_hi: 'दर्ज मान एक सत्यापित एन्कोडेड शर्त को पूरा करता नहीं दिखता।' },
  { key: 'needs_information', label_en: 'Needs information', label_hi: 'जानकारी चाहिए', description_en: 'A mandatory input is missing or inconsistent. Nothing was calculated or guessed.', description_hi: 'कोई आवश्यक जानकारी नहीं है या असंगत है। कुछ भी गणना या अनुमान नहीं किया गया।' },
  { key: 'manual_review', label_en: 'Manual review required', label_hi: 'मैनुअल समीक्षा आवश्यक', description_en: 'The rule is unverified, ambiguous, has an exception, may be superseded, or conflicts with another provision.', description_hi: 'नियम असत्यापित, अस्पष्ट, अपवाद वाला, संभवतः बदला हुआ या किसी अन्य प्रावधान से टकराता है।' },
  { key: 'calculated', label_en: 'Calculated', label_hi: 'गणना की गई', description_en: 'A verified calculation (fee, validity date) produced a value.', description_hi: 'सत्यापित गणना (शुल्क, वैधता तिथि) से मान निकाला गया।' },
  { key: 'reference', label_en: 'Reference', label_hi: 'संदर्भ', description_en: 'An informational provision with no numeric check.', description_hi: 'सूचनात्मक प्रावधान, कोई संख्यात्मक जाँच नहीं।' },
  { key: 'answered', label_en: 'Answered', label_hi: 'उत्तर दिया गया', description_en: 'Answer backed by at least one verified rule passage.', description_hi: 'कम से कम एक सत्यापित नियम अंश पर आधारित उत्तर।' },
  { key: 'not_found', label_en: 'Not found in provided sources', label_hi: 'दिए गए स्रोतों में नहीं मिला', description_en: 'No adequate supporting evidence was found.', description_hi: 'पर्याप्त सहायक प्रमाण नहीं मिला।' },
  { key: 'evidence_only', label_en: 'Evidence only', label_hi: 'केवल प्रमाण', description_en: 'AI explanation unavailable; relevant rule passages shown.', description_hi: 'AI व्याख्या उपलब्ध नहीं; प्रासंगिक नियम अंश दिखाए गए।' },
];
