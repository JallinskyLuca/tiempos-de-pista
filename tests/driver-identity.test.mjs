import { expect, it } from 'vitest';
import { identifyDriver } from '../scripts/driver-identity.mjs';

it('distingue a dos pilotos con el mismo apellido y abreviatura', () => {
  const drivers = [{ id: 'max', name: 'Max Verstappen', firstName: 'Max', lastName: 'Verstappen', abbreviation: 'VER' }, { id: 'jos', name: 'Jos Verstappen', firstName: 'Jos', lastName: 'Verstappen', abbreviation: 'VER' }];
  expect(identifyDriver(drivers, { full_name: 'Max VERSTAPPEN', first_name: 'Max', last_name: 'Verstappen', name_acronym: 'VER' })?.id).toBe('max');
});
it('admite un nombre abreviado solo con apellido y código coincidentes', () => {
  const driver = { id: 'alex', name: 'Alexander Albon', firstName: 'Alexander', lastName: 'Albon', abbreviation: 'ALB' };
  expect(identifyDriver([driver], { full_name: 'Alex ALBON', first_name: 'Alex', last_name: 'Albon', name_acronym: 'ALB' })?.id).toBe('alex');
  expect(identifyDriver([driver], { full_name: 'Otra Persona', first_name: 'Otra', last_name: 'Albon', name_acronym: 'ALB' })).toBe(null);
});
