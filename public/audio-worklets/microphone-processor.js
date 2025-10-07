// This AudioWorklet mirrors the low-latency buffer dispatch pattern used by
// TarteelAI's `react-native-microphone-stream` module. It accumulates PCM frames
// inside the audio rendering thread, then posts transferable chunks back to the
// main UI thread so we can forward them to live tajweed inference services with
// minimal delay.

class MicrophoneWorkletProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    const processorOptions = options?.processorOptions ?? {}
    this.bufferSize = Math.max(128, Number(processorOptions.bufferSize) || 1024)
    this.channelIndex = Number(processorOptions.channelIndex) || 0
    this.frameBuffer = new Float32Array(this.bufferSize)
    this.offset = 0

    this.port.onmessage = (event) => {
      if (!event?.data) {
        return
      }
      if (event.data.type === "flush") {
        this.flush(event.data.force)
      }
    }
  }

  flush(force = false) {
    if (this.offset === 0 && !force) {
      this.port.postMessage({ type: "flush-complete" })
      return
    }

    const length = force ? this.frameBuffer.length : this.offset
    if (length === 0) {
      this.port.postMessage({ type: "flush-complete" })
      return
    }

    const payload = new Float32Array(length)
    payload.set(this.frameBuffer.subarray(0, length))

    this.port.postMessage(
      {
        type: "audio",
        frame: payload,
        timestamp: currentTime,
        partial: length !== this.frameBuffer.length,
      },
      [payload.buffer],
    )

    this.frameBuffer = new Float32Array(this.bufferSize)
    this.offset = 0
    this.port.postMessage({ type: "flush-complete" })
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || input.length === 0) {
      return true
    }

    const channel = input[this.channelIndex] ?? input[0]
    if (!channel) {
      return true
    }

    let index = 0
    while (index < channel.length) {
      const remaining = this.bufferSize - this.offset
      const copyLength = Math.min(remaining, channel.length - index)
      this.frameBuffer.set(channel.subarray(index, index + copyLength), this.offset)
      this.offset += copyLength
      index += copyLength

      if (this.offset >= this.bufferSize) {
        const frame = this.frameBuffer
        this.port.postMessage(
          {
            type: "audio",
            frame,
            timestamp: currentTime,
            partial: false,
          },
          [frame.buffer],
        )
        this.frameBuffer = new Float32Array(this.bufferSize)
        this.offset = 0
      }
    }

    return true
  }
}

registerProcessor("microphone-worklet", MicrophoneWorkletProcessor)
