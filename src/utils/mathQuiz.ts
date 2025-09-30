// src/utils/mathQuiz.ts

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
      startup: {
        defaultReady: () => void;
        ready?: () => void;
      };
      tex?: {
        inlineMath?: [string, string][];
      };
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
  answerMode: "integer" | "decimal" | "fraction";
}

export interface ProblemGenerator {
  generate(difficulty: Difficulty): Problem[];
}

// ============================================================================
// PROBLEM GENERATORS
// ============================================================================

class MultiplicationGenerator implements ProblemGenerator {
  generate(difficulty: Difficulty): Problem[] {
    const problems: Problem[] = [];
    const ranges = {
      easy: { min: 2, max: 5 },
      medium: { min: 2, max: 10 },
      hard: { min: 2, max: 15 },
    };
    const range = ranges[difficulty];
    
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
    const problems: Problem[] = [];
    const ranges = {
      easy: { min: 2, max: 5 },
      medium: { min: 2, max: 10 },
      hard: { min: 2, max: 15 },
    };
    const range = ranges[difficulty];
    
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
    const problems: Problem[] = [];
    const ranges = {
      easy: { min: 1, max: 20 },
      medium: { min: 10, max: 50 },
      hard: { min: 20, max: 100 },
    };
    const range = ranges[difficulty];
    
    for (let a = range.min; a <= range.max; a += difficulty === "easy" ? 1 : 2) {
      for (let b = a; b <= range.max; b += difficulty === "easy" ? 1 : 2) {
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
    const problems: Problem[] = [];
    const ranges = {
      easy: { min: 5, max: 20 },
      medium: { min: 10, max: 50 },
      hard: { min: 20, max: 100 },
    };
    const range = ranges[difficulty];
    
    for (let minuend = range.min; minuend <= range.max; minuend += difficulty === "easy" ? 1 : 2) {
      for (let subtrahend = range.min; subtrahend < minuend; subtrahend += difficulty === "easy" ? 1 : 2) {
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
    const problems: Problem[] = [];
    const ranges = {
      easy: { maxDenom: 6, maxNum: 5 },
      medium: { maxDenom: 12, maxNum: 10 },
      hard: { maxDenom: 20, maxNum: 15 },
    };
    const range = ranges[difficulty];
    
    for (let d1 = 2; d1 <= range.maxDenom; d1++) {
      for (let n1 = 1; n1 < d1 && n1 <= range.maxNum; n1++) {
        for (let d2 = 2; d2 <= range.maxDenom; d2++) {
          for (let n2 = 1; n2 < d2 && n2 <= range.maxNum; n2++) {
            const lcd = (d1 * d2) / this.gcd(d1, d2);
            const num = n1 * (lcd / d1) + n2 * (lcd / d2);
            const g = this.gcd(num, lcd);
            const ansNum = num / g;
            const ansDenom = lcd / g;
            
            problems.push({
              display: `\\frac{${n1}}{${d1}} + \\frac{${n2}}{${d2}}`,
              answer: `${ansNum}/${ansDenom}`,
              key: `${n1}/${d1}+${n2}/${d2}`,
            });
          }
        }
      }
    }
    return problems.slice(0, difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 100);
  }
}

class FractionSubtractionGenerator implements ProblemGenerator {
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  generate(difficulty: Difficulty): Problem[] {
    const problems: Problem[] = [];
    const ranges = {
      easy: { maxDenom: 6, maxNum: 5 },
      medium: { maxDenom: 12, maxNum: 10 },
      hard: { maxDenom: 20, maxNum: 15 },
    };
    const range = ranges[difficulty];
    
    for (let d1 = 2; d1 <= range.maxDenom; d1++) {
      for (let n1 = 2; n1 < d1 && n1 <= range.maxNum; n1++) {
        for (let d2 = 2; d2 <= range.maxDenom; d2++) {
          for (let n2 = 1; n2 < Math.min(n1, d2) && n2 <= range.maxNum; n2++) {
            const lcd = (d1 * d2) / this.gcd(d1, d2);
            const num = n1 * (lcd / d1) - n2 * (lcd / d2);
            if (num > 0) {
              const g = this.gcd(num, lcd);
              const ansNum = num / g;
              const ansDenom = lcd / g;
              
              problems.push({
                display: `\\frac{${n1}}{${d1}} - \\frac{${n2}}{${d2}}`,
                answer: `${ansNum}/${ansDenom}`,
                key: `${n1}/${d1}-${n2}/${d2}`,
              });
            }
          }
        }
      }
    }
    return problems.slice(0, difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 100);
  }
}

class FractionMultiplicationGenerator implements ProblemGenerator {
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  generate(difficulty: Difficulty): Problem[] {
    const problems: Problem[] = [];
    const ranges = {
      easy: { maxDenom: 6, maxNum: 5 },
      medium: { maxDenom: 12, maxNum: 10 },
      hard: { maxDenom: 15, maxNum: 12 },
    };
    const range = ranges[difficulty];
    
    for (let d1 = 2; d1 <= range.maxDenom; d1++) {
      for (let n1 = 1; n1 < d1 && n1 <= range.maxNum; n1++) {
        for (let d2 = 2; d2 <= range.maxDenom; d2++) {
          for (let n2 = 1; n2 < d2 && n2 <= range.maxNum; n2++) {
            const num = n1 * n2;
            const denom = d1 * d2;
            const g = this.gcd(num, denom);
            const ansNum = num / g;
            const ansDenom = denom / g;
            
            problems.push({
              display: `\\frac{${n1}}{${d1}} \\times \\frac{${n2}}{${d2}}`,
              answer: `${ansNum}/${ansDenom}`,
              key: `${n1}/${d1}×${n2}/${d2}`,
            });
          }
        }
      }
    }
    return problems.slice(0, difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 100);
  }
}

class FractionDivisionGenerator implements ProblemGenerator {
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  generate(difficulty: Difficulty): Problem[] {
    const problems: Problem[] = [];
    const ranges = {
      easy: { maxDenom: 6, maxNum: 5 },
      medium: { maxDenom: 10, maxNum: 8 },
      hard: { maxDenom: 12, maxNum: 10 },
    };
    const range = ranges[difficulty];
    
    for (let d1 = 2; d1 <= range.maxDenom; d1++) {
      for (let n1 = 1; n1 < d1 && n1 <= range.maxNum; n1++) {
        for (let d2 = 2; d2 <= range.maxDenom; d2++) {
          for (let n2 = 1; n2 < d2 && n2 <= range.maxNum; n2++) {
            const num = n1 * d2;
            const denom = d1 * n2;
            const g = this.gcd(num, denom);
            const ansNum = num / g;
            const ansDenom = denom / g;
            
            problems.push({
              display: `\\frac{${n1}}{${d1}} \\div \\frac{${n2}}{${d2}}`,
              answer: `${ansNum}/${ansDenom}`,
              key: `${n1}/${d1}÷${n2}/${d2}`,
            });
          }
        }
      }
    }
    return problems.slice(0, difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 100);
  }
}

class FractionSimplificationGenerator implements ProblemGenerator {
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  generate(difficulty: Difficulty): Problem[] {
    const problems: Problem[] = [];
    const ranges = {
      easy: { max: 12, multipliers: [2, 3] },
      medium: { max: 20, multipliers: [2, 3, 4, 5] },
      hard: { max: 30, multipliers: [2, 3, 4, 5, 6, 7] },
    };
    const range = ranges[difficulty];
    
    for (let denom = 2; denom <= range.max; denom++) {
      for (let num = 1; num < denom; num++) {
        for (const mult of range.multipliers) {
          const g = this.gcd(num, denom);
          if (g === 1) {
            problems.push({
              display: `\\frac{${num * mult}}{${denom * mult}}`,
              answer: `${num}/${denom}`,
              key: `${num * mult}/${denom * mult}`,
            });
          }
        }
      }
    }
    return problems.slice(0, difficulty === "easy" ? 30 : difficulty === "medium" ? 50 : 80);
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
    const decimalsRequired = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
    
    return this.constants.map(c => ({
      display: c.name,
      answer: c.value.toFixed(decimalsRequired),
      key: c.name,
    }));
  }
}

// ============================================================================
// SOUND MANAGER
// ============================================================================

class SoundManager {
  private enabled = false;
  private audioContext: AudioContext | null = null;

  constructor() {
    const savedPref = localStorage.getItem("mathQuizSounds");
    this.enabled = savedPref === "true";
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

  private playTone(frequency: number, duration: number, type: OscillatorType = "sine") {
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
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

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

// ============================================================================
// STREAK MANAGER
// ============================================================================

class StreakManager {
  private storageKey = "mathQuizStreaks";

  getStreak(problemTypeId: string, difficulty: Difficulty): number {
    const data = this.loadData();
    const key = `${problemTypeId}_${difficulty}`;
    return data[key] || 0;
  }

  updateStreak(problemTypeId: string, difficulty: Difficulty, streak: number) {
    const data = this.loadData();
    const key = `${problemTypeId}_${difficulty}`;
    const current = data[key] || 0;
    if (streak > current) {
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

// ============================================================================
// PROBLEM TYPE REGISTRY
// ============================================================================

export const PROBLEM_TYPES: ProblemType[] = [
  {
    id: "multiplication",
    name: "Multiplication",
    description: "Practice multiplying whole numbers. Build fluency with times tables and develop mental math skills.",
    generator: new MultiplicationGenerator(),
    answerMode: "integer",
  },
  {
    id: "division",
    name: "Division",
    description: "Practice dividing whole numbers. Master division facts and strengthen your understanding of the relationship between multiplication and division.",
    generator: new DivisionGenerator(),
    answerMode: "integer",
  },
  {
    id: "addition",
    name: "Addition",
    description: "Practice adding whole numbers. Develop quick mental addition skills and number sense.",
    generator: new AdditionGenerator(),
    answerMode: "integer",
  },
  {
    id: "subtraction",
    name: "Subtraction",
    description: "Practice subtracting whole numbers. Build confidence with mental subtraction and strengthen number relationships.",
    generator: new SubtractionGenerator(),
    answerMode: "integer",
  },
  {
    id: "fraction-addition",
    name: "Fraction Addition",
    description: "Add fractions with different denominators. Practice finding common denominators and simplifying results.",
    generator: new FractionAdditionGenerator(),
    answerMode: "fraction",
  },
  {
    id: "fraction-subtraction",
    name: "Fraction Subtraction",
    description: "Subtract fractions with different denominators. Master working with common denominators and reducing answers.",
    generator: new FractionSubtractionGenerator(),
    answerMode: "fraction",
  },
  {
    id: "fraction-multiplication",
    name: "Fraction Multiplication",
    description: "Multiply fractions and simplify the results. Learn to multiply numerators and denominators efficiently.",
    generator: new FractionMultiplicationGenerator(),
    answerMode: "fraction",
  },
  {
    id: "fraction-division",
    name: "Fraction Division",
    description: "Divide fractions using the multiply-by-reciprocal method. Build understanding of fraction operations.",
    generator: new FractionDivisionGenerator(),
    answerMode: "fraction",
  },
  {
    id: "fraction-simplification",
    name: "Fraction Simplification",
    description: "Simplify fractions to lowest terms. Practice identifying greatest common factors and reducing fractions.",
    generator: new FractionSimplificationGenerator(),
    answerMode: "fraction",
  },
  {
    id: "constants",
    name: "Mathematical Constants",
    description: "Memorize important mathematical constants to multiple decimal places. Essential values include π, e, φ, and common square roots.",
    generator: new ConstantsGenerator(),
    answerMode: "decimal",
  },
];

// ============================================================================
// MAIN QUIZ CLASS
// ============================================================================

export class MathQuiz {
  private allProblems: Problem[] = [];
  private solvedKeys: Set<string> = new Set();
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
          inlineMath: [["$", "$"], ["\\(", "\\)"]],
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
    const select = document.getElementById("problem-type-select") as HTMLSelectElement;
    
    PROBLEM_TYPES.forEach(type => {
      (["easy", "medium", "hard"] as Difficulty[]).forEach(diff => {
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
    const problemType = PROBLEM_TYPES.find(t => t.id === typeId);
    if (!problemType) return;

    this.currentProblemType = problemType;
    this.currentDifficulty = difficulty;
    
    const desc = document.getElementById("problem-description");
    if (desc) desc.textContent = problemType.description;

    this.updateNumpad(problemType.answerMode);

    this.allProblems = this.shuffleArray(problemType.generator.generate(difficulty));
    this.solvedKeys.clear();
    this.retryQueue = [];
    this.totalProblems = this.allProblems.length;
    this.problemsSinceRetry = 0;
    this.currentStreak = 0;
    this.generateNewProblem();
    this.updateProgress();
  }

  private updateNumpad(mode: "integer" | "decimal" | "fraction") {
    const decimalBtn = document.getElementById("decimal-btn");
    const fractionBtn = document.getElementById("fraction-btn");
    
    if (decimalBtn) decimalBtn.style.display = mode === "decimal" ? "block" : "none";
    if (fractionBtn) fractionBtn.style.display = mode === "fraction" ? "block" : "none";
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
      } else if (e.key === "." && this.currentProblemType?.answerMode === "decimal") {
        e.preventDefault();
        this.addCharacter(".");
        this.soundManager.playClick();
      } else if (e.key === "/" && this.currentProblemType?.answerMode === "fraction") {
        e.preventDefault();
        this.addCharacter("/");
        this.soundManager.playClick();
      }
    });

    document.querySelectorAll("[data-num]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const char = (btn as HTMLElement).dataset.num!;
        this.addCharacter(char);
        this.soundManager.playClick();
      });
    });

    const decimalBtn = document.getElementById("decimal-btn");
    if (decimalBtn) {
      decimalBtn.addEventListener("click", () => {
        this.addCharacter(".");
        this.soundManager.playClick();
      });
    }

    const fractionBtn = document.getElementById("fraction-btn");
    if (fractionBtn) {
      fractionBtn.addEventListener("click", () => {
        this.addCharacter("/");
        this.soundManager.playClick();
      });
    }

    document.getElementById("backspace")!.addEventListener("click", () => {
      this.backspace();
      this.soundManager.playClick();
    });

    document.getElementById("enter")!.addEventListener("click", () => {
      this.checkAnswer();
    });
  }

  private animateButton(selector: string) {
    const btn = document.querySelector(selector) as HTMLElement;
    if (btn) {
      btn.classList.add("pressed");
      setTimeout(() => btn.classList.remove("pressed"), 100);
    }
  }

  private addCharacter(char: string) {
    const input = document.getElementById("answer-input") as HTMLDivElement;
    const current = input.textContent?.trim() || "";
    if (current.length < 10 && current !== "\u00A0") {
      input.textContent = (current === "" ? "" : current) + char;
    }
  }

  private backspace() {
    const input = document.getElementById("answer-input") as HTMLDivElement;
    const current = input.textContent || "";
    const newValue = current.slice(0, -1);
    input.textContent = newValue || "\u00A0";
  }

  private updateProgress() {
    const progressDiv = document.getElementById("progress") as HTMLDivElement;
    progressDiv.textContent = `${this.solvedKeys.size}/${this.totalProblems}`;

    const streakDiv = document.getElementById("streak") as HTMLDivElement;
    if (this.currentProblemType) {
      const bestStreak = this.streakManager.getStreak(this.currentProblemType.id, this.currentDifficulty);
      streakDiv.textContent = `${this.currentStreak} | ${bestStreak}`;
    }
  }

  private updateStreak(correct: boolean) {
    if (correct) {
      this.currentStreak++;
      if (this.currentProblemType) {
        this.streakManager.updateStreak(this.currentProblemType.id, this.currentDifficulty, this.currentStreak);
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

    if (this.retryQueue.length > 0 && this.problemsSinceRetry >= this.getRandomDelay()) {
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

    const latex = `\\[${this.currentProblem.display}\\]`;
    problemDiv.innerHTML = latex;

    if (window.MathJax?.typesetPromise) {
      try {
        await window.MathJax.typesetPromise([problemDiv]);
      } catch (err) {
        console.error("MathJax typesetting error:", err);
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

    const isCorrect = this.compareAnswers(answerText, this.currentProblem!.answer);

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

    if (user.includes("/") && correct.includes("/")) {
      const [un, ud] = user.split("/").map(Number);
      const [cn, cd] = correct.split("/").map(Number);
      if (!isNaN(un) && !isNaN(ud) && !isNaN(cn) && !isNaN(cd)) {
        return un * cd === cn * ud;
      }
    }

    const userNum = parseFloat(user);
    const correctNum = parseFloat(correct);
    if (!isNaN(userNum) && !isNaN(correctNum)) {
      return Math.abs(userNum - correctNum) < 0.0001;
    }

    return false;
  }

  private showCompletion() {
    const calculator = document.getElementById("calculator") as HTMLDivElement;
    const completionDiv = document.getElementById("completion") as HTMLDivElement;
    const selector = document.getElementById("problem-type-selector") as HTMLDivElement;

    calculator.classList.add("hidden");
    selector.classList.add("hidden");
    completionDiv.textContent = "√ COMPLETE";
    completionDiv.className = "correct";
  }
}