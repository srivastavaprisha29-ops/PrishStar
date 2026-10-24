export type ArchiveEntry={id:string;kind:string;title:string;body:string;extra:string;created:string};
export function normalizeEntry(x:any):ArchiveEntry{
  if(!x||typeof x.id!=='string'||!x.id||x.id.length>100||!['blog','weekly','story','photo','hate','meddle','love','book','profile','reminder'].includes(x.kind)||typeof x.title!=='string'||x.title.length>200||typeof x.body!=='string'||x.body.length>20000||typeof x.extra!=='string'||x.extra.length>20000||typeof x.created!=='string'||!Number.isFinite(Date.parse(x.created)))throw Error('Invalid entry in transfer file.');
  const e=JSON.parse(x.extra);if(!e||typeof e!=='object'||Array.isArray(e))throw Error('Invalid entry details.');
  for(const key of ['image','poster','audio'])if(e[key]&&!/^\/api\/media\?id=[a-zA-Z0-9-]+$/.test(e[key]))throw Error('Invalid media reference.');
  if(e.link&&!/^https?:\/\//i.test(e.link))throw Error('Invalid article link.');
  return {id:x.id,kind:x.kind,title:x.title,body:x.body,extra:JSON.stringify({...e,published:e.published===true}),created:new Date(x.created).toISOString()};
}
async function responseJson(r:Response){if(!r.ok)throw Error(await r.text());return r.json()}
export async function downloadArchive(progress:(s:string)=>void){
  const rows:ArchiveEntry[]=await responseJson(await fetch('/api/archive'));
  const assets:any[]=[];const seen=new Set<string>();
  for(const row of rows){const extra=JSON.parse(row.extra);for(const key of ['image','poster','audio']){const path=extra[key];if(!path||seen.has(path))continue;seen.add(path);progress('Packing media '+(assets.length+1)+'…');
    const r=await fetch(path);if(!r.ok)throw Error('Could not read '+row.title+'. Sign in on this site and retry.');
    const blob=await r.blob();const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Could not read media.'));reader.readAsDataURL(blob)});
    assets.push({url:path,type:blob.type,kind:row.kind,created:row.created,data});
  }}
  const url=URL.createObjectURL(new Blob([JSON.stringify({version:2,entries:rows,assets})],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='prishstar-transfer.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);progress('Downloaded '+rows.length+' entries and '+assets.length+' media files. Import this file on your live website.');
}
export async function importArchive(file:File,progress:(s:string)=>void){
  if(file.size>500*1024*1024)throw Error('Transfer files must be under 500 MB.');
  const archive=JSON.parse(await file.text());if(archive.version!==2||!Array.isArray(archive.entries)||!Array.isArray(archive.assets))throw Error('Use a transfer file downloaded with “Download posts & media”.');
  const existing:ArchiveEntry[]=await responseJson(await fetch('/api/archive'));const ids=new Set(existing.map(x=>x.id));
  const rows:ArchiveEntry[]=archive.entries.map(normalizeEntry).filter((x:ArchiveEntry)=>!ids.has(x.id));if(!rows.length){progress('These entries are already on this site. Nothing was changed.');return}
  const needed=new Set(rows.flatMap(x=>{const e=JSON.parse(x.extra);return [e.image,e.poster,e.audio]}).filter(Boolean));const replacements=new Map<string,string>();
  for(const asset of archive.assets){if(!needed.has(asset.url)||replacements.has(asset.url))continue;
    if(typeof asset.data!=='string'||asset.data.length>134*1024*1024)throw Error('Invalid media in transfer file.');
    const bytes=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));progress('Restoring media '+(replacements.size+1)+' of '+needed.size+'…');
    const r=await fetch('/api/media',{method:'POST',headers:{'Content-Type':asset.type,'X-Upload-Size':String(bytes.length),'X-Upload-Kind':asset.kind,'X-Upload-Created':asset.created},body:bytes});
    replacements.set(asset.url,(await responseJson(r)).url);
  }
  for(const row of rows){const extra=JSON.parse(row.extra);for(const key of ['image','poster','audio'])if(extra[key]){if(!replacements.has(extra[key]))throw Error('The transfer file is missing media. Re-export from the original site.');extra[key]=replacements.get(extra[key])}row.extra=JSON.stringify(extra)}
  const result=await responseJson(await fetch('/api/archive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entries:rows})}));progress('Restored '+result.imported+' entries. Public/private settings and original dates preserved.');
}
