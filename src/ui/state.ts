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
  pendingKeySetup?: boolean;
  pendingAdminAdd?: boolean;
  globalView?: boolean;
}

class UiStateStore {
  private state = new Map<number, UiState>();

  private get(id: number): UiState {
    let s = this.state.get(id);
    if (!s) {
      s = {};
      this.state.set(id, s);
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

  setPendingKeySetup(chatId: number): void {
    this.get(chatId).pendingKeySetup = true;
  }

  isPendingKeySetup(chatId: number): boolean {
    return this.get(chatId).pendingKeySetup === true;
  }

  clearPendingKeySetup(chatId: number): void {
    const s = this.get(chatId);
    delete s.pendingKeySetup;
  }

  setPendingAdminAdd(chatId: number): void {
    this.get(chatId).pendingAdminAdd = true;
  }

  isPendingAdminAdd(chatId: number): boolean {
    return this.get(chatId).pendingAdminAdd === true;
  }

  clearPendingAdminAdd(chatId: number): void {
    const s = this.get(chatId);
    delete s.pendingAdminAdd;
  }

  // Keyed by userId for global view (admin-only toggle)
  setGlobalView(userId: number, enabled: boolean): void {
    this.get(userId).globalView = enabled;
  }

  isGlobalView(userId: number): boolean {
    return this.get(userId).globalView === true;
  }
}

export const uiState = new UiStateStore();
