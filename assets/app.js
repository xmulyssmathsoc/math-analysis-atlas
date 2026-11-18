/* Math Atlas — dependency-free educational web app. No model keys in the browser. */
'use strict';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const math = (source) => `$$${escapeHtml(source)}$$`;
const LEVELS = ['预备 · 概念启蒙','入门 · 基础计算','进阶 · 定理应用','拔高 · 严格证明','高阶 · 现代分析'];
const STAGES = ['预备桥梁','数学分析 I','数学分析 II','多元分析 III','高阶分析'];
const STAGE_LETTERS = ['∑','ε','∞','∂','∫'];
const COLORS = ['#67aecb','#8877de','#688fdf','#31aca4','#d2a05e'];
const VIEW_NAMES = {dashboard:'学习总览',graph:'知识星图',paths:'学习路径',library:'知识卡片',practice:'分层题库',lab:'极限实验室',tutor:'AI 学习导师',resources:'开放资源馆'};
const TRACKS = [
 {title:'预备桥梁',tag:'从直觉走向严谨',desc:'集合与量词、函数、不等式、归纳法和证明方法。为大学数学分析建立语言与工具。'},
 {title:'数学分析 I',tag:'极限 · 连续 · 微积分',desc:'实数完备性、ε–N 和 ε–δ、连续函数、导数、中值定理与黎曼积分。'},
 {title:'数学分析 II',tag:'无穷过程与一致性',desc:'数项级数、函数列、幂级数、反常积分以及极限交换背后的条件。'},
 {title:'多元分析 III',tag:'从直线走向空间',desc:'多元微分、隐函数、最优化、重积分、曲线积分与向量场。'},
 {title:'高阶分析',tag:'现代实分析的入口',desc:'度量空间、测度与 Lebesgue 积分、Lᵖ 空间、泛函分析初步。'}
];
const RESOURCES = [
 {name:'MIT OCW · Real Analysis',type:'严谨课程 / 本科高阶',icon:'M',tag:'核心推荐 · 理论与证明',desc:'MIT 18.100B，公开讲义覆盖实数、数列、紧致性、连续、可微、黎曼积分与一致收敛。',url:'https://ocw.mit.edu/courses/18-100b-real-analysis-spring-2025/pages/lecture-notes/'},
 {name:'OpenStax Calculus · Vol. 1',type:'开放教材 / 入门',icon:'O',tag:'函数 · 极限 · 导数 · 积分',desc:'可自由在线阅读的微积分教材，适合从计算和直觉起步。使用时遵守原站版权许可。',url:'https://openstax.org/books/calculus-volume-1/pages/preface'},
 {name:'OpenStax Calculus · Vol. 2',type:'开放教材 / 进阶',icon:'O',tag:'级数 · 积分方法 · 微分方程',desc:'继续学习级数、幂级数、参数形式与积分技术。',url:'https://openstax.org/books/calculus-volume-2/pages/preface'},
 {name:'OpenStax Calculus · Vol. 3',type:'开放教材 / 多元',icon:'O',tag:'多元函数 · 重积分 · 向量分析',desc:'从多元函数走向偏导、重积分及向量微积分。',url:'https://openstax.org/books/calculus-volume-3/pages/preface'},
 {name:'3Blue1Brown · Essence of Calculus',type:'可视化视频 / 直觉',icon:'3',tag:'图像直觉 · 变化率 · 累积',desc:'用可视化方式重建微积分直觉，适合与严格证明交叉学习。',url:'https://www.3blue1brown.com/lessons/essence-of-calculus/'},
 {name:'MIT · Calculus Open Textbook',type:'免费在线教材 / 系统',icon:'∫',tag:'Gilbert Strang · 计算与应用',desc:'MIT OCW 中的经典微积分电子教材和配套资源。',url:'https://ocw.mit.edu/courses/res-18-001-calculus-fall-2023/pages/open-textbook/'},
 {name:'MIT 18.125 · Measure & Integration',type:'研究生课程 / 进阶',icon:'μ',tag:'测度 · Lebesgue · Lᵖ',desc:'测度论与积分理论课程内容简介，适合高阶分析拓展。',url:'https://ocw.mit.edu/courses/18-125-measure-and-integration-fall-2003/'},
 {name:'D3 · Force Simulation',type:'项目技术参考 / 开源',icon:'◎',tag:'知识图谱 · 可视化思路',desc:'交互网络图的经典开源可视化参考。当前项目采用独立 SVG 布局实现，无需依赖运行时框架。',url:'https://github.com/d3/d3/blob/main/docs/d3-force/simulation.md'},
 {name:'KaTeX · Math Rendering',type:'项目技术参考 / 开源',icon:'π',tag:'LaTeX 公式展示',desc:'本项目使用 KaTeX 自动排版数学公式；没有联网时仍能阅读原始 LaTeX。',url:'https://katex.org/docs/autorender'}
];
const STORAGE_KEY = 'math-atlas-learning-v1';
const ENDPOINT_KEY = 'math-atlas-endpoint-v1';
const defaultProgress = () => ({visited:[],mastered:[],bookmarks:[],answers:{},activity:[]});
let progress = defaultProgress();
let endpoint = '';
let nodes = [];
let exercises = [];
let lessons = {};
let byId = new Map();
let currentView = 'dashboard';
let currentTopic = 'seq-limit';
let graphSelected = 'seq-limit';
let graphStage = 'all';
let graphView = {x:-58,y:-25,w:1170,h:660};
let graphCoords = new Map();
let graphDrag = null;
let filterStage = 'all';
let filterFamily = 'all';
let onlySaved = false;
let libraryQuery = '';
let practiceDifficulty = 'all';
let currentExercise = null;
let exerciseUi = {};
let activeLab = 'delta';
let tutorMode = 'socratic';
let tutorBusy = false;
let tutorExercise = null;
let messages = [];
let toastTimeout;

