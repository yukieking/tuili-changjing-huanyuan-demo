import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||5173);
http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);return res.end();}const publicFile=p===root?path.join(root,'index.html'):p;fs.readFile(publicFile,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json'})[path.extname(publicFile)]||'application/octet-stream');res.end(data);});}).listen(port,'127.0.0.1',()=>console.log(`谜境 → http://localhost:${port}`));
