import {spawnSync} from 'node:child_process';
import {appendFileSync} from 'node:fs';
const password=process.env.PRISHSTAR_ADMIN_PASSWORD;
if(!password||password.length<20)throw new Error('Set PRISHSTAR_ADMIN_PASSWORD (at least 20 characters) in GitHub Actions secrets.');
function run(args,input){const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{encoding:'utf8',input,env:{...process.env,CI:'true'},maxBuffer:8*1024*1024});
 if(r.error)throw r.error;
 const output=(r.stdout||'')+(r.stderr||'');process.stdout.write(output);
 if(r.status!==0)throw new Error('Cloudflare deployment command failed. Review the error above.');return output;}
const output=run(['deploy','--config','dist/server/wrangler.json']);
run(['secret','bulk','--config','dist/server/wrangler.json'],JSON.stringify({PRISHSTAR_ADMIN_PASSWORD:password}));
const url=output.match(/https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev\b/i)?.[0];
if(url){
 const r=await fetch(url);if(!r.ok)throw new Error('Deployment returned a URL, but its homepage responded '+r.status+'.');
 const session=await fetch(url+'/api/session');if(!session.ok||(await session.json()).canEdit!==false)throw new Error('Public reader check failed.');
 const denied=await fetch(url+'/api/entries',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(denied.status!==403)throw new Error('Owner-only write check failed.');
 const summary='## PrishStar deployed\n\nLive site: '+url+'\n\nOwner sign-in: '+url+'/owner\n\nHomepage and read-only visitor checks passed.\n';
 if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);console.log(summary);
}else throw new Error('Worker deployed, but no workers.dev URL was returned. Enable a Workers subdomain in your Cloudflare account and rerun.');
