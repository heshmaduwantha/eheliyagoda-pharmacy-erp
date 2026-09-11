const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "311123", "311321", "331121", "312113", "312311", "332111", "314111", "221411", "431111", // 50-59
  "111224", "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114", "122411", // 60-69
  "142112", "142211", "241211", "221114", "413111", "241112", "134111", "111242", "121142", "121241", // 70-79
  "114212", "124112", "124211", "411212", "421112", "421211", "212141", "214121", "412121", "111143", // 80-89
  "111341", "131141", "114113", "114311", "411113", "411311", "113141", "114131", "311141", "411131", // 90-99
  "211412", "211214", "211232", "2331112" // 100-103
];

const START_CODE_B = "211412"; // index 104
const STOP_CODE = "2331112";   // index 106

/**
 * Generates an SVG string for a Code 128 barcode (Subset B).
 * Scannable by any 1D barcode scanner.
 */
export function generateCode128Svg(text: string, height = 40, moduleWidth = 2): string {
  if (!text) return "";

  let sequence = START_CODE_B;
  let checksum = 104;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const code = Math.max(0, Math.min(95, charCode - 32));
    sequence += CODE128_PATTERNS[code];
    checksum += code * (i + 1);
  }

  const checksumIndex = checksum % 103;
  sequence += CODE128_PATTERNS[checksumIndex];
  sequence += STOP_CODE;

  // Calculate total width
  let totalUnits = 0;
  for (let i = 0; i < sequence.length; i++) {
    totalUnits += parseInt(sequence[i], 10);
  }

  const quietZone = 10 * moduleWidth;
  const totalWidth = totalUnits * moduleWidth + quietZone * 2;

  let currentX = quietZone;
  let rects = "";

  for (let i = 0; i < sequence.length; i++) {
    const width = parseInt(sequence[i], 10) * moduleWidth;
    const isBar = i % 2 === 0;

    if (isBar) {
      rects += `<rect x="${currentX}" y="0" width="${width}" height="${height}" fill="#000000" />`;
    }
    currentX += width;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" width="${totalWidth}" height="${height}" style="display: block; margin: 0 auto; max-width: 100%; height: auto;">
    <rect width="${totalWidth}" height="${height}" fill="#ffffff" />
    ${rects}
  </svg>`;
}
