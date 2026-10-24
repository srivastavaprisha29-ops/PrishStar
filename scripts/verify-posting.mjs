export async function verifyPosting(url,password){
 const login=await fetch(url+'/api/owner',{method:'POST',headers:{'Content-Type':'application/json',Origin:url},body:JSON.stringify({password})});if(!login.ok)throw Error('Owner sign-in check failed');const cookie=login.headers.get('set-cookie')?.split(';')[0];if(!cookie)throw Error('Owner cookie missing');
 const owner={'Content-Type':'application/json',Cookie:cookie,Origin:url};
 for(const kind of ['story','photo']){let id;try{
  const bytes=Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64');
  const media=await fetch(url+'/api/media',{method:'POST',headers:{Cookie:cookie,Origin:url,'Content-Type':'image/gif','X-Upload-Kind':kind,'X-Upload-Size':String(bytes.length)},body:bytes});if(!media.ok)throw Error('Upload check failed');const asset=await media.json();
  const post=await fetch(url+'/api/entries',{method:'POST',headers:owner,body:JSON.stringify({kind,title:'Posting verification',body:'',extra:{image:asset.url,mediaType:asset.type,published:false}})});if(!post.ok)throw Error('Posting check failed');const row=await post.json();id=row.id;if(!JSON.parse(row.extra).published)throw Error('New upload did not publish automatically');
  const visible=await (await fetch(url+'/api/entries')).json();if(!visible.some(x=>x.id===id))throw Error('Published post missing for visitors');const image=await fetch(url+asset.url);if(!image.ok)throw Error('Published upload missing for visitors');await image.body?.cancel();
  const hide=await fetch(url+'/api/entries',{method:'PATCH',headers:owner,body:JSON.stringify({id,published:false})});if(!hide.ok)throw Error('Take-down check failed');const hidden=await (await fetch(url+'/api/entries')).json();if(hidden.some(x=>x.id===id))throw Error('Unpublished post still visible');const inaccessible=await fetch(url+asset.url);if(inaccessible.status!==404)throw Error('Unpublished media still visible');
 }finally{if(id){const deleted=await fetch(url+'/api/entries?id='+id,{method:'DELETE',headers:{Cookie:cookie,Origin:url}});if(!deleted.ok)throw Error('Verification cleanup failed');}}
 }
 console.log('Story/feed upload, immediate publication, public media, take-down, and deletion checks passed.');
}
