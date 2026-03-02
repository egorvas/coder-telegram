import type { Workspace, WorkspaceListResponse, WorkspaceBuild, CoderTemplate, CoderPreset, CoderTask } from './types.js';

export class CoderClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Coder-Session-Token': this.token,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Coder API error ${res.status}: ${text}`);
    }

    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined as T;
    }

    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  // --- Workspaces ---

  async listWorkspaces(): Promise<Workspace[]> {
    const data = await this.request<WorkspaceListResponse>('/api/v2/workspaces');
    return data.workspaces;
  }

  private async findWorkspace(name: string): Promise<Workspace> {
    const workspaces = await this.listWorkspaces();
    const ws = workspaces.find((w) => w.name === name);
    if (!ws) throw new Error(`Workspace not found: ${name}`);
    return ws;
  }

  async startWorkspace(name: string): Promise<WorkspaceBuild> {
    const ws = await this.findWorkspace(name);
    return this.request<WorkspaceBuild>(`/api/v2/workspaces/${ws.id}/builds`, {
      method: 'POST',
      body: JSON.stringify({ transition: 'start' }),
    });
  }

  async stopWorkspace(name: string): Promise<WorkspaceBuild> {
    const ws = await this.findWorkspace(name);
    return this.request<WorkspaceBuild>(`/api/v2/workspaces/${ws.id}/builds`, {
      method: 'POST',
      body: JSON.stringify({ transition: 'stop' }),
    });
  }

  async createWorkspace(templateVersionId: string, presetId: string | null, name: string): Promise<Workspace> {
    return this.request<Workspace>('/api/v2/users/me/workspaces', {
      method: 'POST',
      body: JSON.stringify({
        template_version_id: templateVersionId,
        ...(presetId ? { template_version_preset_id: presetId } : {}),
        name,
      }),
    });
  }

  // --- Templates ---

  async listTemplates(): Promise<CoderTemplate[]> {
    return this.request<CoderTemplate[]>('/api/v2/templates');
  }

  async getTemplatePresets(templateVersionId: string): Promise<CoderPreset[]> {
    return this.request<CoderPreset[]>(
      `/api/v2/templateversions/${templateVersionId}/presets`
    );
  }

  // --- AI Tasks ---

  async listTasks(): Promise<CoderTask[]> {
    const data = await this.request<{ tasks: CoderTask[] }>('/api/v2/tasks');
    return data.tasks;
  }

  async createTask(templateVersionId: string, presetId: string | null, prompt: string): Promise<CoderTask> {
    return this.request<CoderTask>('/api/v2/tasks/me', {
      method: 'POST',
      body: JSON.stringify({
        template_version_id: templateVersionId,
        ...(presetId ? { template_version_preset_id: presetId } : {}),
        input: prompt,
      }),
    });
  }

  async getTask(taskId: string): Promise<CoderTask> {
    return this.request<CoderTask>(`/api/v2/tasks/me/${taskId}`);
  }

  async getTaskLogs(taskId: string): Promise<string> {
    const data = await this.request<{ logs: Array<{ content: string }> }>(`/api/v2/tasks/me/${taskId}/logs`);
    const lines = (data.logs ?? []).map((l) => l.content);
    return lines.slice(-50).join('\n');
  }

  async appendTaskPrompt(taskId: string, prompt: string): Promise<void> {
    await this.request(`/api/v2/tasks/me/${taskId}/send`, {
      method: 'POST',
      body: JSON.stringify({ input: prompt }),
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.request(`/api/v2/tasks/me/${taskId}`, { method: 'DELETE' });
  }

  async pauseTask(taskId: string): Promise<void> {
    await this.request(`/api/v2/tasks/me/${taskId}/pause`, { method: 'POST' });
  }

  async resumeTask(taskId: string): Promise<void> {
    await this.request(`/api/v2/tasks/me/${taskId}/resume`, { method: 'POST' });
  }
}
