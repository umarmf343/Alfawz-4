export interface EncodeWavOptions {
  targetSampleRate?: number
}

export function mergeFloat32(frames: Float32Array[]): Float32Array {
  const totalLength = frames.reduce((sum, frame) => sum + frame.length, 0)
  const merged = new Float32Array(totalLength)
  let offset = 0
  for (const frame of frames) {
    merged.set(frame, offset)
    offset += frame.length
  }
  return merged
}

export function encodePcmAsWav(
  frames: Float32Array[],
  sourceSampleRate: number,
  options: EncodeWavOptions = {},
): Blob {
  if (!frames.length) {
    throw new Error("No audio frames available for encoding")
  }
  if (!sourceSampleRate) {
    throw new Error("A valid source sample rate is required")
  }

  const merged = mergeFloat32(frames)
  const targetSampleRate = options.targetSampleRate ?? 16000
  const resampled =
    sourceSampleRate === targetSampleRate
      ? merged
      : resampleLinear(merged, sourceSampleRate, targetSampleRate)

  const bytesPerSample = 2
  const bitsPerSample = bytesPerSample * 8
  const blockAlign = bytesPerSample
  const dataLength = resampled.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  writeString(view, 0, "RIFF")
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, "WAVE")
  writeString(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, targetSampleRate, true)
  view.setUint32(28, targetSampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true) // bits per sample (16)
  writeString(view, 36, "data")
  view.setUint32(40, dataLength, true)

  let offset = 44
  for (let i = 0; i < resampled.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, resampled[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += 2
  }

  return new Blob([buffer], { type: "audio/wav" })
}

function resampleLinear(data: Float32Array, sourceRate: number, targetRate: number): Float32Array {
  const ratio = sourceRate / targetRate
  const newLength = Math.round(data.length / ratio)
  const result = new Float32Array(newLength)
  let position = 0
  for (let i = 0; i < newLength; i += 1) {
    const index = Math.floor(position)
    const nextIndex = Math.min(index + 1, data.length - 1)
    const interpolation = position - index
    const sample = data[index]
    const nextSample = data[nextIndex]
    result[i] = sample + (nextSample - sample) * interpolation
    position += ratio
  }
  return result
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}

