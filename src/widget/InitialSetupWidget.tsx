import { ReactWidget } from '@jupyterlab/apputils';
import React  from 'react';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import InitialSetupComponent from "./InitialSetupComponent";


/**
* A Counter Lumino Widget that wraps a CounterComponent.
*/
export class InitialSetupWidget extends ReactWidget {
    _id: string;
    _settingRegistry: ISettingRegistry;
    /**
    * Constructs a new CounterWidget.
    */
    constructor(id: string, settingRegistry: ISettingRegistry) {
        super();
        this._id = id;
        this._settingRegistry = settingRegistry;
        console.log(this._settingRegistry);
    }

    render(): JSX.Element {
        return (
            <div id={this._id + "_component"}>
                <InitialSetupComponent settingRegistry={this._settingRegistry}/>
            </div>
        )
    }
}

export default InitialSetupWidget;