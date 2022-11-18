import React, { useEffect, useState } from "react";
import { ISettingRegistry } from "@jupyterlab/settingregistry";

import { CircularProgress } from "@mui/material";

import { ContentStepper } from "./stepper";
import { ThemeProvider } from "@mui/material/styles";
import WidgetControl from "./widget_control";

import { WebDSService } from "@webds/service";
import { WidgetAttributes } from "./widget_constant";

import { Canvas } from "./mui_extensions/Canvas";
import { Content } from "./mui_extensions/Content";
import { Controls } from "./mui_extensions/Controls";

interface IProps {
  service: WebDSService;
  settingRegistry: ISettingRegistry;
}

export const InitialSetupComponent = (props: IProps): JSX.Element => {
  const [dataReady, setDataReady] = useState(false);
  const [step, setStep] = useState(0);
  const [isBusy, setBusy] = useState(false);

  async function checkConfigJson() {
    let ret;
    if (props.service.pinormos) {
      const external = props.service.pinormos.isExternal();
      if (external) {
        ret = await props.service.packrat.cache.addPublicConfig();
      } else {
        ret = await props.service.packrat.cache.addPrivateConfig();
      }
      console.log(ret);
    }
  }

  useEffect(() => {
    setBusy(false);
    checkConfigJson().then(() => {
      setDataReady(true);
    });
  }, []);

  function updateStep(step: any) {
    setStep(step);
  }

  function ShowContent() {
    return <ContentStepper updateStep={updateStep} step={step} />;
  }

  function showAll() {
    return (
      <Canvas
        title="Initial Setup"
        sx={{ width: WidgetAttributes.rootWidgetWidth + 24 * 2 }}
      >
        <Content>{ShowContent()}</Content>
        <Controls
          sx={{
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <WidgetControl
            updateStep={updateStep}
            count={3}
            step={step}
            busy={isBusy}
          />
        </Controls>
      </Canvas>
    );
  }

  const theme = props.service.ui.getWebDSTheme();

  return (
    <>
      <ThemeProvider theme={theme}>
        <div className="jp-webds-widget-body">{dataReady && showAll()}</div>
        {!dataReady && (
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
        )}
      </ThemeProvider>
    </>
  );
};

export default InitialSetupComponent;
