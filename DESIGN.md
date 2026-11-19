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

La hora de consulta y la hora de publicación son distintas. Una consulta sin cambios no renueva la antigüedad del resultado. Los errores conservan los resultados publicados y se muestran como una demora de la fuente. La web no afirma un estado “en vivo” a partir del horario previsto.
