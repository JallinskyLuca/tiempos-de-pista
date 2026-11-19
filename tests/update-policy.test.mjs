import { expect, it } from 'vitest';
import { updateWindow } from '../scripts/update-policy.mjs';

const event = { id: '1', date: '2026-11-22', tables: [], schedule: [['Clasificación', '2026-11-21T04:00:00Z'], ['Carrera', '2026-11-22T04:00:00Z']] };
it('activa una sesión en el día argentino correcto, aunque UTC ya sea otro día', () => {
  expect(updateWindow([event], 'f1', new Date('2026-11-21T03:30:00Z'))).toMatchObject({ active: true, reason: 'actividad' });
});
it('no consulta un lunes sin actividad ni resultados pendientes', () => {
  const full = { ...event, tables: [{ name: 'Carrera', columns: [], rows: [] }] };
  expect(updateWindow([full], 'f1', new Date('2026-11-23T15:00:00Z')).active).toBe(false);
});
it('permite recuperar un resultado atrasado durante 48 horas y después corta los reintentos', () => {
  expect(updateWindow([event], 'f1', new Date('2026-11-23T15:00:00Z')).reason).toBe('resultado-pendiente');
  expect(updateWindow([event], 'f1', new Date('2026-11-26T15:00:00Z')).active).toBe(false);
});
it('usa una ventana diurna del fin de semana cuando el proveedor no publica horarios', () => {
  expect(updateWindow([{ ...event, schedule: [] }], 'tc', new Date('2026-11-20T15:00:00Z')).active).toBe(true);
  expect(updateWindow([{ ...event, schedule: [] }], 'tc', new Date('2026-11-20T05:00:00Z')).active).toBe(false);
});
it('TN requiere resultados finales de ambas clases para cerrar los pendientes', () => {
  const partial = { ...event, tables: [{ name: 'Final', group: 'Clase 2' }] };
  expect(updateWindow([partial], 'tn', new Date('2026-11-23T15:00:00Z')).active).toBe(true);
  partial.tables.push({ name: 'Final', group: 'Clase 3' });
  expect(updateWindow([partial], 'tn', new Date('2026-11-23T15:00:00Z')).active).toBe(false);
});
