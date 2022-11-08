import React, { useEffect, useState } from "react";
import { ISettingRegistry } from "@jupyterlab/settingregistry";

import { CircularProgress } from "@mui/material";

import { ContentStepper } from "./stepper";
import { ThemeProvider } from "@mui/material/styles";

import { WebDSService } from "@webds/service";
import { WidgetAttributes } from "./widget_constant";

import { Canvas } from "./mui_extensions/Canvas";
import { Content } from "./mui_extensions/Content";


interface IProps {
    service: WebDSService;
    settingRegistry: ISettingRegistry;
}

export const InitialSetupComponent = (props: IProps): JSX.Element => {

    const [dataReady, setDataReady] = useState(false);

    async function checkConfigJson() {
        let ret;
        const external = props.service.pinormos.isExternal();
        if (external) {
            ret = await props.service.packrat.cache.addPublicConfig();
        } else {
            ret = await props.service.packrat.cache.addPrivateConfig();
        }
        console.log(ret);
    }

    useEffect(() => {
        checkConfigJson().then(() => {
            setDataReady(true);
        })
    }, []);

    function ShowContent() {
        return <ContentStepper />;
    }

    function showAll() {
        return (
            <Canvas title="Initial Setup" sx={{ width: WidgetAttributes.rootWidgetWidth + 24 * 2 }}>
                <Content sx={{ p: 0 }}>
                    {ShowContent()}
                </Content>
            </Canvas>
        );
    }

    const theme = props.service.ui.getWebDSTheme();

    return (
        <>
            <ThemeProvider theme={theme}>
            <div className="jp-webds-widget-body">
                {dataReady && showAll()}
            </div>
            {!dataReady &&
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)"
                    }}
                >
                    <CircularProgress color="primary" />
                </div>
            }
            </ThemeProvider>
        </>
    );
}

export default InitialSetupComponent;