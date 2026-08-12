import type { GridColumnDef } from '@ornery/ui-grid-core';

// ─── Instruments ────────────────────────────────────────────────────────────

const INSTRUMENTS: ReadonlyArray<[string, string, string, number]> = [
  ['NVDA',    'NASDAQ', 'Technology', 875],
  ['MSFT',    'NASDAQ', 'Technology', 415],
  ['AAPL',    'NASDAQ', 'Technology', 195],
  ['GOOGL',   'NASDAQ', 'Technology', 175],
  ['META',    'NASDAQ', 'Technology', 520],
  ['AMZN',    'NASDAQ', 'Technology', 205],
  ['TSLA',    'NASDAQ', 'Automotive', 240],
  ['AMD',     'NASDAQ', 'Technology', 165],
  ['INTC',    'NASDAQ', 'Technology',  35],
  ['ORCL',    'NYSE',   'Technology', 145],
  ['CRM',     'NYSE',   'Technology', 310],
  ['ADBE',    'NASDAQ', 'Technology', 475],
  ['NFLX',    'NASDAQ', 'Media',      690],
  ['DIS',     'NYSE',   'Media',      115],
  ['JPM',     'NYSE',   'Financial',  215],
  ['GS',      'NYSE',   'Financial',  480],
  ['BAC',     'NYSE',   'Financial',   42],
  ['WFC',     'NYSE',   'Financial',   58],
  ['V',       'NYSE',   'Financial',  285],
  ['MA',      'NYSE',   'Financial',  495],
  ['JNJ',     'NYSE',   'Healthcare', 155],
  ['PFE',     'NYSE',   'Healthcare',  28],
  ['UNH',     'NYSE',   'Healthcare', 510],
  ['XOM',     'NYSE',   'Energy',     115],
  ['SPY',     'NYSE',   'ETF',        560],
  ['QQQ',     'NASDAQ', 'ETF',        480],
  ['BTC-USD', 'CRYPTO', 'Crypto',   68000],
  ['ETH-USD', 'CRYPTO', 'Crypto',    3400],
];

// ─── LCG RNG ─────────────────────────────────────────────────────────────────

export class TradingLcg {
  private state: number;

  constructor(seed = 0xdeadbeef) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state;
  }

  f64(): number {
    return this.next() / 4294967296;
  }

  range(lo: number, hi: number): number {
    return lo + this.f64() * (hi - lo);
  }

  intN(n: number): number {
    return Math.floor(this.f64() * n);
  }
}

// ─── Row type ─────────────────────────────────────────────────────────────────

export interface TradingRow extends Record<string, unknown> {
  id: string;
  symbol: string;
  exchange: string;
  sector: string;
  price: number;
  basePrice: number;
  bid: number;
  ask: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
  lastSize: number;
  direction: 1 | -1 | 0;
  /** CSS color value for price / bid / ask cells */
  priceColor: string;
  /** CSS color value for change / changePct cells */
  changeColor: string;
  /** Pre-formatted strings (consumed by vanilla WC slot templates & Angular/React cell renderers) */
  priceStr: string;
  bidStr: string;
  askStr: string;
  changeStr: string;
  changePctStr: string;
}

// ─── Formatters (exported so Angular/React renderers can reuse them) ──────────

