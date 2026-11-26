import {findSymptomGroup, symptomGroups} from './symptoms.js';

export const languages = [['en-US','English'],['hi-IN','हिन्दी'],['hi-Latn','Hinglish'],['bn-IN','বাংলা'],['ta-IN','தமிழ்'],['te-IN','తెలుగు'],['mr-IN','मराठी'],['gu-IN','ગુજરાતી'],['kn-IN','ಕನ್ನಡ'],['ml-IN','മലയാളം'],['pa-IN','ਪੰਜਾਬੀ'],['ur-IN','اردو'],['es-ES','Español'],['fr-FR','Français'],['ar','العربية']];
export const ageGroups = ['Child · 0–12','Teen · 13–17','Adult · 18–59','Older adult · 60+'];
export const groupFor = age => !Number.isInteger(age) ? 2 : age < 13 ? 0 : age < 18 ? 1 : age < 60 ? 2 : 3;
export const stages = ['Understanding your concern','Checking warning signs','Reviewing health context','Considering local conditions','Preparing safe next steps'];
export const warningOptions = ['No warning signs','Yes, there is a warning sign','I’m unsure'];
export const responseChoices = {awake:'Yes',unresponsive:'No, they are unresponsive',unsure:'I’m unsure',away:'I’m not with them and can’t check'};
const headacheWarnings = ['Sudden, extremely painful headache','New weakness, numbness, or trouble speaking','New confusion or loss of vision','Fever with a stiff neck','Seizure'];
const generalWarnings = ['Severe trouble breathing or chest pain','Heavy bleeding','Seizure or sudden confusion','New weakness on one side or trouble speaking'];
const ankleWarnings = ['Ankle looks bent out of shape','Deep wound or visible bone','Foot or toes are numb, cold, blue, or pale'];
const ankleUrgent = ['I can’t walk or put weight on it','Severe or worsening swelling','A snap or pop at the time of injury','Fever with a red or hot ankle'];
const bodyAcheWarnings = ['Sudden weakness or inability to move an arm or leg','A high fever with a very stiff neck','Serious trouble breathing or swallowing'];
const bodyAchePattern = /\b(?:body\s*(?:aches?|pains?)|muscle\s*(?:aches?|pains?|soreness)|aching all over|whole body (?:hurts|aches))\b|शरीर में दर्द|बदन दर्द/i;
export const isHeadache = concern => /head\s*ache|head hurts|pain in (?:(?:my|the|left|right)\s+)*head\b|sir dard|सिर दर्द/i.test(concern);

export function weatherContext({weather,concern,exposure,emergency,language}) {
  if(!weather||emergency||weather.feelsLike<32||!(isHeadache(concern)||/dizz|light.headed|chakkar|चक्कर/i.test(concern))) return '';
  const confirmed=exposure==='More heat than usual';
  if(language==='hi-IN') return confirmed
    ? 'आपने बताया कि आप ज़्यादा गर्मी में रहे। गर्मी लक्षणों में योगदान दे सकती है। मौसम के आँकड़ों से कारण की पुष्टि नहीं होती।'
    : 'मौसम के अनुमान में गर्मी है। अगर आप भी गर्मी में रहे हों, तो गर्मी लक्षणों में योगदान दे सकती है। अभी यह स्पष्ट नहीं है कि आप गर्मी में रहे थे।';
  return confirmed
    ? 'You reported more heat exposure than usual. Heat could be contributing to your symptoms. Weather alone cannot confirm the cause.'
    : 'The weather estimate shows hot conditions. Heat could contribute if you were in a hot environment. Your actual heat exposure is still unknown.';
}

export function canReviewHeadacheMedicine({concern, facts, profile, emergency}) {
  const recent = /^(?:today|yesterday|this morning|last night|\d+\s+(?:minutes?|hours?)\s+ago|1 day ago)$/i.test(facts.onset);
  return !emergency && recent && isHeadache(concern) && profile.person === 'Myself'
    && urgency(facts,profile,false)[0] === 'Monitor symptoms';
}

