// 이야기 우체통 API
//   GET    /api/letters?n=200        → { letters, total, persistent }  (연락처는 반환하지 않음)
//   POST   /api/letters              → { letter }  {village, place, story, from, contact}
//   DELETE /api/letters?id=...       → 관리자 삭제 (헤더 x-admin-token)
//   GET    /api/letters?full=1       → 관리자 전체(연락처 포함, x-admin-token 필요)
import { add, list, remove, count, persistent } from './_store.js';

const VILLAGES=['가정1리','가정2리','내룡리','당우리','덕산리','상교리','서원1리','서원2리','석우1리','석우2리','신남리','신접1리','신접2리','외룡리','운촌리','장암1리','장암2리','주암1리','주암2리','중암1리','중암2리','지내리'];
const BANNED=['시발','씨발','병신','새끼'];
const rate=globalThis.__rate||(globalThis.__rate=new Map());
const ip=req=>(req.headers['x-forwarded-for']||'').split(',')[0].trim()||'local';
function limited(k){const now=Date.now();const a=(rate.get(k)||[]).filter(t=>now-t<60000);a.push(now);rate.set(k,a);return a.length>6}
const clean=l=>{const{contact,...rest}=l;return rest};

export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  try{
    const admin=process.env.ADMIN_TOKEN&&req.headers['x-admin-token']===process.env.ADMIN_TOKEN;
    if(req.method==='GET'){
      const n=Math.min(500,+(req.query.n||200));
      const [rows,total]=await Promise.all([list(n),count()]);
      if(req.query.full&&admin) return res.status(200).json({letters:rows,total,persistent});
      return res.status(200).json({letters:rows.map(clean),total,persistent});
    }
    if(req.method==='POST'){
      if(limited(ip(req))) return res.status(429).json({error:'잠시 후 다시 보내 주세요. (1분에 6번까지)'});
      const b=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
      const village=String(b.village||'').trim();
      const place=String(b.place||'').trim().replace(/\s+/g,' ').slice(0,40);
      const story=String(b.story||'').trim().replace(/\s{2,}/g,' ');
      const from=String(b.from||'').trim().slice(0,20);
      const contact=String(b.contact||'').trim().slice(0,60);
      if(!VILLAGES.includes(village)) return res.status(400).json({error:'마을을 골라 주세요.'});
      if(place.length<2) return res.status(400).json({error:'기억나는 이름이나 자리를 적어 주세요.'});
      if(story.length<5) return res.status(400).json({error:'이야기를 다섯 글자 이상 적어 주세요.'});
      if(story.length>600) return res.status(400).json({error:'600자 이내로 적어 주세요.'});
      if(BANNED.some(w=>(place+story).includes(w))) return res.status(400).json({error:'게시할 수 없는 표현이 있어요.'});
      const letter={
        id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),
        village, place, story, from: from||'익명', contact,
        at:new Date().toISOString(),
      };
      await add(letter);
      return res.status(201).json({letter:clean(letter),persistent});
    }
    if(req.method==='DELETE'){
      if(!admin) return res.status(401).json({error:'unauthorized'});
      const ok=await remove(String(req.query.id||''));
      return res.status(ok?200:404).json({ok});
    }
    res.setHeader('Allow','GET, POST, DELETE');
    return res.status(405).json({error:'method not allowed'});
  }catch(e){ console.error(e); return res.status(500).json({error:'서버 오류가 났어요. 잠시 후 다시 시도해 주세요.'}) }
}
