import { expect, it } from 'vitest';
import { buildF1Entities } from '../scripts/f1-entities.mjs';

const fixture = () => ({ year: 2026, drivers: [{ id: 'a', name: 'Piloto A', firstName: 'Piloto', lastName: 'A', abbreviation: 'PIL', permanentNumber: 4, nationalityCountryId: 'argentina' }], constructors: [{ id: 'uno', name: 'Equipo Uno' }, { id: 'dos', name: 'Equipo Dos' }], countries: [{ id: 'argentina', name: 'Argentina', alpha2Code: 'AR' }], engineManufacturers: [{ id: 'motor', name: 'Motor A' }], chassis: [{ id: 'auto', name: 'Chasis A' }], entrantDrivers: [{ year: 2026, driverId: 'a', constructorId: 'uno' }, { year: 2026, driverId: 'a', constructorId: 'dos' }], entrantConstructors: [{ year: 2026, constructorId: 'uno', engineManufacturerId: 'motor' }], entrantChassis: [{ year: 2026, constructorId: 'uno', chassisId: 'auto' }], driverStandings: [{ year: 2026, driverId: 'a', points: 25, positionNumber: 1 }], constructorStandings: [], media: { year: 2025, drivers: [{ id: 'a', photo: '/otra-temporada.webp' }] }, raceResults: [{ year: 2026, round: 1, driverId: 'a', driverNumber: '1' }] });

it('conserva un cambio de escudería y usa el número de la temporada, sin asignar un retrato de otro año', () => {
  const entities = buildF1Entities(fixture());
  expect(entities.drivers[0]).toMatchObject({ teams: ['uno', 'dos'], photo: null, number: 1, nationality: 'Argentina', points: 25 });
  expect(entities.teams[0]).toMatchObject({ engines: ['Motor A'], chassis: ['Chasis A'], drivers: ['a'] });
});
it('rechaza una identidad de piloto desconocida', () => {
  const data = fixture();
  data.drivers = [];
  expect(() => buildF1Entities(data)).toThrow('Piloto desconocido');
});
