import React, { useEffect, useState } from "react";
import { ISettingRegistry } from "@jupyterlab/settingregistry";

import { Stack, Paper, Typography, CircularProgress } from "@mui/material";

import { ContentStepper } from "./stepper";
import { ThemeProvider } from "@mui/material/styles";

import { WebDSService } from "@webds/service";
import { WidgetAttributes } from "./widget_constant";

const HEIGHT_TITLE = 70;
const HEIGHT_CONTENT_MIN = 300;
const EXTENSION_TITLE = "Initial Setup";

interface IProps {
    service: WebDSService;
    settingRegistry: ISettingRegistry;
}

export default function InitialSetupComponent(props: IProps) {
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
            <Stack spacing={2}>
                <Paper
                    elevation={0}
                    sx={{
                        width: WidgetAttributes.rootWidgetHeight + "px",
                        height: HEIGHT_TITLE + "px",
                        position: "relative",
                        bgcolor: "section.main"
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)"
                        }}
                    >
                        {EXTENSION_TITLE}
                    </Typography>
                </Paper>

                <Stack
                    direction="row"
                    alignItems="stretch"
                    sx={{
                        width: WidgetAttributes.rootWidgetHeight + "px",
                        minHeight: HEIGHT_CONTENT_MIN + "px",
                        bgcolor: "section.main"
                    }}
                >
                    {ShowContent()}
                </Stack>
            </Stack>
        );
    }

    const theme = props.service.ui.getWebDSTheme();

    return (
        <div className="jp-webds-widget-body">
            <ThemeProvider theme={theme}>
                <>
                {dataReady && showAll()}
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
               </>
            </ThemeProvider>
        </div>
    );
}
