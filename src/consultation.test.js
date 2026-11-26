import assert from 'node:assert/strict';
import {test} from 'node:test';
import {canReviewGenericMedicine, demos, hasRedFlag, interpretAnswer, nextQuestion, readFacts, responseChoices, urgency, warningOptions} from './consultation.js';

test('the emergency demo and common urgent phrases trigger the override', () => {
  for (const report of [demos[4].concern,'I have slurred speech.','He is unconscious.','सीने में दर्द है','I want to kill myself.']) {
    assert.equal(hasRedFlag(report),true,report);
  }
  for (const report of ['My head hurts.','No chest pain.','My headache is 4/10.']) {
    assert.equal(hasRedFlag(report),false,report);
  }
});

test('known timing and severity are not asked again', () => {
  const concern = demos[2].concern;
  const profile = {age:32,person:'Myself'};
  const facts = readFacts(concern);
  assert.deepEqual(facts,{severity:'2',onset:'this morning'});
  assert.equal(nextQuestion({profile,facts,concern}).key,'warning');
  assert.equal(nextQuestion({profile,facts:{...facts,warning:'No warning signs'},concern}).key,'associated');
});

test('caregivers check responsiveness first and older adults are asked about falls', () => {
  const {age,person,concern} = demos[3];
  const profile = {age,person};
  const facts = readFacts(concern);
  assert.equal(nextQuestion({profile,facts,concern}).key,'responsive');
  assert.equal(nextQuestion({profile,facts:{...facts,responsive:'Yes',warning:'No warning signs'},concern}).key,'fall');
});

test('a worsening severity can increase urgency and emergency always wins', () => {
  const mild = {severity:'2',associated:'None reported',context:'None reported',warning:'No warning signs'};
  const profile = {age:28};
  assert.equal(urgency(mild,profile,false)[0],'Monitor symptoms');
  assert.equal(urgency({...mild,severity:'7'},profile,false)[0],'Same-day assessment');
  assert.equal(urgency(mild,profile,true)[0],'Emergency');
});

test('free-text replies keep descriptions and clarify ambiguous safety answers', () => {
  const warning = {key:'warning',options:warningOptions};
  assert.equal(interpretAnswer(warning,'No, none of those apply.'),warningOptions[0]);
  assert.equal(interpretAnswer(warning,'I’m not sure if it counts.'),warningOptions[2]);
  assert.equal(interpretAnswer(warning,'Bending over makes it worse.'),null);
  assert.equal(interpretAnswer({key:'severity'},'It aches when I bend over.'),'It aches when I bend over.');
  assert.equal(interpretAnswer({key:'severity'},'Around 6 out of 10.'),'6');
  assert.equal(interpretAnswer({key:'responsive'},'She is awake and talking to me.'),'Yes');
  assert.equal(interpretAnswer({key:'responsive'},'She is sitting next to me.'),null);
});

test('headache warning choices name the actual symptoms and map to emergency', () => {
  const question=nextQuestion({profile:{age:30,person:'Myself'},facts:{},concern:'I have a head ache'});
  assert.ok(question.options.includes('Sudden, extremely painful headache'));
  assert.ok(question.options.includes('Fever with a stiff neck'));
  for (const choice of question.emergencyChoices) assert.equal(interpretAnswer(question,choice),warningOptions[1]);
  assert.equal(interpretAnswer(question,warningOptions[0]),warningOptions[0]);
});

test('generic medicine review is limited to mild recent headaches in eligible adults', () => {
  const facts={onset:'this morning',severity:'2',warning:warningOptions[0],associated:'None reported',context:'None reported'};
  const profile={person:'Myself',age:32};
  const input={concern:'My head hurts',facts,profile,emergency:false};
  assert.equal(canReviewGenericMedicine(input),true);
  assert.equal(canReviewGenericMedicine({...input,emergency:true}),false);
  assert.equal(canReviewGenericMedicine({...input,concern:'I feel dizzy'}),false);
  assert.equal(canReviewGenericMedicine({...input,profile:{...profile,age:12}}),false);
  assert.equal(canReviewGenericMedicine({...input,facts:{...facts,warning:warningOptions[2]}}),false);
  assert.equal(canReviewGenericMedicine({...input,facts:{...facts,context:'Current medicines'}}),false);
  assert.equal(canReviewGenericMedicine({...input,facts:{...facts,onset:'A week or more ago'}}),false);
});

test('left ankle pain asks about the ankle and inability to bear weight prompts assessment', () => {
  const profile={person:'Myself',age:32};
  const concern='hi i have pain in my left ankle';
  const question=nextQuestion({profile,concern,facts:{}});
  assert.match(question.text,/left ankle/);
  assert.ok(question.options.includes('Ankle looks bent out of shape'));
  assert.equal(interpretAnswer(question,'Deep wound or visible bone'),warningOptions[1]);
  const facts={warning:warningOptions[0]};
  assert.equal(nextQuestion({profile,concern,facts}).key,'ankleWalking');
  facts.ankleWalking='I can’t walk or put weight on it';
  assert.equal(nextQuestion({profile,concern,facts}).key,'ankleInjury');
  assert.equal(urgency(facts,profile,false)[0],'Same-day assessment');
});

test('an unsure caregiver gets a follow-up before emergency is assumed', () => {
  const profile={person:'An older family member',age:70};
  const concern='My father is dizzy';
  const check=nextQuestion({profile,concern,facts:{responsive:responseChoices.unsure}});
  assert.ok(check.options.includes(responseChoices.away));
  const facts={responsive:responseChoices.away};
  assert.equal(urgency(facts,profile,false)[0],'Check on them now');
  assert.equal(nextQuestion({profile,concern,facts}).key,'warning');
});

