export function importOptions(argv, now = new Date()) {
  const args = argv.slice(1);
  const options = { category: argv[0], year: Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric' }).format(now)), through: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now), refresh: false, onlyCurrent: false };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--refresh') options.refresh = true;
    else if (argument === '--current') options.onlyCurrent = true;
    else if (argument === '--recent') options.recent = true;
    else if (argument === '--year') options.year = Number(args[++index]);
    else if (argument === '--through') options.through = args[++index];
    else throw new Error(`Opción desconocida ${argument}`);
  }
  if (!Number.isInteger(options.year) || options.year < 1937 || options.year > 2100) throw new Error('Temporada inválida.');
  if (options.recent && !options.onlyCurrent) throw new Error('--recent requiere --current.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.through) || !Number.isFinite(Date.parse(options.through)) || new Date(options.through).toISOString().slice(0, 10) !== options.through) throw new Error('Fecha de corte inválida.');
  return options;
}
