import {writeFileSync} from 'node:fs';
const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const token=process.env.CLOUDFLARE_API_TOKEN;
if(!account||!/^[a-f0-9]{32}$/i.test(account)||!token)throw new Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in GitHub Actions secrets.');
if((process.env.PRISHSTAR_ADMIN_PASSWORD||'').length<20)throw new Error('PRISHSTAR_ADMIN_PASSWORD must contain at least 20 characters.');
async function api(path,options={}){
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{...options,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...options.headers}});
 const data=await r.json();if(!r.ok||data.success===false){const err=new Error('Cloudflare API request failed ('+r.status+'): '+(data.errors||[]).map(x=>x.message).join('; '));err.status=r.status;throw err;}return data.result;
}
const databases=await api('/d1/database?per_page=100&name=prishstar-db');let db=databases.find(x=>x.name==='prishstar-db');
if(!db)db=await api('/d1/database',{method:'POST',body:JSON.stringify({name:'prishstar-db'})});
try{await api('/r2/buckets/prishstar-media')}catch(e){if(e.status!==404)throw e;await api('/r2/buckets',{method:'POST',body:JSON.stringify({name:'prishstar-media'})});}
const config={name:'prishstar',main:'./worker/index.ts',compatibility_date:'2026-05-15',compatibility_flags:['nodejs_compat'],workers_dev:true,vars:{PRISHSTAR_HOST_MODE:'cloudflare'},d1_databases:[{binding:'DB',database_name:'prishstar-db',database_id:db.uuid||db.id,migrations_dir:'drizzle'}],r2_buckets:[{binding:'BUCKET',bucket_name:'prishstar-media'}],observability:{enabled:true}};
if(!config.d1_databases[0].database_id)throw new Error('Cloudflare did not return a database ID.');
writeFileSync('wrangler.cloudflare.generated.json',JSON.stringify(config,null,2)+'\n');console.log('Cloudflare database, media bucket, and deployment configuration ready.');
