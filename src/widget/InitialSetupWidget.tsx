import { ReactWidget } from '@jupyterlab/apputils';
import React  from 'react';

import { WebDSService } from '@webds/service';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import InitialSetupComponent from "./InitialSetupComponent";


/**
* A Counter Lumino Widget that wraps a CounterComponent.
*/
export class InitialSetupWidget extends ReactWidget {
    _id: string;
    _service: WebDSService;
    _settingRegistry: ISettingRegistry | null = null;
    /**
    * Constructs a new CounterWidget.
    */
    constructor(id: string, service: WebDSService, settingRegistry?: ISettingRegistry | null) {
        super();
        this._id = id;
        this._service = service;
        this._settingRegistry = settingRegistry || null;
        console.log(this._settingRegistry);
    }

    render(): JSX.Element {
        return (
            <div id={this._id + "_container"} className="jp-webds-widget-container">
                <div id={this._id + "_content"} className="jp-webds-widget">
                    <InitialSetupComponent service={this._service} settingRegistry={this._settingRegistry}/>
                </div>
                <div className="jp-webds-widget-shadow jp-webds-widget-shadow-top"></div>
                <div className="jp-webds-widget-shadow jp-webds-widget-shadow-bottom"></div>
            </div>
        )
    }
}

export default InitialSetupWidget;