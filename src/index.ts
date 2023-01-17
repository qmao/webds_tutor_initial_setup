import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';

import { WidgetTracker } from '@jupyterlab/apputils';

import { ILauncher } from '@jupyterlab/launcher';

import { InitialSetupWidget } from './widget/InitialSetupWidget'

import { WebDSService, WebDSWidget } from '@webds/service';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { Attributes } from "./constant";

export let webdsService: WebDSService;
export let settingRegistry: ISettingRegistry;

/**
 * Initialization data for the reprogram extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: Attributes.plugin,
  autoStart: true,
  requires: [ILauncher, ILayoutRestorer, ISettingRegistry, WebDSService],
  activate: (
    app: JupyterFrontEnd,
    launcher: ILauncher,
    restorer: ILayoutRestorer,
    settings: ISettingRegistry,
    service: WebDSService ) => {
    console.log('JupyterLab extension ${Attributes.label} is activated!');

	webdsService = service;
	settingRegistry = settings;

    let widget: WebDSWidget;
    const { commands, shell } = app;
    const command = Attributes.command;

    commands.addCommand(command, {
      label: Attributes.label,
      caption: Attributes.caption,
	  icon: Attributes.icon,
      execute: () => {
        if (!widget || widget.isDisposed) {
          let content = new InitialSetupWidget(Attributes.id);

          widget = new WebDSWidget<InitialSetupWidget>({ content });
          widget.id = Attributes.id;
          widget.title.label = Attributes.label;
          widget.title.closable = true;
          widget.title.icon = Attributes.icon;
        }

        if (!tracker.has(widget))
          tracker.add(widget);

        if (!widget.isAttached)
          shell.add(widget, 'main');

        shell.activateById(widget.id);
      }
    });

    // Add launcher
    launcher.add({
      command: command,
      category: Attributes.category,
      rank: Attributes.rank
    });

    let tracker = new WidgetTracker<WebDSWidget>({ namespace: Attributes.id });
    restorer.restore(tracker, { command, name: () => Attributes.id });
  }
};

export default plugin;
