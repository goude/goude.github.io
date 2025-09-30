// src/utils/mathQuiz.ts

// MathJax type declarations
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

export type OperationMode =
  | "multiplication"
  | "division"
  | "addition"
  | "subtraction"
  | "squares"
  | "square-roots"
  | "lcd";

export interface Problem {
  display: string;
  answer: number;
  key: string;
}

export interface ProblemGenerator {
  generate(): Problem[];
}

export class MultiplicationGenerator implements ProblemGenerator {
  generate(): Problem[] {
    const problems: Problem[] = [];
    for (let a = 2; a <= 12; a++) {
      for (let b = a; b <= 12; b++) {
        const key = `${Math.min(a, b)}×${Math.max(a, b)}`;
        problems.push({
          display: `${a} \\times ${b}`,
          answer: a * b,
          key,
        });
      }
    }
    return problems;
  }
}

export class DivisionGenerator implements ProblemGenerator {
  generate(): Problem[] {
    const problems: Problem[] = [];
    for (let divisor = 2; divisor <= 12; divisor++) {
      for (let quotient = 2; quotient <= 12; quotient++) {
        const dividend = divisor * quotient;
        if (dividend <= 144) {
          const key = `${dividend}÷${divisor}`;
          problems.push({
            display: `\\frac{${dividend}}{${divisor}}`,
            answer: quotient,
            key,
          });
        }
      }
    }
    return problems;
  }
}

export class AdditionGenerator implements ProblemGenerator {
  generate(): Problem[] {
    const problems: Problem[] = [];
    for (let a = 2; a <= 50; a++) {
      for (let b = a; b <= 50; b++) {
        if (a + b <= 100) {
          const key = `${Math.min(a, b)}+${Math.max(a, b)}`;
          problems.push({
            display: `${a} + ${b}`,
            answer: a + b,
            key,
          });
        }
      }
    }
    return problems;
  }
}

export class SubtractionGenerator implements ProblemGenerator {
  generate(): Problem[] {
    const problems: Problem[] = [];
    for (let minuend = 10; minuend <= 100; minuend++) {
      for (
        let subtrahend = 2;
        subtrahend < minuend && subtrahend <= 50;
        subtrahend++
      ) {
        const key = `${minuend}−${subtrahend}`;
        problems.push({
          display: `${minuend} - ${subtrahend}`,
          answer: minuend - subtrahend,
          key,
        });
      }
    }
    return problems;
  }
}

export class SquaresGenerator implements ProblemGenerator {
  generate(): Problem[] {
    const problems: Problem[] = [];
    for (let n = 2; n <= 25; n++) {
      problems.push({
        display: `${n}^2`,
        answer: n * n,
        key: `${n}²`,
      });
    }
    return problems;
  }
}

export class SquareRootsGenerator implements ProblemGenerator {
  generate(): Problem[] {
    const problems: Problem[] = [];
    for (let n = 2; n <= 25; n++) {
      problems.push({
        display: `\\sqrt{${n * n}}`,
        answer: n,
        key: `√${n * n}`,
      });
    }
    return problems;
  }
}

export class LCDGenerator implements ProblemGenerator {
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  private lcm(a: number, b: number): number {
    return (a * b) / this.gcd(a, b);
  }

  generate(): Problem[] {
    const problems: Problem[] = [];
    // Generate LCD problems for denominators 2-12
    for (let a = 2; a <= 12; a++) {
      for (let b = a + 1; b <= 12; b++) {
        const lcd = this.lcm(a, b);
        const key = `LCD(${a},${b})`;
        problems.push({
          display: `\\text{LCD}(${a}, ${b})`,
          answer: lcd,
          key,
        });
      }
    }
    return problems;
  }
}

export class MathQuiz {
  private generators: Map<OperationMode, ProblemGenerator>;
  private allProblems: Problem[] = [];
  private solvedKeys: Set<string> = new Set();
  private retryQueue: Problem[] = [];
  private currentProblem: Problem | null = null;
  private problemsSinceRetry = 0;
  private totalProblems = 0;
  private isProcessing = false;
  private currentStreak = 0;
  private bestStreak = 0;

  constructor() {
    this.generators = new Map([
      ["multiplication", new MultiplicationGenerator()],
      ["division", new DivisionGenerator()],
      ["addition", new AdditionGenerator()],
      ["subtraction", new SubtractionGenerator()],
      ["squares", new SquaresGenerator()],
      ["square-roots", new SquareRootsGenerator()],
      ["lcd", new LCDGenerator()],
    ]);

    this.initialize();
  }

  private async initialize() {
    await this.loadMathJax();
    this.setupModeSelector();
    this.setupEventListeners();
    this.initializeMode("multiplication");
  }

