import { Markup } from 'telegraf';
import type { Workspace, CoderTask, CoderTemplate, CoderPreset } from '../coder/types.js';
import { config } from '../config.js';

const MAX_NAME = 40;
function truncate(s: string, max = MAX_NAME): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// 2.1 Main menu
export function mainMenuKeyboard(isAdmin = false) {
  type Row = ReturnType<typeof Markup.button.callback>[];
  const rows: Row[] = [
    [
      Markup.button.callback('🤖 AI Tasks', 'menu:tasks'),
      Markup.button.callback('💻 Workspaces', 'menu:workspaces'),
      Markup.button.callback('📋 Templates', 'menu:templates'),
    ],
  ];
  if (isAdmin) {
    rows.push([Markup.button.callback('👤 Admin', 'menu:admin')]);
  }
  return Markup.inlineKeyboard(rows);
}

// 2.2 Task list — one button per task + New Task
export function taskListKeyboard(tasks: CoderTask[]) {
  const rows = tasks.map((t) => [
    Markup.button.callback(
      `${truncate(t.display_name || t.name, 38)} — ${t.status}`,
      `task:select:${t.id}`
    ),
  ]);
  rows.push([
    Markup.button.callback('🔄 Refresh', 'dashboard:refresh'),
    Markup.button.callback('➕ New Task', 'dashboard:new'),
  ]);
  rows.push([Markup.button.callback('« Main Menu', 'menu:main')]);
  return Markup.inlineKeyboard(rows);
}

// 2.3 Task submenu — actions for a specific task (kept for backward compat)
export function taskMenuKeyboard(taskId: string, agentState?: string) {
  type Btn = ReturnType<typeof Markup.button.callback> | ReturnType<typeof Markup.button.url>;
  const actionRow: Btn[] = agentState === 'working'
    ? [
        Markup.button.callback('🗑 Delete', `task:delete:${taskId}`),
      ]
    : [
        Markup.button.callback('📄 Full Log', `task:fulllog:${taskId}`),
        Markup.button.callback('🧠 Model', `task:model:${taskId}`),
        Markup.button.callback('🗑 Delete', `task:delete:${taskId}`),
      ];
  const rows: Btn[][] = [actionRow];
  rows.push([Markup.button.url('🌐 Open', `${config.coderApiUrl}/tasks/me/${taskId}`)]);
  rows.push([Markup.button.callback('« Tasks', 'dashboard:back')]);
  return Markup.inlineKeyboard(rows);
}

// 2.3b Live card keyboard
export function taskCardKeyboard(taskId: string, agentState?: string) {
  type Btn = ReturnType<typeof Markup.button.callback> | ReturnType<typeof Markup.button.url>;
  const rows: Btn[][] = [];

  if (agentState !== 'working') {
    rows.push([
      Markup.button.callback('📄 Full Log', `task:fulllog:${taskId}`),
      Markup.button.callback('🧠 Model', `task:model:${taskId}`),
    ]);
  }

  rows.push([
    Markup.button.callback('🗑 Delete', `task:delete:${taskId}`),
    Markup.button.url('🌐 Open', `${config.coderApiUrl}/tasks/me/${taskId}`),
  ]);
  rows.push([Markup.button.callback('« Tasks', 'dashboard:back')]);
  return Markup.inlineKeyboard(rows);
}

// 2.3a Model selection keyboard
export function modelKeyboard(taskId: string) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⚡ Haiku (fast)',    `task:model:set:${taskId}:haiku`)],
    [Markup.button.callback('⚖️ Sonnet (balanced)', `task:model:set:${taskId}:sonnet`)],
    [Markup.button.callback('🧠 Opus (smart)',    `task:model:set:${taskId}:opus`)],
    [Markup.button.callback('« Back', `task:select:${taskId}`)],
  ]);
}

