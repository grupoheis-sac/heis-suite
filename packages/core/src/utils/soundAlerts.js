let sharedAudioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playTone(freq, startTimeOffset, duration, type = 'sine', volume = 0.22) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTimeOffset);

  gain.gain.setValueAtTime(0.001, ctx.currentTime + startTimeOffset);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + startTimeOffset + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTimeOffset + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startTimeOffset);
  osc.stop(ctx.currentTime + startTimeOffset + duration + 0.02);
}

/**
 * Campana doble tipo cocina ("Ding-Dong" de alta presencia) cuando entra una nueva comanda al KDS
 */
export function playKdsNewOrderSound() {
  try {
    if (localStorage.getItem('heis_sound_muted') === 'true') return;
    playTone(987.77, 0.0, 0.22, 'triangle', 0.28); // B5
    playTone(783.99, 0.20, 0.40, 'triangle', 0.28); // G5
  } catch (_) {}
}

/**
 * Timbre triple ascendente cuando un plato pasa a estado "Listo" (ready)
 */
export function playKdsDishReadySound() {
  try {
    if (localStorage.getItem('heis_sound_muted') === 'true') return;
    playTone(523.25, 0.0, 0.14, 'sine', 0.20); // C5
    playTone(659.25, 0.12, 0.14, 'sine', 0.22); // E5
    playTone(783.99, 0.24, 0.28, 'sine', 0.25); // G5
  } catch (_) {}
}

/**
 * Notificación suave para Check-in / Check-out / Cambio en el Rack Hotelero
 */
export function playRackStatusSound() {
  try {
    if (localStorage.getItem('heis_sound_muted') === 'true') return;
    playTone(587.33, 0.0, 0.15, 'sine', 0.18); // D5
    playTone(880.0, 0.14, 0.25, 'sine', 0.20);  // A5
  } catch (_) {}
}

export default {
  playKdsNewOrderSound,
  playKdsDishReadySound,
  playRackStatusSound,
};
