# Let It Go

*A quiet space to release what weighs on you.*

**Let It Go** is an interactive meditation website I built for a class assignment. It takes you from tension to calm through a short reflection, guided breathing, and a moment to let the words go.

## Try it

[Open the live site](https://evelynyan-222.github.io/let-it-go-meditation/)

Download or clone the repository, then open `index.html` in a modern browser. Keep `index.html`, `style.css`, and `app.js` in the same folder. There are no dependencies or build steps.

1. Click **Begin**, write down something that’s weighing on you, and choose how you feel.
2. Watch the sphere respond to your emotion. You can also turn on soft rain, ocean sounds, or soft tones.
3. Follow the sphere as it expands for **5 seconds** and contracts for **7 seconds**.
4. Click **Let It Go** whenever you’re ready. Your words fade as the background lightens.

Your reflection stays in the browser tab and is cleared when you release it.

## How it works

- **`index.html`** defines the screens and inputs, including the reflection text area, emotion radio buttons, and ambient sound dropdown.
- **`style.css`** uses gradients, animations, and transitions to change the sphere’s color, shape, and motion.
- **`app.js`** listens for typing, selections, form submissions, and button clicks. It tracks the current stage and uses conditional logic to validate the reflection and switch between breathing cues.

The emotion and the stage work together to shape what you see. For example, choosing **Frustrated** gives the sphere a reddish-purple pulse. Starting the breathing exercise gradually softens that color and steadies the movement as the sphere settles into the breathing rhythm. The text you entered then becomes the words you see fade on the release screen.
