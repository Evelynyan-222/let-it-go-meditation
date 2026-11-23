"use strict";
const byId = id => document.getElementById(id);
const thought = byId("thought");
const sound = byId("sound");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const inhaleSeconds = 5;
const exhaleSeconds = 7;
const sphere = document.querySelector(".sphere");
const breathTitle = byId("breath-title");

let stage = -1;
let breathFrame;

function show(next) {
  stage = next;
  byId("intro").hidden = true;
  document.querySelector(".content").hidden = false;
  document.querySelector("footer").hidden = next === 1;
  byId("steps").parentElement.hidden = next === 1;
  sphere.style.removeProperty("--breath-scale");
  document.body.dataset.stage = next;
  ["reflect", "breathe", "release"].forEach((id, index) => {
    byId(id).hidden = index !== Math.min(next, 2);
  });
  Array.from(byId("steps").children).forEach((step, index) => {
    if (index === Math.min(next, 2)) step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });
  byId("progress").value = [8, 30, 78, 100][next];
  ["reflect-title", "breath-title", "release-title", "release-title"]
    .map(byId)[next].focus({preventScroll: true});
  if (matchMedia("(max-width: 790px)").matches) {
    byId(["reflect", "breathe", "release", "release"][next]).scrollIntoView({block:"nearest"});
  }
  tuneAudio();
}

byId("enter").addEventListener("click", () => show(0));

function updateCount() {
  byId("count").textContent = thought.value.length + " / 1000";
  thought.setCustomValidity("");
}
thought.addEventListener("input", updateCount);
byId("reflection").addEventListener("change", event => {
  if (event.target.name !== "mood") return;
  document.body.dataset.mood = event.target.value;
  byId("progress").value = 17;
});
byId("reflection").addEventListener("submit", event => {
  event.preventDefault();
  if (!thought.value.trim()) {
    thought.setCustomValidity("Write a few words about what you’re carrying.");
    thought.reportValidity();
    return;
  }
  breathTitle.textContent = "Breathe In";
  show(1);
  const started = performance.now();
  function animateBreath(now) {
    const position = Math.max(0, now - started) / 1000 % (inhaleSeconds + exhaleSeconds);
    const inhaling = position < inhaleSeconds;
    const cue = inhaling ? "Breathe In" : "Breathe Out";
    if (breathTitle.textContent !== cue) breathTitle.textContent = cue;
    const expansion = inhaling ? position / inhaleSeconds : (inhaleSeconds + exhaleSeconds - position) / exhaleSeconds;
    const scale = 1 + .18 * (.5 - .5 * Math.cos(expansion * Math.PI));
    sphere.style.setProperty("--breath-scale", scale);
    breathFrame = requestAnimationFrame(animateBreath);
  }
  breathFrame = requestAnimationFrame(animateBreath);
});

byId("advance").addEventListener("click", () => {
  if (stage !== 1) return;
  cancelAnimationFrame(breathFrame);
  const written = byId("written");
  written.textContent = thought.value.trim();
  thought.value = "";
  show(2);
  if (reduceMotion.matches) {
    finishRelease();
  } else {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      written.classList.add("dissolve");
      setTimeout(finishRelease, 2450);
    }));
  }
});

function finishRelease() {
  byId("written").textContent = "";
  byId("written").hidden = true;
  byId("again").hidden = false;
  byId("release-title").textContent = "A little lighter.";
  byId("release-note").textContent = "Stay here for another breath, or begin again whenever you’re ready.";
  show(3);
}
byId("again").addEventListener("click", () => {
  byId("reflection").reset();
  updateCount();
  delete document.body.dataset.mood;
  byId("written").hidden = false;
  byId("written").classList.remove("dissolve");
  byId("again").hidden = true;
  byId("release-title").textContent = "Let it go.";
  byId("release-note").textContent = "Let the words drift away.";
  show(0);
});

let audio, master, filter, ambience;
function tuneAudio() {
  if (!master) return;
  const now = audio.currentTime;
  master.gain.setTargetAtTime(sound.value === "off" ? 0 : stage >= 2 ? .11 : .19, now, .4);
  if (filter) filter.frequency.setTargetAtTime(sound.value === "ocean" ? (stage >= 2 ? 360 : 600) : (stage >= 2 ? 1400 : 2600), now, .5);
}
sound.addEventListener("change", async () => {
  const choice = sound.value;
  if (choice === "off") return tuneAudio();
  try {
    if (!audio) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      master = audio.createGain();
      master.gain.value = 0;
      master.connect(audio.destination);
    }
    await audio.resume();
    if (sound.value !== choice) return;
    if (ambience) {
      const old = ambience;
      old.gain.gain.setTargetAtTime(0, audio.currentTime, .15);
      setTimeout(() => old.sources.forEach(source => source.stop()), 850);
    }
    const gain = audio.createGain();
    gain.gain.value = 0;
    gain.connect(master);
    gain.gain.setTargetAtTime(choice === "drone" ? .22 : .8, audio.currentTime, .3);
    const sources = [];
    filter = null;
    if (choice === "drone") {
      for (const frequency of [110, 164.81, 220.3]) {
        const voice = audio.createOscillator();
        voice.frequency.value = frequency;
        voice.connect(gain);
        sources.push(voice);
      }
    } else {
      const buffer = audio.createBuffer(1, audio.sampleRate * 12, audio.sampleRate);
      const samples = buffer.getChannelData(0);
      let previous = 0;
      for (let index = 0; index < samples.length; index++) {
        const noise = Math.random() * 2 - 1;
        previous = .97 * previous + .03 * noise;
        const swell = .65 + .32 * Math.cos(index / samples.length * Math.PI * 4);
        samples[index] = choice === "ocean" ? previous * swell * 4 : noise * .55 + previous;
      }
      const noise = audio.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      filter = audio.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = .3;
      noise.connect(filter).connect(gain);
      sources.push(noise);
    }
    sources.forEach(source => source.start());
    ambience = {sources, gain};
    tuneAudio();
  } catch {
    sound.value = "off";
    tuneAudio();
    sound.setCustomValidity("Ambient audio is unavailable in this browser.");
    sound.reportValidity();
    sound.setCustomValidity("");
  }
});
