// src/utils/mathQuiz.ts - Lean and comprehensive

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
      startup: { defaultReady: () => void; ready?: () => void };
      tex?: { inlineMath?: [string, string][] };
    };
  }
}

export type Difficulty = "easy" | "medium" | "hard";

export interface Problem {
  display: string;
  answer: string;
  key: string;
}

export interface ProblemType {
  id: string;
  name: string;
  description: string;
  generator: ProblemGenerator;
  answerMode: "integer" | "decimal" | "fraction" | "prime-factorization";
}

export interface ProblemGenerator {
  generate(difficulty: Difficulty): Problem[];
}

class MultiplicationGenerator implements ProblemGenerator {
  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { min: 2, max: 5 },
      medium: { min: 2, max: 10 },
      hard: { min: 2, max: 15 },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    for (let a = range.min; a <= range.max; a++) {
      for (let b = a; b <= range.max; b++) {
        problems.push({
          display: `${a} \\times ${b}`,
          answer: String(a * b),
          key: `${a}×${b}`,
        });
      }
    }
    return problems;
  }
}

class DivisionGenerator implements ProblemGenerator {
  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { min: 2, max: 5 },
      medium: { min: 2, max: 10 },
      hard: { min: 2, max: 15 },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    for (let divisor = range.min; divisor <= range.max; divisor++) {
      for (let quotient = range.min; quotient <= range.max; quotient++) {
        const dividend = divisor * quotient;
        problems.push({
          display: `${dividend} \\div ${divisor}`,
          answer: String(quotient),
          key: `${dividend}÷${divisor}`,
        });
      }
    }
    return problems;
  }
}

class AdditionGenerator implements ProblemGenerator {
  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { min: 1, max: 20 },
      medium: { min: 10, max: 50 },
      hard: { min: 20, max: 100 },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    const step = difficulty === "easy" ? 1 : 2;
    for (let a = range.min; a <= range.max; a += step) {
      for (let b = a; b <= range.max; b += step) {
        if (a + b <= range.max * 2) {
          problems.push({
            display: `${a} + ${b}`,
            answer: String(a + b),
            key: `${a}+${b}`,
          });
        }
      }
    }
    return problems;
  }
}

class SubtractionGenerator implements ProblemGenerator {
  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { min: 5, max: 20 },
      medium: { min: 10, max: 50 },
      hard: { min: 20, max: 100 },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    const step = difficulty === "easy" ? 1 : 2;
    for (let minuend = range.min; minuend <= range.max; minuend += step) {
      for (
        let subtrahend = range.min;
        subtrahend < minuend;
        subtrahend += step
      ) {
        problems.push({
          display: `${minuend} - ${subtrahend}`,
          answer: String(minuend - subtrahend),
          key: `${minuend}−${subtrahend}`,
        });
      }
    }
    return problems;
  }
}

class FractionAdditionGenerator implements ProblemGenerator {
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { maxDenom: 6, maxNum: 5 },
      medium: { maxDenom: 12, maxNum: 10 },
      hard: { maxDenom: 20, maxNum: 15 },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    for (let d1 = 2; d1 <= range.maxDenom; d1++) {
      for (let n1 = 1; n1 < d1 && n1 <= range.maxNum; n1++) {
        for (let d2 = 2; d2 <= range.maxDenom; d2++) {
          for (let n2 = 1; n2 < d2 && n2 <= range.maxNum; n2++) {
            const lcd = (d1 * d2) / this.gcd(d1, d2);
            const num = n1 * (lcd / d1) + n2 * (lcd / d2);
            const g = this.gcd(num, lcd);
            problems.push({
              display: `\\frac{${n1}}{${d1}} + \\frac{${n2}}{${d2}}`,
              answer: `${num / g}/${lcd / g}`,
              key: `${n1}/${d1}+${n2}/${d2}`,
            });
          }
        }
      }
    }
    return problems.slice(
      0,
      difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 100,
    );
  }
}

