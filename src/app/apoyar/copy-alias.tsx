'use client';

import { useState } from 'react';

export function CopyAlias({ alias }: { alias: string }) {
  const [status, setStatus] = useState('');

  async function copy() {
    try {
      await navigator.clipboard.writeText(alias);
      setStatus('Alias copiado');
    } catch {
      setStatus('Podés seleccionar y copiar el alias manualmente.');
    }
  }

  return (
    <>
      <div className="alias-row">
        <code>{alias}</code>
        <button onClick={copy} type="button">Copiar alias</button>
      </div>
      <p className="copy-status" role="status">{status}</p>
    </>
  );
}
