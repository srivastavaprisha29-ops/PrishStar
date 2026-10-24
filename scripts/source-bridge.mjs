import {generateKeyPairSync,privateDecrypt,constants} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
mkdirSync('.bridge-runtime',{recursive:true});
function wrangler(args){const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{encoding:'utf8',env:process.env});if(r.status!==0)throw Error('Bridge storage operation failed');}
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
async function api(path,options={}){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`,{...options,headers:{Authorization:`Bearer ${token}`,...options.headers}});if(!r.ok)throw Error('Bridge storage request failed: '+r.status);return r;}
const keyPath='r2/buckets/prishstar-media/objects/__system%2Fbridge-key.json';
let keys;const keyResponse=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${keyPath}`,{headers:{Authorization:`Bearer ${token}`}});
if(keyResponse.ok)keys=await keyResponse.json();else if(keyResponse.status===404){keys=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});await api(keyPath,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(keys)});}else throw Error('Bridge key unavailable '+keyResponse.status);
console.log('BRIDGE_PUBLIC_KEY='+Buffer.from(keys.publicKey).toString('base64'));
if(existsSync('.openai/bridge.encrypted')){const envelope=JSON.parse(privateDecrypt({key:keys.privateKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},Buffer.from(readFileSync('.openai/bridge.encrypted','utf8').trim(),'base64')).toString());writeFileSync('.bridge-runtime/config.json',JSON.stringify(envelope),{mode:0o600});console.log('Source bridge configured.');}