class FractionSubtractionGenerator implements ProblemGenerator {
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { maxDenom: 6, maxNum: 5 },
      medium: { maxDenom: 12, maxNum: 10 },
      hard: { maxDenom: 20, maxNum: 15 },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    for (let d1 = 2; d1 <= range.maxDenom; d1++) {
      for (let n1 = 2; n1 < d1 && n1 <= range.maxNum; n1++) {
        for (let d2 = 2; d2 <= range.maxDenom; d2++) {
          for (let n2 = 1; n2 < Math.min(n1, d2) && n2 <= range.maxNum; n2++) {
            const lcd = (d1 * d2) / this.gcd(d1, d2);
            const num = n1 * (lcd / d1) - n2 * (lcd / d2);
            if (num > 0) {
              const g = this.gcd(num, lcd);
              problems.push({
                display: `\\frac{${n1}}{${d1}} - \\frac{${n2}}{${d2}}`,
                answer: `${num / g}/${lcd / g}`,
                key: `${n1}/${d1}-${n2}/${d2}`,
              });
            }
          }
        }
      }
    }
    return problems.slice(
      0,
      difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 100,
    );
  }
}

class FractionMultiplicationGenerator implements ProblemGenerator {
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { maxDenom: 6, maxNum: 5 },
      medium: { maxDenom: 12, maxNum: 10 },
      hard: { maxDenom: 15, maxNum: 12 },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    for (let d1 = 2; d1 <= range.maxDenom; d1++) {
      for (let n1 = 1; n1 < d1 && n1 <= range.maxNum; n1++) {
        for (let d2 = 2; d2 <= range.maxDenom; d2++) {
          for (let n2 = 1; n2 < d2 && n2 <= range.maxNum; n2++) {
            const num = n1 * n2;
            const denom = d1 * d2;
            const g = this.gcd(num, denom);
            problems.push({
              display: `\\frac{${n1}}{${d1}} \\times \\frac{${n2}}{${d2}}`,
              answer: `${num / g}/${denom / g}`,
              key: `${n1}/${d1}×${n2}/${d2}`,
            });
          }
        }
      }
    }
    return problems.slice(
      0,
      difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 100,
    );
  }
}

class FractionDivisionGenerator implements ProblemGenerator {
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { maxDenom: 6, maxNum: 5 },
      medium: { maxDenom: 10, maxNum: 8 },
      hard: { maxDenom: 12, maxNum: 10 },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    for (let d1 = 2; d1 <= range.maxDenom; d1++) {
      for (let n1 = 1; n1 < d1 && n1 <= range.maxNum; n1++) {
        for (let d2 = 2; d2 <= range.maxDenom; d2++) {
          for (let n2 = 1; n2 < d2 && n2 <= range.maxNum; n2++) {
            const num = n1 * d2;
            const denom = d1 * n2;
            const g = this.gcd(num, denom);
            problems.push({
              display: `\\frac{${n1}}{${d1}} \\div \\frac{${n2}}{${d2}}`,
              answer: `${num / g}/${denom / g}`,
              key: `${n1}/${d1}÷${n2}/${d2}`,
            });
          }
        }
      }
    }
    return problems.slice(
      0,
      difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 100,
    );
  }
}

class FractionSimplificationGenerator implements ProblemGenerator {
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { max: 12, multipliers: [2, 3] },
      medium: { max: 20, multipliers: [2, 3, 4, 5] },
      hard: { max: 30, multipliers: [2, 3, 4, 5, 6, 7] },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    for (let denom = 2; denom <= range.max; denom++) {
      for (let num = 1; num < denom; num++) {
        for (const mult of range.multipliers) {
          if (this.gcd(num, denom) === 1) {
            problems.push({
              display: `\\frac{${num * mult}}{${denom * mult}}`,
              answer: `${num}/${denom}`,
              key: `${num * mult}/${denom * mult}`,
            });
          }
        }
      }
    }
    return problems.slice(
      0,
      difficulty === "easy" ? 30 : difficulty === "medium" ? 50 : 80,
    );
  }
}

