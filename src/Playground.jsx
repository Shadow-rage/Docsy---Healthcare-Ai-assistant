import React, {useState} from 'react';
import {Heart, RotateCcw, Sparkles, Sun} from 'lucide-react';
import companionArt from './docsy-companion.webp';

const scenes=[
  {label:'Mint garden',className:'mint',icon:Sparkles},
  {label:'Golden hour',className:'gold',icon:Sun},
  {label:'Lavender sky',className:'lavender',icon:Heart},
];

export default function Playground() {
  const [scene,setScene]=useState(0);
  const [wave,setWave]=useState(0);
  const [still,setStill]=useState(false);
  const current=scenes[scene];
  return <div className="playground">
    <p>Pick a scene or tap Docsy to say hello. You can return to your chat whenever you’re ready.</p>
    <div className={'play-scene '+current.className+(still?' still':'')}>
      <div className="play-orbit" aria-hidden="true"/>
      <button className="play-companion" aria-label="Wave to Docsy" onClick={()=>setWave(count=>count+1)}>
        <img alt="" src={companionArt}/>
        {wave>0&&<span key={wave} className="play-spark" aria-hidden="true">✦</span>}
      </button>
      <p className="play-caption" aria-live="polite">{wave ? (wave%2?'Docsy waves back!':'Hello again!') : current.label}</p>
    </div>
    <div className="chips" role="group" aria-label="Playground scene">{scenes.map(({label,icon:Icon},i)=><button key={label} aria-pressed={scene===i} className={scene===i?'chosen':''} onClick={()=>{setScene(i);setWave(0);}}><Icon size={16}/>{label}</button>)}</div>
    <div className="play-settings">
      <button className="text-button" aria-pressed={still} onClick={()=>setStill(value=>!value)}>{still?'Enable animation':'Pause animation'}</button>
      <button className="text-button" onClick={()=>{setScene(0);setWave(0);}}><RotateCcw size={15}/> Reset scene</button>
    </div>
  </div>;
}
