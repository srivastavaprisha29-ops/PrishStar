const encoder = new TextEncoder();
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode = (text: string) => Uint8Array.from(atob(text.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function key(password: string){return crypto.subtle.importKey('raw',encoder.encode(password+':prishstar-session-v1'),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
export async function createOwnerSession(password: string, now=Date.now()):Promise<string>{
  const payload=encode(encoder.encode(JSON.stringify({exp:now+8*60*60*1000,nonce:crypto.randomUUID()})));
  const signature=await crypto.subtle.sign('HMAC',await key(password),encoder.encode(payload));return payload+'.'+encode(new Uint8Array(signature));
}
export async function validOwnerSession(token: string, password: string, now=Date.now()):Promise<boolean>{
  if(password.length<20||token.length>2048)return false;
  try{const parts=token.split('.');if(parts.length!==2)return false;const [payload,signature]=parts;
    if(!await crypto.subtle.verify('HMAC',await key(password),decode(signature),encoder.encode(payload)))return false;
    const data=JSON.parse(new TextDecoder().decode(decode(payload)));return typeof data.exp==='number'&&data.exp>now&&data.exp<=now+8*60*60*1000;
  }catch{return false;}
}
export async function passwordMatches(input: string, expected: string):Promise<boolean>{
  const a=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(input)));
  const b=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(expected)));
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