  private async loadMathJax(): Promise<void> {
    return new Promise((resolve) => {
      // If MathJax is already loaded and ready
      if (window.MathJax?.typesetPromise) {
        resolve();
        return;
      }

      // Configure MathJax before loading the script
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
            // Call the default ready function
            const mj = window.MathJax;
            if (mj) {
              mj.startup.defaultReady.call(mj.startup);
            }
            // Signal that we're ready
            resolve();
          },
        },
      };

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js";
      script.async = true;

      // Fallback in case ready() doesn't fire
      script.onload = () => {
        setTimeout(() => {
          if (window.MathJax?.typesetPromise) {
            resolve();
          }
        }, 100);
      };

      document.head.appendChild(script);
    });
  }

  private setupModeSelector() {
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = (btn as HTMLElement).dataset.mode as OperationMode;
        this.switchMode(mode);
      });
    });
  }

  private switchMode(mode: OperationMode) {
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.classList.toggle(
        "active",
        (btn as HTMLElement).dataset.mode === mode,
      );
    });
    this.initializeMode(mode);
  }

  private initializeMode(mode: OperationMode) {
    const generator = this.generators.get(mode)!;
    this.allProblems = this.shuffleArray(generator.generate());
    this.solvedKeys.clear();
    this.retryQueue = [];
    this.totalProblems = this.allProblems.length;
    this.problemsSinceRetry = 0;
    this.currentStreak = 0;
    this.generateNewProblem();
    this.updateProgress();
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
        this.addDigit(e.key);
        this.animateButton(`[data-num="${e.key}"]`);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        this.backspace();
        this.animateButton("#backspace");
      } else if (e.key === "Enter") {
        e.preventDefault();
        this.checkAnswer();
        this.animateButton("#enter");
      }
    });

    document.querySelectorAll("[data-num]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const num = (btn as HTMLElement).dataset.num!;
        this.addDigit(num);
      });
    });

    document.getElementById("backspace")!.addEventListener("click", () => {
      this.backspace();
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

  private addDigit(digit: string) {
    const input = document.getElementById("answer-input") as HTMLDivElement;
    const current = input.textContent?.trim() || "";
    if (current.length < 4 && current !== "\u00A0") {
      input.textContent = (current === "" ? "" : current) + digit;
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
    progressDiv.textContent = `${this.solvedKeys.size} / ${this.totalProblems}`;

    const streakDiv = document.getElementById("streak") as HTMLDivElement;
    streakDiv.textContent = `🔥 ${this.currentStreak}`;
  }

  private updateStreak(correct: boolean) {
    if (correct) {
      this.currentStreak++;
      if (this.currentStreak > this.bestStreak) {
        this.bestStreak = this.currentStreak;
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

    // Set the LaTeX markup
    const latex = `\\[${this.currentProblem.display}\\]`;
    problemDiv.innerHTML = latex;
    console.log("Problem LaTeX:", latex);
    console.log("MathJax available:", !!window.MathJax?.typesetPromise);

    // Wait for MathJax to render
    if (window.MathJax?.typesetPromise) {
      try {
        await window.MathJax.typesetPromise([problemDiv]);
        console.log("MathJax rendered successfully");
      } catch (err) {
        console.error("MathJax typesetting error:", err);
        // Fallback: show the raw LaTeX
      }
    } else {
      console.warn("MathJax not available yet");
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
    const userAnswer = parseInt(answerText, 10);

    if (!answerText || answerText === "\u00A0" || isNaN(userAnswer)) return;

    this.isProcessing = true;

    if (userAnswer === this.currentProblem!.answer) {
      feedbackDiv.textContent = "✓";
      feedbackDiv.className = "correct";
      this.solvedKeys.add(this.currentProblem!.key);
      this.problemsSinceRetry++;
      this.updateStreak(true);
      setTimeout(() => this.generateNewProblem(), 600);
    } else {
      feedbackDiv.textContent = `✗ ${this.currentProblem!.answer}`;
      feedbackDiv.className = "incorrect";
      this.retryQueue.push(this.currentProblem!);
      this.updateStreak(false);
      setTimeout(() => this.generateNewProblem(), 1200);
    }
  }

  private showCompletion() {
    const calculator = document.getElementById("calculator") as HTMLDivElement;
    const completionDiv = document.getElementById(
      "completion",
    ) as HTMLDivElement;
    const modeSelector = document.getElementById(
      "mode-selector",
    ) as HTMLDivElement;

    calculator.classList.add("hidden");
    modeSelector.classList.add("hidden");
    completionDiv.textContent = "✓ All problems completed!";
    completionDiv.className = "correct";
  }
}
