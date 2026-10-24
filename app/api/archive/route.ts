import {isOwner,rejectWrite} from '../../../lib/access';
import {getDb} from '../../../db';
import {entries} from '../../../db/schema';
import {isLive} from '../../../lib/lifetime';
import {normalizeEntry} from '../../../lib/archive';
import {desc} from 'drizzle-orm';
export async function GET(req:Request){if(!await isOwner(req))return new Response('Owner sign-in required.',{status:403});const rows=await getDb().select().from(entries).orderBy(desc(entries.created));return Response.json(rows.filter(x=>isLive(x.kind,x.created)),{headers:{'Cache-Control':'private, no-store'}});}
export async function POST(req:Request){const denied=await rejectWrite(req);if(denied)return denied;
  try{const data=await req.json();if(!Array.isArray(data.entries)||data.entries.length>500)return new Response('Invalid transfer file.',{status:400});const rows=data.entries.map(normalizeEntry);const existing=new Set((await getDb().select({id:entries.id}).from(entries)).map(x=>x.id));const fresh=rows.filter((x:any)=>!existing.has(x.id));
    for(let i=0;i<fresh.length;i+=50)await getDb().batch(fresh.slice(i,i+50).map((x:any)=>getDb().insert(entries).values(x).onConflictDoNothing()));
    return Response.json({imported:fresh.length},{headers:{'Cache-Control':'no-store'}});
  }catch{return new Response('Transfer file could not be imported.',{status:400})}
}
