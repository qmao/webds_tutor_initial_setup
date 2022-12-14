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
    _settingRegistry: ISettingRegistry;
    /**
    * Constructs a new CounterWidget.
    */
    constructor(id: string, service: WebDSService, settingRegistry: ISettingRegistry) {
        super();
        this._id = id;
        this._service = service;
        this._settingRegistry = settingRegistry;
        console.log(this._settingRegistry);
    }

    render(): JSX.Element {
        return (
            <div id={this._id + "_component"}>
                <InitialSetupComponent service={this._service} settingRegistry={this._settingRegistry}/>
            </div>
        )
    }
}

export default InitialSetupWidget;