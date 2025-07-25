# JavaScript Configuration Guide

## Survey Counter Feature

The survey counter feature shows the number of people who have clicked the
"Online Participation" or "Offline Participation" buttons. This feature is
**disabled by default** for privacy reasons.

### How to Enable/Disable

In `main.js`, locate the configuration object in the `LightningTalkApp`
constructor:

```javascript
this.config = {
  showSurveyCounters: false // Set to true to enable counter display
};
```

### Behavior

- **When disabled (default)**:
  - Counters are hidden from view
  - Clicking buttons still records the count internally (in localStorage)
  - Users see a "Thank you" message without revealing the count

- **When enabled**:
  - Counters are visible next to each button
  - Users see the current count and a notification when they vote
  - Counts persist in localStorage

### Privacy Considerations

The feature is disabled by default to:

- Avoid influencing participant choices based on others' selections
- Maintain privacy for early participants
- Prevent potential gaming of the system

Enable this feature only if you want transparent participation metrics visible
to all users.
