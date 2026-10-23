import {env} from 'cloudflare:workers';
import {ownerMatches} from './visibility';
import {validOwnerSession} from './owner-session';
export async function isOwner(req:Request):Promise<boolean>{
  if(env.PRISHSTAR_HOST_MODE==='cloudflare'){
    // Standalone deployments never trust incoming Sites identity headers.
    const token=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-prishstar_owner='))?.split('=')[1];
    return !!token&&!!env.PRISHSTAR_ADMIN_PASSWORD&&await validOwnerSession(token,env.PRISHSTAR_ADMIN_PASSWORD);
  }
  return !!req.headers.get('oai-authenticated-user-id')&&ownerMatches(req.headers.get('oai-authenticated-user-email'),env.PRISHSTAR_OWNER_EMAIL);
}
export async function rejectWrite(req:Request):Promise<Response|null>{
  if(!await isOwner(req))return new Response('Owner sign-in required.',{status:403});
  const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return new Response('Origin not allowed.',{status:403});return null;
}
export const ownerSignInPath=()=>env.PRISHSTAR_HOST_MODE==='cloudflare'?'/owner':'/signin-with-chatgpt?return_to=%2F';
