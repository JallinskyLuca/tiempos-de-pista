import type { Metadata } from 'next';
import Link from 'next/link';
import { CoffeeIcon } from '@/components/coffee-icon';
import { CopyAlias } from './copy-alias';

export const metadata: Metadata = { title: 'Apoyá el proyecto' };

export default function SupportPage() {
  return (
    <section className="support-page">
      <Link className="back-link" href="/">‹ Este finde</Link>
      <div className="section-hero support-hero">
        <div><h1>Apoyá Tiempos de Pista</h1><span>Tu aporte ayuda a mantener el archivo y sumar más categorías.</span></div>
        <CoffeeIcon />
      </div>
      <section className="panel support-panel">
        <div className="section-heading"><h2>Alias de Mercado Pago</h2></div>
        <CopyAlias alias="luca.509.rayo.mp" />
      </section>
    </section>
  );
}
