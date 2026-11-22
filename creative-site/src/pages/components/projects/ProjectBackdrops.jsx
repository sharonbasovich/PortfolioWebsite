import styles from './projectBackdrops.module.scss';

// Illustrative market session. Values are normalized, with each tuple supplying
// open, close, low, high, and relative volume in that order.
const candles = [
  [36, 39, 30, 43, 34], [39, 37, 33, 42, 19], [37, 43, 35, 48, 48],
  [43, 47, 41, 51, 29], [47, 43, 38, 49, 23], [43, 45, 40, 48, 24],
  [45, 48, 43, 52, 37], [48, 53, 46, 57, 44], [53, 50, 47, 55, 32],
  [50, 52, 48, 55, 23], [52, 47, 44, 54, 35], [47, 40, 35, 50, 74],
  [40, 37, 32, 45, 65], [37, 39, 35, 42, 27], [39, 41, 36, 44, 22],
  [41, 45, 38, 47, 40], [45, 42, 38, 48, 29], [42, 46, 40, 49, 31],
  [46, 48, 44, 52, 45], [48, 54, 47, 58, 67], [54, 58, 51, 61, 49],
  [58, 56, 52, 62, 35], [56, 60, 54, 63, 42], [60, 67, 58, 69, 77],
  [67, 71, 64, 73, 72], [71, 68, 65, 74, 46], [68, 74, 66, 77, 59],
  [74, 71, 67, 76, 39], [71, 76, 67, 79, 56], [76, 81, 74, 85, 63],
  [81, 77, 74, 84, 56], [77, 72, 66, 80, 74], [72, 74, 68, 77, 29],
  [74, 70, 63, 76, 35], [70, 75, 67, 78, 58], [75, 72, 69, 80, 45],
  [72, 76, 70, 80, 44], [76, 81, 74, 85, 65], [81, 87, 79, 91, 85],
  [87, 85, 82, 91, 56], [85, 80, 78, 89, 58], [80, 83, 77, 87, 45],
  [83, 88, 80, 92, 64], [88, 91, 85, 95, 74], [91, 87, 84, 95, 50],
];

const marketHours = ['09:30', '11:00', '12:30', '14:00', '16:00'];
const priceTicks = ['+2σ', '+1σ', 'μ', '−1σ', '−2σ'];

export function MarbleBackdrop() {
  return (
    <div className={styles.market} aria-hidden="true" data-project-background="market">
      <div className={styles.chart}>
        <div className={styles.chartCaption}>
          <span>Illustrative OHLC</span>
          <span>Price / volume</span>
        </div>
        <div className={styles.price}>
          {candles.map(([open, close, low, high], index) => (
            <div key={index} className={close < open ? styles.down : styles.up}>
              <i className={styles.wick} style={{ bottom: `${low}%`, height: `${high - low}%` }} />
              <i className={styles.body} style={{ bottom: `${Math.min(open, close)}%`, height: `${Math.abs(close - open)}%` }} />
            </div>
          ))}
          <div className={styles.priceTicks}>
            {priceTicks.map((tick) => <span key={tick}>{tick}</span>)}
          </div>
        </div>
        <div className={styles.volume}>
          {candles.map(([open, close, , , volume], index) => (
            <div key={index} className={close < open ? styles.down : styles.up}>
              <i style={{ height: `${volume}%` }} />
            </div>
          ))}
        </div>
        <div className={styles.time}>
          {marketHours.map((hour) => <span key={hour}>{hour}</span>)}
        </div>
      </div>
    </div>
  );
}

const kernel = [
  '#include <cuda_runtime.h>',
  '',
  '__global__ void advance(float* x,',
  '                        const float* dx, int n) {',
  '    int i = blockIdx.x * blockDim.x + threadIdx.x;',
  '    if (i < n) x[i] += dx[i];',
  '}',
  '',
  'constexpr int threads_per_block = 256;',
  'int blocks = (n + threads_per_block - 1) / threads_per_block;',
  'advance<<<blocks, threads_per_block, 0, stream>>>(x, dx, n);',
];

const mathNotes = [
  'ψₜ(R) = D↑(R) D↓(R) exp[J(R)]',
  'ρ(R) ∝ |ψₜ(R)|²',
  'A(R → R′) = min(1, ρ(R′) / ρ(R))',
  '⟨E⟩ = mean(E_local)',
];

export function HpcBackdrop() {
  return (
    <div className={styles.compute} aria-hidden="true" data-project-background="compute">
      <div className={styles.trace}>
        <div className={styles.paneTitle}>C++23 / CUDA</div>
        <pre className={styles.code}>
          {kernel.map((line, index) => (
            <span key={index}><i>{String(index + 1).padStart(2, '0')}</i>{line || ' '}</span>
          ))}
        </pre>
      </div>
      <div className={styles.research}>
        <div className={styles.paneTitle}>Variational Monte Carlo</div>
        {mathNotes.map((line) => <span key={line}>{line}</span>)}
      </div>
    </div>
  );
}
