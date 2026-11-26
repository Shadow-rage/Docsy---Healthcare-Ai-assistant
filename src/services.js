export const emergencyDirectory = {
  India:{number:'112',source:'https://www.mha.gov.in/emergency-response-support-system-erss'},
  'United Kingdom':{number:'999',source:'https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/'},
  'United States':{number:'911',source:'https://www.911.gov/calling-911/'},
};

export const sampleWeather = {temperature:36,feelsLike:37,humidity:42,sample:true};

export function getPosition({precise=false}={}) {
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation) {reject(new Error('Location unavailable'));return;}
    navigator.geolocation.getCurrentPosition(resolve,reject,{timeout:8000,enableHighAccuracy:precise,maximumAge:precise?0:300000});
  });
}

export async function fetchLocalWeather({latitude,longitude},{signal,request=fetch}={}) {
  const url=new URL('https://api.open-meteo.com/v1/forecast');
  url.search=new URLSearchParams({
    latitude:latitude.toFixed(1),
    longitude:longitude.toFixed(1),
    current:'temperature_2m,apparent_temperature,relative_humidity_2m',
  });
  const response=await request(url,{signal,referrerPolicy:'no-referrer'});
  if(!response.ok) throw new Error('Weather unavailable');
  const {current}=await response.json();
  const temperature=current?.temperature_2m;
  const feelsLike=current?.apparent_temperature;
  const humidity=current?.relative_humidity_2m;
  if(![temperature,feelsLike,humidity].every(Number.isFinite)) throw new Error('Weather unavailable');
  return {temperature,feelsLike,humidity,sample:false};
}

export function describeWeather(weather) {
  return `${weather.sample?'Sample weather':'Local weather estimate'} · ${Math.round(weather.temperature)} °C · feels like ${Math.round(weather.feelsLike)} °C · ${Math.round(weather.humidity)}% humidity`;
}