export function interpretAnswer(question, response) {
  const text = response.toLowerCase().trim().replace(/[.!?]+$/,'').replace(/’/g,"'");
  const option = question.options?.find(choice=>choice.toLowerCase().replace(/’/g,"'")===text);
  if (question.key === 'severity') {
    const score = readFacts(response).severity || text.match(/^(10|[1-9])$/)?.[1];
    return score || response;
  }
  if (question.emergencyChoices || question.key === 'warning') {
    if (question.emergencyChoices?.includes(response)) return warningOptions[1];
    if (option) return option;
    if (/^(?:yes|yeah|yep)\b/.test(text)) return warningOptions[1];
    if (/^(?:no|nope|none)(?:$|[,.!]|\s+(?:none|nothing|i don't|i do not|they don't|they do not|of (?:those|these|them)|warning signs)\b)/.test(text) || /^nothing (?:like that|else)$/.test(text)) return warningOptions[0];
    if (/\b(?:unsure|not sure|don't know|cannot tell|can't tell)\b/.test(text)) return warningOptions[2];
    return null;
  }
  if (['responsive','adult'].includes(question.key)) {
    if (option) return option;
    if (question.key === 'responsive' && /\b(?:not awake|not responding|won't wake|can't wake|cannot wake)\b/.test(text)) return 'No';
    if (/^(?:yes|yeah|yep)\b/.test(text)) return 'Yes';
    if (/^(?:no|nope)\b/.test(text)) return 'No';
    if (/\b(?:unsure|not sure|don't know|cannot tell|can't tell)\b/.test(text)) return 'I’m unsure';
    if (question.key === 'responsive' && /\b(?:awake and (?:talking|responding)|responding normally|talking to me)\b/.test(text) && !/\b(?:not|isn't|aren't|hardly|barely)\b/.test(text)) return 'Yes';
    if (question.key === 'adult' && /\b(?:mom|mum|dad|parent|grandmother|grandfather|grown.up|trusted adult)\b.*\b(?:here|with me|next to me)\b/.test(text) && !/\b(?:not|isn't|aren't|no)\b/.test(text)) return 'Yes';
    return null;
  }
  return option || response;
}

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

export function reportedAge(text) {
  const value=text.match(/\b(\d{1,3})(?:\s+years? old\b|-years?-old\b)/i)?.[1];
  return value!==undefined&&Number(value)<=125 ? Number(value) : null;
}

function couldMonitorAtHome(facts) {
  return Number(facts.severity)>=1 && Number(facts.severity)<=3
    && facts.warning===warningOptions[0] && facts.associated==='None reported' && facts.context==='None reported';
}

