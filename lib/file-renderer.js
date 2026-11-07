import { escapeHTML } from './print-materials.js';
export function svgDocument(d) {
  const f=d.figure;if(!f)return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f.columns.length*100+50} ${f.rows.length*50+60}"><title>${escapeHTML(d.title)}</title><desc>${escapeHTML(d.text)}</desc><rect width="100%" height="100%" fill="#e5e0d6"/><g font-family="monospace" fill="#171b22">${f.columns.map((x,i)=>`<text x="${i*100+65}" y="25" font-size="16">${escapeHTML(x)}</text>`).join('')}${f.rows.map((r,j)=>`<text x="10" y="${j*50+70}">${j+1}</text>${r.map((x,i)=>`<rect x="${i*100+45}" y="${j*50+40}" width="90" height="42" fill="none" stroke="#a58c56"/><text x="${i*100+70}" y="${j*50+68}" font-size="20">${escapeHTML(x)}</text>`).join('')}`).join('')}</g></svg>`;
}
// Small, paginated, selectable-text PDF. WinAnsi supports the Portuguese alphabet.
export function pdfDocument(d) {
  const clean=s=>s.replace(/[“”]/g,'"').replace(/[’‘]/g,"'").replace(/[—–→]/g,'-').replace(/[^\x20-\xff\n]/g,' ');
  const wrap=s=>s.split('\n').flatMap(line=>{const out=[];let rest=line;while(rest.length>82){let at=rest.lastIndexOf(' ',82);if(at<15)at=82;out.push(rest.slice(0,at));rest=rest.slice(at).trimStart();}out.push(rest);return out;});
  const lines=wrap(clean(`${d.title}\n${d.id} / ${d.classification}\n\n${d.text}`));
  const pages=[];for(let i=0;i<lines.length;i+=43)pages.push(lines.slice(i,i+43));
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'];
  const pageIds=[];
  for(const page of pages){const id=objects.length+1,streamId=id+1;pageIds.push(id);objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`);const stream=`BT /F1 11 Tf 16 TL 55 785 Td ${page.map((line,i)=>`${i?'T* ':''}(${line.replace(/([\\()])/g,'\\$1')}) Tj`).join('\n')} ET`;objects.push(`<< /Length ${Buffer.byteLength(stream,'latin1')} >>\nstream\n${stream}\nendstream`);}
  objects[1]=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  let result='%PDF-1.4\n',offsets=[0];objects.forEach((obj,i)=>{offsets.push(Buffer.byteLength(result,'latin1'));result+=`${i+1} 0 obj\n${obj}\nendobj\n`;});const xref=Buffer.byteLength(result,'latin1');result+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(result,'latin1');
}
