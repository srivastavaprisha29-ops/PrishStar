export async function migrate(target,config){
 const source='https://prisha-catharsis.saltylake.chatgpt.site';
 const headers={Authorization:'Bearer '+config.secret,'OAI-Sites-Authorization':'Bearer '+config.service};
 const done=await fetch(target+'/api/bridge?migration=state',{headers:{Authorization:'Bearer '+config.secret}});if(done.ok&&(await done.json()).done){console.log('Existing uploads already migrated.');return;}if(!done.ok)throw Error('Cannot verify source migration state.');
 const records=await fetch(source+'/api/bridge',{headers});if(!records.ok)throw Error('Cannot read existing uploads: '+records.status);const rows=await records.json();let media=0;
 for(const row of rows){const extra=JSON.parse(row.extra);if(['story','photo'].includes(row.kind))extra.published=true;row.extra=JSON.stringify(extra);
  if(extra.image){const id=new URL(extra.image,source).searchParams.get('id');if(!/^[a-f0-9-]{36}$/.test(id||''))throw Error('Invalid stored media ID');const r=await fetch(source+'/api/bridge?media='+id,{headers});if(!r.ok)throw Error('Existing media unavailable: '+r.status);const data=await r.arrayBuffer();const upload=await fetch(target+'/api/bridge?media='+id,{method:'POST',headers:{Authorization:'Bearer '+config.secret,'Content-Type':r.headers.get('content-type')||'application/octet-stream','X-Upload-Size':String(data.byteLength)},body:data});if(!upload.ok)throw Error('Media migration failed: '+upload.status);media++;}
  const save=await fetch(target+'/api/bridge',{method:'POST',headers:{Authorization:'Bearer '+config.secret,'Content-Type':'application/json'},body:JSON.stringify({entry:row})});if(!save.ok)throw Error('Post migration failed: '+save.status);
  if(['story','photo'].includes(row.kind)){const update=await fetch(source+'/api/bridge',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({entry:row})});if(!update.ok)throw Error('Source publication failed.');}
 }
 const publicRows=await (await fetch(target+'/api/entries')).json();const expected=rows.filter(x=>['story','photo'].includes(x.kind));if(expected.some(x=>!publicRows.some(y=>y.id===x.id)))throw Error('Public migration verification failed.');
 for(const row of expected){const path=JSON.parse(row.extra).image;if(path){const r=await fetch(target+path,{headers:{Range:'bytes=0-15'}});if(!r.ok)throw Error('Public media verification failed.');await r.body?.cancel();}}
 const saved=await fetch(target+'/api/bridge?migration=complete',{method:'POST',headers:{Authorization:'Bearer '+config.secret}});if(!saved.ok)throw Error('Cannot save migration completion.');
 console.log(`Automatically migrated ${rows.length} entries and ${media} uploads; public story/feed checks passed.`);
}
