# Interfaz de consulta de pista

La prioridad es encontrar una categoría, una sesión y un piloto con pocos controles. La identidad proviene de las grillas de resultados, el número del auto y las caras de los pilotos. El color de una escudería acompaña su nombre y nunca reemplaza el texto.

## Sistema visual

- Asfalto `#0b1018`: fondo.
- Boxes `#162233`: superficies de lectura.
- Texto `#f4f7fb`: contenido principal.
- Acero `#bdcadb`: contenido secundario legible.
- Celeste `#a4e2ff`: acción principal con texto oscuro.
- Borde `#657b94`: controles distinguibles de la superficie.

Barlow Condensed para títulos de categoría y nombres destacados, sistema nativo para lectura y controles, monoespaciada para tiempos y puntos. Cuerpo de 16 px y controles de al menos 44 px. Foco visible y estados seleccionados expresados con texto, borde y `aria-current`.

La navegación de consulta se alinea a la izquierda. La ficha de temporada separa calendario, posiciones, pilotos y escuderías, y campeones. En móvil se conserva una barra inferior y las tablas desplazan su contenido dentro de la región, manteniendo visible al piloto.

```text
Categorías
Temporada / alcance de los datos
Fuente / última publicación / consulta automática
Calendario | Posiciones | Pilotos y escuderías | Campeones

Escudería              Motor / chasis / puntos
Piloto con foto        Piloto con foto
```

Se revisó el diseño contra la consigna: se conservan el fondo oscuro y las tablas livianas ya elegidos por el usuario. Se evita sumar controles duplicados, efectos decorativos y colores de equipo de bajo contraste para texto o botones.

## Datos visibles

La v1.1.0 agrega un tema claro de fondo `#f1f5fa`, superficie blanca, texto `#172638`, secundario `#40546c` y acción `#155b8a`. Mantiene oscuro por defecto y la elección local se aplica en el head antes de la interfaz. Los logos blancos oficiales llevan fondo oscuro en ambos temas. La tabla de fechas destaca la actual/próxima y ordena el resto en sentido descendente.

Los gráficos de telemetría usan SVG liviano y comparan tiempo transcurrido: línea continua para la vuelta principal y punteada para la comparación. La selección no consulta al proveedor hasta pulsar la acción; valores ausentes interrumpen el trazo y permanecen como faltantes en la tabla. Wake Lock se solicita para la página de fecha y se libera al ocultar o abandonar esa vista.

## Portada y centros de categoría · v1.1.0

Se conserva el sistema asfalto `#0b1018`, boxes `#162233`, texto `#f4f7fb`, acero `#bdcadb`, celeste `#a4e2ff` y borde `#7a91ac`. Barlow Condensed identifica titulares; sistema nativo para noticias y controles. Todo alineado a la izquierda.

La Home abre con accesos claros a F1, TC y TN y reúne actividad, noticias y videos. Cada categoría abre con su identidad y accesos a calendario, posiciones e historia; los contenidos siguientes pertenecen solo a esa competencia. Los videos usan una portada tipográfica con logo local, tipo de sesión y botón de carga, evitando imágenes externas y peso de reproductores antes de la interacción.

```text
Inicio | F1 | TC | TN
Actualidad de pista / Identidad de la categoría
Entradas a categorías / Accesos de temporada
Noticias propias breves + fuente
Resúmenes oficiales, reproductor bajo demanda
Agenda del fin de semana | Campeonatos
```

Revisión contra la consigna: se mantienen las tablas y el modo oscuro liviano. Se distinguen portada general y centros sin duplicar páginas completas de archivo. Se usan acentos de categoría como orientación, texto explícito para cada acción y ningún carrusel o reproducción automática.

La hora de consulta y la hora de publicación son distintas. Una consulta sin cambios no renueva la antigüedad del resultado. Los errores conservan los resultados publicados y se muestran como una demora de la fuente. La web no afirma un estado “en vivo” a partir del horario previsto.
