# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción                        |
| --------- | ----------------------------- |
| `←` `→`   | Rotar nave                    |
| `↑`       | Propulsar                     |
| `Espacio` | Disparar / Confirmar en menú  |
| `↑` `↓`   | Navegar selección de skin     |
| `Enter`   | Confirmar selección de skin   |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up **Velocidad**: duplica el empuje de la nave durante 5 segundos
- Power-up **Triple disparo**: la nave dispara 3 balas en fila india durante 5 segundos
- Power-up **Escudo**: anillo protector que destruye asteroides al contactar la nave durante 6 segundos
- **Skins de nave**: menú de selección con 5 apariencias, persistencia en `localStorage`

## Power-ups

Al destruir un asteroide grande existe una probabilidad del 18% de que suelte
un power-up recolectable. El tipo se elige al azar entre los disponibles. El
item flota en el espacio y expira a los 8 segundos si no se recoge (parpadea
en el último segundo).

| Power-up        | Efecto                                                                  | Duración |
| --------------- | ----------------------------------------------------------------------- | -------- |
| Velocidad       | Duplica la aceleración de la nave (propulsión cian)                     | 5 s      |
| Triple disparo  | Dispara 3 balas en fila india por cada disparo (icono amarillo)         | 5 s      |
| Escudo          | Anillo protector que destruye asteroides/estrellas al contactar la nave, sin sumar puntos. Cada impacto consume 1 s de duración. | 6 s |

Los efectos pueden estar activos a la vez. El efecto activo se pierde si la
nave es destruida. Los items en pantalla se limpian al completar un nivel.

El escudo se dibuja como un anillo celeste alrededor de la nave y destruye los
asteroides y estrellas fugaces que tocan su perímetro, sin otorgar puntos. Cada
impacto consume 1 segundo de duración; al agotarse el escudo desaparece.

## Skins

Al abrir el juego aparece un menú de selección de nave con cinco apariencias
que varían el color de la silueta y de la llama del propulsor (incluido el
efecto del power-up Velocidad). La última skin elegida se guarda en el
navegador y vuelve a estar seleccionada al recargar la página.

| Skin      | Color de línea | Llama normal  | Llama con Velocidad |
| --------- | -------------- | ------------ | ------------------- |
| Clásica   | Blanco         | Naranja      | Cian                |
| Carmesí   | Rojo           | Ámbar        | Blanco              |
| Brasa     | Naranja        | Rojo         | Dorado              |
| Tóxica    | Lima           | Verde        | Cian                |
| Plasma    | Magenta        | Violeta     | Azul                |

Para cambiar de skin durante la partida, tras el Game Over se vuelve al menú
presionando `Espacio`.
