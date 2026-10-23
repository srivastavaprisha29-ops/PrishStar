import {env} from 'cloudflare:workers';
import {createOwnerSession,passwordMatches} from '../../../lib/owner-session';
export async function POST(req:Request){
  if(env.PRISHSTAR_HOST_MODE!=='cloudflare')return new Response('Use the hosting sign-in.',{status:404});
  if(req.headers.get('origin')!==new URL(req.url).origin)return new Response('Origin not allowed.',{status:403});
  const expected=env.PRISHSTAR_ADMIN_PASSWORD;if(!expected||expected.length<20)return new Response('Owner sign-in is not configured.',{status:503});
  if(!req.headers.get('content-type')?.startsWith('application/json'))return new Response('JSON required.',{status:415});
  const ip=req.headers.get('cf-connecting-ip')||'unknown';const bucket=Math.floor(Date.now()/(15*60*1000));
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip+':'+bucket+':'+expected));
  const id=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const row=await env.DB.prepare('INSERT INTO login_attempts (id,count,created) VALUES (?,\'1\',?) ON CONFLICT(id) DO UPDATE SET count=CAST(count AS INTEGER)+1 RETURNING count').bind(id,new Date().toISOString()).first<{count:string}>();
  if(Number(row?.count)>8)return new Response('Too many attempts. Try again in 15 minutes.',{status:429,headers:{'Retry-After':'900'}});
  let input;try{input=await req.json()}catch{return new Response('Invalid request.',{status:400})}
  if(typeof input.password!=='string'||input.password.length>1000||!await passwordMatches(input.password,expected))return new Response('Incorrect password.',{status:401});
  await env.DB.prepare('DELETE FROM login_attempts WHERE created < ?').bind(new Date(Date.now()-2*24*60*60*1000).toISOString()).run();
  const token=await createOwnerSession(expected);
  return Response.json({ok:true},{headers:{'Set-Cookie':`__Host-prishstar_owner=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`,'Cache-Control':'no-store'}});
}
export async function DELETE(req:Request){
  if(req.headers.get('origin')!==new URL(req.url).origin)return new Response('Origin not allowed.',{status:403});
  return Response.json({ok:true},{headers:{'Set-Cookie':'__Host-prishstar_owner=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0','Cache-Control':'no-store'}});
}
