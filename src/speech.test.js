import assert from 'node:assert/strict';
import {test} from 'node:test';
import {installDictationLanguage, onDeviceSpeechProvider} from './speech.js';

test('on-device dictation only uses a compatible recognizer and the selected language', async () => {
  class OnlineSpeech {}
  class LocalSpeech {
    get processLocally() { return true; }
    static async install(options) {
      assert.deepEqual(options,{langs:['hi-IN'],processLocally:true,quality:'dictation'});
      return true;
    }
  }
  assert.equal(onDeviceSpeechProvider({SpeechRecognition:OnlineSpeech}),undefined);
  const provider=onDeviceSpeechProvider({SpeechRecognition:OnlineSpeech,webkitSpeechRecognition:LocalSpeech});
  assert.equal(provider,LocalSpeech);
  assert.equal(await installDictationLanguage(provider,'hi-IN'),true);
});
