// Generates a soft, gentle acoustic audio chime blob using Web Audio API
export async function createWelcomeAudioBlob(): Promise<Blob> {
  const sampleRate = 44100;
  const duration = 2.5; // 2.5 seconds
  const numSamples = sampleRate * duration;
  
  // Create an offline audio context to render the chime
  const offlineCtx = new OfflineAudioContext(1, numSamples, sampleRate);

  // Play a gentle major chord chime: C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77)
  const freqs = [523.25, 659.25, 783.99, 987.77];
  const startTimes = [0, 0.25, 0.5, 0.75];

  freqs.forEach((freq, idx) => {
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, offlineCtx.currentTime);
    
    const startTime = startTimes[idx];
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.18, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.6);
    
    osc.connect(gain);
    gain.connect(offlineCtx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + 1.8);
  });

  const renderedBuffer = await offlineCtx.startRendering();
  
  // Convert AudioBuffer to WAV Blob
  return bufferToWave(renderedBuffer, numSamples);
}

function bufferToWave(abuffer: AudioBuffer, totalSamples: number): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = totalSamples * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample: number;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // format chunk identifier
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit

  // data chunk identifier
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