class DecimalAdditionGenerator implements ProblemGenerator {
  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { min: 0.1, max: 5, step: 0.1 },
      medium: { min: 0.5, max: 20, step: 0.5 },
      hard: { min: 1, max: 50, step: 1 },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    for (let a = range.min; a <= range.max; a += range.step) {
      for (let b = a; b <= range.max; b += range.step) {
        problems.push({
          display: `${a.toFixed(1)} + ${b.toFixed(1)}`,
          answer: (a + b).toFixed(1),
          key: `${a}+${b}`,
        });
      }
    }
    return problems.slice(
      0,
      difficulty === "easy" ? 40 : difficulty === "medium" ? 60 : 80,
    );
  }
}

class DecimalSubtractionGenerator implements ProblemGenerator {
  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { min: 0.1, max: 5, step: 0.1 },
      medium: { min: 0.5, max: 20, step: 0.5 },
      hard: { min: 1, max: 50, step: 1 },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    for (let a = range.min; a <= range.max; a += range.step) {
      for (let b = range.min; b < a; b += range.step) {
        problems.push({
          display: `${a.toFixed(1)} - ${b.toFixed(1)}`,
          answer: (a - b).toFixed(1),
          key: `${a}-${b}`,
        });
      }
    }
    return problems.slice(
      0,
      difficulty === "easy" ? 40 : difficulty === "medium" ? 60 : 80,
    );
  }
}

class DecimalMultiplicationGenerator implements ProblemGenerator {
  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { min: 0.1, max: 3, step: 0.1 },
      medium: { min: 0.5, max: 5, step: 0.5 },
      hard: { min: 1, max: 10, step: 1 },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    for (let a = range.min; a <= range.max; a += range.step) {
      for (let b = a; b <= range.max; b += range.step) {
        const product = a * b;
        problems.push({
          display: `${a.toFixed(1)} \\times ${b.toFixed(1)}`,
          answer: product.toFixed(2),
          key: `${a}×${b}`,
        });
      }
    }
    return problems.slice(
      0,
      difficulty === "easy" ? 30 : difficulty === "medium" ? 50 : 70,
    );
  }
}

class DecimalDivisionGenerator implements ProblemGenerator {
  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { min: 0.1, max: 3, step: 0.1 },
      medium: { min: 0.5, max: 5, step: 0.5 },
      hard: { min: 1, max: 10, step: 1 },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    for (let divisor = range.min; divisor <= range.max; divisor += range.step) {
      for (
        let quotient = range.min;
        quotient <= range.max;
        quotient += range.step
      ) {
        const dividend = divisor * quotient;
        problems.push({
          display: `${dividend.toFixed(2)} \\div ${divisor.toFixed(1)}`,
          answer: quotient.toFixed(1),
          key: `${dividend}÷${divisor}`,
        });
      }
    }
    return problems.slice(
      0,
      difficulty === "easy" ? 30 : difficulty === "medium" ? 50 : 70,
    );
  }
}

class PercentageGenerator implements ProblemGenerator {
  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { nums: [10, 20, 25, 50, 75, 100], pcts: [10, 20, 25, 50] },
      medium: { nums: [15, 30, 45, 60, 80, 120], pcts: [15, 30, 40, 60, 75] },
      hard: { nums: [35, 65, 85, 125, 150, 200], pcts: [12, 18, 35, 65, 85] },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    for (const num of range.nums) {
      for (const pct of range.pcts) {
        const result = (num * pct) / 100;
        problems.push({
          display: `${pct}\\% \\text{ of } ${num}`,
          answer: result.toFixed(result % 1 === 0 ? 0 : 1),
          key: `${pct}%of${num}`,
        });
      }
    }
    return problems;
  }
}

