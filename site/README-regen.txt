Regenerate reasons.js from the markdown (run from the site/ folder):

node -e "const fs=require('fs');const src=fs.readFileSync('../250-reasons-utah-to-cheyenne.md','utf8').split(/\r?\n/);let cat=null,out=[];for(const line of src){if(line.startsWith('## '))cat=line.slice(3).trim();const m=line.match(/^(\d+)\. (.*)$/);if(m&&cat)out.push({n:+m[1],cat,text:m[2].trim()});}fs.writeFileSync('reasons.js','// Generated from 250-reasons-utah-to-cheyenne.md\nwindow.REASONS = '+JSON.stringify(out,null,1)+';\n');console.log(out.length)"
