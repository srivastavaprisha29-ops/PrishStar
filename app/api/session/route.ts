import {isOwner} from '../../../lib/access';
export async function GET(req:Request){return Response.json({canEdit:isOwner(req)},{headers:{'Cache-Control':'private, no-store'}});}
