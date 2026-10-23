import {isOwner,rejectWrite} from '../../../lib/access';
import {published} from '../../../lib/visibility';
import {env} from 'cloudflare:workers';
import {lifetime,isLive} from '../../../lib/lifetime';
import {getDb} from '../../../db';
import {entries} from '../../../db/schema';
const MAX = 95 * 1024 * 1024;
const TYPES = new Set(['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime','video/ogg']);
export async function POST(req:Request){
  const denied=await rejectWrite(req);if(denied)return denied;
  const type=(req.headers.get('content-type')||'').split(';')[0];
  const size=Number(req.headers.get('content-length') || req.headers.get('x-upload-size'));
  const kind=req.headers.get('x-upload-kind')||'';
  if(!TYPES.has(type)||!['photo','story','profile'].includes(kind)||!req.body||!Number.isFinite(size)||size<=0||size>MAX)
    return new Response('Choose a supported image or video up to 95 MB.',{status:400});
  if(kind==='profile'&&!type.startsWith('image/'))return new Response('Profile photos must be images.',{status:400});
  const duration=lifetime(kind);const key=crypto.randomUUID();
  await env.BUCKET.put(key,req.body,{httpMetadata:{contentType:type},customMetadata:{kind,expiresAt:duration?String(Date.now()+duration):''}});
  return Response.json({url:'/api/media?id='+key,type});
}
export async function GET(req:Request){
  const id=new URL(req.url).searchParams.get('id');if(!id)return new Response(null,{status:404});
  if(!await isOwner(req)){const rows=await getDb().select().from(entries);const visible=rows.some(x=>{try{return JSON.parse(x.extra).image==='/api/media?id='+id&&published(x.extra)&&isLive(x.kind,x.created)}catch{return false}});if(!visible)return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});}
  const head=await env.BUCKET.head(id);if(!head)return new Response(null,{status:404});
  let expiry=Number(head.customMetadata?.expiresAt||0);
  if(!head.customMetadata?.kind){const rows=await getDb().select().from(entries);const record=rows.find(x=>{try{return JSON.parse(x.extra).image==='/api/media?id='+id}catch{return false}});if(record&&!isLive(record.kind,record.created))return new Response('This upload has expired.',{status:410,headers:{'Cache-Control':'no-store'}});}
  if(expiry&&Date.now()>=expiry)return new Response('This upload has expired.',{status:410,headers:{'Cache-Control':'no-store'}});
  const object=await env.BUCKET.get(id,{range:req.headers});if(!object)return new Response(null,{status:404});
  const headers=new Headers({'Content-Type':object.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'private, no-store','Accept-Ranges':'bytes','ETag':object.httpEtag,'X-Content-Type-Options':'nosniff'});
  const range=object.range;
  if(range&&'offset' in range&&range.offset!==undefined){const length=range.length||object.size-range.offset;headers.set('Content-Range',`bytes ${range.offset}-${range.offset+length-1}/${object.size}`);headers.set('Content-Length',String(length));return new Response(object.body,{status:206,headers});}
  headers.set('Content-Length',String(object.size));return new Response(object.body,{headers});
}
