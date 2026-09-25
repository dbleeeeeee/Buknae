// 저장소: Upstash Redis가 연결되어 있으면 영구 저장, 없으면 메모리(데모)
import { Redis } from '@upstash/redis';
const url=process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL;
const token=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY='letters:v1';
const LIMIT=2000;
let redis=null;
if(url&&token) redis=new Redis({url,token});
const mem=globalThis.__mem_letters||(globalThis.__mem_letters=[]);
export const persistent=!!redis;
export async function add(l){
  if(redis){ await redis.lpush(KEY,JSON.stringify(l)); await redis.ltrim(KEY,0,LIMIT-1); }
  else { mem.unshift(l); if(mem.length>LIMIT) mem.length=LIMIT; }
  return l;
}
export async function list(n=200){
  if(redis){ const rows=await redis.lrange(KEY,0,n-1); return rows.map(r=>typeof r==='string'?JSON.parse(r):r); }
  return mem.slice(0,n);
}
export async function remove(id){
  if(redis){
    const rows=await redis.lrange(KEY,0,LIMIT-1);
    const hit=rows.find(r=>(typeof r==='string'?JSON.parse(r):r).id===id);
    if(hit) await redis.lrem(KEY,1,typeof hit==='string'?hit:JSON.stringify(hit));
    return !!hit;
  }
  const i=mem.findIndex(l=>l.id===id); if(i>=0) mem.splice(i,1); return i>=0;
}
export async function count(){ return redis? await redis.llen(KEY) : mem.length; }
