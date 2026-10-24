import {generateKeyPairSync,privateDecrypt,constants} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
mkdirSync('.bridge-runtime',{recursive:true});
function wrangler(args,optional=false){const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config','wrangler.cloudflare.generated.json'],{encoding:'utf8',env:process.env});if(r.status!==0&&!optional)throw Error('Bridge storage operation failed: '+r.stderr);return r.status===0;}
const keyPath='prishstar-media/__system/bridge-key.json',file='.bridge-runtime/key.json';let keys;
if(wrangler(['r2','object','get',keyPath,'--remote','--file',file],true))keys=JSON.parse(readFileSync(file,'utf8'));else{keys=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});writeFileSync(file,JSON.stringify(keys),{mode:0o600});wrangler(['r2','object','put',keyPath,'--remote','--file',file,'--content-type','application/json']);}
console.log('BRIDGE_PUBLIC_KEY='+Buffer.from(keys.publicKey).toString('base64'));
if(existsSync('.openai/bridge.encrypted')){const envelope=JSON.parse(privateDecrypt({key:keys.privateKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},Buffer.from(readFileSync('.openai/bridge.encrypted','utf8').trim(),'base64')).toString());writeFileSync('.bridge-runtime/config.json',JSON.stringify(envelope),{mode:0o600});console.log('Source bridge configured.');}
