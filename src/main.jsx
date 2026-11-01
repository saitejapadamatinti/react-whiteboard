import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MousePointer2, Pencil, Eraser, Minus, Square, Circle, ArrowUpRight, Type, Undo2, Redo2, Trash2, Download, Plus, Minus as ZoomOut, Maximize, Grid2X2, Share2, ChevronDown, Hand, StickyNote } from 'lucide-react';
import './style.css';

const tools = [
  ['select', MousePointer2, 'Select'], ['pen', Pencil, 'Pen'], ['eraser', Eraser, 'Eraser'],
  ['line', Minus, 'Line'], ['rect', Square, 'Rectangle'], ['circle', Circle, 'Circle'],
  ['arrow', ArrowUpRight, 'Arrow'], ['text', Type, 'Text'], ['note', StickyNote, 'Sticky note']
];
const colors = ['#202536','#64748b','#ef4444','#f97316','#eab308','#22c55e','#0ea5e9','#6366f1','#a855f7','#ec4899'];

function App() {
  const canvasRef = useRef(null), wrapRef = useRef(null), drawing = useRef(false), start = useRef(null), current = useRef(null);
  const [tool,setTool] = useState('pen'), [color,setColor] = useState('#202536'), [size,setSize] = useState(3);
  const [objects,setObjects] = useState([]), [past,setPast] = useState([]), [future,setFuture] = useState([]);
  const [zoom,setZoom] = useState(100), [grid,setGrid] = useState(true), [name,setName] = useState('Untitled board');
  const [textInput,setTextInput] = useState(null), [selected,setSelected] = useState(null);

  const snapshot = useCallback((next) => { setPast(p=>[...p,objects]); setFuture([]); setObjects(next); },[objects]);
  const point = e => { const r=canvasRef.current.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top}; };
  const draw = useCallback((items, preview=null) => {
    const canvas=canvasRef.current; if(!canvas) return; const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.lineCap='round'; ctx.lineJoin='round';
    const all=preview?[...items,preview]:items;
    all.forEach(o=>{ctx.strokeStyle=o.color||'#202536';ctx.fillStyle=o.color||'#202536';ctx.lineWidth=o.size||3;
      if(o.type==='pen'||o.type==='eraser'){if(!o.points?.length)return;ctx.beginPath();ctx.moveTo(o.points[0].x,o.points[0].y);o.points.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();}
      if(o.type==='line'||o.type==='arrow'){ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(o.x2,o.y2);ctx.stroke();if(o.type==='arrow'){const a=Math.atan2(o.y2-o.y,o.x2-o.x);ctx.beginPath();ctx.moveTo(o.x2,o.y2);ctx.lineTo(o.x2-15*Math.cos(a-.45),o.y2-15*Math.sin(a-.45));ctx.moveTo(o.x2,o.y2);ctx.lineTo(o.x2-15*Math.cos(a+.45),o.y2-15*Math.sin(a+.45));ctx.stroke();}}
      if(o.type==='rect'){ctx.strokeRect(o.x,o.y,o.x2-o.x,o.y2-o.y);}
      if(o.type==='circle'){ctx.beginPath();ctx.ellipse((o.x+o.x2)/2,(o.y+o.y2)/2,Math.abs(o.x2-o.x)/2,Math.abs(o.y2-o.y)/2,0,0,Math.PI*2);ctx.stroke();}
      if(o.type==='text'){ctx.font=`${o.size*6+12}px Inter, sans-serif`;ctx.fillText(o.text,o.x,o.y);}
      if(o.type==='note'){ctx.fillStyle='#fff2b3';ctx.fillRect(o.x,o.y,170,120);ctx.fillStyle='#594b22';ctx.font='16px Inter, sans-serif';(o.text||'Add your note').split('\n').forEach((line,i)=>ctx.fillText(line,o.x+12,o.y+28+i*22));}
    });
  },[]);
  useEffect(()=>{const c=canvasRef.current;const resize=()=>{const r=wrapRef.current.getBoundingClientRect();const dpr=window.devicePixelRatio||1;c.width=r.width*dpr;c.height=r.height*dpr;c.style.width=r.width+'px';c.style.height=r.height+'px';c.getContext('2d').scale(dpr,dpr);draw(objects);};resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[draw,objects]);
  useEffect(()=>{draw(objects);},[objects,draw]);
  const down=e=>{
    // Accept only active stylus input; reject finger, palm and mouse contacts.
    if(e.pointerType !== 'pen') return;
    if(tool==='text'||tool==='note'){const p=point(e);setTextInput({x:p.x,y:p.y,type:tool});return;}
    if(tool==='select'){setSelected(null);return;}
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drawing.current=true;
    const p=point(e);
    start.current=p;
    current.current={type:tool==='eraser'?'eraser':tool,color:tool==='eraser'?'#ffffff':color,size:tool==='eraser'?size*5:size,x:p.x,y:p.y,x2:p.x,y2:p.y,points:[p]};
  };
  const move=e=>{if(!drawing.current)return;const p=point(e);const o={...current.current,x2:p.x,y2:p.y};if(tool==='pen'||tool==='eraser')o.points=[...current.current.points,p];current.current=o;draw(objects,o);};
  const up=e=>{if(!drawing.current)return;drawing.current=false;const o=current.current;if(o) snapshot([...objects,o]);current.current=null;if(e?.currentTarget?.hasPointerCapture?.(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);};
  const finishText=()=>{if(!textInput)return;const el=document.getElementById('canvas-text-entry');const value=el?.value?.trim();if(value){const o={type:textInput.type==='note'?'note':'text',x:textInput.x,y:textInput.y,text:value,color,size};snapshot([...objects,o]);}setTextInput(null);};
  const undo=()=>{if(!past.length)return;setFuture(f=>[objects,...f]);setObjects(past[past.length-1]);setPast(p=>p.slice(0,-1));};
  const redo=()=>{if(!future.length)return;setPast(p=>[...p,objects]);setObjects(future[0]);setFuture(f=>f.slice(1));};
  const exportPNG=()=>{const c=document.createElement('canvas');c.width=canvasRef.current.width;c.height=canvasRef.current.height;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);const live=canvasRef.current;ctx.drawImage(live,0,0);const a=document.createElement('a');a.download='sketchboard.png';a.href=c.toDataURL('image/png');a.click();};
  const clear=()=>{if(objects.length&&confirm('Clear everything on this board?'))snapshot([]);};
  useEffect(()=>{const handler=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}if(e.key==='Escape')setTextInput(null);};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);});
  return <div className="app">
    <header className="topbar"><div className="brand"><div className="brand-mark"><Grid2X2 size={18}/></div><span>sketch<span className="brand-light">board</span></span></div><div className="board-title"><input value={name} onChange={e=>setName(e.target.value)} aria-label="Board name"/><ChevronDown size={14}/><span className="saved"><i/> Saved locally</span></div><div className="top-actions"><button className="icon-btn" title="Undo (Ctrl+Z)" onClick={undo} disabled={!past.length}><Undo2 size={18}/></button><button className="icon-btn" title="Redo (Ctrl+Y)" onClick={redo} disabled={!future.length}><Redo2 size={18}/></button><span className="top-divider"/><button className="share-btn" onClick={()=>navigator.clipboard?.writeText(location.href).then(()=>alert('Board link copied. Note: this board is stored locally, not synced.')).catch(()=>alert('Copy is unavailable in this browser.'))}><Share2 size={16}/> Share</button><button className="export-btn" onClick={exportPNG}><Download size={16}/> Export</button></div></header>
    <main className="workspace"><aside className="left-rail"><div className="rail-label">TOOLS</div>{tools.map(([id,Icon,label])=><button key={id} className={`tool-btn ${tool===id?'active':''}`} title={label} aria-label={label} onClick={()=>setTool(id)}><Icon size={19}/></button>)}<div className="rail-sep"/><button className={`tool-btn ${grid?'active-soft':''}`} title="Toggle grid" onClick={()=>setGrid(!grid)}><Grid2X2 size={18}/></button><button className="tool-btn" title="Clear board" onClick={clear}><Trash2 size={18}/></button><div className="rail-bottom"><span className="avatar">S</span></div></aside>
    <section className="canvas-area"><div className="canvas-hint"><span className="hint-dot"/> {tool==='pen'?'Draw anything':tool==='eraser'?'Erase strokes':`Tool: ${tools.find(t=>t[0]===tool)?.[2]}`} <span className="hint-separator">·</span> Changes stay in this browser</div><div className={`canvas-wrap ${grid?'with-grid':''}`} ref={wrapRef}><canvas ref={canvasRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up}/>{textInput&&<div className="text-editor" style={{left:textInput.x,top:textInput.y}}><textarea id="canvas-text-entry" autoFocus placeholder={textInput.type==='note'?'Write a note…':'Type something…'} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();finishText();}if(e.key==='Escape')setTextInput(null);}}/><div><button onClick={finishText}>Add to board</button><button className="cancel" onClick={()=>setTextInput(null)}>Cancel</button></div></div>}</div><div className="canvas-footer"><span><Hand size={14}/> Drag on canvas to draw</span><div className="zoom-controls"><button onClick={()=>setZoom(z=>Math.max(50,z-10))}><ZoomOut size={15}/></button><span>{zoom}%</span><button onClick={()=>setZoom(z=>Math.min(150,z+10))}><Plus size={15}/></button><button onClick={()=>setZoom(100)} title="Reset zoom"><Maximize size={14}/></button></div></div></section>
    <aside className="right-panel"><div className="panel-heading">Style <span className="panel-more">•••</span></div><div className="panel-section"><div className="section-title">COLOR</div><div className="color-grid">{colors.map(c=><button key={c} className={`swatch ${color===c?'chosen':''}`} style={{background:c}} onClick={()=>setColor(c)} aria-label={`Set color ${c}`}/>)}</div><div className="custom-color"><span>Custom color</span><input type="color" value={color} onChange={e=>setColor(e.target.value)}/></div></div><div className="panel-section"><div className="section-title">STROKE WIDTH <b>{size}px</b></div><input className="range" type="range" min="1" max="12" value={size} onChange={e=>setSize(+e.target.value)}/><div className="range-labels"><span>Thin</span><span>Thick</span></div></div><div className="panel-section"><div className="section-title">QUICK ACTIONS</div><button className="action-row" onClick={undo}><Undo2 size={16}/> Undo <kbd>⌘ Z</kbd></button><button className="action-row" onClick={redo}><Redo2 size={16}/> Redo <kbd>⌘ ⇧ Z</kbd></button><button className="action-row" onClick={exportPNG}><Download size={16}/> Download PNG</button><button className="action-row danger" onClick={clear}><Trash2 size={16}/> Clear canvas</button></div><div className="panel-tip"><div className="tip-icon">✦</div><div><b>A little inspiration</b><p>Great ideas start with a rough sketch. Don't worry about making it perfect.</p></div></div><div className="panel-bottom">Made for ideas <span>✳</span></div></aside></main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);