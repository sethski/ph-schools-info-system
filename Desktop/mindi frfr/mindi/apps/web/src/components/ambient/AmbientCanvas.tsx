// =============================================================================
// MINDI — AmbientCanvas (Phase 4 — driven by Python style fingerprint)
// writingRhythm from extract.py drives particle speed:
//   "short punchy" → fast · "long flowing" → slow
// =============================================================================
'use client';
import { useEffect, useRef, useCallback } from 'react';
import type { AmbientPersonality } from '../../../../../shared/types/phase4';
import type { EmotionalState } from '../../../../../shared/types/phase2';

interface Props {
  personality: AmbientPersonality;
  emotionalState?: EmotionalState;
  isSyncing?: boolean;
  isDnD?: boolean;
  writingRhythm?: string;
  className?: string;
}

const EM: Record<EmotionalState, { speed: number; density: number; glow: number }> = {
  focused: {speed:0.8,density:0.9,glow:0.9}, stressed: {speed:0.4,density:0.5,glow:0.5},
  fatigued:{speed:0.3,density:0.4,glow:0.4}, neutral:  {speed:1.0,density:1.0,glow:1.0},
  productive:{speed:1.2,density:1.1,glow:1.1},
};

function rhythmMul(r?: string) {
  if (!r) return 1;
  const l = r.toLowerCase();
  if (l.includes('short')||l.includes('punchy')||l.includes('terse')) return 1.4;
  if (l.includes('long') ||l.includes('flowing')||l.includes('dense')) return 0.7;
  return 1;
}

function rgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? {r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)} : {r:99,g:102,b:241};
}

export default function AmbientCanvas({personality,emotionalState='neutral',isSyncing=false,isDnD=false,writingRhythm,className=''}: Props) {
  const cvs=useRef<HTMLCanvasElement>(null), pts=useRef<any[]>([]), raf=useRef(0), tick=useRef(0);
  const rm = typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const build = useCallback((W:number,H:number)=>{
    const em=EM[emotionalState], rm2=rhythmMul(writingRhythm);
    const n=isDnD?3:Math.floor(personality.particleDensity*em.density*60);
    const spd=personality.particleSpeed*em.speed*rm2;
    pts.current=Array.from({length:n},()=>{
      const ml=180+Math.random()*240;
      return{x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*spd*.8,vy:(Math.random()-.5)*spd*.8,
             sz:1+Math.random()*3,op:0,od:.008+Math.random()*.006,sec:Math.random()>.6,life:Math.random()*ml,ml};
    });
  },[personality,emotionalState,isDnD,writingRhythm]);

  useEffect(()=>{
    const c=cvs.current; if(!c)return;
    const ctx=c.getContext('2d'); if(!ctx)return;
    const resize=()=>{c.width=c.offsetWidth*devicePixelRatio;c.height=c.offsetHeight*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);build(c.offsetWidth,c.offsetHeight);};
    resize();
    const ro=new ResizeObserver(resize); ro.observe(c);

    if(rm){
      const r=rgb(personality.primaryColor);
      const g=ctx.createRadialGradient(c.offsetWidth/2,c.offsetHeight/2,0,c.offsetWidth/2,c.offsetHeight/2,c.offsetWidth*.4);
      g.addColorStop(0,`rgba(${r.r},${r.g},${r.b},.08)`);g.addColorStop(1,'transparent');
      ctx.fillStyle=g;ctx.fillRect(0,0,c.offsetWidth,c.offsetHeight);
      return()=>ro.disconnect();
    }

    const em=EM[emotionalState], glow=personality.glowIntensity*em.glow*(isDnD?.1:1);
    const pr=rgb(personality.primaryColor);

    const draw=()=>{
      tick.current++;
      const W=c.offsetWidth,H=c.offsetHeight;
      ctx.clearRect(0,0,W,H);
      if(glow>0){
        const p=1+Math.sin(tick.current*.015)*.1;
        const bg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*.45*p);
        bg.addColorStop(0,`rgba(${pr.r},${pr.g},${pr.b},${glow*.08})`);bg.addColorStop(1,'transparent');
        ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
      }
      if(isSyncing){
        const ps=(tick.current*2)%(Math.min(W,H)*.4);
        const po=Math.max(0,.3-ps/(W*.4));
        ctx.beginPath();ctx.arc(W/2,H/2,ps,0,Math.PI*2);
        ctx.strokeStyle=`rgba(${pr.r},${pr.g},${pr.b},${po})`;ctx.lineWidth=1;ctx.stroke();
      }
      for(const p of pts.current){
        p.life++;p.x+=p.vx;p.y+=p.vy;
        if(p.life<p.ml*.2) p.op=Math.min(.6,p.op+p.od);
        else if(p.life>p.ml*.8) p.op=Math.max(0,p.op-p.od*2);
        if(p.x<-20||p.x>W+20||p.y<-20||p.y>H+20||p.life>=p.ml){p.x=Math.random()*W;p.y=Math.random()*H;p.life=0;p.op=0;}
        const col=p.sec?personality.secondaryColor:personality.primaryColor;
        const {r,g:gr,b}=rgb(col);
        ctx.fillStyle=`rgba(${r},${gr},${b},${p.op})`;
        ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();
      }
      raf.current=requestAnimationFrame(draw);
    };
    raf.current=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf.current);ro.disconnect();};
  },[personality,emotionalState,isSyncing,isDnD,writingRhythm,build,rm]);

  return <canvas ref={cvs} className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} style={{willChange:'transform'}} aria-hidden="true" role="presentation"/>;
}
