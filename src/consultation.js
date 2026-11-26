export const languages = [['en-US','English'],['hi-IN','हिन्दी'],['hi-Latn','Hinglish'],['bn-IN','বাংলা'],['ta-IN','தமிழ்'],['te-IN','తెలుగు'],['mr-IN','मराठी'],['gu-IN','ગુજરાતી'],['kn-IN','ಕನ್ನಡ'],['ml-IN','മലയാളം'],['pa-IN','ਪੰਜਾਬੀ'],['ur-IN','اردو'],['es-ES','Español'],['fr-FR','Français'],['ar','العربية']];
export const ageGroups = ['Child · 0–12','Teen · 13–17','Adult · 18–59','Older adult · 60+'];
export const groupFor = age => age < 13 ? 0 : age < 18 ? 1 : age < 60 ? 2 : 3;
export const stages = ['Understanding your concern','Checking warning signs','Reviewing health context','Considering local conditions','Preparing safe next steps'];
export const warningOptions = ['No warning signs','Yes, there is a warning sign','I’m unsure'];

const warningPatterns = [
  /chest (pain|pressure)|pain in (my |the )?chest|सीने में दर्द|seene mein dard/i,
  /can.?t breathe|cannot breathe|difficulty breathing|struggling to breathe|shortness of breath|breathless|saans (nahi|lene mein dikkat)|साँस लेने में दिक्कत/i,
  /face droop|slurred speech|difficulty speaking|one.sided weakness|weakness on one side|sudden confusion/i,
  /anaphylaxis|severe allergic reaction|(?:throat|tongue) (?:is )?swelling|unconscious|unresponsive|seizure|major bleeding|bleeding won.t stop|serious injury/i,
  /worst(?:.ever)? headache|sudden severe headache|fever.*stiff neck|stiff neck.*fever/i,
  /suicid|kill myself|end my life|harm myself|self.harm|आत्महत्या/i,
  /^yes, there is a warning sign$/i,
];

export function hasRedFlag(input) {
  return warningPatterns.some(pattern => {
    const match = input.match(pattern);
    if (!match) return false;
    const prefix = input.slice(0, match.index).split(/[.!?,;]|\bbut\b/i).at(-1);
    return !/\b(?:no|denies|without)\s+(?:\w+\s+){0,1}$/i.test(prefix);
  });
}

export function readFacts(text) {
  const facts = {};
  const severity = text.match(/\b(10|[1-9])\s*(?:\/\s*10|out of 10)\b/i);
  const onset = text.match(/\b(?:yesterday|this morning|last night|today|\d+\s+(?:minutes?|hours?|days?|weeks?)\s+ago)\b|आज|कल/i);
  if (severity) facts.severity = severity[1];
  if (onset && onset[0] !== 'कल') facts.onset = onset[0];
  return facts;
}

export function nextQuestion({profile, facts, concern, simple}) {
  const group = groupFor(profile.age);
  const caregiver = profile.person !== 'Myself';
  const patient = caregiver ? 'the person you’re helping' : 'you';
  const headache = /headache|head hurts|sir dard|सिर दर्द/i.test(concern);
  const stomach = /stomach|belly|abdomen|pet dard|पेट/i.test(concern);
  const dizzy = /dizz|chakkar|चक्कर/i.test(concern);
  const question = (key, stage, text, why, options) => ({key, stage, text, why, options});
  if (caregiver && !facts.responsive) return question('responsive',1,'Is the person awake and responding normally?','A change in responsiveness can require emergency help.',['Yes','No, they are unresponsive','I’m unsure']);
  if (group === 0 && !facts.adult) return question('adult',1,'Is a parent or trusted grown-up with you?','A trusted adult can help describe symptoms and get care.',['Yes','No']);
  if (group === 0 && facts.adult === 'No') return question('adult',1,'Ask a parent or trusted grown-up to join you. Is someone with you now?','A trusted adult can help you get care.',['Yes','No']);
  if (!facts.warning) return question('warning',1,headache ? 'Did the headache start suddenly and feel unusually severe, or is there new weakness, confusion, or a stiff neck with fever?' : 'Is there severe trouble breathing, chest pain, heavy bleeding, a seizure, or a sudden change in alertness?','These signs can require immediate emergency help.',warningOptions);
  if (facts.change === 'Recheck') return question('change',0,'Compared with the previous check, are you better, the same, or worse?','Changes can affect how soon you should seek care.',['Better','Same','Worse']);
  if (!facts.onset) return question('onset',0,group === 0 ? 'When did it start hurting?' : 'When did this start?','Timing helps a clinician understand whether symptoms are new or changing.',['Today','Yesterday','Several days ago']);
  if (!facts.severity) return question('severity',0,group === 0 ? 'How much does it hurt?' : 'How severe are the symptoms on a scale from 1 to 10?','Severity gives us a baseline for comparing changes.',group === 0 ? ['🙂 2/10','😕 5/10','😣 8/10'] : ['2/10','4/10','7/10','10/10']);
  if ((dizzy || group === 3) && !facts.fall) return question('fall',2,`Has ${caregiver ? patient + ' had' : 'there been'} a recent fall or injury?`,'An injury can change how soon someone needs an assessment.',['No','Yes','I’m unsure']);
  if (caregiver && !facts.withPatient) return question('withPatient',2,'Are you physically with the patient, and can they answer questions?','It helps to know which details come directly from the patient.',['With them, they can answer','With them, they cannot answer','I’m elsewhere']);
  if (group === 3 && !facts.assistance) return question('assistance',2,'Is someone nearby who can help if symptoms change?','It helps to know who can assist with getting care.',['Yes','No','I’m unsure']);
  if (!facts.associated) return question('associated',2,stomach ? 'Is there vomiting, fever, or pain that is getting worse?' : dizzy ? 'Has there been poor fluid intake, fainting, or new weakness?' : 'Are there any other symptoms, or has anything changed?','Symptoms appearing together may change the safest next step.',['None reported','I’m unsure']);
  if (!facts.context) return question('context',2,simple ? 'Are there any medicines, allergies, or health problems we should know about?' : `Does ${caregiver ? patient + ' have' : 'your health history include'} any current medicines, allergies, or ongoing conditions?`,'This context helps a clinician assess symptoms and medicine safety.',['None reported','I’m unsure']);
  if ((headache || dizzy) && !facts.exposure) return question('exposure',3,'Was there recent heat exposure, or a change in food, fluids, or sleep?','Environment and routine can provide context for the symptoms.',['No known change','I’m unsure']);
  if (facts.change && !facts.followupCare) return question('followupCare',2,'What have you tried since the last check, and has it helped? Include any medicine you took.','A clinician may need to know what you took and how the symptoms responded.',['Nothing yet','I’m unsure']);
  return null;
}

