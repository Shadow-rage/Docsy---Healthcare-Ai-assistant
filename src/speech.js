export function onDeviceSpeechProvider(browser) {
  return [browser.SpeechRecognition,browser.webkitSpeechRecognition]
    .find(provider=>typeof provider?.install==='function'&&'processLocally' in provider.prototype);
}

export async function installDictationLanguage(provider, language) {
  if(!provider)return false;
  return provider.install({langs:[language],processLocally:true,quality:'dictation'});
}
