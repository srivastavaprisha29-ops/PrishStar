import {env} from 'cloudflare:workers';
import {ownerMatches} from './visibility';
// Identity headers are supplied and protected by the Sites hosting boundary.
export function isOwner(req: Request): boolean {
  return !!req.headers.get('oai-authenticated-user-id') && ownerMatches(req.headers.get('oai-authenticated-user-email'),env.PRISHSTAR_OWNER_EMAIL);
}
export function rejectWrite(req:Request): Response | null {
  if(!isOwner(req))return new Response('Owner sign-in required.',{status:403});
  const origin=req.headers.get('origin');
  if(origin && origin!==new URL(req.url).origin)return new Response('Origin not allowed.',{status:403});
  return null;
}