// 2.4 Workspace list — one button per ws + New Workspace
export function workspaceListKeyboard(workspaces: Workspace[]) {
  const rows = workspaces.map((ws) => [
    Markup.button.callback(
      `${ws.name} — ${ws.latest_build.status}`,
      `ws:select:${truncate(ws.name, 50)}`
    ),
  ]);
  rows.push([
    Markup.button.callback('🔄 Refresh', 'ws:refresh'),
    Markup.button.callback('➕ New Workspace', 'ws:new'),
  ]);
  rows.push([Markup.button.callback('« Main Menu', 'menu:main')]);
  return Markup.inlineKeyboard(rows);
}

// 2.5 Workspace action menu
export function workspaceActionKeyboard(ws: Workspace) {
  const isRunning = ws.latest_build.status === 'running';
  return Markup.inlineKeyboard([
    [
      isRunning
        ? Markup.button.callback('⏹ Stop', `ws:stop:${truncate(ws.name, 51)}`)
        : Markup.button.callback('▶️ Start', `ws:start:${truncate(ws.name, 50)}`),
    ],
    [Markup.button.callback('🗑 Delete', `ws:delete:${truncate(ws.name, 49)}`)],
    [Markup.button.url('🌐 Open in Coder', `${config.coderApiUrl}/@me/${ws.name}`)],
    [Markup.button.callback('« Back', 'ws:back')],
  ]);
}

// 2.6 Template list
export function templateListKeyboard(templates: CoderTemplate[]) {
  const rows = templates.slice(0, 20).map((t) => [
    Markup.button.callback(
      t.display_name || t.name,
      `tpl:select:${truncate(t.name, 52)}`
    ),
  ]);
  rows.push([Markup.button.callback('🔄 Refresh', 'tpl:refresh')]);
  rows.push([Markup.button.callback('« Main Menu', 'menu:main')]);
  return Markup.inlineKeyboard(rows);
}

// 2.7 Preset list (read-only browser in template section)
export function presetListKeyboard(presets: CoderPreset[], templateName: string) {
  return Markup.inlineKeyboard([
    ...presets.map((p) => [
      Markup.button.callback(
        `${p.Name}${p.Description ? ` — ${truncate(p.Description, 30)}` : ''}${p.Default ? ' ✓' : ''}`,
        `tpl:preset:noop`
      ),
    ]),
    [Markup.button.url('🌐 Open in Coder', `${config.coderApiUrl}/templates/${templateName}`)],
    [Markup.button.callback('« Templates', 'menu:templates')],
  ]);
}

// 2.8 Wizard: template selection
export function wizardTemplateKeyboard(templates: CoderTemplate[]) {
  const rows = templates.slice(0, 20).map((t) => [
    Markup.button.callback(t.display_name || t.name, `wizard:tpl:${truncate(t.name, 49)}`),
  ]);
  rows.push([
    Markup.button.callback('« Back', 'wizard:back'),
    Markup.button.callback('✕ Cancel', 'wizard:cancel'),
  ]);
  return Markup.inlineKeyboard(rows);
}

// 2.9 Wizard: preset selection
export function wizardPresetKeyboard(presets: CoderPreset[]) {
  const rows = presets.map((p) => [
    Markup.button.callback(
      `${p.Name}${p.Default ? ' ✓' : ''}${p.Description ? ` — ${truncate(p.Description, 20)}` : ''}`,
      `wizard:preset:${truncate(p.ID, 50)}`
    ),
  ]);
  rows.push([
    Markup.button.callback('« Back', 'wizard:back'),
    Markup.button.callback('✕ Cancel', 'wizard:cancel'),
  ]);
  return Markup.inlineKeyboard(rows);
}

// 2.10 Confirm keyboard (yes/no for destructive actions)
export function confirmKeyboard(yesAction: string, noAction: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Yes', yesAction),
      Markup.button.callback('❌ No', noAction),
    ],
  ]);
}

// 2.11 Wizard: prompt input (task = required, workspace = optional)
export function promptKeyboard(canSkip: boolean) {
  const buttons = canSkip
    ? [Markup.button.callback('⏭ Skip', 'wizard:skip'), Markup.button.callback('✕ Cancel', 'wizard:cancel')]
    : [Markup.button.callback('✕ Cancel', 'wizard:cancel')];
  return Markup.inlineKeyboard([buttons]);
}
