## ADDED Requirements

### Requirement: Append button hidden when agent is busy
The system SHALL hide the Append inline keyboard button when the task's agent state is `working`. The button SHALL be shown only when the agent state is `idle` or unknown.

#### Scenario: Append hidden while agent is working
- **WHEN** the task detail keyboard is rendered and `lastKnownAgentState` is `working`
- **THEN** the Append button MUST NOT appear in the inline keyboard

#### Scenario: Append shown when agent is idle
- **WHEN** the task detail keyboard is rendered and `lastKnownAgentState` is `idle`
- **THEN** the Append button SHALL appear in the inline keyboard

#### Scenario: Append shown when agent state is unknown
- **WHEN** the task detail keyboard is rendered and `lastKnownAgentState` is `undefined`
- **THEN** the Append button SHALL appear in the inline keyboard (fail-open)
