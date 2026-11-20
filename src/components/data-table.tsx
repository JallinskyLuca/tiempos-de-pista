'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ArchiveTable, F1Entities } from '@/lib/archive';
import { DriverAvatar } from './driver-avatar';
import { TeamLogo } from './team-logo';

const normalize = (value: string | number) => String(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function DataTable({ table, id, embedded = false, f1, year }: { table: ArchiveTable; id?: string; embedded?: boolean; f1?: F1Entities; year?: string }) {
  const [filter, setFilter] = useState('');
  const [order, setOrder] = useState<{ index: number; descending: boolean } | null>(null);
  const rows = table.rows.map((cells, index) => ({ cells, entity: table.rowEntities?.[index] })).filter(({ cells }) => !filter || cells.some((cell) => normalize(cell).includes(normalize(filter))));
  if (order) rows.sort((a, b) => {
    const left = a.cells[order.index];
    const right = b.cells[order.index];
    const numeric = /^(puntos|pts\.?|vueltas|vtas|victorias|podios|títulos)$/i.test(table.columns[order.index]);
    const result = numeric && left !== '' && right !== '' && Number.isFinite(Number(left)) && Number.isFinite(Number(right))
      ? Number(left) - Number(right)
      : String(left).localeCompare(String(right), 'es', { numeric: true });
    return order.descending ? -result : result;
  });
  const identity = table.columns.findIndex((column) => /^(piloto|nombre|campeón|equipo)$/i.test(column));

  return (
    <section className={embedded ? 'archive-table embedded-table' : 'panel archive-table'} id={id}>
      {!embedded ? (
        <>
          <div className="section-heading">
            <h2>{table.name}{table.group ? <small>{table.group}</small> : null}</h2>
            <span className="section-meta">{table.rows.length} registros</span>
          </div>
          <label className="table-filter">Filtrar tabla
            <input type="search" name="filtrar-tabla" autoComplete="off" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Ej.: piloto, equipo o número…" maxLength={80} />
            <span role="status">{rows.length} de {table.rows.length}</span>
          </label>
        </>
      ) : null}
      <div className="table-scroll" tabIndex={0} role="region" aria-label={table.group ? `${table.name}, ${table.group}` : table.name}>
        <table aria-label={table.name}>
          <thead><tr>{table.columns.map((column, index) => (
            <th key={index} scope="col" aria-sort={order?.index === index ? order.descending ? 'descending' : 'ascending' : undefined}>
              {embedded ? column : <button type="button" title={`Ordenar por ${column}`} onClick={() => setOrder({ index, descending: order?.index === index && !order.descending })}>{column}<span aria-hidden="true">{order?.index === index ? order.descending ? ' ↓' : ' ↑' : ' ↕'}</span></button>}
            </th>
          ))}</tr></thead>
          <tbody>
            {rows.map(({ cells: row, entity }, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, index) => {
                  const numeric = /^(pos|p$|n[.°ºr]|tiempo|dif|puntos|vueltas|vtas|[qs]q?\d|\d{2}\/)/i.test(table.columns[index]);
                  const driver = table.columns[index] === 'Piloto' ? f1?.drivers.find((driver) => driver.id === entity?.driverId) : null;
                  const team = table.columns[index] === 'Equipo' ? f1?.teams.find((team) => team.id === entity?.constructorId) : null;
                  const content = driver && year ? <Link className="table-person" href={`/f1/${year}/piloto/${driver.id}`}><DriverAvatar name={driver.name} photo={driver.photo} /><span>{cell}</span></Link> : team && year ? <Link className="table-team" href={`/f1/${year}/escuderia/${team.id}`}><TeamLogo id={team.id} year={year}/><span className="team-dot" aria-hidden="true" style={{ backgroundColor: team.color }} />{cell}</Link> : cell === '' ? '—' : cell;
                  return index === identity
                    ? <th className="driver-cell" key={index} scope="row">{content}</th>
                    : <td key={index} className={numeric ? 'numeric' : undefined}>{content}</td>;
                })}
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={table.columns.length}>No hay coincidencias.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
