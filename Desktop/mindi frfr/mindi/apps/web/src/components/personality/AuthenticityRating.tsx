// =============================================================================
// MINDI — AuthenticityRating (Phase 4 — wired to Python /style/feedback)
// Submits 1-5 score to /api/style-feedback → Python updates style_match_score.
// Low scores (≤2) flag region for re-extraction on next ingest.
// =============================================================================
'use client';
import { useState, useCallback } from 'react';
import { useAuth } from '../../app/auth/useAuth';

type FeedbackType = 'tone'|'accuracy'|'structure'|'voice';
interface Props { prompt?: string; region?: string; onSubmit?: (score:number,fb?:string)=>void; onDismiss?: ()=>void; }
const FB: Array<{value:FeedbackType;label:string}> = [
  {value:'tone',label:"The tone was off"},{value:'accuracy',label:"Facts felt wrong"},
  {value:'structure',label:"Structure didn't fit"},{value:'voice',label:"Not my voice"},
];

export default function AuthenticityRating({prompt='Did this feel like you?',region,onSubmit,onDismiss}:Props) {
  const {user} = useAuth();
  const [score,setScore]=useState<number|null>(null);
  const [feedback,setFeedback]=useState<FeedbackType|null>(null);
  const [submitted,setSubmitted]=useState(false);
  const [hovered,setHovered]=useState<number|null>(null);

  const submit = useCallback(async()=>{
    if(!score||!user)return;
    try {
      const tok = await user.getIdToken();
      await fetch('/api/style-feedback',{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},
        body:JSON.stringify({uid:user.uid,score,region:region??'overall',feedback_type:feedback}),
      });
    } catch { /* non-blocking */ }
    onSubmit?.(score,feedback??undefined);
    setSubmitted(true);
  },[score,feedback,user,region,onSubmit]);

  if(submitted) return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
      <span className="text-emerald-400 text-xs font-medium">✓ Thanks — Mindi learns from this</span>
    </div>
  );

  const d = hovered??score;
  return (
    <div className="space-y-3 py-3 px-4 rounded-xl bg-white/3 border border-white/8" role="group" aria-label="Rate this response">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">{prompt}</p>
        <button onClick={onDismiss} aria-label="Dismiss" className="text-white/20 hover:text-white/40 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center text-xs">✕</button>
      </div>
      <div className="flex gap-1" role="radiogroup" aria-label="Score 1 to 5">
        {[1,2,3,4,5].map(s=>(
          <button key={s} onClick={()=>setScore(s)}
            onMouseEnter={()=>setHovered(s)} onMouseLeave={()=>setHovered(null)}
            role="radio" aria-checked={score===s} aria-label={`${s} out of 5`}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all min-h-[44px] ${(d??0)>=s?'border-amber-500/40 bg-amber-500/15 text-amber-300':'border-white/8 bg-white/3 text-white/25 hover:text-white/50'}`}>★</button>
        ))}
      </div>
      {d && <p className="text-[10px] text-white/30 text-center">{d===5?'Perfect — this is exactly me':d===4?'Pretty close':d===3?'Somewhat like me':d===2?'Not quite right':"Didn't feel like me"}</p>}
      {score!==null&&score<=3 && (
        <div className="flex flex-wrap gap-1.5">
          <p className="w-full text-[10px] text-white/30 mb-0.5">What felt off?</p>
          {FB.map(o=>(
            <button key={o.value} onClick={()=>setFeedback(f=>f===o.value?null:o.value)} aria-pressed={feedback===o.value}
              className={`px-2.5 py-1 rounded-full border text-[10px] font-medium transition-all min-h-[44px] ${feedback===o.value?'border-red-500/40 bg-red-500/15 text-red-400':'border-white/8 bg-white/3 text-white/35 hover:text-white/55'}`}>{o.label}</button>
          ))}
        </div>
      )}
      {score!==null&&<button onClick={submit} className="w-full py-2 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 rounded-xl text-xs font-medium hover:bg-indigo-500/25 transition-all min-h-[44px]">Submit</button>}
    </div>
  );
}
