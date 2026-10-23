import {isOwner,rejectWrite} from "../../../lib/access";
import {published} from "../../../lib/visibility";
import {getDb} from "../../../db";
import {entries} from "../../../db/schema";
import {isLive} from "../../../lib/lifetime";
import {eq,desc} from "drizzle-orm";
export async function GET(req:Request){const owner=await isOwner(req);const rows=await getDb().select().from(entries).orderBy(desc(entries.created));return Response.json(rows.filter(x=>isLive(x.kind,x.created)&&(owner||published(x.extra))),{headers:{"Cache-Control":"no-store"}});}
export async function POST(req:Request){const denied=await rejectWrite(req);if(denied)return denied;const x=await req.json();if(!["blog","weekly","story","photo","hate","meddle","love","book","profile","reminder"].includes(x.kind)||typeof x.title!=="string"||typeof x.body!=="string"||x.body.length>20000)return new Response("Invalid entry",{status:400}); const row={id:crypto.randomUUID(),kind:x.kind,title:x.title.slice(0,200),body:x.body,extra:JSON.stringify(x.extra||{}),created:new Date().toISOString()};if(x.kind==="reminder"){await getDb().batch([getDb().delete(entries).where(eq(entries.kind,"reminder")),getDb().insert(entries).values(row)]);}else{await getDb().insert(entries).values(row);}return Response.json(row);}
export async function DELETE(req:Request){const denied=await rejectWrite(req);if(denied)return denied;const id=new URL(req.url).searchParams.get("id");if(!id)return new Response("Missing id",{status:400});await getDb().delete(entries).where(eq(entries.id,id));return Response.json({ok:true});}
export async function PATCH(req:Request){
  const denied=await rejectWrite(req);if(denied)return denied;
  const x=await req.json();if(typeof x.id!=='string'||typeof x.published!=='boolean')return new Response('Invalid request',{status:400});
  const existing=await getDb().select().from(entries).where(eq(entries.id,x.id)).get();if(!existing)return new Response('Not found',{status:404});
  const extra={...JSON.parse(existing.extra),published:x.published};
  await getDb().update(entries).set({extra:JSON.stringify(extra)}).where(eq(entries.id,x.id));return Response.json({ok:true});
}