test('body pains open with location and use an aches-specific safety check', () => {
  const profile={person:'Myself',age:70};
  const concern='body pains';
  assert.equal(nextQuestion({profile,concern,facts:{}}).key,'acheLocation');
  const facts={acheLocation:'All over my body'};
  const safety=nextQuestion({profile,concern,facts});
  assert.equal(safety.key,'acheWarning');
  assert.ok(safety.options.includes('A high fever with a very stiff neck'));
  assert.equal(interpretAnswer(safety,safety.emergencyChoices[0]),warningOptions[1]);
  assert.equal(nextQuestion({profile,concern,facts:{...facts,warning:warningOptions[0],onset:'Today',severity:'4'}}).key,'acheTrigger');
});

test('common symptom groups use tailored questions and unfamiliar reports get a category choice', () => {
  const profile={person:'Myself',age:35};
  for (const [concern,pattern] of [
    ['I have a cough',/nose, or throat/],['It burns when I pee',/urinate/],
    ['There is a rash on my leg',/skin/],['Pain in my left ankle area (front view) · 4/10',/left ankle/],
    ['Pain in head (front view) · 4/10',/head hurts/],
  ]) {
    assert.match(nextQuestion({profile,concern,facts:{}}).text,pattern);
  }
  const concern='Something feels off';
  assert.equal(nextQuestion({profile,concern,facts:{}}).key,'symptomGroup');
  const facts={symptomGroup:'Ear or hearing symptoms'};
  assert.match(nextQuestion({profile,concern,facts}).text,/ear or hearing/);
});

test('age is requested for fever or eligible headache self-care, not during unrelated triage', () => {
  const profile={person:'Myself',age:null};
  const warning=warningOptions[0];
  assert.equal(nextQuestion({profile,concern:'I hurt my ankle',facts:{warning}}).key,'ankleWalking');
  const concern='I have a fever';
  const facts={warning,symptomDetail:'I measured a fever'};
  assert.equal(nextQuestion({profile,concern,facts}).key,'age');
  assert.equal(nextQuestion({profile,concern,facts:{...facts,ageSkipped:true}}).key,'onset');
  assert.equal(nextQuestion({profile,concern:'My headache started today',facts:{warning,associated:'None reported',context:'None reported',severity:'2'}}).key,'age');
  assert.equal(urgency({warning},profile,false)[0],'Contact a clinician');
  assert.equal(urgency({warning},{...profile,age:0},false)[0],'Same-day assessment');
});

test('a lower-torso pin clarifies location and asks only area-specific safety questions', () => {
  const profile={person:'Myself',age:null};
  const concern='Pain in lower torso (front view) · 6/10 · aching · side selected: left';
  const first=nextQuestion({profile,concern,facts:{severity:'6'}});
  assert.equal(first.key,'lowerTorsoArea');
  for (const [lowerTorsoArea,expected] of [
    ['Lower belly','Vomiting blood or passing black, sticky stool'],
    ['Groin or pelvis','Feeling faint or passing out with the pain'],
    ['Hip or side of the hip','Unable to walk or put weight on that leg'],
  ]) {
    const question=nextQuestion({profile,concern,facts:{severity:'6',lowerTorsoArea}});
    assert.equal(question.key,'lowerTorsoWarning');
    assert.ok(question.options.includes(expected));
    assert.ok(!question.options.includes('Severe trouble breathing or chest pain'));
    assert.equal(interpretAnswer(question,expected),warningOptions[1]);
  }
  assert.equal(nextQuestion({profile,concern,facts:{severity:'6',lowerTorsoArea:'Lower belly',warning:warningOptions[0]}}).key,'onset');
});

test('upper-front torso pressure uses chest safety checks and keeps injury follow-ups relevant', () => {
  const concern='Pain in left upper torso (front view) · 7/10 · pressure · side selected: left';
  const profile={person:'Myself',age:null};
  const facts={severity:'7'};
  const first=nextQuestion({profile,concern,facts});
  assert.equal(first.key,'chestWarning');
  assert.equal(interpretAnswer(first,'Sudden pressure that is not going away'),warningOptions[1]);
  facts.warning=warningOptions[0];
  assert.equal(nextQuestion({profile,concern,facts}).key,'chestTrigger');
  facts.chestTrigger='After a blow, fall, or injury';
  assert.equal(nextQuestion({profile,concern,facts}).text,'When did the injury happen?');
  assert.equal(urgency(facts,profile,false,concern)[0],'Same-day assessment');
  assert.equal(canReviewGenericMedicine({concern,facts,profile:{...profile,age:35},emergency:false}),false);
});

test('mild ankle symptoms and exertional aches can qualify for screened medicine information', () => {
  const profile={person:'Myself',age:35};
  const facts={onset:'Today',severity:'3',warning:warningOptions[0],associated:'None reported',context:'None reported'};
  assert.equal(canReviewGenericMedicine({concern:'My ankle aches',facts:{...facts,ankleWalking:'I can walk normally',ankleInjury:'I twisted it'},profile,emergency:false}),true);
  assert.equal(canReviewGenericMedicine({concern:'body aches',facts:{...facts,acheTrigger:'Unusual exercise or physical work'},profile,emergency:false}),true);
  assert.equal(canReviewGenericMedicine({concern:'body aches',facts:{...facts,acheTrigger:'I started or changed a medicine'},profile,emergency:false}),false);
});
