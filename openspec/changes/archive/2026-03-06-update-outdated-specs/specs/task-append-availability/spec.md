## REMOVED Requirements

### Requirement: Append button hidden when agent is busy
**Reason**: The "Append" inline button no longer exists. It was replaced by reply-based interaction where users reply to the card or log message. The card keyboard adapts based on agent state (hiding Full Log and Model while working), but there is no Append button to show/hide.
**Migration**: Reply-based interaction is documented in the `live-task-cards` spec. Card keyboard behavior is documented in the `live-task-cards` spec under "Card inline keyboard".
