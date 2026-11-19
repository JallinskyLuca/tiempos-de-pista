import { expect, it } from 'vitest';
import { importOptions } from '../scripts/import-options.mjs';

it('elige año y corte argentinos cuando UTC ya está en el año siguiente', () => {
  expect(importOptions(['tc', '--current'], new Date('2027-01-01T01:00:00Z'))).toMatchObject({ year: 2026, through: '2026-12-31', onlyCurrent: true });
});

it('admite una importación explícita y rechaza fechas imposibles u opciones desconocidas', () => {
  expect(importOptions(['tn', '--year', '2025', '--through', '2025-11-30', '--refresh'])).toMatchObject({ year: 2025, through: '2025-11-30', refresh: true });
  expect(() => importOptions(['tc', '--through', '2026-02-30'])).toThrow('Fecha de corte inválida');
  expect(() => importOptions(['tc', '--other'])).toThrow('Opción desconocida');
});
