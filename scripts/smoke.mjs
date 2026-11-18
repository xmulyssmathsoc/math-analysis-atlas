/** Headless DOM-lite smoke test — confirms every view renders without network or a browser. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const elements=new Map();
function stubElement(key){
  if(elements.has(key))return elements.get(key);
  const cls=new Set();
  const o={innerHTML:'',textContent:'',value:key.includes('epsilonSlider')?'1':key.includes('deltaSlider')?'.2':key.includes('sequenceEpsilon')?'.1':key.includes('sequenceN')?'10':'',style:{},hidden:false,dataset:{},scrollTop:0,scrollHeight:0,checked:false,querySelectorAll(){return []},querySelector(sel){return stubElement(sel)},addEventListener(){},focus(){},setAttribute(){},getBoundingClientRect(){return {left:0,top:0,width:900,height:600}},setPointerCapture(){},classList:{add(...s){s.forEach(v=>cls.add(v))},remove(...s){s.forEach(v=>cls.delete(v))},contains(x){return cls.has(x)},toggle(x,on){if(on===undefined? !cls.has(x):on)cls.add(x);else cls.delete(x);}}};
  elements.set(key,o);return o;
}
const document={querySelector:s=>stubElement(s),querySelectorAll:()=>[],addEventListener(){},activeElement:{tagName:'BODY'}};
const storage=new Map();
const context={document,window:{addEventListener(){},scrollTo(){}},console,URL,Date,JSON,Math,Number,Set,Map,Promise,Array,String,Boolean,RegExp,setTimeout,clearTimeout,location:{hash:''},history:{replaceState(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},fetch:async u=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,u),'utf8'))})};
vm.createContext(context);
const script=fs.readFileSync(path.join(root,'assets/app.js'),'utf8').replace(/initialize\(\);\s*$/,'globalThis.__test={initialize,navigate,openLesson,closeLesson,drawDeltaLab,drawSequenceLab,renderGraph,renderPractice,renderLibrary,renderPaths,renderTutor,renderResources,renderDashboard};');
vm.runInContext(script,context,{filename:'assets/app.js'});
const app=context.__test;
await app.initialize();
const names=['dashboard','graph','paths','library','practice','lab','tutor','resources'];
for(const view of names)app.navigate(view);
app.openLesson('function-limit');app.closeLesson();
for(const selector of ['#dashboardStats','#graphSvg','#pathCards','#libraryGrid','#exerciseDetail','#deltaChart','#chatMessages','#resourceGrid','#lessonContent']){
  const html=stubElement(selector).innerHTML;
  if(!html||String(html).length<80)throw Error(`View failed to render ${selector}`);
}
console.log('✅ UI smoke test passed: 8 views, graph, lesson drawer, practice, lab, tutor and external resources.');
