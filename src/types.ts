export interface PrizeBond {
  id: string;
  number: string; // 7-digit string e.g. "0123456"
  series?: string; // e.g. "কখ" or "Ka" (optional)
  note?: string; // user-specified note, e.g. "Booklet 1"
  createdAt: string;
}

export interface DrawResult {
  id: string; // e.g. "draw-115"
  title: string; // e.g. "115th Raffle Draw"
  date: string; // e.g. "2026-04-30"
  firstPrize: string[];  // 1 number
  secondPrize: string[]; // 1 number
  thirdPrize: string[];  // 2 numbers
  fourthPrize: string[]; // 2 numbers
  fifthPrize: string[];  // 40 numbers
}

export interface MatchResult {
  id: string;
  bond: PrizeBond;
  drawId: string;
  drawTitle: string;
  drawDate: string;
  prizeCategory: '1st' | '2nd' | '3rd' | '4th' | '5th';
  prizeAmount: number; // in BDT
}