class PrimeFactorizationGenerator implements ProblemGenerator {
  private getPrimeFactors(n: number): number[] {
    const factors: number[] = [];
    let divisor = 2;
    while (n > 1) {
      while (n % divisor === 0) {
        factors.push(divisor);
        n = n / divisor;
      }
      divisor++;
      if (divisor * divisor > n && n > 1) {
        factors.push(n);
        break;
      }
    }
    return factors;
  }

  private formatFactors(factors: number[]): string {
    const counts = new Map<number, number>();
    for (const f of factors) {
      counts.set(f, (counts.get(f) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([base, exp]) => (exp === 1 ? String(base) : `${base}^${exp}`))
      .join("×");
  }

  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: { min: 4, max: 30 },
      medium: { min: 20, max: 100 },
      hard: { min: 50, max: 200 },
    };
    const range = ranges[difficulty];
    const problems: Problem[] = [];
    for (let n = range.min; n <= range.max; n++) {
      const factors = this.getPrimeFactors(n);
      if (factors.length > 1) {
        problems.push({
          display: String(n),
          answer: this.formatFactors(factors),
          key: `factor-${n}`,
        });
      }
    }
    return problems.slice(
      0,
      difficulty === "easy" ? 40 : difficulty === "medium" ? 60 : 80,
    );
  }
}

class ConstantsGenerator implements ProblemGenerator {
  private constants = [
    { name: "\\pi", value: Math.PI },
    { name: "e", value: Math.E },
    { name: "\\phi", value: (1 + Math.sqrt(5)) / 2 },
    { name: "\\sqrt{2}", value: Math.sqrt(2) },
    { name: "\\sqrt{3}", value: Math.sqrt(3) },
    { name: "\\sqrt{5}", value: Math.sqrt(5) },
    { name: "\\ln(2)", value: Math.log(2) },
    { name: "\\ln(10)", value: Math.log(10) },
    { name: "\\tau", value: 2 * Math.PI },
  ];

  generate(difficulty: Difficulty): Problem[] {
    const decimals =
      difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
    return this.constants.map((c) => ({
      display: c.name,
      answer: c.value.toFixed(decimals),
      key: c.name,
    }));
  }
}

class SquareRootsGenerator implements ProblemGenerator {
  generate(difficulty: Difficulty): Problem[] {
    const ranges = {
      easy: [4, 9, 16, 25, 36, 49, 64, 81, 100],
      medium: [121, 144, 169, 196, 225, 256, 289, 324, 361, 400],
      hard: [441, 484, 529, 576, 625, 676, 729, 784, 841, 900],
    };
    const nums = ranges[difficulty];
    return nums.map((n) => ({
      display: `\\sqrt{${n}}`,
      answer: String(Math.sqrt(n)),
      key: `sqrt${n}`,
    }));
  }
}

class SoundManager {
  private enabled = false;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.enabled = localStorage.getItem("mathQuizSounds") === "true";
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem("mathQuizSounds", String(this.enabled));
    if (this.enabled && !this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
  ) {
    if (!this.enabled) return;
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration,
    );
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playClick() {
    this.playTone(800, 0.05, "square");
  }

  playCorrect() {
    this.playTone(800, 0.1);
    setTimeout(() => this.playTone(1000, 0.15), 100);
  }

  playIncorrect() {
    this.playTone(300, 0.2);
  }
}

class StreakManager {
  private storageKey = "mathQuizStreaks";

  getStreak(problemTypeId: string, difficulty: Difficulty): number {
    const data = this.loadData();
    return data[`${problemTypeId}_${difficulty}`] || 0;
  }

  updateStreak(problemTypeId: string, difficulty: Difficulty, streak: number) {
    const data = this.loadData();
    const key = `${problemTypeId}_${difficulty}`;
    if (streak > (data[key] || 0)) {
      data[key] = streak;
      this.saveData(data);
    }
  }

  private loadData(): Record<string, number> {
    try {
      const json = localStorage.getItem(this.storageKey);
      return json ? JSON.parse(json) : {};
    } catch {
      return {};
    }
  }

