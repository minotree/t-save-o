import { moods } from './moods';
import type { MoodId } from './moods';

export function MoodPicker({selected,onChange}:{selected:MoodId;onChange:(id:MoodId)=>void}){
  return <fieldset className="mood-picker">
    <legend>어떤 분위기로 즐길까요?</legend>
    <p className="mood-help">마음에 드는 분위기를 골라 보세요.</p>
    <div className="mood-options">
      {moods.map(mood=><label key={mood.id} className={`mood-option mood-${mood.id} ${selected===mood.id?'is-selected':''}`}>
        <input type="radio" name="mood" value={mood.id} checked={selected===mood.id} onChange={()=>onChange(mood.id)}/>
        <svg className="mood-preview" viewBox="0 0 220 116" aria-hidden="true">
          <rect className="preview-panel" x="16" y="9" width="188" height="98" rx={mood.id==='modern'?10:24}/>
          <path className="preview-lines" d="M41 43 H63 M51 43 V61 M157 70 H180 M168 55 V70"/>
          <circle className="preview-ring" cx="110" cy="58" r="28"/>
          <g className="preview-face"><circle cx="102" cy="56" r="2"/><circle cx="118" cy="56" r="2"/><path d="M104 65 Q110 71 116 65"/></g>
          {mood.id==='cute'&&<g fill="#FFADB8"><ellipse cx="96" cy="64" rx="4" ry="2.5"/><ellipse cx="124" cy="64" rx="4" ry="2.5"/></g>}
        </svg>
        <span className="mood-title">{mood.name}<span className="mood-check" aria-hidden="true">{selected===mood.id?'✓':'○'}</span></span>
        <span className="mood-description">{mood.description}</span>
      </label>)}
    </div>
  </fieldset>;
}