export function nextQuestion({profile, facts, concern, simple}) {
  const group = groupFor(profile.age);
  const caregiver = profile.person !== 'Myself';
  const patient = caregiver ? 'the person you’re helping' : 'you';
  const headache = isHeadache(concern);
  const ankle = /ankle|टखन[ेा]|takhna/i.test(concern);
  const ankleName = /\bleft\b/i.test(concern) ? 'left ankle' : /\bright\b/i.test(concern) ? 'right ankle' : 'ankle';
  const stomach = /stomach|belly|abdomen|pet dard|पेट/i.test(concern);
  const dizzy = /dizz|chakkar|चक्कर/i.test(concern);
  const bodyAches = bodyAchePattern.test(concern);
  const groupMatch = !headache&&!ankle&&!stomach&&!dizzy&&!bodyAches ? findSymptomGroup(concern,facts.symptomGroup) : null;
  const needsGroup = !headache&&!ankle&&!stomach&&!dizzy&&!bodyAches&&!groupMatch&&!facts.symptomGroup;
  const question = (key, stage, text, why, options) => ({key, stage, text, why, options});
  if (caregiver && !facts.responsive) return question('responsive',1,'Is the person awake and responding normally?','A change in responsiveness can require emergency help.',[responseChoices.awake,responseChoices.unresponsive,responseChoices.unsure]);
  if (caregiver && facts.responsive===responseChoices.unsure) return question('responsive',1,'Are you with them? If you are, can they answer when you speak to them?','This helps distinguish someone who cannot be reached from someone who cannot be woken.',[responseChoices.awake,responseChoices.unresponsive,responseChoices.away]);
  if (group === 0 && !facts.adult) return question('adult',1,'Is a parent or trusted grown-up with you?','A trusted adult can help describe symptoms and get care.',['Yes','No']);
  if (group === 0 && facts.adult !== 'Yes') return question('adult',1,'Ask a parent or trusted grown-up to join you. Is someone with you now?','A trusted adult can help you get care.',['Yes','No']);
  if (needsGroup) return question('symptomGroup',0,'Which option best describes what you’d like help with?','This helps me ask questions about the right symptoms.',[...symptomGroups.map(group=>group.label),'Something else or I’m unsure']);
  if (groupMatch && !facts.symptomDetail) return question('symptomDetail',0,groupMatch.prompt,'This helps me understand what changed and what to ask next.',[...groupMatch.choices,'Something else or I’m unsure']);
  if (bodyAches && !facts.acheLocation) return question('acheLocation',0,'You mentioned body aches. Where are you feeling them most?','Aches in one area and aches all over can have different causes.',['All over my body','Mostly in one area','In a few separate areas','I’m unsure']);
  if (!facts.warning) {
    const emergencyChoices = ankle ? ankleWarnings : headache ? headacheWarnings : bodyAches ? bodyAcheWarnings : generalWarnings;
    return {...question(ankle?'ankleWarning':bodyAches&&!headache?'acheWarning':'warning',1,ankle
      ? `You mentioned pain in your ${ankleName}. First, does the ankle or foot have any of these signs?` : headache
      ? 'I’m sorry your head hurts. First, are you experiencing any of these symptoms? Choose any one that applies.'
      : bodyAches ? 'Along with the aches, have you noticed any of these symptoms?'
      : 'First, are you experiencing any of these symptoms? Choose any one that applies.',
    ankle ? 'Changes in shape, feeling, or colour can mean the ankle needs immediate care.' : 'Any one of these symptoms can be a reason to get emergency help.',[...emergencyChoices,warningOptions[0],warningOptions[2]]),emergencyChoices};
  }
  const fever = groupMatch?.label==='Fever or chills'||/\b(?:fever|feverish|chills)\b|बुखार/i.test(concern);
  const needsAge = profile.age===null && !facts.ageSkipped
    && (profile.person==='My child' || fever || (headache && couldMonitorAtHome(facts)));
  if (needsAge) return question('age',2,'How old is the patient?','Age can change what care is appropriate for this concern.');
  if (ankle && !facts.ankleWalking) return question('ankleWalking',2,'How well can you put weight on that ankle?','Trouble putting weight on the ankle can mean it needs a prompt examination.',['I can walk normally','I can walk, but it hurts',ankleUrgent[0],'I’m unsure']);
  if (ankle && !facts.ankleInjury) return question('ankleInjury',2,'What were you doing when the ankle pain started?','How it started helps decide the next questions.',['I twisted it','I fell or hit it','It started during or after activity','No injury that I remember','I’m unsure']);
  if (facts.change === 'Recheck') return question('change',0,'Compared with the previous check, are you better, the same, or worse?','Changes can affect how soon you should seek care.',['Better','Same','Worse']);
  if (!facts.onset) return question('onset',0,group === 0 ? 'When did it start hurting?' : 'When did you first notice it?','Timing helps a clinician understand whether symptoms are new or changing.',['Today','Yesterday','A few days ago','A week or more ago','I’m unsure']);
  if (!facts.severity) return question('severity',0,group === 0 ? 'How much does it hurt?' : 'How strong does it feel right now?','Severity gives us a baseline for comparing changes.',group === 0 ? ['🙂 2/10','😕 5/10','😣 8/10','I’m unsure'] : [...Array.from({length:10},(_,i)=>`${i+1}/10`),'I’m unsure']);
  if (bodyAches && !facts.acheTrigger) return question('acheTrigger',2,'What was happening around the time the aches started?','Recent activity, illness, injury, or a medicine change helps put the aches in context.',['Unusual exercise or physical work','An illness around the same time','An injury or fall','I started or changed a medicine','No obvious trigger','I’m unsure']);
  if ((dizzy || group === 3 || profile.person==='An older family member') && !facts.fall) return question('fall',2,`Has ${caregiver ? patient + ' had' : 'there been'} a recent fall or injury?`,'An injury can change how soon someone needs an assessment.',['No','Yes','I’m unsure']);
  if (caregiver && !facts.withPatient) return question('withPatient',2,'Are you physically with the patient, and can they answer questions?','It helps to know which details come directly from the patient.',['With them, they can answer','With them, they cannot answer','I’m elsewhere']);
  if ((group === 3 || profile.person==='An older family member') && !facts.assistance) return question('assistance',2,'Is someone nearby who can help if symptoms change?','It helps to know who can assist with getting care.',['Yes','No','I’m unsure']);
  if (!facts.associated) {
    const symptoms = ankle ? [ankleUrgent[1],ankleUrgent[2],ankleUrgent[3],'Mild swelling or bruising'] : headache ? ['Nausea','Vomiting','Light sensitivity','Worse when bending over or coughing']
      : stomach ? ['Vomiting','Fever','Pain is getting worse'] : dizzy ? ['Drinking less than usual','Fainted','New weakness'] : bodyAches ? ['Fever or chills','Cough or sore throat','A swollen or red area','A new rash','Unusual tiredness'] : ['Fever','Nausea','Fatigue'];
    return question(ankle?'ankleAssociated':'associated',2,ankle?'What else have you noticed about the ankle? Pick the most concerning sign that applies.':'Have you noticed anything else along with it? Choose the closest answer.','Symptoms appearing together may change the safest next step.',[...symptoms,'More than one or something else','None reported','I’m unsure']);
  }
  if (!facts.context) return question('context',2,simple ? 'Are there any medicines, allergies, or health problems we should know about?' : `Does ${caregiver ? patient + ' have' : 'your health history include'} any current medicines, allergies, or ongoing conditions?`,'This context helps a clinician assess symptoms and medicine safety.',['Current medicines','Known allergies','An ongoing condition','More than one applies','None reported','I’m unsure']);
  if ((headache || dizzy) && !facts.exposure) return question('exposure',3,'Has anything changed recently with heat, meals, water, or sleep?','Environment and routine can provide context for the symptoms.',['More heat than usual','Less food or water','Less sleep','More than one applies','No known change','I’m unsure']);
  if (facts.change && !facts.followupCare) return question('followupCare',2,'Have you tried anything since the last check?','A clinician may need to know what you tried and how the symptoms responded.',['Nothing yet','I tried something and it helped','I tried something and it didn’t help','I took medicine','I’m unsure']);
  return null;
}

