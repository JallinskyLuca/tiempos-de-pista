/* La lectura local usa el mismo esquema IndexedDB que la app. */
async function readDownloads() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tiempos-de-pista', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('events', { keyPath: 'key' });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('events', 'readonly');
      const query = transaction.objectStore('events').getAll();
      query.onsuccess = () => resolve(query.result);
      query.onerror = () => reject(query.error);
      transaction.oncomplete = () => db.close();
    };
  });
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = String(text ?? '');
  if (className) node.className = className;
  return node;
}

function showTable(table) {
  const section = element('section', '');
  section.append(element('h2', table.name + (table.group ? ' · ' + table.group : '')));
  const container = element('div', '', 'table-scroll');
  container.tabIndex = 0;
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', table.name);
  const grid = element('table', '');
  const head = element('thead', '');
  const row = element('tr', '');
  table.columns.forEach((label) => { const cell = element('th', label); cell.scope = 'col'; row.append(cell); });
  head.append(row);
  const body = element('tbody', '');
  table.rows.forEach((cells) => {
    const row = element('tr', '');
    cells.forEach((text, index) => {
      const identity = /^(piloto|nombre|equipo)$/i.test(table.columns[index]);
      const cell = element(identity ? 'th' : 'td', text === '' ? '—' : text);
      if (identity) cell.scope = 'row';
      row.append(cell);
    });
    body.append(row);
  });
  grid.append(head, body);
  container.append(grid);
  section.append(container);
  return section;
}

readDownloads().then((saved) => {
  const message = document.getElementById('message');
  const list = document.getElementById('events');
  const article = document.getElementById('event');
  const queryKey = new URL(location.href).searchParams.get('fecha');
  const path = location.pathname.match(/^\/categoria\/(tc|f1|tn)\/archivo\/(\d{4})\/([\w-]+)$/);
  const key = queryKey || (path ? path.slice(1).join(':') : null);
  message.textContent = saved.length ? 'Estas copias reflejan la fecha de descarga. Las actualizaciones requieren conexión.' : 'Todavía no hay fechas descargadas. Con conexión, abrí una fecha y elegí “Guardar sin conexión”.';
  saved.forEach((item) => {
    const link = element('a', item.event.name + ' · ' + item.year);
    link.href = '/offline.html?fecha=' + encodeURIComponent(item.key);
    list.append(link);
  });
  const selected = saved.find((item) => item.key === key);
  if (!selected) {
    if (key) message.textContent = 'Esta fecha no está descargada. Elegí otra copia guardada o volvé cuando tengas conexión.';
    return;
  }
  const date = new Intl.DateTimeFormat('es-AR', { dateStyle:'medium', timeStyle:'short', timeZone:'America/Argentina/Buenos_Aires' }).format(new Date(selected.savedAt));
  article.append(element('h2', selected.event.name), element('p', 'Copia guardada el ' + date, 'offline-meta'));
  const tabs = element('nav', '');
  tabs.setAttribute('aria-label', 'Sesiones');
  const result = element('div', '');
  selected.event.tables.forEach((table, index) => {
    const button = element('button', table.name + (table.group ? ' · ' + table.group : ''));
    button.type = 'button';
    button.setAttribute('aria-pressed', String(index === 0));
    button.onclick = () => {
      tabs.querySelectorAll('button').forEach((item) => item.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      result.replaceChildren(showTable(table));
    };
    tabs.append(button);
  });
  if (selected.event.tables[0]) result.append(showTable(selected.event.tables[0]));
  const schedule = element('div', '');
  if (!selected.event.tables.length && selected.event.winner) result.append(element('p', 'Ganador registrado: ' + selected.event.winner));
  if (selected.event.schedule?.length) {
    schedule.append(showTable({ name:'Cronograma · Hora argentina', columns:['Sesión','Día y hora'], rows:selected.event.schedule.map(([name, time]) => [name, new Intl.DateTimeFormat('es-AR', { dateStyle:'medium', timeStyle:'short', timeZone:'America/Argentina/Buenos_Aires' }).format(new Date(time))]) }));
  }
  const online = element('a', 'Abrir versión actualizada', 'back');
  online.href = '/categoria/' + selected.category + '/archivo/' + selected.year + '/' + selected.event.id;
  article.append(tabs, result, schedule, online);
}).catch(() => {
  document.getElementById('message').textContent = 'El navegador no pudo acceder al archivo local. Intentá de nuevo con el almacenamiento habilitado.';
});
