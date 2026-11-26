export const emergencyDirectory = {
  India:{number:'112',source:'https://www.mha.gov.in/emergency-response-support-system-erss'},
  'United Kingdom':{number:'999',source:'https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/'},
  'United States':{number:'911',source:'https://www.911.gov/calling-911/'},
};

export const sampleWeather = '36 °C · 42% humidity · moderate air quality · low pollen';

export function getPosition() {
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation) {reject(new Error('Location unavailable'));return;}
    navigator.geolocation.getCurrentPosition(resolve,reject,{timeout:8000});
  });
}