  private saveData(data: Record<string, number>) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
}

export const PROBLEM_TYPES: ProblemType[] = [
  {
    id: "multiplication",
    name: "Multiplication",
    description: "Multiply whole numbers and build fluency with times tables.",
    generator: new MultiplicationGenerator(),
    answerMode: "integer",
  },
  {
    id: "division",
    name: "Division",
    description: "Divide whole numbers and master division facts.",
    generator: new DivisionGenerator(),
    answerMode: "integer",
  },
  {
    id: "addition",
    name: "Addition",
    description: "Add whole numbers and develop quick mental math skills.",
    generator: new AdditionGenerator(),
    answerMode: "integer",
  },
  {
    id: "subtraction",
    name: "Subtraction",
    description: "Subtract whole numbers and build number sense.",
    generator: new SubtractionGenerator(),
    answerMode: "integer",
  },
  {
    id: "decimal-addition",
    name: "Decimal Addition",
    description: "Add numbers with decimals. Practice aligning decimal places.",
    generator: new DecimalAdditionGenerator(),
    answerMode: "decimal",
  },
  {
    id: "decimal-subtraction",
    name: "Decimal Subtraction",
    description:
      "Subtract numbers with decimals. Master decimal place alignment.",
    generator: new DecimalSubtractionGenerator(),
    answerMode: "decimal",
  },
  {
    id: "decimal-multiplication",
    name: "Decimal Multiplication",
    description:
      "Multiply decimal numbers. Learn to count decimal places in products.",
    generator: new DecimalMultiplicationGenerator(),
    answerMode: "decimal",
  },
  {
    id: "decimal-division",
    name: "Decimal Division",
    description: "Divide decimal numbers. Practice moving decimal points.",
    generator: new DecimalDivisionGenerator(),
    answerMode: "decimal",
  },
  {
    id: "percentages",
    name: "Percentages",
    description:
      "Calculate percentages of numbers. Essential for real-world math.",
    generator: new PercentageGenerator(),
    answerMode: "decimal",
  },
  {
    id: "square-roots",
    name: "Square Roots",
    description:
      "Find square roots of perfect squares. Build mental math foundation.",
    generator: new SquareRootsGenerator(),
    answerMode: "integer",
  },
  {
    id: "fraction-addition",
    name: "Fraction Addition",
    description:
      "Add fractions with different denominators. Simplify to reduced form.",
    generator: new FractionAdditionGenerator(),
    answerMode: "fraction",
  },
  {
    id: "fraction-subtraction",
    name: "Fraction Subtraction",
    description:
      "Subtract fractions with different denominators. Reduce answers.",
    generator: new FractionSubtractionGenerator(),
    answerMode: "fraction",
  },
  {
    id: "fraction-multiplication",
    name: "Fraction Multiplication",
    description: "Multiply fractions and simplify to lowest terms.",
    generator: new FractionMultiplicationGenerator(),
    answerMode: "fraction",
  },
  {
    id: "fraction-division",
    name: "Fraction Division",
    description: "Divide fractions using multiply-by-reciprocal method.",
    generator: new FractionDivisionGenerator(),
    answerMode: "fraction",
  },
  {
    id: "fraction-simplification",
    name: "Fraction Simplification",
    description: "Simplify fractions to lowest terms.",
    generator: new FractionSimplificationGenerator(),
    answerMode: "fraction",
  },
  {
    id: "prime-factorization",
    name: "Prime Factorization",
    description:
      "Factor numbers into primes. Use × for multiplication and ^ for exponents (e.g., 2^3×5 for 40).",
    generator: new PrimeFactorizationGenerator(),
    answerMode: "prime-factorization",
  },
  {
    id: "constants",
    name: "Mathematical Constants",
    description:
      "Memorize important constants like π, e, φ to multiple decimal places.",
    generator: new ConstantsGenerator(),
    answerMode: "decimal",
  },
];

