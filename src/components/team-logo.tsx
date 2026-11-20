import Image from 'next/image';
import assets from '../../data/media/team-logos.json';

export function TeamLogo({id,year}:{id:string;year:string}) {
  const asset=assets.assets.find((asset)=>asset.id===id && String(asset.year)===year);
  return asset?<span className="team-logo"><Image src={asset.path} width={64} height={40} alt="" unoptimized /></span>:null;
}
