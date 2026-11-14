/**
 * Verdant Resonance — Dedicated AudioWorklet Hardware Rendering Kernel
 * (`public/verdant-audio-worklet.js`)
 *
 * Executes sample-accurate 128-frame breath-coupled harmonic warmth and RMS envelope
 * measurement on the dedicated browser audio thread (zero main-thread jitter).
 */

class VerdantResonanceWorkletProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'warmthGain', defaultValue: 0.008, minValue: 0.0, maxValue: 0.06, automationRate: 'k-rate' },
      { name: 'concertPitchHz', defaultValue: 261.63, minValue: 110.0, maxValue: 528.0, automationRate: 'k-rate' },
      { name: 'breathPhaseRateHz', defaultValue: 0.125, minValue: 0.04, maxValue: 0.5, automationRate: 'k-rate' },
    ];
  }

  constructor() {
    super();
    this.phaseFundamental = 0.0;
    this.phaseFifth = 0.0;
    this.phaseBreath = 0.0;
    this.quantaProcessed = 0;
    this.port.onmessage = (ev) => {
      if (ev.data && ev.data.type === 'ping-saturation') {
        this.port.postMessage({
          type: 'saturation-ack',
          quantaProcessed: this.quantaProcessed,
          sampleRate,
        });
      }
    };
  }

  process(inputs, outputs, parameters) {
    const out = outputs[0];
    if (!out || out.length === 0) return true;

    const gain = parameters.warmthGain[0] ?? 0.008;
    const f0 = parameters.concertPitchHz[0] ?? 261.63;
    const breathHz = parameters.breathPhaseRateHz[0] ?? 0.125;
    const twoPi = 6.283185307179586;
    const d0 = (twoPi * (f0 * 0.5)) / sampleRate;
    const d5 = (twoPi * (f0 * 0.75)) / sampleRate;
    const dB = (twoPi * breathHz) / sampleRate;

    const ch0 = out[0];
    const ch1 = out.length > 1 ? out[1] : null;
    const in0 = inputs[0] && inputs[0][0] ? inputs[0][0] : null;
    let sumSq = 0.0;

    for (let i = 0; i < ch0.length; i++) {
      const breathMod = 0.62 + 0.38 * Math.sin(this.phaseBreath);
      const subSample =
        (Math.sin(this.phaseFundamental) * 0.72 + Math.sin(this.phaseFifth) * 0.28) *
        gain *
        breathMod;
      const passthrough = in0 ? in0[i] : 0.0;
      const mixed = passthrough + subSample;
      ch0[i] = mixed;
      if (ch1) ch1[i] = mixed;
      sumSq += mixed * mixed;

      this.phaseFundamental += d0;
      if (this.phaseFundamental >= twoPi) this.phaseFundamental -= twoPi;
      this.phaseFifth += d5;
      if (this.phaseFifth >= twoPi) this.phaseFifth -= twoPi;
      this.phaseBreath += dB;
      if (this.phaseBreath >= twoPi) this.phaseBreath -= twoPi;
    }

    this.quantaProcessed += 1;
    if ((this.quantaProcessed & 255) === 0) {
      this.port.postMessage({
        type: 'worklet-telemetry',
        quantaProcessed: this.quantaProcessed,
        rms: Math.sqrt(sumSq / Math.max(1, ch0.length)),
        sampleRate,
      });
    }
    return true;
  }
}

registerProcessor('verdant-resonance-worklet', VerdantResonanceWorkletProcessor);