export function urgency(facts, profile, emergency) {
  if (emergency) return ['Emergency','Call your local emergency service now. If you are severely unwell, do not drive yourself.'];
  if (facts.responsive===responseChoices.away) return ['Check on them now','Try to reach them or ask someone nearby to check on them now. If they cannot be woken or are not breathing normally, call emergency services immediately.'];
  if (Number(facts.severity) >= 7 || facts.fall === 'Yes' || profile.age === 0 || facts.warning === 'I’m unsure' || facts.change === 'Worse' || facts.ankleWalking==='I’m unsure' || ankleUrgent.includes(facts.ankleWalking) || ankleUrgent.includes(facts.associated) || ['Fainted','New weakness','Vomiting','Worse when bending over or coughing'].includes(facts.associated)) {
    return ['Same-day assessment','Contact a healthcare professional for a same-day assessment. Call emergency services if a warning sign appears.'];
  }
  const acheTriggerNeedsReview = ['An injury or fall','I started or changed a medicine','I’m unsure'].includes(facts.acheTrigger)||facts.symptomGroup||facts.symptomDetail;
  if (!acheTriggerNeedsReview && couldMonitorAtHome(facts) && profile.age >= 18 && profile.age < 60) {
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
  age:'मरीज़ की उम्र कितनी है?',
  responsive:'क्या मरीज़ जाग रहा है और सामान्य रूप से जवाब दे रहा है?',
  adult:'क्या आपके साथ कोई भरोसेमंद बड़ा व्यक्ति है?',
  warning:'क्या इनमें से कोई लक्षण है? लागू होने वाला कोई एक विकल्प चुनें।',
  acheLocation:'आपको शरीर में सबसे ज़्यादा दर्द कहाँ महसूस हो रहा है?',
  acheWarning:'क्या शरीर के दर्द के साथ इनमें से कोई लक्षण है?',
  acheTrigger:'जब दर्द शुरू हुआ, उस समय क्या हुआ था?',
  ankleWarning:'आपने टखने में दर्द बताया। क्या टखने या पैर में इनमें से कोई संकेत है?',
  ankleWalking:'क्या आप उस टखने पर वजन डालकर चल पा रहे हैं?',
  ankleInjury:'जब टखने में दर्द शुरू हुआ, तब आप क्या कर रहे थे?',
  ankleAssociated:'टखने में और क्या बदलाव दिखा? सबसे चिंताजनक संकेत चुनें।',
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

export const hindiAnswers = {
  'All over my body':'पूरे शरीर में',
  'Mostly in one area':'ज़्यादातर एक जगह पर',
  'In a few separate areas':'कुछ अलग-अलग जगहों पर',
  [bodyAcheWarnings[0]]:'अचानक कमज़ोरी या हाथ-पैर हिलाने में असमर्थता',
  [bodyAcheWarnings[1]]:'तेज़ बुखार के साथ गर्दन बहुत अकड़ी हुई है',
  [bodyAcheWarnings[2]]:'साँस लेने या निगलने में गंभीर दिक्कत',
  [warningOptions[0]]:'इनमें से कोई संकेत नहीं',
  [warningOptions[2]]:'मुझे पक्का नहीं पता',
  [ankleWarnings[0]]:'टखना टेढ़ा दिखता है',
  [ankleWarnings[1]]:'गहरा घाव है या हड्डी दिख रही है',
  [ankleWarnings[2]]:'पैर या उँगलियाँ सुन्न, ठंडी, नीली या फीकी हैं',
  [ankleUrgent[0]]:'चल नहीं पा रहे या पैर पर वजन नहीं डाल पा रहे',
  [ankleUrgent[1]]:'बहुत सूजन या बढ़ती सूजन',
  [ankleUrgent[2]]:'चोट के समय चटकने की आवाज़ आई',
  [ankleUrgent[3]]:'बुखार के साथ टखना लाल या गर्म है',
  'I can walk normally':'सामान्य रूप से चल पा रहे हैं',
  'I can walk, but it hurts':'चल पा रहे हैं, लेकिन दर्द है',
  'I twisted it':'टखना मुड़ गया',
  'I fell or hit it':'गिरने या टकराने से चोट लगी',
  'It started during or after activity':'गतिविधि के दौरान या बाद में शुरू हुआ',
  'No injury that I remember':'कोई चोट याद नहीं',
  'Mild swelling or bruising':'हल्की सूजन या नीला निशान',
  'More than one or something else':'एक से ज़्यादा संकेत या कुछ और',
  'None reported':'इनमें से कुछ नहीं',
  'Today':'आज',
  'Yesterday':'कल',
  'A few days ago':'कुछ दिन पहले',
  'A week or more ago':'एक हफ़्ते या उससे पहले',
  'Current medicines':'अभी ली जा रही दवाएँ',
  'Known allergies':'ज्ञात एलर्जी',
  'An ongoing condition':'पहले से कोई बीमारी',
  'More than one applies':'एक से ज़्यादा विकल्प लागू हैं',
};
