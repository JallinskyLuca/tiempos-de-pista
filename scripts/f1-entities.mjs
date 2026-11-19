export function buildF1Entities({ year, drivers, constructors, countries, engineManufacturers, chassis, entrantDrivers, entrantConstructors, entrantChassis, driverStandings, constructorStandings, media, raceResults = [] }) {
  const byId = (rows) => new Map(rows.map((row) => [row.id, row]));
  const people = byId(drivers), teams = byId(constructors), nations = byId(countries), engines = byId(engineManufacturers), cars = byId(chassis);
  const entries = entrantDrivers.filter((entry) => entry.year === year && !entry.testDriver);
  const lastNumbers = new Map(raceResults.filter((row) => row.year === year).toSorted((a, b) => a.round - b.round).map((row) => [row.driverId, row.driverNumber]));
  const standings = new Map(driverStandings.filter((row) => row.year === year).map((row) => [row.driverId, row]));
  const teamPoints = new Map(constructorStandings.filter((row) => row.year === year).map((row) => [row.constructorId, row]));
  const driverIds = new Set([...entries.map((entry) => entry.driverId), ...standings.keys()]);
  const teamIds = new Set([...entrantConstructors.filter((entry) => entry.year === year).map((entry) => entry.constructorId), ...teamPoints.keys()]);
  return {
    drivers: [...driverIds].map((id) => {
      const driver = people.get(id);
      if (!driver) throw new Error(`Piloto desconocido: ${id}`);
      const standing = standings.get(id);
      const portrait = media?.year === year ? media.drivers.find((row) => row.id === id) : null;
      return { id, name: driver.name, abbreviation: driver.abbreviation, number: lastNumbers.has(id) ? Number(lastNumbers.get(id)) : null, nationality: nations.get(driver.nationalityCountryId)?.name ?? '', countryCode: nations.get(driver.nationalityCountryId)?.alpha2Code ?? '', dateOfBirth: driver.dateOfBirth, teams: [...new Set(entries.filter((entry) => entry.driverId === id).map((entry) => entry.constructorId))], points: standing?.points ?? 0, position: standing?.positionNumber ?? null, photo: portrait?.photo ?? null };
    }).sort((a, b) => (a.position ?? 999) - (b.position ?? 999) || a.name.localeCompare(b.name)),
    teams: [...teamIds].map((id) => {
      const team = teams.get(id);
      if (!team) throw new Error(`Escudería desconocida: ${id}`);
      const standing = teamPoints.get(id);
      const entry = entries.find((entry) => entry.constructorId === id);
      const color = media?.year === year ? media.drivers.find((driver) => driver.id === entry?.driverId)?.color : null;
      return { id, name: team.name, fullName: team.fullName, country: nations.get(team.countryId)?.name ?? '', points: standing?.points ?? 0, position: standing?.positionNumber ?? null, engines: [...new Set(entrantConstructors.filter((entry) => entry.year === year && entry.constructorId === id).map((entry) => engines.get(entry.engineManufacturerId)?.name).filter(Boolean))], chassis: [...new Set(entrantChassis.filter((entry) => entry.year === year && entry.constructorId === id).map((entry) => cars.get(entry.chassisId)?.name).filter(Boolean))], drivers: [...new Set(entries.filter((entry) => entry.constructorId === id).map((entry) => entry.driverId))], color: color && /^[a-f\d]{6}$/i.test(color) ? '#' + color : '#a4e2ff' };
    }).sort((a, b) => (a.position ?? 999) - (b.position ?? 999) || a.name.localeCompare(b.name)),
  };
}
