// math-quiz.ts
type Problem = {
  a: number;
  b: number;
  answer: number;
  key: string;
};

class MathQuiz {
  private allProblems: Problem[] = [];
  private solvedKeys: Set<string> = new Set();
  private retryQueue: Problem[] = [];
  private currentProblem: Problem | null = null;
  private problemsSinceRetry = 0;
  private totalProblems = 0;
  private isProcessing = false;

  constructor() {
    this.initializeProblems();
    this.setupEventListeners();
    this.generateNewProblem();
    this.updateProgress();
  }

  private initializeProblems() {
    for (let a = 2; a <= 12; a++) {
      for (let b = a; b <= 12; b++) {
        const key = this.getProblemKey(a, b);
        this.allProblems.push({ a, b, answer: a * b, key });
      }
    }
    this.totalProblems = this.allProblems.length;
    this.shuffleArray(this.allProblems);
  }

  private shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private getProblemKey(a: number, b: number): string {
    return a <= b ? `${a}×${b}` : `${b}×${a}`;
  }

  private setupEventListeners() {
    // Physical keyboard support
    document.addEventListener('keydown', (e) => {
      if (this.isProcessing) return;
      
      if (e.key >= '0' && e.key <= '9') {
        this.addDigit(e.key);
      } else if (e.key === 'Backspace') {
        this.backspace();
      } else if (e.key === 'Enter') {
        this.checkAnswer();
      }
    });

    // Number buttons
    document.querySelectorAll('[data-num]').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = (btn as HTMLElement).dataset.num!;
        this.addDigit(num);
      });
    });

    // Backspace button
    document.getElementById('backspace')!.addEventListener('click', () => {
      this.backspace();
    });

    // Enter button
    document.getElementById('enter')!.addEventListener('click', () => {
      this.checkAnswer();
    });
  }

  private addDigit(digit: string) {
    const input = document.getElementById('answer-input') as HTMLDivElement;
    if (input.textContent!.length < 4) {
      input.textContent += digit;
    }
  }

  private backspace() {
    const input = document.getElementById('answer-input') as HTMLDivElement;
    input.textContent = input.textContent!.slice(0, -1);
  }

  private updateProgress() {
    const progressDiv = document.getElementById('progress') as HTMLDivElement;
    progressDiv.textContent = `${this.solvedKeys.size} / ${this.totalProblems}`;
  }

  private generateNewProblem() {
    const input = document.getElementById('answer-input') as HTMLDivElement;
    const problemDiv = document.getElementById('problem') as HTMLDivElement;
    const feedbackDiv = document.getElementById('feedback') as HTMLDivElement;

    this.isProcessing = false;
    input.textContent = '';
    feedbackDiv.textContent = '';
    feedbackDiv.className = '';

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

    if (Math.random() > 0.5 && this.currentProblem.a !== this.currentProblem.b) {
      [this.currentProblem.a, this.currentProblem.b] = 
        [this.currentProblem.b, this.currentProblem.a];
    }

    problemDiv.textContent = `${this.currentProblem.a} × ${this.currentProblem.b}`;
  }

  private getRandomDelay(): number {
    return Math.floor(Math.random() * 3) + 2;
  }

  private checkAnswer() {
    if (this.isProcessing) return;
    
    const input = document.getElementById('answer-input') as HTMLDivElement;
    const feedbackDiv = document.getElementById('feedback') as HTMLDivElement;
    const answerText = input.textContent || '';
    const userAnswer = parseInt(answerText, 10);

    if (!answerText || isNaN(userAnswer)) return;

    this.isProcessing = true;

    if (userAnswer === this.currentProblem!.answer) {
      feedbackDiv.textContent = '✓';
      feedbackDiv.className = 'correct';
      this.solvedKeys.add(this.currentProblem!.key);
      this.problemsSinceRetry++;
      this.updateProgress();
      setTimeout(() => this.generateNewProblem(), 600);
    } else {
      feedbackDiv.textContent = `✗ ${this.currentProblem!.answer}`;
      feedbackDiv.className = 'incorrect';
      this.retryQueue.push(this.currentProblem!);
      setTimeout(() => this.generateNewProblem(), 1200);
    }
  }

  private showCompletion() {
    const display = document.getElementById('display') as HTMLDivElement;
    const numpad = document.getElementById('numpad') as HTMLDivElement;
    const completionDiv = document.getElementById('completion') as HTMLDivElement;

    display.classList.add('hidden');
    numpad.classList.add('hidden');
    completionDiv.textContent = '✓ All problems completed!';
    completionDiv.className = 'correct';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MathQuiz();
  });
} else {
  new MathQuiz();
}