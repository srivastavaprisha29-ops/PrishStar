import {isOwner,ownerSignInPath} from '../../../lib/access';
export async function GET(req:Request){return Response.json({canEdit:await isOwner(req),signInPath:ownerSignInPath()},{headers:{'Cache-Control':'private, no-store'}});}
