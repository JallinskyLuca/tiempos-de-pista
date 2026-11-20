import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const response=await fetch('https://www.formula1.com/en/teams',{signal:AbortSignal.timeout(20000)});
if(!response.ok)throw new Error('No se pudo verificar la lista oficial.');
const html=await response.text();
const slugs={mercedes:'mercedes',ferrari:'ferrari','red-bull':'redbullracing',mclaren:'mclaren','racing-bulls':'racingbulls',alpine:'alpine',haas:'haasf1team',audi:'audi',williams:'williams','aston-martin':'astonmartin',cadillac:'cadillac'};
const directory=new URL('../public/escuderias/2026/',import.meta.url);
await mkdir(directory,{recursive:true});
const assets=[];
for(const[id,slug]of Object.entries(slugs)){
  const suffix=`/common/f1/2026/${slug}/2026${slug}logowhite.webp`;
  const found=[...html.matchAll(/https:[^\s"<>\\]+/g)].map(x=>x[0]).find(url=>url.endsWith(suffix));
  if(!found || new URL(found).hostname!=='media.formula1.com')throw new Error(`No se encontró el logo oficial de ${id}.`);
  const url=found.replace('c_lfill,w_48/','c_fit,w_160,h_100/');
  const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(18000)});
  if(!r.ok)throw new Error(`Logo no disponible: ${id}`);
  const buffer=Buffer.from(await r.arrayBuffer());
  if(buffer.length>1_000_000)throw new Error('Imagen demasiado grande.');
  const output=await sharp(buffer).resize({width:160,height:100,fit:'inside',withoutEnlargement:true}).webp({quality:90}).toBuffer();
  const path=new URL(`${id}.webp`,directory);
  let old;try{old=await readFile(path);}catch{}
  if(!old?.equals(output))await writeFile(path,output);
  assets.push({id,year:2026,path:`/escuderias/2026/${id}.webp`,sourceUrl:url});
}
await writeFile(new URL('../data/media/team-logos.json',import.meta.url),JSON.stringify({source:'https://www.formula1.com/en/teams',assets}));
console.log(`${assets.length} logos oficiales guardados localmente; variantes blancas sobre fondo oscuro.`);