export function fmtPrice(v: unknown): string {
  return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtChange(v: unknown): string {
  const n = Number(v);
  return `${n >= 0 ? '+' : ''}${fmtPrice(n)}`;
}

export function fmtChangePct(v: unknown): string {
  const n = Number(v);
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

export function fmtVolume(v: unknown): string {
  const n = Number(v);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function dirColor(dir: 1 | -1 | 0): string {
  if (dir === 1) return '#22c55e';
  if (dir === -1) return '#ef4444';
  return 'inherit';
}

// ─── Row construction ─────────────────────────────────────────────────────────

export function createTradingRows(): TradingRow[] {
  const rng = new TradingLcg(0xdeadbeef);
  return INSTRUMENTS.map(([symbol, exchange, sector, base], i) => {
    const price = base + rng.range(-base * 0.02, base * 0.02);
    const spread = Math.max(price * 0.0002, 0.01);
    const bid = price - spread;
    const ask = price + spread;
    return {
      id: `trade-${i}`,
      symbol,
      exchange,
      sector,
      price,
      basePrice: price,
      bid,
      ask,
      change: 0,
      changePct: 0,
      high: price,
      low: price,
      volume: Math.floor(rng.range(100_000, 600_000)),
      lastSize: Math.floor(rng.range(1, 500)),
      direction: 0 as const,
      priceColor: 'inherit',
      changeColor: '#9ca3af',
      priceStr: fmtPrice(price),
      bidStr: fmtPrice(bid),
      askStr: fmtPrice(ask),
      changeStr: '+0.00',
      changePctStr: '+0.00%',
    };
  });
}

// ─── Tick ─────────────────────────────────────────────────────────────────────

export function tickTradingRows(
  rows: TradingRow[],
  rng: TradingLcg,
  count: number,
): TradingRow[] {
  const updated = rows.slice();
  const seen = new Set<number>();
  let attempts = 0;
  const target = Math.min(count, rows.length);

  while (seen.size < target && attempts < target * 3) {
    seen.add(rng.intN(rows.length));
    attempts++;
  }

  for (const idx of seen) {
    const row = { ...updated[idx] };
    const prev = row.price;
    let delta = rng.range(-0.0015, 0.0015);
    if (rng.f64() < 0.03) delta += rng.range(-0.005, 0.005);

    const next = Math.max(prev * (1 + delta), 0.01);
    const spread = Math.max(next * 0.0002, 0.01);
    const dir: 1 | -1 | 0 = next > prev ? 1 : next < prev ? -1 : 0;

    row.price = next;
    row.bid = next - spread;
    row.ask = next + spread;
    row.high = Math.max(row.high, next);
    row.low = Math.min(row.low, next);
    row.volume += Math.floor(rng.range(100, 5000));
    row.lastSize = Math.floor(rng.range(1, 500));
    row.change = next - row.basePrice;
    row.changePct = (row.change / row.basePrice) * 100;
    row.direction = dir;
    row.priceColor = dirColor(dir);
    row.changeColor = row.change >= 0 ? '#22c55e' : '#ef4444';
    row.priceStr = fmtPrice(next);
    row.bidStr = fmtPrice(row.bid);
    row.askStr = fmtPrice(row.ask);
    row.changeStr = fmtChange(row.change);
    row.changePctStr = fmtChangePct(row.changePct);

    updated[idx] = row;
  }

  return updated;
}

// ─── Column definitions ───────────────────────────────────────────────────────

export function tradingColumnDefs(): GridColumnDef[] {
  return [
    { name: 'symbol',    displayName: 'Symbol', width: '100px' },
    { name: 'exchange',  displayName: 'Exch',   width: '80px' },
    { name: 'sector',    displayName: 'Sector',  width: '120px' },
    { name: 'price',     displayName: 'Price',   width: '110px', align: 'end', formatter: fmtPrice },
    { name: 'bid',       displayName: 'Bid',     width: '100px', align: 'end', formatter: fmtPrice },
    { name: 'ask',       displayName: 'Ask',     width: '100px', align: 'end', formatter: fmtPrice },
    { name: 'change',    displayName: 'Chg',     width: '100px', align: 'end', formatter: fmtChange },
    { name: 'changePct', displayName: 'Chg %',   width: '90px',  align: 'end', formatter: fmtChangePct },
    { name: 'high',      displayName: 'High',    width: '100px', align: 'end', formatter: fmtPrice },
    { name: 'low',       displayName: 'Low',     width: '100px', align: 'end', formatter: fmtPrice },
    { name: 'volume',    displayName: 'Volume',  width: '90px',  align: 'end', formatter: fmtVolume },
    { name: 'lastSize',  displayName: 'Last Sz', width: '80px',  align: 'end' },
  ];
}
