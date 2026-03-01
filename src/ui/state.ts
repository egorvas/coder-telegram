export interface WizardState {
  step: 1 | 2 | 3;
  mode: 'task' | 'workspace';
  templateName?: string;
  templateVersionId?: string;
  presetId?: string;
  presetName?: string;
}

interface UiState {
  wizard?: WizardState;
  pendingAppend?: { taskId: string };
}

class UiStateStore {
  private state = new Map<number, UiState>();

  private get(chatId: number): UiState {
    let s = this.state.get(chatId);
    if (!s) {
      s = {};
      this.state.set(chatId, s);
    }
    return s;
  }

  getWizard(chatId: number): WizardState | null {
    return this.get(chatId).wizard ?? null;
  }

  setWizard(chatId: number, wizard: WizardState): void {
    this.get(chatId).wizard = wizard;
  }

  clearWizard(chatId: number): void {
    const s = this.get(chatId);
    delete s.wizard;
  }

  setPendingAppend(chatId: number, taskId: string): void {
    this.get(chatId).pendingAppend = { taskId };
  }

  getPendingAppend(chatId: number): { taskId: string } | null {
    return this.get(chatId).pendingAppend ?? null;
  }

  clearPendingAppend(chatId: number): void {
    const s = this.get(chatId);
    delete s.pendingAppend;
  }
}

export const uiState = new UiStateStore();
