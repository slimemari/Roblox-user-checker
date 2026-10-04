const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";

function json(res,status,obj){
  const body=JSON.stringify(obj);
  res.writeHead(status,{"Content-Type":"application/json","Cache-Control":"no-store"});
  res.end(body);
}

async function checkRoblox(username){
  const url="https://auth.roblox.com/v1/usernames/validate?request.username="+encodeURIComponent(username)+"&request.birthday=2000-01-01&request.context=Signup";
  const r=await fetch(url,{headers:{"User-Agent":"RobloxUsernameChecker/1.0"}});
  let data={}; try{data=await r.json()}catch{}
  if(r.status===429) return {rateLimited:true};
  if(!r.ok) return {error:"Roblox returned HTTP "+r.status};
  return {available:data.code===0,code:data.code,message:data.message};
}

const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,"http://localhost");
  if(u.pathname==="/api/check"){
    const username=u.searchParams.get("username")||"";
    if(!/^[A-Za-z0-9]{3,20}$/.test(username)) return json(res,400,{error:"Invalid username format"});
    try{
      const result=await checkRoblox(username);
      if(result.rateLimited) return json(res,429,{rateLimited:true,error:"Roblox rate-limited the request"});
      if(result.error) return json(res,502,result);
      return json(res,200,result);
    }catch(e){ return json(res,502,{error:"Unable to contact Roblox"}); }
  }
  if(u.pathname==="/health"){return json(res,200,{ok:true});}
  let file=u.pathname==="/" ? "/index.html" : u.pathname;
  const filePath=path.join(__dirname,path.normalize(file));
  if(!filePath.startsWith(__dirname)) return res.writeHead(403).end();
  fs.readFile(filePath,(err,data)=>{
    if(err){res.writeHead(404,{"Content-Type":"text/plain"});return res.end("Not found");}
    const type=filePath.endsWith(".html")?"text/html; charset=utf-8":"application/octet-stream";
    res.writeHead(200,{"Content-Type":type});res.end(data);
  });
});
server.listen(PORT,HOST,()=>console.log(`Listening on ${HOST}:${PORT}`));
