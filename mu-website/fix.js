const fs=require('fs');
const path=require('path');
const rootDir='d:/BIT_FC/MUFC/mu-website';
function replaceInFile(filePath){
  let content=fs.readFileSync(filePath,'utf8');
  let original=content;
  content=content.replace(/<div class="pre-text">BIT FC<\/div>/g,'<div class="pre-text">NONE BIT FC<\/div>');
  content=content.replace(/<div class="footer-logo-text">BIT FC<span>/g,'<div class="footer-logo-text">NONE BIT FC<span>');
  content=content.replace(/alt="BIT FC Logo"/g,'alt="NONE BIT FC Logo"');
  content=content.replace(/<span>BIT FC<\/span>/g,'<span>NONE BIT FC<\/span>');
  content=content.replace(/alt="BIT FC"/g,'alt="NONE BIT FC"');
  if(content!==original){
    fs.writeFileSync(filePath,content,'utf8');
    console.log('Updated: '+filePath);
  }
}
function walk(dir){
  if(dir.includes('.git')||dir.includes('node_modules'))return;
  const files=fs.readdirSync(dir);
  for(const file of files){
    const fullPath=path.join(dir,file);
    if(fs.statSync(fullPath).isDirectory()){
      walk(fullPath);
    }else if(fullPath.endsWith('.html')){
      replaceInFile(fullPath);
    }
  }
}
walk(rootDir);
