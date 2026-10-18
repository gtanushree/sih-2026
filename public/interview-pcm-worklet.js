class InterviewPcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Int16Array(2048);
    this.offset = 0;
    this.port.onmessage = ({ data }) => {
      if (data?.type === "flush") this.flush();
    };
  }

  flush() {
    if (!this.offset) return;
    const output = this.buffer.slice(0, this.offset).buffer;
    this.port.postMessage(output, [output]);
    this.buffer = new Int16Array(2048);
    this.offset = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;
    for (let index = 0; index < channel.length; index += 1) {
      const sample = Math.max(-1, Math.min(1, channel[index]));
      this.buffer[this.offset] = Math.round(sample < 0 ? sample * 32768 : sample * 32767);
      this.offset += 1;
      if (this.offset === this.buffer.length) this.flush();
    }
    return true;
  }
}

registerProcessor("interview-pcm-capture", InterviewPcmCapture);