export class MathQuiz {
  private allProblems: Problem[] = [];
  private solvedKeys = new Set<string>();
  private retryQueue: Problem[] = [];
  private currentProblem: Problem | null = null;
  private problemsSinceRetry = 0;
  private totalProblems = 0;
  private isProcessing = false;
  private currentStreak = 0;
  private currentProblemType: ProblemType | null = null;
  private currentDifficulty: Difficulty = "easy";
  private soundManager = new SoundManager();
  private streakManager = new StreakManager();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.loadMathJax();
    this.setupProblemSelector();
    this.setupEventListeners();
    this.setupSoundToggle();
    this.switchMode(PROBLEM_TYPES[0].id, "easy");
  }

  private async loadMathJax(): Promise<void> {
    return new Promise((resolve) => {
      if (window.MathJax?.typesetPromise) {
        resolve();
        return;
      }
      window.MathJax = {
        tex: {
          inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
        },
        startup: {
          defaultReady: () => {},
          ready() {
            const mj = window.MathJax;
            if (mj) {
              mj.startup.defaultReady.call(mj.startup);
            }
            resolve();
          },
        },
      };
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js";
      script.async = true;
      script.onload = () => {
        setTimeout(() => {
          if (window.MathJax?.typesetPromise) resolve();
        }, 100);
      };
      document.head.appendChild(script);
    });
  }

  private setupProblemSelector() {
    const select = document.getElementById(
      "problem-type-select",
    ) as HTMLSelectElement;
    PROBLEM_TYPES.forEach((type) => {
      (["easy", "medium", "hard"] as Difficulty[]).forEach((diff) => {
        const option = document.createElement("option");
        option.value = `${type.id}:${diff}`;
        option.textContent = `${type.name} - ${diff.charAt(0).toUpperCase() + diff.slice(1)}`;
        select.appendChild(option);
      });
    });
    select.addEventListener("change", () => {
      const [typeId, difficulty] = select.value.split(":");
      this.switchMode(typeId, difficulty as Difficulty);
    });
  }

  private setupSoundToggle() {
    const toggle = document.getElementById("sound-toggle");
    if (toggle) {
      toggle.textContent = this.soundManager.isEnabled() ? "♪" : "♪̸";
      toggle.addEventListener("click", () => {
        const enabled = this.soundManager.toggle();
        toggle.textContent = enabled ? "♪" : "♪̸";
        if (enabled) this.soundManager.playClick();
      });
    }
  }

  private switchMode(typeId: string, difficulty: Difficulty) {
    const problemType = PROBLEM_TYPES.find((t) => t.id === typeId);
    if (!problemType) return;
    this.currentProblemType = problemType;
    this.currentDifficulty = difficulty;
    const desc = document.getElementById("problem-description");
    if (desc) desc.textContent = problemType.description;
    this.updateNumpad(problemType.answerMode);
    this.allProblems = this.shuffleArray(
      problemType.generator.generate(difficulty),
    );
    this.solvedKeys.clear();
    this.retryQueue = [];
    this.totalProblems = this.allProblems.length;
    this.problemsSinceRetry = 0;
    this.currentStreak = 0;
    this.generateNewProblem();
    this.updateProgress();
  }

  private updateNumpad(
    mode: "integer" | "decimal" | "fraction" | "prime-factorization",
  ) {
    const decimalBtn = document.getElementById(
      "decimal-btn",
    ) as HTMLButtonElement;
    const fractionBtn = document.getElementById(
      "fraction-btn",
    ) as HTMLButtonElement;
    const multiplyBtn = document.getElementById(
      "multiply-btn",
    ) as HTMLButtonElement;
    const exponentBtn = document.getElementById(
      "exponent-btn",
    ) as HTMLButtonElement;

    decimalBtn.disabled = mode !== "decimal";
    fractionBtn.disabled = mode !== "fraction";
    multiplyBtn.disabled = mode !== "prime-factorization";
    exponentBtn.disabled = mode !== "prime-factorization";
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private setupEventListeners() {
    window.addEventListener("keydown", (e) => {
      if (this.isProcessing) return;
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        this.addCharacter(e.key);
        this.animateButton(`[data-num="${e.key}"]`);
        this.soundManager.playClick();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        this.backspace();
        this.animateButton("#backspace");
        this.soundManager.playClick();
      } else if (e.key === "Enter") {
        e.preventDefault();
        this.checkAnswer();
        this.animateButton("#enter");
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        this.clear();
        this.animateButton("#clear");
        this.soundManager.playClick();
      } else {
        const keyMap: Record<string, { char: string; mode: string }> = {
          ".": { char: ".", mode: "decimal" },
          "/": { char: "/", mode: "fraction" },
          "*": { char: "×", mode: "prime-factorization" },
          x: { char: "×", mode: "prime-factorization" },
          "^": { char: "^", mode: "prime-factorization" },
        };
        const mapped = keyMap[e.key];
        if (mapped && this.currentProblemType?.answerMode === mapped.mode) {
          e.preventDefault();
          this.addCharacter(mapped.char);
          this.soundManager.playClick();
        }
      }
    });

    document.querySelectorAll("[data-num]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const char = (btn as HTMLElement).dataset.num!;
        this.addCharacter(char);
        this.soundManager.playClick();
      });
    });

    document.getElementById("decimal-btn")?.addEventListener("click", () => {
      this.addCharacter(".");
      this.soundManager.playClick();
    });

    document.getElementById("fraction-btn")?.addEventListener("click", () => {
      this.addCharacter("/");
      this.soundManager.playClick();
    });

    document.getElementById("multiply-btn")?.addEventListener("click", () => {
      this.addCharacter("×");
      this.soundManager.playClick();
    });

    document.getElementById("exponent-btn")?.addEventListener("click", () => {
      this.addCharacter("^");
      this.soundManager.playClick();
    });

    document.getElementById("backspace")!.addEventListener("click", () => {
      this.backspace();
      this.soundManager.playClick();
    });

    document.getElementById("clear")!.addEventListener("click", () => {
      this.clear();
      this.soundManager.playClick();
    });

    document.getElementById("enter")!.addEventListener("click", () => {
      this.checkAnswer();
    });
  }

  private animateButton(selector: string) {
    const btn = document.querySelector(selector) as HTMLElement;
    if (btn && !btn.hasAttribute("disabled")) {
      btn.classList.add("pressed");
      setTimeout(() => btn.classList.remove("pressed"), 100);
    }
  }

  private addCharacter(char: string) {
    const input = document.getElementById("answer-input") as HTMLDivElement;
    const current = input.textContent?.trim() || "";
    if (current.length < 20 && current !== "\u00A0") {
      input.textContent = (current === "" ? "" : current) + char;
    }
  }

  private backspace() {
    const input = document.getElementById("answer-input") as HTMLDivElement;
    const current = input.textContent || "";
    input.textContent = current.slice(0, -1) || "\u00A0";
  }

  private clear() {
    const input = document.getElementById("answer-input") as HTMLDivElement;
    input.textContent = "\u00A0";
  }

  private updateProgress() {
    const progressDiv = document.getElementById("progress") as HTMLDivElement;
    progressDiv.textContent = `${this.solvedKeys.size}/${this.totalProblems}`;
    const streakDiv = document.getElementById("streak") as HTMLDivElement;
    if (this.currentProblemType) {
      const bestStreak = this.streakManager.getStreak(
        this.currentProblemType.id,
        this.currentDifficulty,
      );
      streakDiv.textContent = `${this.currentStreak} | ${bestStreak}`;
    }
  }

  private updateStreak(correct: boolean) {
    if (correct) {
      this.currentStreak++;
      if (this.currentProblemType) {
        this.streakManager.updateStreak(
          this.currentProblemType.id,
          this.currentDifficulty,
          this.currentStreak,
        );
      }
    } else {
      this.currentStreak = 0;
    }
    this.updateProgress();
  }

  private async generateNewProblem() {
    const input = document.getElementById("answer-input") as HTMLDivElement;
    const problemDiv = document.getElementById("problem") as HTMLDivElement;
    const feedbackDiv = document.getElementById("feedback") as HTMLDivElement;
    this.isProcessing = false;
    input.textContent = "\u00A0";
    feedbackDiv.textContent = "\u00A0";
    feedbackDiv.className = "";

    if (
      this.retryQueue.length > 0 &&
      this.problemsSinceRetry >= this.getRandomDelay()
    ) {
      this.currentProblem = this.retryQueue.shift()!;
      this.problemsSinceRetry = 0;
    } else if (this.allProblems.length > 0) {
      this.currentProblem = this.allProblems.shift()!;
    } else if (this.retryQueue.length > 0) {
      this.currentProblem = this.retryQueue.shift()!;
    } else {
      this.showCompletion();
      return;
    }

    problemDiv.innerHTML = `\\[${this.currentProblem.display}\\]`;
    if (window.MathJax?.typesetPromise) {
      try {
        await window.MathJax.typesetPromise([problemDiv]);
      } catch (err) {
        console.error("MathJax error:", err);
      }
    }
  }

  private getRandomDelay(): number {
    return Math.floor(Math.random() * 3) + 2;
  }

  private checkAnswer() {
    if (this.isProcessing) return;
    const input = document.getElementById("answer-input") as HTMLDivElement;
    const feedbackDiv = document.getElementById("feedback") as HTMLDivElement;
    const answerText = (input.textContent || "").trim();
    if (!answerText || answerText === "\u00A0") return;
    this.isProcessing = true;

    const isCorrect = this.compareAnswers(
      answerText,
      this.currentProblem!.answer,
    );
    if (isCorrect) {
      feedbackDiv.textContent = "√";
      feedbackDiv.className = "correct";
      this.solvedKeys.add(this.currentProblem!.key);
      this.problemsSinceRetry++;
      this.updateStreak(true);
      this.soundManager.playCorrect();
      setTimeout(() => this.generateNewProblem(), 600);
    } else {
      feedbackDiv.textContent = `X ${this.currentProblem!.answer}`;
      feedbackDiv.className = "incorrect";
      this.retryQueue.push(this.currentProblem!);
      this.updateStreak(false);
      this.soundManager.playIncorrect();
      setTimeout(() => this.generateNewProblem(), 1200);
    }
  }

  private compareAnswers(userAnswer: string, correctAnswer: string): boolean {
    const user = userAnswer.trim().toLowerCase();
    const correct = correctAnswer.trim().toLowerCase();
    if (user === correct) return true;

    // Fractions
    if (user.includes("/") && correct.includes("/")) {
      const [un, ud] = user.split("/").map(Number);
      const [cn, cd] = correct.split("/").map(Number);
      if (!isNaN(un) && !isNaN(ud) && !isNaN(cn) && !isNaN(cd)) {
        const gcd = (a: number, b: number): number =>
          b === 0 ? a : gcd(b, a % b);
        return (
          gcd(Math.abs(un), Math.abs(ud)) === 1 &&
          gcd(Math.abs(cn), Math.abs(cd)) === 1 &&
          un * cd === cn * ud
        );
      }
    }

    // Decimals
    const userNum = parseFloat(user);
    const correctNum = parseFloat(correct);
    if (!isNaN(userNum) && !isNaN(correctNum)) {
      return Math.abs(userNum - correctNum) < 0.0001;
    }

    return false;
  }

  private showCompletion() {
    document.getElementById("calculator")!.classList.add("hidden");
    document.getElementById("problem-type-selector")!.classList.add("hidden");
    const completionDiv = document.getElementById("completion")!;
    completionDiv.textContent = "√ COMPLETE";
    completionDiv.className = "correct";
  }
}
