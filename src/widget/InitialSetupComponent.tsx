import React from "react";
import { ISettingRegistry } from "@jupyterlab/settingregistry";

import { Stack, Paper, Typography } from "@mui/material";

import { ContentStepper } from "./stepper";
import { ThemeProvider } from "@mui/material/styles";

import { WebDSService } from "@webds/service";
////import { getWebDSTheme } from "./ui/mui_theme";

const WIDGET_WIDTH = 1000;
const HEIGHT_TITLE = 70;
const HEIGHT_CONTENT_MIN = 300;
const EXTENSION_TITLE = "Initial Setup";

interface IProps {
    service: WebDSService;
    settingRegistry: ISettingRegistry;
}

export default function InitialSetupComponent(props: IProps) {
    function ShowContent() {
        return <ContentStepper />;
    }

    function showAll() {
        return (
            <Stack spacing={2}>
                <Paper
                    elevation={0}
                    sx={{
                        minWidth: WIDGET_WIDTH + "px",
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
                        minWidth: WIDGET_WIDTH + "px",
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
    ///const theme = getWebDSTheme();

    return (
        <div className="jp-webds-widget-body">
            <ThemeProvider theme={theme}>
                {showAll()}
                <div></div>
            </ThemeProvider>
        </div>
    );
}