export function urgency(facts, profile, emergency) {
  if (emergency) return ['Emergency','Call your local emergency service now. If you are severely unwell, do not drive yourself.'];
  if (Number(facts.severity) >= 7 || facts.fall === 'Yes' || profile.age < 1 || facts.warning === 'I’m unsure' || facts.change === 'Worse') {
    return ['Same-day assessment','Contact a healthcare professional for a same-day assessment. Call emergency services if a warning sign appears.'];
  }
  if (Number(facts.severity) >= 1 && Number(facts.severity) <= 3 && facts.warning === warningOptions[0] && facts.associated === 'None reported' && facts.context === 'None reported' && profile.age >= 18 && profile.age < 60) {
    return ['Monitor symptoms','If symptoms stay mild, rest and drink fluids as usual if safe for you. Seek professional advice if symptoms persist or worsen.'];
  }
  return ['Contact a clinician','Ask a healthcare professional about your symptoms, especially if they persist, worsen, or interfere with normal activity.'];
}

export const demos = [
  {name:'Child with stomach pain', concern:'My stomach hurts since this morning, 4/10.', age:8, person:'My child', map:true},
  {name:'Teen speaking Hinglish', concern:'Aaj mera sir dard kar raha hai, 4/10.', age:15, language:'hi-Latn'},
  {name:'Headache in hot weather', concern:'I have a mild headache since this morning, 2/10.', age:32, weather:true},
  {name:'Caregiver reporting dizziness', concern:'My father has been dizzy since yesterday, 4/10.', age:72, person:'An older family member'},
  {name:'Chest pain and breathing difficulty', concern:'I have chest pain and can’t breathe.', age:45},
  {name:'Pain changes from 4/10 to 7/10', concern:'My stomach hurts more now, 7/10.', age:28, previous:true},
  {name:'Hindi voice to English summary', concern:'आज सुबह से सिर दर्द है, 4/10.', age:30, language:'hi-IN', voice:true},
  {name:'Location permission denied', concern:'I have a headache, 4/10.', age:34, location:true},
];

export const hindiQuestions = {
  responsive:'क्या मरीज़ जाग रहा है और सामान्य रूप से जवाब दे रहा है?',
  adult:'क्या आपके साथ कोई भरोसेमंद बड़ा व्यक्ति है?',
  warning:'क्या साँस लेने में बहुत दिक्कत, सीने में दर्द, बहुत खून बहना, दौरा या अचानक भ्रम जैसे कोई गंभीर लक्षण हैं?',
  onset:'ये लक्षण कब शुरू हुए?',
  severity:'1 से 10 तक लक्षण कितने गंभीर हैं?',
  fall:'क्या हाल में गिरने या चोट लगने की घटना हुई?',
  withPatient:'क्या आप मरीज़ के साथ हैं और क्या वे सवालों के जवाब दे सकते हैं?',
  associated:'क्या कोई और लक्षण हैं, या किसी लक्षण में बदलाव आया है?',
  context:'क्या कोई एलर्जी, पहले से बीमारी या अभी ली जा रही दवा है?',
  exposure:'क्या हाल में गर्मी, खाने, पानी या नींद में कोई बदलाव हुआ?',
  assistance:'क्या पास में कोई है जो लक्षण बदलने पर मदद कर सके?',
  change:'पिछली बार की तुलना में अब आप बेहतर, वैसे ही, या बदतर महसूस कर रहे हैं?',
  followupCare:'पिछली बार के बाद आपने क्या किया या कौन-सी दवा ली? क्या उससे मदद मिली?',
};
