import type { Championship, Race } from './racing';

export const edition = {
  weekend: '13–15 de noviembre',
  startsOn: '2026-11-13',
  endsOn: '2026-11-15',
  season: 2026,
} as const;

const actcSchedule = 'https://actc.org.ar/tc/noticias/los-horarios-del-tc-para-rio-cuarto';
const saoPauloResults = 'https://www.formula1.com/en/results/2026/races/1299/brazil';
const tnClass2 = 'https://apat.org.ar/resultados/c2/2026-11-01';
const tnClass3 = 'https://apat.org.ar/resultados/c3/2026-11-01';

export const races: Race[] = [
  {
    id: 'tc-rio-cuarto',
    category: 'tc',
    name: 'Río Cuarto',
    venue: 'Parque Ciudad de Río Cuarto, Córdoba',
    round: 14,
    date: '2026-11-15',
    source: actcSchedule,
    sessions: [
      { name: 'Entrenamiento 1', startsAt: '2026-11-14T13:10:00Z' },
      { name: 'Entrenamiento 2', startsAt: '2026-11-14T15:05:00Z' },
      { name: 'Clasificación', startsAt: '2026-11-14T19:03:00Z' },
      { name: 'Serie 1', startsAt: '2026-11-15T13:55:00Z' },
      { name: 'Serie 2', startsAt: '2026-11-15T14:20:00Z' },
      { name: 'Serie 3', startsAt: '2026-11-15T14:45:00Z' },
      { name: 'Final', startsAt: '2026-11-15T17:00:00Z' },
    ],
  },
  {
    id: 'f1-las-vegas',
    category: 'f1',
    name: 'GP de Las Vegas',
    venue: 'Las Vegas Strip Circuit, Estados Unidos',
    round: 21,
    date: '2026-11-22',
    source: 'https://www.formula1.com/en/racing/2026/las-vegas',
    sessions: [
      { name: 'Libres 1', startsAt: '2026-11-20T00:30:00Z' },
      { name: 'Libres 2', startsAt: '2026-11-20T04:00:00Z' },
      { name: 'Libres 3', startsAt: '2026-11-21T00:30:00Z' },
      { name: 'Clasificación', startsAt: '2026-11-21T04:00:00Z' },
      { name: 'Carrera', startsAt: '2026-11-22T04:00:00Z' },
    ],
  },
  {
    id: 'tn-viedma',
    category: 'tn',
    name: 'Viedma',
    venue: 'Autódromo Ciudad de Viedma, Río Negro',
    round: 12,
    date: '2026-11-29',
    source: 'https://apat.org.ar/resultados/historico',
    sessions: [],
  },
  {
    id: 'f1-sao-paulo',
    category: 'f1',
    name: 'GP de São Paulo',
    venue: 'Autódromo José Carlos Pace, Brasil',
    round: 20,
    date: '2026-11-08',
    source: `${saoPauloResults}/race-result`,
    sessions: [
      {
        name: 'Carrera',
        results: [
          ['Lando Norris', 'McLaren', '1:35:23.504'],
          ['Max Verstappen', 'Red Bull Racing', '+14.602 s'],
          ['Isack Hadjar', 'Red Bull Racing', '+24.485 s'],
          ['George Russell', 'Mercedes', '+33.991 s'],
          ['Kimi Antonelli', 'Mercedes', '+41.017 s'],
        ],
      },
      {
        name: 'Clasificación',
        source: `${saoPauloResults}/qualifying`,
        results: [['Lando Norris', 'McLaren', '1:27.470']],
      },
    ],
  },
  {
    id: 'tn-concordia',
    category: 'tn',
    name: 'Concordia',
    venue: 'Autódromo Ciudad de Concordia, Entre Ríos',
    round: 11,
    date: '2026-11-01',
    source: 'https://apat.org.ar/resultados/historico',
    sessions: [
      {
        name: 'Final · Clase 3',
        source: tnClass3,
        results: [
          ['Julián Santero', 'VW Virtus', '35:07.399'],
          ['Bautista Damiani', 'VW Vento GLI', '+0.354 s'],
          ['Thiago Martínez', 'Ford Focus', '+5.899 s'],
          ['Ever Franetovich', 'Ford Focus', '+6.260 s'],
          ['Fabián Yannantuoni', 'Ford Focus', '+8.871 s'],
        ],
      },
      {
        name: 'Final · Clase 2',
        source: tnClass2,
        results: [
          ['Tomás Vitar', 'Nissan March', '26:59.152'],
          ['Gastón Iansa', 'Peugeot 208', '+0.676 s'],
          ['Braian Reinoso', 'Chevrolet Onix', '+7.662 s'],
          ['Martín Leston', 'Peugeot 208', '+12.583 s'],
          ['Santino Balerini', 'Peugeot 208', '+12.840 s'],
        ],
      },
    ],
  },
  {
    id: 'tc-rosario',
    category: 'tc',
    name: 'Rosario',
    venue: 'Autódromo Juan Manuel Fangio, Santa Fe',
    round: 13,
    date: '2026-10-25',
    source: 'https://tiempos.actc.org.ar/resultados/1091/ver',
    sessions: [
      {
        name: 'Final',
        results: [
          ['Mauricio Lambiris', 'Ford Mustang', '43:54.210'],
          ['Matías Rossi', 'Toyota', '+2.287 s'],
          ['Mariano Werner', 'Ford Mustang', '+10.885 s'],
          ['Julián Santero', 'BMW', '+20.898 s'],
          ['Marcos Landa', 'Chevrolet Camaro', '+21.532 s'],
        ],
      },
      {
        name: 'Clasificación',
        source: 'https://tiempos.actc.org.ar/resultados/1071/ver',
        results: [
          ['Mauricio Lambiris', 'Ford Mustang', '1:35.092'],
          ['Matías Rossi', 'Toyota', '+0.192 s'],
          ['Otto Fritzler', 'Mercedes-Benz', '+0.295 s'],
        ],
      },
    ],
  },
];

export const championships: Championship[] = [
  {
    category: 'tc',
    name: 'Turismo Carretera · General',
    source: 'https://tiempos.actc.org.ar/tc/campeonato?year=2026',
    rows: [['Agustín Canapino', 347], ['Otto Fritzler', 339]],
  },
  {
    category: 'f1',
    name: 'Fórmula 1 · Pilotos',
    source: 'https://www.formula1.com/en/results/2026/drivers',
    rows: [['Kimi Antonelli', 390], ['Max Verstappen', 279], ['George Russell', 262]],
  },
  {
    category: 'tn',
    name: 'TN · Clase 3',
    source: 'https://apat.org.ar/campeonato/ranking/c3',
    rows: [['Agustín Canapino', 320], ['Julián Santero', 298], ['Mauricio Lambiris', 249]],
  },
  {
    category: 'tn',
    name: 'TN · Clase 2',
    source: 'https://apat.org.ar/campeonato/ranking/c2',
    rows: [['Tomás Vitar', 316], ['Exequiel Bastidas', 315], ['Francisco Coltrinari', 289]],
  },
];
