import assert from 'node:assert/strict';
import {test} from 'node:test';
import {weatherContext} from './consultation.js';
import {fetchLocalWeather} from './services.js';

test('forecast requests send rounded coordinates and unpack current weather', async () => {
  const weather=await fetchLocalWeather({latitude:19.076,longitude:72.8777},{request:async url=>{
    assert.equal(url.searchParams.get('latitude'),'19.1');
    assert.equal(url.searchParams.get('longitude'),'72.9');
    assert.ok(url.searchParams.get('current').includes('apparent_temperature'));
    return {ok:true,json:async()=>({current:{temperature_2m:34,apparent_temperature:38,relative_humidity_2m:60}})};
  }});
  assert.deepEqual(weather,{temperature:34,feelsLike:38,humidity:60,sample:false});
});

test('weather context is conditional and never interrupts emergency guidance', () => {
  const input={weather:{feelsLike:38},concern:'My head hurts',emergency:false,language:'en-US'};
  assert.match(weatherContext(input),/exposure is still unknown/);
  assert.match(weatherContext({...input,exposure:'More heat than usual'}),/You reported/);
  assert.equal(weatherContext({...input,concern:'My left ankle hurts'}),'');
  assert.equal(weatherContext({...input,emergency:true}),'');
  assert.equal(weatherContext({...input,weather:{feelsLike:20}}),'');
});
