const normalize = (name) => typeof name === 'string' ? name.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/gi, '').toLowerCase() : '';

export function identifyDriver(drivers, incoming) {
  if (!incoming.name_acronym || !incoming.full_name || !incoming.last_name) return null;
  const sameCode = drivers.filter((driver) => driver.abbreviation === incoming.name_acronym);
  const exact = sameCode.filter((driver) => [driver.name, driver.fullName].some((name) => normalize(name) === normalize(incoming.full_name)));
  if (exact.length) return exact.length === 1 ? exact[0] : null;
  const first = normalize(incoming.first_name);
  const candidates = sameCode.filter((driver) => {
    const knownFirst = normalize(driver.firstName);
    return first.length >= 3 && knownFirst.length >= 3 && (first.startsWith(knownFirst) || knownFirst.startsWith(first)) && normalize(driver.lastName.replace(/\s+Jr\.?$/i, '')) === normalize(incoming.last_name);
  });
  return candidates.length === 1 ? candidates[0] : null;
}
