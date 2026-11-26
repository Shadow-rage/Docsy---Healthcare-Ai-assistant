// Routes descriptions to questions about symptoms, not diagnoses.
export const symptomGroups = [
  {label:'Cough, throat, or nasal symptoms', pattern:/\b(?:cough\w*|sore throat|throat pain|runny nose|stuffy nose|blocked nose|congestion|hoarse)\b|खाँसी|गले में दर्द/i,
    prompt:'What are you noticing most with your breathing, nose, or throat?', choices:['Dry cough','Cough with mucus','Sore throat','Stuffy or runny nose','Several of these']},
  {label:'Fever or chills', pattern:/\b(?:fever\w*|chills|shivering)\b|बुखार/i,
    prompt:'Have you been able to check your temperature?', choices:['I measured a fever','I feel feverish or have chills','The reading was normal','I haven’t checked']},
  {label:'Skin, rash, or swelling', pattern:/\b(?:rash\w*|hives|itch\w*|skin|swollen|swelling|blisters?|acne|bruise\w*)\b|खुजली/i,
    prompt:'What change can you see or feel on your skin?', choices:['A rash or patches','Itching','Swelling','A blister or sore','A bruise or colour change','Several of these']},
  {label:'Nausea, vomiting, or bowel symptoms', pattern:/\b(?:nause\w*|vomit\w*|diarrh\w*|constipat\w*|heartburn|bloat\w*|bowel\w*|reflux|indigestion)\b|उल्टी|दस्त/i,
    prompt:'What has changed most with your digestion?', choices:['Nausea','Vomiting','Loose or frequent stools','Difficulty passing stool','Bloating or burning','Several of these']},
  {label:'Urination or bladder symptoms', pattern:/\b(?:urin\w*|pee\w*|bladder|uti)\b|पेशाब/i,
    prompt:'What change have you noticed when you urinate?', choices:['Burning or pain','Needing to urinate more often','Difficulty passing urine','Blood or a colour change','Several of these']},
  {label:'Back, neck, joint, or limb pain', pattern:/\b(?:back(?:ache)?|neck|shoulder|elbow|wrist|hand|finger|knee|hip|joint|foot|feet|leg|arm|heel|toe|torso|rib)\b/i,
    prompt:'How did the pain or discomfort begin?', choices:['After an injury','During or after activity','Gradually with no clear trigger','Suddenly with no clear trigger','I’m unsure']},
  {label:'Eye or vision symptoms', pattern:/\b(?:eyes?|vision|blurr\w*|floaters?|eyelid)\b|आँख/i,
    prompt:'What change have you noticed with your eye or vision?', choices:['Pain or irritation','Redness or discharge','Blurred vision','New flashes or floaters','Several of these']},
  {label:'Ear or hearing symptoms', pattern:/\b(?:ear\w*|hearing|tinnitus)\b|कान में/i,
    prompt:'What change have you noticed with your ear or hearing?', choices:['Ear pain','Ringing','Hearing feels different','Fluid coming from the ear','Several of these']},
  {label:'Tooth, mouth, or jaw symptoms', pattern:/\b(?:tooth\w*|teeth|dental|gum\w*|jaw|mouth|tongue)\b|दाँत/i,
    prompt:'What are you noticing in your mouth or jaw?', choices:['Tooth pain','Sore or swollen gums','Jaw pain','A mouth sore','Several of these']},
  {label:'Periods, pelvic symptoms, or pregnancy concerns', pattern:/\b(?:periods?|menstrual|pelvi\w*|pregnan\w*|vagin\w*|testic\w*|scrot\w*)\b|माहवारी/i,
    prompt:'What are you most concerned about?', choices:['Pelvic or genital pain','Bleeding or a period change','Unusual discharge or irritation','A concern during pregnancy','Several of these']},
  {label:'Numbness, tingling, or weakness', pattern:/\b(?:numb\w*|tingl\w*|weakness|pins and needles|tremor\w*)\b|सुन्न/i,
    prompt:'Where are you noticing the change in feeling or strength?', choices:['One arm or leg','Both arms or legs','Face','Several areas','I’m unsure']},
  {label:'Energy, sleep, appetite, or weight changes', pattern:/\b(?:fatigue\w*|tired\w*|exhaust\w*|sleep\w*|insomnia|appetite|weight loss|weight gain)\b|थकान/i,
    prompt:'What change is affecting you most?', choices:['Low energy','Trouble sleeping','Sleeping more than usual','Appetite or weight change','Several of these']},
  {label:'Mood, anxiety, or stress', pattern:/\b(?:anxi\w*|panic\w*|depress\w*|stress\w*|low mood|overwhelm\w*)\b|घबराहट/i,
    prompt:'What has been hardest to manage lately?', choices:['Worry or panic','Low mood','Stress or feeling overwhelmed','An impact on sleep or daily life','Several of these']},
];

export function findSymptomGroup(concern, selected) {
  return symptomGroups.find(group=>group.label===selected)
    || symptomGroups.find(group=>group.pattern.test(concern));
}
