import assert from 'node:assert/strict';
import {test} from 'node:test';
import {demos, hasRedFlag, interpretAnswer, nextQuestion, readFacts, urgency, warningOptions} from './consultation.js';

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
