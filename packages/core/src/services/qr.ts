/** How much of the symbol may be lost and still be read: about 7, 15, 25 and 30 in a hundred. */
export type QrCorrection = "L" | "M" | "Q" | "H"

export interface QrSymbol {
  /** How many modules a side has. */
  readonly size: number
  /** Whether the module at a column and a row is dark. */
  dark(x: number, y: number): boolean
}

// Per correction level, then per version (1 to 40): error-correction codewords in each block,
// and how many blocks there are. The standard's table 9.
const PER_BLOCK: Record<QrCorrection, number[]> = {
  L: [
    7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30,
    26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  M: [
    10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
  Q: [
    13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30,
    30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  H: [
    17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
}
const BLOCKS: Record<QrCorrection, number[]> = {
  L: [
    1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15,
    16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
  ],
  M: [
    1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25,
    26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
  Q: [
    1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34,
    35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
  H: [
    1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37,
    40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
  ],
}
// The two bits a format word carries for each level.
const FORMAT: Record<QrCorrection, number> = { L: 1, M: 0, Q: 3, H: 2 }

/** Modules that carry data or correction in a version: all but the function patterns. */
function rawModules(version: number): number {
  let result = (16 * version + 128) * version + 64
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2
    result -= (25 * align - 10) * align - 55
    if (version >= 7) result -= 36
  }
  return result
}

function dataCodewords(version: number, level: QrCorrection): number {
  return (
    Math.floor(rawModules(version) / 8) -
    PER_BLOCK[level][version - 1]! * BLOCKS[level][version - 1]!
  )
}

// Arithmetic in the field of 256 the standard corrects in.
function multiply(x: number, y: number): number {
  let z = 0
  for (let bit = 7; bit >= 0; bit--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> bit) & 1) * x
  }
  return z
}

function divisor(degree: number): number[] {
  const result = Array.from<number>({ length: degree }).fill(0)
  result[degree - 1] = 1
  let root = 1
  for (let n = 0; n < degree; n++) {
    for (let at = 0; at < degree; at++) {
      result[at] = multiply(result[at]!, root)
      if (at + 1 < degree) result[at] = result[at]! ^ result[at + 1]!
    }
    root = multiply(root, 2)
  }
  return result
}

function remainder(data: readonly number[], by: readonly number[]): number[] {
  const result = by.map(() => 0)
  for (const byte of data) {
    const factor = byte ^ result.shift()!
    result.push(0)
    by.forEach((coefficient, at) => (result[at] = result[at]! ^ multiply(coefficient, factor)))
  }
  return result
}

/** Where a version's alignment patterns are centred, along either axis. */
function alignment(version: number): number[] {
  if (version === 1) return []
  const count = Math.floor(version / 7) + 2
  const size = version * 4 + 17
  const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2
  const result = [6]
  for (let at = size - 7; result.length < count; at -= step) result.splice(1, 0, at)
  return result
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

/**
 * A QR code for a text, as its modules. The text is written as UTF-8 bytes, in the smallest
 * version that holds it at the correction asked for, with the mask the standard's own scoring
 * prefers. Nothing is drawn here: a part turns the modules into one path.
 *
 * Throws when the text is longer than the largest symbol holds (2,953 bytes at `L`).
 */
export function qr(text: string, level: QrCorrection = "M"): QrSymbol {
  const bytes = [...new TextEncoder().encode(text)]
  let version = 1
  for (; ; version++) {
    if (version > 40) throw new RangeError("The text is too long for a QR code")
    const room = dataCodewords(version, level) * 8
    if (4 + (version < 10 ? 8 : 16) + bytes.length * 8 <= room) break
  }
  const size = version * 4 + 17

  // The data: its mode, its length, its bytes, then padding to the version's room.
  const bits: number[] = []
  const append = (value: number, length: number) => {
    for (let bit = length - 1; bit >= 0; bit--) bits.push((value >>> bit) & 1)
  }
  append(4, 4)
  append(bytes.length, version < 10 ? 8 : 16)
  for (const byte of bytes) append(byte, 8)
  const room = dataCodewords(version, level) * 8
  append(0, Math.min(4, room - bits.length))
  append(0, (8 - (bits.length % 8)) % 8)
  for (let pad = 0xec; bits.length < room; pad ^= 0xec ^ 0x11) append(pad, 8)
  const data: number[] = []
  for (let at = 0; at < bits.length; at += 8) {
    let byte = 0
    for (let bit = 0; bit < 8; bit++) byte = (byte << 1) | bits[at + bit]!
    data.push(byte)
  }

  // In blocks, each with its correction, then interleaved.
  const blocks = BLOCKS[level][version - 1]!
  const correction = PER_BLOCK[level][version - 1]!
  const raw = Math.floor(rawModules(version) / 8)
  const short = blocks - (raw % blocks)
  const length = Math.floor(raw / blocks)
  const generator = divisor(correction)
  const parts: number[][] = []
  for (let block = 0, at = 0; block < blocks; block++) {
    const own = data.slice(at, at + length - correction + (block < short ? 0 : 1))
    at += own.length
    const check = remainder(own, generator)
    // A short block has one data codeword fewer: a place is kept for it, and passed over.
    if (block < short) own.push(-1)
    parts.push([...own, ...check])
  }
  const codewords: number[] = []
  for (let at = 0; at < parts[0]!.length; at++) {
    for (const part of parts) if (part[at] !== -1) codewords.push(part[at]!)
  }

  const modules = Array.from({ length: size }, () =>
    Array.from<boolean>({ length: size }).fill(false)
  )
  const taken = Array.from({ length: size }, () =>
    Array.from<boolean>({ length: size }).fill(false)
  )
  const set = (x: number, y: number, dark: boolean) => {
    modules[y]![x] = dark
    taken[y]![x] = true
  }

  function format(mask: number) {
    const word = (FORMAT[level] << 3) | mask
    let rest = word
    for (let n = 0; n < 10; n++) rest = (rest << 1) ^ ((rest >>> 9) * 0x537)
    const all = ((word << 10) | rest) ^ 0x5412
    const bit = (n: number) => ((all >>> n) & 1) !== 0
    for (let n = 0; n <= 5; n++) set(8, n, bit(n))
    set(8, 7, bit(6))
    set(8, 8, bit(7))
    set(7, 8, bit(8))
    for (let n = 9; n < 15; n++) set(14 - n, 8, bit(n))
    for (let n = 0; n < 8; n++) set(size - 1 - n, 8, bit(n))
    for (let n = 8; n < 15; n++) set(8, size - 15 + n, bit(n))
    set(8, size - 8, true)
  }

  // The patterns a reader finds the symbol by.
  for (let at = 0; at < size; at++) {
    set(6, at, at % 2 === 0)
    set(at, 6, at % 2 === 0)
  }
  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy))
        const x = cx + dx
        const y = cy + dy
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, distance !== 2 && distance !== 4)
      }
    }
  }
  finder(3, 3)
  finder(size - 4, 3)
  finder(3, size - 4)
  const centres = alignment(version)
  centres.forEach((cx, a) =>
    centres.forEach((cy, b) => {
      const last = centres.length - 1
      // Not where a finder is.
      if ((a === 0 && b === 0) || (a === 0 && b === last) || (a === last && b === 0)) return
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
        }
      }
    })
  )
  format(0)
  if (version >= 7) {
    let rest = version
    for (let n = 0; n < 12; n++) rest = (rest << 1) ^ ((rest >>> 11) * 0x1f25)
    const all = (version << 12) | rest
    for (let n = 0; n < 18; n++) {
      const dark = ((all >>> n) & 1) !== 0
      const a = size - 11 + (n % 3)
      const b = Math.floor(n / 3)
      set(a, b, dark)
      set(b, a, dark)
    }
  }

  // The codewords, in the zigzag from the bottom right corner.
  let written = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vertical = 0; vertical < size; vertical++) {
      for (let column = 0; column < 2; column++) {
        const x = right - column
        const upward = ((right + 1) & 2) === 0
        const y = upward ? size - 1 - vertical : vertical
        if (!taken[y]![x] && written < codewords.length * 8) {
          modules[y]![x] = ((codewords[written >>> 3]! >>> (7 - (written & 7))) & 1) !== 0
          written++
        }
      }
    }
  }

  const apply = (mask: number) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!taken[y]![x] && MASKS[mask]!(x, y)) modules[y]![x] = !modules[y]![x]
      }
    }
  }

  /** The standard's score for how hard a symbol is to read: lower is better. */
  function penalty(): number {
    let result = 0
    const history = [0, 0, 0, 0, 0, 0, 0]
    const count = () => {
      const n = history[1]!
      const core =
        n > 0 && history[2] === n && history[3] === n * 3 && history[4] === n && history[5] === n
      return (
        (core && history[0]! >= n * 4 && history[6]! >= n ? 1 : 0) +
        (core && history[6]! >= n * 4 && history[0]! >= n ? 1 : 0)
      )
    }
    const add = (run: number) => {
      if (history[0] === 0) run += size
      history.pop()
      history.unshift(run)
    }
    const end = (dark: boolean, run: number) => {
      if (dark) {
        add(run)
        run = 0
      }
      run += size
      add(run)
      return count()
    }
    const line = (at: (n: number) => boolean) => {
      let dark = false
      let run = 0
      history.fill(0)
      for (let n = 0; n < size; n++) {
        if (at(n) === dark) {
          run++
          if (run === 5) result += 3
          else if (run > 5) result++
        } else {
          add(run)
          if (!dark) result += count() * 40
          dark = at(n)
          run = 1
        }
      }
      result += end(dark, run) * 40
    }
    for (let y = 0; y < size; y++) line((x) => modules[y]![x]!)
    for (let x = 0; x < size; x++) line((y) => modules[y]![x]!)
    let darks = 0
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dark = modules[y]![x]!
        if (dark) darks++
        if (
          x + 1 < size &&
          y + 1 < size &&
          dark === modules[y]![x + 1] &&
          dark === modules[y + 1]![x] &&
          dark === modules[y + 1]![x + 1]
        )
          result += 3
      }
    }
    const total = size * size
    result += (Math.ceil(Math.abs(darks * 20 - total * 10) / total) - 1) * 10
    return result
  }

  let best = 0
  let least = Infinity
  for (let mask = 0; mask < 8; mask++) {
    apply(mask)
    format(mask)
    const score = penalty()
    if (score < least) {
      least = score
      best = mask
    }
    // The same mask again takes it off.
    apply(mask)
  }
  apply(best)
  format(best)

  return { size, dark: (x, y) => modules[y]?.[x] === true }
}

/** The dark modules as one path, each a unit square, rows joined into runs. */
export function qrPath(symbol: QrSymbol): string {
  let path = ""
  for (let y = 0; y < symbol.size; y++) {
    for (let x = 0; x < symbol.size; x++) {
      if (!symbol.dark(x, y)) continue
      let run = 1
      while (symbol.dark(x + run, y)) run++
      path += `M${x} ${y}h${run}v1h-${run}z`
      x += run
    }
  }
  return path
}
