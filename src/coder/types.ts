export interface WorkspaceBuild {
  id: string;
  status: 'pending' | 'starting' | 'running' | 'stopping' | 'stopped' | 'failed' | 'canceling' | 'canceled' | 'deleted' | 'deleting' | string;
  transition: 'start' | 'stop' | 'delete' | string;
  job: {
    id: string;
    status: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  owner_name: string;
  latest_build: WorkspaceBuild;
}

export interface WorkspaceListResponse {
  workspaces: Workspace[];
  count: number;
}

// AI Task types
export interface CoderTask {
  id: string;
  name: string;
  display_name: string;
  status: 'pending' | 'initializing' | 'active' | 'paused' | 'unknown' | 'error' | string;
  template_name: string;
  template_display_name: string;
  template_version_id: string;
  initial_prompt: string;
  workspace_name: string;
  workspace_status: string;
  current_state?: {
    state: string;
    message: string;
    timestamp: string;
  };
  created_at: string;
  updated_at: string;
}

export interface TaskLogEntry {
  id: number;
  content: string;
  time: string;
  type: string;
}

// Template types
export interface CoderTemplate {
  id: string;
  name: string;
  display_name: string;
  active_version_id: string;
}

export interface CoderPreset {
  ID: string;
  Name: string;
  Description: string;
  Default: boolean;
}
