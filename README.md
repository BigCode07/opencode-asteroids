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

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

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

## Power-ups

Al destruir un asteroide grande existe una probabilidad del 18% de que suelte un
power-up recolectable. Al caer hay 50% de chance de que sea Velocidad y 50% de
que sea Escudo. El item flota en el espacio y expira a los 8 segundos si no se
recoge (parpadea en el último segundo).

| Power-up  | Efecto                                                 | Duración |
| --------- | ------------------------------------------------------ | -------- |
| Velocidad | Duplica la aceleración de la nave (-propulsión cian)   | 5 s      |
| Escudo    | Anillo protector que destruye asteroides/estrellas al contactar la nave, sin sumar puntos. Cada impacto consume 1 s de duración. | 6 s |

El efecto activo se pierde si la nave es destruida. Los items en pantalla se
limpian al completar un nivel.

El escudo se dibuja como un anillo celeste alrededor de la nave y destruye los
asteroides y estrellas fugaces que tocan su perímetro, sin otorgar puntos. Cada
impacto consume 1 segundo de duración; al agotarse el escudo desaparece.
