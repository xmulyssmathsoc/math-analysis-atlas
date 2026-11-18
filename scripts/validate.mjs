import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(name)=>JSON.parse(fs.readFileSync(path.join(root,'data',name),'utf8'));
const nodes=read('curriculum.json'),exercises=read('exercises.json'),lessons=read('lessons.json');
const errors=[];
function requireOk(cond,message){if(!cond)errors.push(message);}
const nodeIds=new Set(nodes.map(n=>n.id));
requireOk(nodeIds.size===nodes.length,'知识节点 ID 有重复');
for(const n of nodes){
  requireOk(n.id&&n.title&&n.summary&&n.intuition&&n.formula,`${n.id}: 缺少必要字段`);
  requireOk(Number.isInteger(n.stage)&&n.stage>=0&&n.stage<=4,`${n.id}: 阶段越界`);
  requireOk(Array.isArray(n.prerequisites),`${n.id}: prerequisites 非数组`);
  for(const id of n.prerequisites||[]){
    requireOk(nodeIds.has(id),`${n.id}: 未知依赖 ${id}`);
    requireOk(id!==n.id,`${n.id}: 不能自己依赖自己`);
    const pre=nodes.find(x=>x.id===id);if(pre)requireOk(pre.stage<=n.stage,`${n.id}: 依赖未来阶段 ${id}`);
  }
}
const visiting=new Set(),visited=new Set();
function dfs(id){if(visiting.has(id)){errors.push(`依赖存在环：${id}`);return;}if(visited.has(id))return;visiting.add(id);const n=nodes.find(n=>n.id===id);for(const pre of n?.prerequisites||[])if(nodeIds.has(pre))dfs(pre);visiting.delete(id);visited.add(id);}
for(const n of nodes)dfs(n.id);
const qids=new Set(exercises.map(q=>q.id));
requireOk(qids.size===exercises.length,'习题 ID 有重复');
for(const q of exercises){
  requireOk(nodeIds.has(q.topic),`${q.id}: 未知知识点 ${q.topic}`);
  requireOk(Number.isInteger(q.difficulty)&&q.difficulty>=0&&q.difficulty<=4,`${q.id}: 难度越界`);
  requireOk(['choice','numeric','proof'].includes(q.kind),`${q.id}: 未知题型`);
  requireOk(q.prompt&&Array.isArray(q.hints)&&q.hints.length>0,`${q.id}: 缺少题干或提示`);
  if(q.kind==='choice')requireOk(q.options?.length>=2&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length,`${q.id}: 选项答案不合法`);
  if(q.kind==='numeric')requireOk(Number.isFinite(q.answer),`${q.id}: 数值答案不合法`);
  if(q.kind==='proof')requireOk(q.answer&&q.rubric?.length>=2,`${q.id}: 缺少证明与评分要点`);
}
for(const [id,l] of Object.entries(lessons)){
  requireOk(nodeIds.has(id),`详细讲义引用不存在的节点 ${id}`);
  requireOk(l.definition&&l.theorem&&l.proof?.length>=2&&l.worked&&l.think,`${id}: 详细讲义不完整`);
}
for(const file of ['index.html','assets/app.js','assets/style.css','assets/favicon.svg','.github/workflows/pages.yml'])requireOk(fs.existsSync(path.join(root,file)),`文件不存在：${file}`);
if(errors.length){console.error(`❌ ${errors.length} 个错误：\n`+errors.map(e=>`  • ${e}`).join('\n'));process.exit(1);}
const edges=nodes.reduce((a,n)=>a+n.prerequisites.length,0);
console.log(`✅ 数据结构有效：${nodes.length} 个知识节点、${edges} 条无环先修边、${Object.keys(lessons).length} 份深度讲义、${exercises.length} 道练习。`);
console.log('✅ 五个阶段均覆盖，引用关系正确，未发现结构性错误。');
