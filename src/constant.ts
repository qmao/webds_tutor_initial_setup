import { extensionTutorInitialSetupIcon } from './icons';

export const Attributes = {
  "plugin": "@webds/tutor_initial_setup:plugin",
  "command": "webds_tutor_initial_setup:open",
  "id": "webds_tutor_initial_setup_widget",
  "label": "Initial Setup",
  "caption": "Initial Setup",
  "category": "Touch - Config Library",
  "rank": 30,
  "icon": extensionTutorInitialSetupIcon,
  ui: {
    stepContentHeight: 440,
    interactiveContentWidth: 732,
    interactiveImageHeight: 300
  }
}