function renderMath(root = document) {
  if (typeof window.renderMathInElement !== 'function') return;
  try {
    window.renderMathInElement(root, {
      delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}],
      throwOnError:false, strict:'ignore'
    });
  } catch (error) { console.warn('Math rendering skipped',error); }
}
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      progress = {
        visited:Array.isArray(saved.visited)?saved.visited:[],
        mastered:Array.isArray(saved.mastered)?saved.mastered:[],
        bookmarks:Array.isArray(saved.bookmarks)?saved.bookmarks:[],
        answers:saved.answers && typeof saved.answers==='object'?saved.answers:{},
        activity:Array.isArray(saved.activity)?saved.activity:[]
      };
    }
    endpoint = localStorage.getItem(ENDPOINT_KEY) || '';
  } catch { progress = defaultProgress(); }
}
function store() {
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(progress)); } catch {}
}
function dateStamp() {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function recordActivity() {const day=dateStamp();if (!progress.activity.includes(day)){progress.activity.push(day);progress.activity=progress.activity.slice(-180);} store();}
function hasMastered(id){return progress.mastered.includes(id);}
function hasSaved(id){return progress.bookmarks.includes(id);}
function masteredInStage(stage){return nodes.filter(n=>n.stage===stage && hasMastered(n.id)).length;}
function getRecommended() {return nodes.find(n => !hasMastered(n.id) && n.prerequisites.every(id=>hasMastered(id))) || nodes.find(n=>!hasMastered(n.id)) || nodes[0];}
function getStreak(){const set=new Set(progress.activity);let count=0;const d=new Date();if(!set.has(dateStamp()))d.setDate(d.getDate()-1);for(let k=0;k<180;k++){let s=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;if(!set.has(s))break;count++;d.setDate(d.getDate()-1);}return count;}
function answeredCount(){return Object.values(progress.answers).filter(v=>v===true||v==='self').length;}
function inform(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),2600);}
function navigate(view,updateHash=true){
  if(!VIEW_NAMES[view])return;
  currentView=view;
  $$('.page').forEach(s=>s.classList.toggle('active',s.id===`view-${view}`));
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  $('#breadcrumbCurrent').textContent=VIEW_NAMES[view];
  if(updateHash)history.replaceState(null,'',`#/${view}`);
  $('#sidebar').classList.remove('open');$('#sidebarScrim').hidden=true;
  if(view==='dashboard')renderDashboard();
  if(view==='graph'){renderGraph();renderInspector();}
  if(view==='paths')renderPaths();
  if(view==='library')renderLibrary();
  if(view==='practice')renderPractice();
  if(view==='lab')renderLabs();
  if(view==='tutor')renderTutor();
  if(view==='resources')renderResources();
  window.scrollTo({top:0,behavior:'instant'});
}
function refreshProgress(){renderSideProgress();renderDashboard();if(currentView==='paths')renderPaths();if(currentView==='library')renderLibrary();if(currentView==='graph'){renderGraph();renderInspector();}if(currentView==='practice')renderPractice();}
function renderSideProgress(){let percent=Math.round(progress.mastered.length/nodes.length*100);$('#sidePercent').textContent=`${percent}%`;$('#sideProgressBar').style.width=`${percent}%`;$('#sideProgressNote').textContent=`已掌握 ${progress.mastered.length} / ${nodes.length} 个知识点 · ${getStreak()} 天连续学习`;}
function renderDashboard(){
  const stats=[
    {name:'知识图谱节点',num:nodes.length,foot:'跨越五个学习阶段',icon:'✧',color:'purple'},
    {name:'严谨先修关系',num:nodes.reduce((n,v)=>n+v.prerequisites.length,0),foot:'可点击、可追溯',icon:'⌁',color:'blue'},
    {name:'完成的练习',num:answeredCount(),foot:`共 ${exercises.length} 道分层练习`,icon:'◇',color:'green'},
    {name:'累计掌握的概念',num:progress.mastered.length,foot:`个人掌握度 ${Math.round(progress.mastered.length/nodes.length*100)}%`,icon:'✳',color:'gold'}
  ];
  $('#dashboardStats').innerHTML=stats.map(s=>`<article class="stat-card"><div class="stat-head"><span>${s.name}</span><span class="stat-icon ${s.color}">${s.icon}</span></div><div class="stat-num">${s.num}<span style="font-size:12px;color:#aab4c1;font-weight:500"> ${s.icon==='◇'?'题':' '}</span></div><div class="stat-foot">${s.foot}</div></article>`).join('');
  $('#journeyPreview').innerHTML=STAGES.map((label,stage)=>{
    const total=nodes.filter(n=>n.stage===stage).length,done=masteredInStage(stage),doneAll=done===total;
    return `<div class="journey-row"><span class="journey-round stage-${stage}">${stage+1}</span><div><div class="journey-title">${label}</div><div class="journey-sub">${TRACKS[stage].tag} · ${total} 个知识点</div></div><span class="journey-status ${doneAll?'done':''}">${doneAll?'✓ 已完成':`${done}/${total} 已掌握`}</span></div>`;
  }).join('');
  const next=getRecommended();if(next){
    $('#nextRecommendation').innerHTML=`<div class="recommended-topic">${escapeHtml(next.title)}</div><div class="rec-meta">${escapeHtml(next.track)} · ${escapeHtml(next.familyName)}</div><p class="rec-description">${escapeHtml(next.intuition)}</p><button class="rec-button" type="button" id="openNext">打开知识卡片 ↗</button>`;
    $('#openNext').addEventListener('click',()=>openLesson(next.id));
  }
}
function renderPaths(){
  $('#pathCards').innerHTML=TRACKS.map((t,i)=>{
    const arr=nodes.filter(n=>n.stage===i),done=masteredInStage(i),percent=Math.round(done/arr.length*100);
    return `<article class="path-card"><div class="path-visual stage-${i}">${STAGE_LETTERS[i]}</div><div class="path-main"><div class="path-no">PATH 0${i+1} · ${escapeHtml(t.tag.toUpperCase())}</div><h3>${escapeHtml(t.title)}</h3><p>${escapeHtml(t.desc)}</p><div class="path-topics">${arr.slice(0,5).map(n=>`<span class="path-topic">${escapeHtml(n.title)}</span>`).join('')}${arr.length>5?`<span class="path-topic">+${arr.length-5} 个节点</span>`:''}</div></div><div class="path-side"><span class="pct">${done} / ${arr.length} 已掌握</span><div class="path-mini-progress"><span style="width:${percent}%"></span></div><button type="button" class="path-open" data-path="${i}">查看课程 ↗</button></div></article>`;
  }).join('');
  $$('#pathCards .path-open').forEach(b=>b.addEventListener('click',()=>{filterStage=b.dataset.path;$('#libraryStage').value=filterStage;navigate('library');}));
}
function ensureGraphCoords(){
  graphCoords=new Map();
  for(let stage=0;stage<5;stage++){
    const list=nodes.filter(n=>n.stage===stage);
    list.forEach((n,i)=>graphCoords.set(n.id,{x:80+stage*340,y:128+i*77}));
  }
}
function graphEdge(from,to,highlight,muted){
  const a=graphCoords.get(from),b=graphCoords.get(to);if(!a||!b)return '';
  const same=a.x===b.x;
  let path;
  if(same){path=`M ${a.x+12} ${a.y+26} C ${a.x-48} ${a.y+26}, ${b.x-48} ${b.y+26}, ${b.x+12} ${b.y+26}`;}
  else{path=`M ${a.x+230} ${a.y+26} C ${a.x+282} ${a.y+26}, ${b.x-55} ${b.y+26}, ${b.x+10} ${b.y+26}`;}
  return `<path class="graph-edge ${highlight?'is-highlight':''} ${muted?'is-faded':''}" d="${path}" />`;
}
function graphNode(n,neighbors){
  const point=graphCoords.get(n.id),isSel=graphSelected===n.id,muted=(graphStage!=='all'&&+graphStage!==n.stage)||Boolean(graphSelected&&!neighbors.has(n.id));
  return `<g class="graph-node ${isSel?'is-selected':''} ${hasMastered(n.id)?'is-mastered':''} ${muted?'is-faded':''}" data-node="${n.id}" transform="translate(${point.x} ${point.y})" role="button" tabindex="0" aria-label="${escapeHtml(n.title)}"><title>${escapeHtml(n.title)} · ${escapeHtml(n.track)}</title><rect class="node-body" x="0" y="0" rx="12" width="230" height="52" /><circle class="node-dot" cx="20" cy="26" r="8" fill="${COLORS[n.stage]}" /><text class="node-title" x="37" y="24">${escapeHtml(n.title.length>15?n.title.slice(0,14)+'…':n.title)}</text><text class="node-number" x="37" y="39">${escapeHtml(n.familyName)} ${hasMastered(n.id)?'· ✓ 已掌握':''}</text></g>`;
}
function applyViewBox(){const g=$('#graphSvg');g.setAttribute('viewBox',`${graphView.x} ${graphView.y} ${graphView.w} ${graphView.h}`);}
function renderGraph(){
  if(!nodes.length)return;
  const focused=byId.get(graphSelected);
  const neighbors=new Set(graphSelected?[graphSelected]:[]);
  if(focused){focused.prerequisites.forEach(id=>neighbors.add(id));nodes.filter(n=>n.prerequisites.includes(focused.id)).forEach(n=>neighbors.add(n.id));}
  const edges=nodes.flatMap(n=>n.prerequisites.map(from=>({from,to:n.id}))).map(({from,to})=>{
    const connected=graphSelected&&(from===graphSelected||to===graphSelected);
    const hidden=Boolean(graphSelected&&!connected)||(graphStage!=='all' && byId.get(from)?.stage!==+graphStage && byId.get(to)?.stage!==+graphStage);
    return graphEdge(from,to,connected,hidden);
  }).join('');
  const labels=STAGES.map((title,i)=>`<text class="graph-stage-label" x="${80+i*340}" y="80">0${i+1} / ${escapeHtml(title)}</text><text class="graph-stage-sub" x="${80+i*340}" y="100">${nodes.filter(n=>n.stage===i).length} 个概念</text>`).join('');
  $('#graphSvg').innerHTML=`<g class="graph-grid-layer">${labels}</g><g class="graph-edges">${edges}</g><g class="graph-nodes">${nodes.map(n=>graphNode(n,neighbors)).join('')}</g>`;
  applyViewBox();
  $('#graphStageTabs').innerHTML=[{name:'全部节点',id:'all'},...STAGES.map((name,i)=>({name,i,id:String(i)}))].map(t=>`<button type="button" class="graph-tab ${graphStage===t.id?'active':''}" data-stage="${t.id}">${escapeHtml(t.name)}</button>`).join('');
  $$('#graphStageTabs .graph-tab').forEach(b=>b.addEventListener('click',()=>{
    graphStage=b.dataset.stage;
    if(graphStage!=='all'){const n=nodes.find(n=>n.stage===+graphStage);if(n){graphSelected=n.id;focusGraphNode(n.id);}}
    renderGraph();renderInspector();
  }));
}
function focusGraphNode(id){const p=graphCoords.get(id);if(!p)return;graphView.x=p.x+115-graphView.w/2;graphView.y=p.y+26-graphView.h/2;applyViewBox();}
function setGraphNode(id,{focus=false}={}){if(!byId.has(id))return;graphSelected=id;renderGraph();renderInspector();if(focus)focusGraphNode(id);}
function renderInspector(){
  const container=$('#graphInspector');const n=byId.get(graphSelected);
  if(!n){container.innerHTML=`<div class="inspector-placeholder"><div class="inspector-icon">✧</div><strong>探索你的知识宇宙</strong><p>点击图中的节点，就能查看核心概念、前置知识和下一步。</p></div>`;return;}
  const next=nodes.filter(k=>k.prerequisites.includes(n.id));
  container.innerHTML=`<div class="inspector-icon">${STAGE_LETTERS[n.stage]}</div><div class="inspector-label">NODE DETAIL / ${escapeHtml(n.track).toUpperCase()}</div><h3>${escapeHtml(n.title)}</h3><p class="inspector-desc">${escapeHtml(n.summary)}</p><div class="inspector-formula">${math(n.formula)}</div><div class="inspector-group"><strong>✦ 直觉理解</strong><p class="inspector-desc">${escapeHtml(n.intuition)}</p></div><div class="inspector-group"><strong>先修知识 · ${n.prerequisites.length}</strong><div class="inspector-list">${n.prerequisites.length?n.prerequisites.map(id=>`<button class="inspector-link" data-gnode="${id}">${escapeHtml(byId.get(id)?.title||id)}</button>`).join(''):'<span class="inspector-desc">知识地图的起点，无先修要求。</span>'}</div></div><div class="inspector-group"><strong>下一站 · ${next.length}</strong><div class="inspector-list">${next.slice(0,6).map(q=>`<button class="inspector-link" data-gnode="${q.id}">${escapeHtml(q.title)}</button>`).join('')||'<span class="inspector-desc">继续探索周边的高阶知识。</span>'}</div></div><div class="inspector-actions"><button type="button" id="inspectorStudy">打开完整知识卡片 ↗</button><button class="secondary" type="button" id="inspectorTutor">请导师引导我理解 ✦</button></div>`;
  $$('[data-gnode]',container).forEach(b=>b.addEventListener('click',()=>setGraphNode(b.dataset.gnode,{focus:true})));
  $('#inspectorStudy').addEventListener('click',()=>openLesson(n.id));
  $('#inspectorTutor').addEventListener('click',()=>{currentTopic=n.id;tutorExercise=null;navigate('tutor');});
  renderMath(container);
}
function renderLibrary(){
  const term=libraryQuery.trim().toLocaleLowerCase();
  const filtered=nodes.filter(n=>{
    if(filterStage!=='all'&&n.stage!==+filterStage)return false;
    if(filterFamily!=='all'&&n.family!==filterFamily)return false;
    if(onlySaved&&!hasSaved(n.id))return false;
    if(term&&!`${n.title} ${n.track} ${n.familyName} ${n.summary} ${n.intuition}`.toLocaleLowerCase().includes(term))return false;
    return true;
  });
  $('#libraryCount').textContent=`${filtered.length} / ${nodes.length} 个知识点`;
  $('#libraryGrid').innerHTML=filtered.length?filtered.map(n=>`<article class="knowledge-card"><div class="knowledge-card-header"><span class="knowledge-family">${STAGE_LETTERS[n.stage]} ${escapeHtml(n.track)} / ${escapeHtml(n.familyName)}</span><button class="know-save ${hasSaved(n.id)?'saved':''}" type="button" data-save="${n.id}" aria-label="${hasSaved(n.id)?'取消收藏':'收藏'} ${escapeHtml(n.title)}">${hasSaved(n.id)?'★':'☆'}</button></div><h3>${escapeHtml(n.title)}</h3><p>${escapeHtml(n.summary)}</p><div class="knowledge-card-formula">${math(n.formula)}</div><div class="knowledge-card-bottom"><span>${hasMastered(n.id)?'<span class="know-master">✓ 已掌握</span>':lessons[n.id]?'含完整推导':'概念导读'}</span><button type="button" data-study="${n.id}">开始探索 ↗</button></div></article>`).join(''):`<div class="empty-state">暂时没有匹配的卡片。试试调整阶段、关键词或收藏筛选。</div>`;
  $$('#libraryGrid [data-study]').forEach(b=>b.addEventListener('click',()=>openLesson(b.dataset.study)));
  $$('#libraryGrid [data-save]').forEach(b=>b.addEventListener('click',()=>toggleBookmark(b.dataset.save)));
  renderMath($('#libraryGrid'));
}
function toggleBookmark(id){const i=progress.bookmarks.indexOf(id);if(i>=0)progress.bookmarks.splice(i,1);else progress.bookmarks.push(id);store();inform(i>=0?'已取消收藏':'已加入收藏');if(currentView==='library')renderLibrary();if($('#lessonDrawer').classList.contains('open'))openLesson(id,{preserve:true});}
function toggleMastery(id){const i=progress.mastered.indexOf(id);if(i>=0)progress.mastered.splice(i,1);else progress.mastered.push(id);recordActivity();store();refreshProgress();inform(i>=0?'已取消掌握标记':'已标记掌握，进度已保存');if($('#lessonDrawer').classList.contains('open'))openLesson(id,{preserve:true});}
function openLesson(id,{preserve=false}={}){
  const n=byId.get(id);if(!n)return;
  if(!progress.visited.includes(id)){progress.visited.push(id);recordActivity();}
  const d=lessons[id];
  const deps=n.prerequisites.map(p=>`<button type="button" data-lesson-dep="${p}">${escapeHtml(byId.get(p)?.title||p)}</button>`).join('');
  const relatedExercises=exercises.filter(q=>q.topic===id).length;
  $('#lessonContent').innerHTML=`
    <div class="lesson-stage">${STAGE_LETTERS[n.stage]} · ${escapeHtml(n.track)} / ${escapeHtml(n.familyName)}</div><h2>${escapeHtml(n.title)}</h2><p class="lesson-intro">${escapeHtml(n.summary)}</p>
    <div class="lesson-action-row"><button type="button" id="lessonMastery" class="${hasMastered(id)?'marked':''}">${hasMastered(id)?'✓ 已掌握':'✓ 标记已掌握'}</button><button type="button" id="lessonBookmark" class="${hasSaved(id)?'saved':''}">${hasSaved(id)?'★ 已收藏':'☆ 收藏'}</button></div>
    <section class="lesson-block"><h3><span>01</span> 核心定义与公式</h3><p>${escapeHtml(d?.definition||n.summary)}</p><div class="lesson-formula">${math(n.formula)}</div></section>
    <section class="lesson-block"><h3><span>02</span> 一句话直觉</h3><p>${escapeHtml(n.intuition)}</p></section>
    ${d?`<section class="lesson-block"><h3><span>03</span> 定理 / 结论</h3><p>${escapeHtml(d.theorem)}</p></section><section class="lesson-block"><h3><span>04</span> 逐步证明与推导</h3><ol class="lesson-steps">${d.proof.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ol></section><section class="lesson-block"><h3><span>05</span> 例题 / 应用</h3><p>${escapeHtml(d.worked)}</p></section>`:`<section class="lesson-block"><h3><span>03</span> 学习目标</h3><p>阅读这个知识点时，先尝试用自己的话解释定义，再核对前置概念，最后回答下方的思考问题。更多证明与习题正在持续扩展。</p></section>`}
    <section class="lesson-block"><h3><span>${d?'06':'04'}</span> 易错提醒</h3><p class="mistake-note">${escapeHtml(n.pitfall)}</p></section>
    <section class="lesson-block"><h3><span>${d?'07':'05'}</span> 反思问题</h3><p class="inquiry-note">${escapeHtml(d?.think||n.inquiry)}</p></section>
    <section class="lesson-block"><h3><span>${d?'08':'06'}</span> 前置知识</h3><div class="lesson-deps">${deps||'<p>这是一条学习路径的起点。</p>'}</div></section>
    <div class="lesson-footer-actions"><button type="button" id="lessonAskTutor">让导师追问我 ✦</button><button type="button" id="lessonDoPractice">${relatedExercises?'练习相关题目':'查看分层题库'} ↗</button></div>`;
  $('#lessonDrawer').classList.add('open');$('#lessonDrawer').setAttribute('aria-hidden','false');$('#lessonBackdrop').hidden=false;
  if(!preserve)$('#lessonContent').scrollTop=0;
  $('#lessonMastery').addEventListener('click',()=>toggleMastery(id));
  $('#lessonBookmark').addEventListener('click',()=>toggleBookmark(id));
  $$('#lessonContent [data-lesson-dep]').forEach(b=>b.addEventListener('click',()=>openLesson(b.dataset.lessonDep)));
  $('#lessonAskTutor').addEventListener('click',()=>{currentTopic=id;tutorExercise=null;closeLesson();navigate('tutor');});
  $('#lessonDoPractice').addEventListener('click',()=>{const first=exercises.find(q=>q.topic===id);if(first){practiceDifficulty='all';currentExercise=first.id;exerciseUi={};}closeLesson();navigate('practice');});
  renderMath($('#lessonContent'));
}
function closeLesson(){$('#lessonDrawer').classList.remove('open');$('#lessonDrawer').setAttribute('aria-hidden','true');$('#lessonBackdrop').hidden=true;}

function renderPractice(){
  const difficulties=[{id:'all',name:'全部难度'},...LEVELS.map((name,i)=>({id:String(i),name}))];
  $('#difficultyTabs').innerHTML=difficulties.map(d=>`<button type="button" class="difficulty-tab ${practiceDifficulty===d.id?'active':''}" data-difficulty="${d.id}">${escapeHtml(d.name)}</button>`).join('');
  $$('#difficultyTabs .difficulty-tab').forEach(b=>b.addEventListener('click',()=>{practiceDifficulty=b.dataset.difficulty;currentExercise=null;exerciseUi={};renderPractice();}));
  const list=exercises.filter(q=>practiceDifficulty==='all'||q.difficulty===+practiceDifficulty);
  if(!list.some(q=>q.id===currentExercise))currentExercise=list[0]?.id||null;
  $('#practiceStat').textContent=`${answeredCount()} / ${exercises.length} 完成`;
  $('#practiceListCount').textContent=`${list.length} 道`;
  $('#exerciseList').innerHTML=list.map((q,i)=>`<button class="exercise-nav-item ${currentExercise===q.id?'active':''} ${progress.answers[q.id]===true||progress.answers[q.id]==='self'?'is-correct':''}" type="button" data-ex="${q.id}"><span class="exercise-nav-number">${progress.answers[q.id]===true||progress.answers[q.id]==='self'?'✓':String(i+1).padStart(2,'0')}</span><span class="exercise-nav-body"><strong>${escapeHtml(byId.get(q.topic)?.title||q.topic)}</strong><span>${LEVELS[q.difficulty]} · ${q.kind==='proof'?'开放证明题':q.kind==='choice'?'选择题':'计算题'}</span></span></button>`).join('');
  $$('#exerciseList [data-ex]').forEach(b=>b.addEventListener('click',()=>{currentExercise=b.dataset.ex;exerciseUi={};renderPractice();}));
  renderExerciseDetail();
}
function renderExerciseDetail(){
  const q=exercises.find(q=>q.id===currentExercise);if(!q)return;
  const result=progress.answers[q.id];
  const u=exerciseUi;
  const options=q.kind==='choice'?`<div class="answer-options">${q.options.map((o,i)=>`<button type="button" data-opt="${i}" class="answer-option ${u.choice===i?'selected':''}"><span class="option-letter">${'ABCD'[i]}</span><span>${escapeHtml(o)}</span></button>`).join('')}</div>`:q.kind==='numeric'?`<input class="answer-input" id="numericAnswer" type="text" inputmode="decimal" placeholder="请输入结果，支持 1/2、√2、sqrt(2)" value="${escapeHtml(u.input||'')}" />`:`<textarea class="proof-input" id="proofAnswer" placeholder="在这里写下你的证明思路、量词和关键不等式。点击下方提示或核对证明要点。">${escapeHtml(u.input||'')}</textarea>`;
  $('#exerciseDetail').innerHTML=`<div class="exercise-top"><span>CHALLENGE ${escapeHtml(q.id.toUpperCase())} / ${escapeHtml(byId.get(q.topic)?.track||'')}</span><span class="difficulty-pill">${LEVELS[q.difficulty]}</span></div><h2>${escapeHtml(byId.get(q.topic)?.title||'知识挑战')}</h2><div class="exercise-description">${escapeHtml(q.prompt)}</div><div class="exercise-divider"></div><div>${options}</div><div class="answer-actions"><button type="button" class="answer-primary" id="checkAnswer">${q.kind==='proof'?'完成自评':'提交答案'}</button><button type="button" class="answer-secondary" id="showHint">${u.hint?'再看提示':'逐步提示'} ✧</button><button type="button" class="answer-tertiary" id="showSolution">${u.solution?'收起':'查看'}解析</button><button type="button" class="answer-tertiary" id="questionTutor">向导师提问 ↗</button></div><div id="exerciseFeedback">${u.feedback?`<div class="feedback-panel ${u.feedbackGood?'good':'bad'}">${escapeHtml(u.feedback)}</div>`:''}</div>${u.hint?`<div class="hint-panel"><strong>提示 ${Math.min(u.hint,q.hints.length)} / ${q.hints.length}</strong>${q.hints.slice(0,u.hint).map(s=>`<p>${escapeHtml(s)}</p>`).join('')}</div>`:''}${u.solution?`<div class="solution-panel"><strong>${q.kind==='proof'?'参考证明与自评标准':'完整解析'}</strong><p>${escapeHtml(q.answer && q.kind==='proof'?q.answer:q.explanation)}</p>${q.rubric?`<ul class="rubric-list">${q.rubric.map(r=>`<li>${escapeHtml(r)}</li>`).join('')}</ul>`:''}</div>`:''}<div class="exercise-divider"></div><div class="rec-meta">学习建议：${escapeHtml(byId.get(q.topic)?.inquiry||'先尝试独立思考，再查看提示。')}${result===true?' · 此题已完成 ✓':result==='self'?' · 已完成自评':''}</div>`;
  $$('#exerciseDetail [data-opt]').forEach(b=>b.addEventListener('click',()=>{exerciseUi.choice=+b.dataset.opt;renderExerciseDetail();}));
  $('#checkAnswer').addEventListener('click',()=>checkAnswer(q));
  $('#showHint').addEventListener('click',()=>{saveAnswerDraft(q);exerciseUi.hint=Math.min((exerciseUi.hint||0)+1,q.hints.length);renderExerciseDetail();});
  $('#showSolution').addEventListener('click',()=>{saveAnswerDraft(q);exerciseUi.solution=!exerciseUi.solution;renderExerciseDetail();});
  $('#questionTutor').addEventListener('click',()=>{saveAnswerDraft(q);currentTopic=q.topic;tutorExercise=q;navigate('tutor');});
  renderMath($('#exerciseDetail'));
}
function saveAnswerDraft(q){if(q.kind==='numeric')exerciseUi.input=$('#numericAnswer')?.value||'';if(q.kind==='proof')exerciseUi.input=$('#proofAnswer')?.value||'';}
function parseNumeric(value){
  const s=String(value).trim().replace(/\s+/g,'').replace(/−/g,'-');
  if(!s)return NaN;
  if(/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(s))return Number(s);
  if(/^[-+]?\d+\/[-+]?\d+$/.test(s)){const [a,b]=s.split('/').map(Number);return b? a/b:NaN;}
  const sq=s.match(/^(?:sqrt\((\d+)\)|√(\d+))$/i);if(sq)return Math.sqrt(Number(sq[1]||sq[2]));
  return NaN;
}
function checkAnswer(q){
  saveAnswerDraft(q);
  if(q.kind==='proof'){
    if(!exerciseUi.input?.trim()){inform('请先写下自己的推理，再进行自评。');return;}
    progress.answers[q.id]='self';exerciseUi.feedback='已记录这次证明练习。请对照参考证明逐项自评；本地模式不会自动判定证明正确。';exerciseUi.feedbackGood=true;exerciseUi.solution=true;
  } else {
    let correct=false;
    if(q.kind==='choice'){
      if(exerciseUi.choice===undefined){inform('请先选择一个答案');return;}
      correct=exerciseUi.choice===q.answer;
    } else {
      const num=parseNumeric(exerciseUi.input);
      if(!Number.isFinite(num)){inform('请输入有效数值，例如 0.5、1/2 或 sqrt(2)');return;}
      correct=Math.abs(num-q.answer)<=Math.max(q.tolerance||1e-6,Math.abs(q.answer)*1e-8);
    }
    progress.answers[q.id]=correct;
    exerciseUi.feedback=correct?'回答正确！已经记录到学习档案。可以继续下一题，或尝试证明它。':'暂时不正确。先查看逐步提示，检查定义、计算或量词，再重试。';
    exerciseUi.feedbackGood=correct;
  }
  recordActivity();store();renderPractice();refreshProgress();
  // Restore feedback after refresh, which does not clear exerciseUi.
  renderExerciseDetail();
}

function chartScaffold(W=620,H=380,left=58,top=24,right=20,bottom=45){return {W,H,left,top,right,bottom,width:W-left-right,height:H-top-bottom};}
function drawDeltaLab(){
  const eps=Number($('#epsilonSlider').value),delta=Number($('#deltaSlider').value),c=chartScaffold();
  const x=x=>c.left+(x/4)*c.width, y=y=>c.top+(10-y)/10*c.height;
  let grid='';for(let v=0;v<=4;v++)grid+=`<line x1="${x(v)}" y1="${c.top}" x2="${x(v)}" y2="${c.top+c.height}" stroke="#eef0f7"/><text x="${x(v)}" y="${c.H-16}" fill="#8994a6" font-size="11" text-anchor="middle">${v}</text>`;
  for(let v=0;v<=10;v+=2)grid+=`<line x1="${c.left}" y1="${y(v)}" x2="${c.W-c.right}" y2="${y(v)}" stroke="#eef0f7"/><text x="${c.left-17}" y="${y(v)+4}" fill="#8994a6" font-size="11" text-anchor="middle">${v}</text>`;
  const path=Array.from({length:201},(_,i)=>{const a=i/50;return `${i?'L':'M'}${x(a).toFixed(2)} ${y(a*a).toFixed(2)}`;}).join(' ');
  const above=4+eps,below=4-eps;
  $('#deltaChart').innerHTML=`${grid}<rect x="${x(2-delta)}" y="${c.top}" width="${x(2+delta)-x(2-delta)}" height="${c.height}" fill="#70badd" opacity=".16"/><rect x="${c.left}" y="${y(above)}" width="${c.width}" height="${y(below)-y(above)}" fill="#f0c472" opacity=".2"/><line x1="${x(2-delta)}" y1="${c.top}" x2="${x(2-delta)}" y2="${c.top+c.height}" stroke="#71b4df" stroke-dasharray="5 5"/><line x1="${x(2+delta)}" y1="${c.top}" x2="${x(2+delta)}" y2="${c.top+c.height}" stroke="#71b4df" stroke-dasharray="5 5"/><line x1="${c.left}" y1="${y(above)}" x2="${c.W-c.right}" y2="${y(above)}" stroke="#d8af5a" stroke-dasharray="5 5"/><line x1="${c.left}" y1="${y(below)}" x2="${c.W-c.right}" y2="${y(below)}" stroke="#d8af5a" stroke-dasharray="5 5"/><path d="${path}" fill="none" stroke="#8873d8" stroke-width="3" stroke-linecap="round"/><circle cx="${x(2)}" cy="${y(4)}" r="5.5" fill="#7566cc" stroke="white" stroke-width="2"/><text x="${x(2)+12}" y="${y(4)-12}" fill="#676caf" font-size="11" font-weight="700">(2, 4)</text><text x="${c.W-22}" y="${c.H-14}" fill="#8c98a8" font-size="11">x</text><text x="${c.left-25}" y="${c.top+4}" fill="#8c98a8" font-size="11">y</text>`;
  const worst=4*delta+delta*delta;
  const pass=worst<=eps+1e-9;
  $('#epsilonValue').textContent=eps.toFixed(2);$('#deltaValue').textContent=delta.toFixed(2);
  $('#deltaCheck').className=`lab-check ${pass?'success':'failure'}`;
  $('#deltaCheck').innerHTML=`<strong>${pass?'✓ 当前 δ 满足严格极限要求':'✧ 这个 δ 还太大'}</strong>最坏边界误差的上确界为 ${worst.toFixed(3)}，当前 ε=${eps.toFixed(2)}。解析上，满足 $4\\delta+\\delta^2\\le\\varepsilon$ 即可。<br/>一个总安全的保守选择是 δ≤${Math.min(1,eps/5).toFixed(3)}。`;
  renderMath($('#deltaCheck'));
}
function drawSequenceLab(){
  const eps=Number($('#sequenceEpsilon').value),N=Number($('#sequenceN').value),c=chartScaffold();
  const xmax=Math.max(48,N+10),x=n=>c.left+n/xmax*c.width,y=v=>c.top+(1.06-v)/1.06*c.height;
  let grid='';for(let i=0;i<=4;i++){const a=Math.round(i*xmax/4);grid+=`<line x1="${x(a)}" y1="${c.top}" x2="${x(a)}" y2="${c.top+c.height}" stroke="#eef0f7"/><text x="${x(a)}" y="${c.H-15}" fill="#8994a6" font-size="11" text-anchor="middle">${a}</text>`;}
  for(const v of [0,.25,.5,.75,1])grid+=`<line x1="${c.left}" y1="${y(v)}" x2="${c.W-c.right}" y2="${y(v)}" stroke="#eef0f7"/><text x="${c.left-18}" y="${y(v)+4}" fill="#8994a6" font-size="10" text-anchor="middle">${v}</text>`;
  const dots=Array.from({length:xmax},(_,i)=>{const n=i+1;return `<circle cx="${x(n)}" cy="${y(1/n)}" r="${n<=24?3.7:2.4}" fill="${n>N?'#8275d7':'#a8b1c3'}" opacity="${n>N?'.92':'.63'}"/>`;}).join('');
  $('#sequenceChart').innerHTML=`${grid}<rect x="${c.left}" y="${y(eps)}" width="${c.width}" height="${y(0)-y(eps)}" fill="#f0c472" opacity=".19"/><line x1="${c.left}" y1="${y(eps)}" x2="${c.W-c.right}" y2="${y(eps)}" stroke="#d9af5d" stroke-width="1.5" stroke-dasharray="6 5"/><line x1="${x(N)}" y1="${c.top}" x2="${x(N)}" y2="${c.top+c.height}" stroke="#71b4df" stroke-width="2" stroke-dasharray="6 5"/>${dots}<text x="${Math.min(c.W-c.right-25,x(N)+10)}" y="${c.top+17}" fill="#539fc2" font-size="11" font-weight="700">N=${N}</text><text x="${c.W-c.right-40}" y="${y(eps)-9}" fill="#bf9042" font-size="11">ε=${eps.toFixed(2)}</text><text x="${c.W-22}" y="${c.H-14}" fill="#8c98a8" font-size="11">n</text>`;
  const minN=Math.floor(1/eps+1e-9),pass=1/(N+1)<eps;
  $('#sequenceEpsilonValue').textContent=eps.toFixed(2);$('#sequenceNValue').textContent=String(N);
  $('#sequenceCheck').className=`lab-check ${pass?'success':'failure'}`;
  $('#sequenceCheck').innerHTML=`<strong>${pass?'✓ 对所有 n>N 条件成立':'✧ 继续增大 N'}</strong>尾项中最大的值是 $1/(N+1)=${(1/(N+1)).toFixed(4)}$。给定 ε=${eps.toFixed(2)}，最小可行的非负整数 N 是 ${minN}。`;
  renderMath($('#sequenceCheck'));
}
function renderLabs(){
  $('#deltaLab').hidden=activeLab!=='delta';$('#sequenceLab').hidden=activeLab!=='sequence';
  $$('.lab-tab').forEach(b=>b.classList.toggle('active',b.dataset.lab===activeLab));
  if(activeLab==='delta')drawDeltaLab();else drawSequenceLab();
}

function renderResources(){
  $('#resourceGrid').innerHTML=RESOURCES.map(r=>`<article class="resource-card"><div class="resource-top"><span class="resource-logo">${escapeHtml(r.icon)}</span><span class="resource-kind">${escapeHtml(r.type)}</span></div><h3>${escapeHtml(r.name)}</h3><p>${escapeHtml(r.desc)}</p><a class="source-link" href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">打开原始资源 ↗</a><div class="resource-tag">${escapeHtml(r.tag)}</div></article>`).join('');
}

function tutorIntroText(){return '你好，我是 Atlas 学习导师。我们可以一起拆解定义、检验条件、构造证明。\n\n当前使用的是本地预设引导，不是实时语言模型，所以我不会假装理解或批改你刚写的证明。你可以从右边选择一个知识点，我们从一个关键问题开始。';}
function renderTutor(){
  const n=byId.get(currentTopic)||nodes[0];if(!n)return;currentTopic=n.id;
  $('#tutorModeBadge').textContent=endpoint?'已配置 AI 服务端 · 需联网':'本地引导 · 无需密钥';
  $('#tutorStatus').textContent=endpoint?'多轮 AI 对话（服务端可用时）':'本地预设引导（不是实时大模型）';
  if(!messages.length)messages=[{role:'assistant',text:tutorIntroText()}];
  $$('#tutorModes [data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===tutorMode));
  $('#tutorContext').innerHTML=`<div class="context-topic"><strong>${escapeHtml(n.title)}</strong><p>${escapeHtml(n.intuition)}</p>${tutorExercise?`<p>正在讨论练习 ${escapeHtml(tutorExercise.id)}</p>`:''}</div>`;
  const select=$('#tutorTopic');select.innerHTML=nodes.map(k=>`<option value="${k.id}" ${k.id===n.id?'selected':''}>${escapeHtml(k.track)} · ${escapeHtml(k.title)}</option>`).join('');
  renderMessages();
}
function renderMessages(){
  const el=$('#chatMessages');el.innerHTML=messages.map(m=>`<div class="chat-message ${m.role==='user'?'user':''}"><span class="chat-bubble-avatar">${m.role==='user'?'M':'✦'}</span><div class="chat-bubble">${escapeHtml(m.text)}</div></div>`).join('');
  renderMath(el);el.scrollTop=el.scrollHeight;
}
function offlineTutorReply(input){
  const n=byId.get(currentTopic)||nodes[0];const d=lessons[n.id];const msg=input.trim();
  const hints=tutorExercise?.hints||[];
  const noOfUserTurns=messages.filter(m=>m.role==='user').length;
  if(/常见错误|误区|错误/.test(msg))return `这个知识点最容易出现的误区是：${n.pitfall}\n\n你能举一个反例，解释这个误区为什么不成立吗？`;
  if(/前置|先修|基础/.test(msg))return n.prerequisites.length?`先确认这几个前置概念：${n.prerequisites.map(id=>byId.get(id)?.title||id).join('、')}。\n\n${n.inquiry}`:`这是起点概念。先尝试解释：${n.summary}`;
  if(/答案|完整解答|全部证明|最终结果/.test(msg)&&tutorMode==='example')return `${d?.theorem||n.summary}\n\n一个可供核对的思路是：${d?.proof.join(' → ')||n.intuition}\n\n请指出你认为最关键的一步。完整证明还需检查条件。`;
  if(hints.length&&( /提示|不会|卡住|思路|开始/.test(msg)))return `我先只给一个小提示：${hints[Math.min(noOfUserTurns-1,hints.length-1)]}\n\n你能根据这个提示写出下一步吗？`;
  if(tutorMode==='proof')return `我们按“条件 → 要证 → 关键桥梁”来组织证明。\n\n已知知识：${n.summary}\n\n先写出要证明的命题和量词；再思考：${n.inquiry}\n\n说明：本地引导无法自动判断你刚刚写的推理是否正确。`;
  if(tutorMode==='example')return `先看一个可以迁移的思路：${d?.worked||n.intuition}\n\n暂不直接跳到答案。你能解释这一步为什么有效吗？如果你需要完整参考推导，可打开右侧知识卡片。`;
  const scripts=[
    `从定义开始：${n.summary}\n\n换成你的话，你会怎么解释？`,
    `尝试把问题转成可检验的条件。请留意：${n.pitfall}\n\n你现在有哪一个已知条件可用？`,
    `一个值得追问的问题是：${d?.think||n.inquiry}\n\n请先说出你的直觉，再尝试形式化它。`,
    `试着把推理分成三行：第一行写条件，第二行写所用定理，第三行写结论。\n\n提示：${n.intuition}`
  ];
  return scripts[(noOfUserTurns-1)%scripts.length]+ '\n\n（这是本地预设引导，无法验证你输入内容的数学正确性。）';
}
async function remoteTutorReply(){
  const topic=byId.get(currentTopic);const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),28000);
  const payload={mode:tutorMode,topic:{id:topic.id,title:topic.title,summary:topic.summary,formula:topic.formula,intuition:topic.intuition,pitfall:topic.pitfall,prerequisites:topic.prerequisites.map(id=>byId.get(id)?.title||id)},exercise:tutorExercise?{prompt:tutorExercise.prompt,hints:tutorExercise.hints,kind:tutorExercise.kind}:null,messages:messages.filter(m=>m.text!=='正在思考你的推理……').slice(-10).map(m=>({role:m.role,content:m.text}))};
  try {
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:ctrl.signal});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const data=await response.json();
    if(typeof data.reply!=='string'||!data.reply.trim())throw new Error('服务端未返回 reply');
    return data.reply.slice(0,4500);
  } finally {clearTimeout(timeout);}
}
async function sendTutor(text){
  const msg=String(text).trim();if(!msg||tutorBusy)return;
  messages.push({role:'user',text:msg.slice(0,3000)});renderMessages();
  $('#tutorInput').value='';
  if(!endpoint){messages.push({role:'assistant',text:offlineTutorReply(msg)});renderMessages();return;}
  tutorBusy=true;$('#tutorSend').disabled=true;messages.push({role:'assistant',text:'正在思考你的推理……'});renderMessages();
  try{const reply=await remoteTutorReply();messages[messages.length-1]={role:'assistant',text:reply};}
  catch(err){messages[messages.length-1]={role:'assistant',text:`连接 AI 服务端失败（${err.name==='AbortError'?'请求超时':err.message}）。没有生成模型回复。你可以检查设置，或者在设置中切换回本地引导。`};}
  finally{tutorBusy=false;$('#tutorSend').disabled=false;renderMessages();}
}
function openSettings(){$('#endpointInput').value=endpoint;$('#settingsOverlay').hidden=false;$('#endpointInput').focus();}
function closeSettings(){$('#settingsOverlay').hidden=true;}
function openSearch(){$('#searchOverlay').hidden=false;$('#globalSearch').value='';renderGlobalResults('');$('#globalSearch').focus();}
function closeSearch(){$('#searchOverlay').hidden=true;}
function renderGlobalResults(term){const words=term.trim().toLocaleLowerCase();let found=nodes.filter(n=>!words||`${n.title} ${n.summary} ${n.track} ${n.familyName}`.toLocaleLowerCase().includes(words)).slice(0,9);
  $('#globalSearchResults').innerHTML=found.length?found.map(n=>`<button type="button" class="global-result" data-global="${n.id}"><span class="global-result-symbol">${STAGE_LETTERS[n.stage]}</span><span><strong>${escapeHtml(n.title)}</strong><small>${escapeHtml(n.track)} · ${escapeHtml(n.familyName)}</small></span><span class="global-result-arrow">↗</span></button>`).join(''):'<div class="empty-state">没有匹配结果，试试其他关键词。</div>';
  $$('#globalSearchResults [data-global]').forEach(b=>b.addEventListener('click',()=>{closeSearch();openLesson(b.dataset.global);}));
}
function wireInteractions(){
  document.addEventListener('click',e=>{const go=e.target.closest('[data-view]');if(go){navigate(go.dataset.view);}});
  $('#mobileMenu').addEventListener('click',()=>{$('#sidebar').classList.add('open');$('#sidebarScrim').hidden=false;});
  $('#sidebarScrim').addEventListener('click',()=>{$('#sidebar').classList.remove('open');$('#sidebarScrim').hidden=true;});
  $('#lessonClose').addEventListener('click',closeLesson);$('#lessonBackdrop').addEventListener('click',closeLesson);
  $('#librarySearch').addEventListener('input',e=>{libraryQuery=e.target.value;renderLibrary();});
  $('#libraryStage').addEventListener('change',e=>{filterStage=e.target.value;renderLibrary();});
  $('#libraryFamily').addEventListener('change',e=>{filterFamily=e.target.value;renderLibrary();});
  $('#onlySaved').addEventListener('change',e=>{onlySaved=e.target.checked;renderLibrary();});
  $('#graphSvg').addEventListener('click',e=>{const g=e.target.closest('[data-node]');if(g&&!graphDrag){setGraphNode(g.dataset.node);}});
  $('#graphSvg').addEventListener('keydown',e=>{const g=e.target.closest('[data-node]');if(g&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setGraphNode(g.dataset.node);}});
  $('#graphSvg').addEventListener('dblclick',e=>{const g=e.target.closest('[data-node]');if(g){e.stopPropagation();openLesson(g.dataset.node);}});
  $('#graphSvg').addEventListener('pointerdown',e=>{if(e.target.closest('[data-node]'))return;graphDrag={x:e.clientX,y:e.clientY,viewX:graphView.x,viewY:graphView.y};e.currentTarget.setPointerCapture(e.pointerId);});
  $('#graphSvg').addEventListener('pointermove',e=>{if(!graphDrag)return;const rect=e.currentTarget.getBoundingClientRect();graphView.x=graphDrag.viewX-(e.clientX-graphDrag.x)*graphView.w/rect.width;graphView.y=graphDrag.viewY-(e.clientY-graphDrag.y)*graphView.h/rect.height;applyViewBox();});
  const endDrag=()=>{graphDrag=null;};$('#graphSvg').addEventListener('pointerup',endDrag);$('#graphSvg').addEventListener('pointercancel',endDrag);
  $('#graphSvg').addEventListener('wheel',e=>{e.preventDefault();const rect=e.currentTarget.getBoundingClientRect(),relX=(e.clientX-rect.left)/rect.width,relY=(e.clientY-rect.top)/rect.height,scale=e.deltaY>0?1.12:.89;zoomGraph(scale,relX,relY);},{passive:false});
  function zoomGraph(scale,rx=.5,ry=.5){const w=Math.min(2400,Math.max(310,graphView.w*scale));const h=graphView.h*(w/graphView.w);graphView.x+= (graphView.w-w)*rx;graphView.y+=(graphView.h-h)*ry;graphView.w=w;graphView.h=h;applyViewBox();}
  $('#graphZoomIn').addEventListener('click',()=>zoomGraph(.8));$('#graphZoomOut').addEventListener('click',()=>zoomGraph(1.2));
  $('#graphReset').addEventListener('click',()=>{graphStage='all';graphSelected='seq-limit';graphView={x:-58,y:-25,w:1170,h:660};renderGraph();renderInspector();});
  $$('.lab-tab').forEach(b=>b.addEventListener('click',()=>{activeLab=b.dataset.lab;renderLabs();}));
  ['epsilonSlider','deltaSlider'].forEach(id=>$('#'+id).addEventListener('input',drawDeltaLab));
  ['sequenceEpsilon','sequenceN'].forEach(id=>$('#'+id).addEventListener('input',drawSequenceLab));
  $('#labOpenLesson').addEventListener('click',()=>openLesson('function-limit'));
  $('#sequenceOpenLesson').addEventListener('click',()=>openLesson('seq-limit'));
  $$('#tutorModes [data-mode]').forEach(b=>b.addEventListener('click',()=>{tutorMode=b.dataset.mode;renderTutor();}));
  $('#tutorTopic').addEventListener('change',e=>{currentTopic=e.target.value;tutorExercise=null;messages.push({role:'assistant',text:`切换到「${byId.get(currentTopic).title}」。${byId.get(currentTopic).inquiry}`});renderTutor();});
  $('#tutorOpenTopic').addEventListener('click',()=>openLesson(currentTopic));
  $('#tutorForm').addEventListener('submit',e=>{e.preventDefault();sendTutor($('#tutorInput').value);});
  $('#tutorInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendTutor(e.currentTarget.value);}});
  $$('.chat-chips [data-tutor-quick]').forEach(b=>b.addEventListener('click',()=>sendTutor(b.dataset.tutorQuick)));
  $('#clearChat').addEventListener('click',()=>{messages=[];renderTutor();inform('对话已清空');});
  $('#settingsButton').addEventListener('click',openSettings);$('#openApiSettings').addEventListener('click',openSettings);$('#settingsClose').addEventListener('click',closeSettings);
  $('#endpointSave').addEventListener('click',()=>{let val=$('#endpointInput').value.trim();if(val){try{const url=new URL(val);if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw Error('端点必须是 HTTPS（本机测试可用 HTTP）');if(url.username||url.password)throw Error('URL 中不要包含账号或密钥');}catch(err){inform(`地址无效：${err.message}`);return;}}endpoint=val;try{localStorage.setItem(ENDPOINT_KEY,val);}catch{}closeSettings();renderTutor();inform(val?'服务端地址已保存，请尝试发送消息':'已切换回本地引导');});
  $('#endpointClear').addEventListener('click',()=>{endpoint='';try{localStorage.removeItem(ENDPOINT_KEY);}catch{}closeSettings();renderTutor();inform('已切换回本地引导');});
  $('#settingsOverlay').addEventListener('click',e=>{if(e.target===$('#settingsOverlay'))closeSettings();});
  $('#topSearch').addEventListener('click',openSearch);$('#searchClose').addEventListener('click',closeSearch);
  $('#searchOverlay').addEventListener('click',e=>{if(e.target===$('#searchOverlay'))closeSearch();});
  $('#globalSearch').addEventListener('input',e=>renderGlobalResults(e.target.value));
  $('#globalSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#globalSearchResults [data-global]')?.click();}});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){closeLesson();closeSearch();closeSettings();$('#sidebar').classList.remove('open');$('#sidebarScrim').hidden=true;}
    if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){e.preventDefault();openSearch();}
  });
  window.addEventListener('hashchange',()=>{const view=location.hash.replace(/^#\//,'');if(VIEW_NAMES[view])navigate(view,false);});
}
async function initialize(){
  loadState();
  try{
    const embedded=window.__ATLAS_INLINE_DATA__;
    const [nc,ls,qs]=embedded ? [embedded.curriculum,embedded.lessons,embedded.exercises] : await Promise.all(['data/curriculum.json','data/lessons.json','data/exercises.json'].map(u=>fetch(u).then(r=>{if(!r.ok)throw new Error(`${u}: ${r.status}`);return r.json();})));
    nodes=nc;lessons=ls;exercises=qs;byId=new Map(nodes.map(n=>[n.id,n]));ensureGraphCoords();
    const families=Array.from(new Map(nodes.map(n=>[n.family,n.familyName])).entries());
    $('#libraryFamily').innerHTML='<option value="all">全部知识领域</option>'+families.map(([id,name])=>`<option value="${id}">${escapeHtml(name)}</option>`).join('');
    wireInteractions();renderSideProgress();
    const view=location.hash.replace(/^#\//,'');navigate(VIEW_NAMES[view]?view:'dashboard',false);
    // Retry formula layout if the CDN finishes loading slightly after app initialization.
    window.addEventListener('load',()=>renderMath(document));
  }catch(error){console.error(error);document.querySelector('main').innerHTML=`<div class="panel" style="padding:40px"><h1>资源加载失败</h1><p>请使用本地 HTTP 服务器访问（例如运行 <code>python -m http.server 8000</code>），不要直接通过 file:// 打开 HTML。</p><p>${escapeHtml(error.message)}</p></div>`;}
}
initialize();
