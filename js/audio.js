var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var bgmTimeout = null;
var audioMuted = false;
var notes = [
  261.63, 329.63, 392.00, 0,      // C, E, G, rest
  440.00, 0,      392.00, 329.63, // A, rest, G, E
  261.63, 329.63, 392.00, 0,      // C, E, G, rest
  523.25, 0,      392.00, 0       // High C, rest, G, rest
]; 
var noteIndex = 0;

function playNextBGMNote() {
  if (gameStatus !== "play") return; // Safety check
  if (audioMuted) {
    // Keep scheduling the note without playing it so the loop doesn't break
    var delay = 250 - (speed - 5) * 3.95;
    delay = Math.max(80, delay);
    bgmTimeout = setTimeout(playNextBGMNote, delay);
    noteIndex = (noteIndex + 1) % notes.length;
    return;
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  var freq = notes[noteIndex];
  
  if (freq > 0) {
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    
    // Sine wave gives a pure, rounded tone like a marimba or steel drum
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    // Percussive envelope
    gain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  }
  
  noteIndex = (noteIndex + 1) % notes.length;

  
  // Calculate delay based on game speed (5 to 48)
  var delay = 250 - (speed - 5) * 3.95;
  delay = Math.max(80, delay);
  
  bgmTimeout = setTimeout(playNextBGMNote, delay);
}

function startBGM() {
  if (bgmTimeout) return;
  noteIndex = 0;
  playNextBGMNote();
}

function stopBGM() {
  clearTimeout(bgmTimeout);
  bgmTimeout = null;
}

function playBonusSound() {
  if (audioMuted) return;
  if (audioCtx.state === 'suspended') {
      audioCtx.resume();
  }
  var oscillator = audioCtx.createOscillator();
  var gainNode = audioCtx.createGain();
  
  // Create a nice cheerful 'ding' sound
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
  oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // Up to A6
  
  gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.1);
}

function playMalusSound() {
  if (audioMuted) return;
  if (audioCtx.state === 'suspended') {
      audioCtx.resume();
  }
  var oscillator = audioCtx.createOscillator();
  var gainNode = audioCtx.createGain();
  
  // Low pitch thud/buzz for hitting obstacle
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(150, audioCtx.currentTime); 
  oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
  
  gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.2);
}

function playGameOverSound() {
  if (audioMuted) return;
  if (audioCtx.state === 'suspended') {
      audioCtx.resume();
  }
  var oscillator = audioCtx.createOscillator();
  var gainNode = audioCtx.createGain();
  
  // Descending crunch/wail for game over
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.8);
  
  gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.8);
}
