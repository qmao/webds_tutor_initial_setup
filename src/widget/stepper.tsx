import React, { useState, useEffect, useRef } from "react";

import {
    Button,
    Stack,
    Typography,
    Paper,
    Box,
    CircularProgress,
    LinearProgress
} from "@mui/material";

import { TutorLocalCBC, AttributesLocalCBC } from "./tutor_local_cbc";
import {
    TutorMaxCapacitance,
    AttributesMaxCapacitance
} from "./tutor_max_capacitance";

import { Attributes } from "./constant";
import WidgetControl from "./widget_control";

const TEXT_WIDTH_CONNECT = 250;
const STEP_LENGTH = 30;
const STEP_COUNT_MAX = 1;
const DEFAULT_CONTROL_STATE = {
    next: 1,
    back: 0,
    start: 1,
    apply: 0,
    cancel: 0,
    step: 0,
    progress: 0,
    done: 0,
    clear: 0,
    accept: 0,
    onInit: 0
};

export const ContentStepper = (props: any): JSX.Element => {
    const tutorRef = useRef(null);

    const [controlState, setControlState] = useState(DEFAULT_CONTROL_STATE);
    const controlStatePrevRef = useRef(DEFAULT_CONTROL_STATE);
    const actionQueueRef = useRef<string[]>([]);
    const [initState, setInitState] = useState(false);

    function updateTutorRef(ref: any) {
        tutorRef.current = ref;
    }

    function updateInitState(state: any) {
        console.log("STEP updateInitState:", state);
        setInitState(state);
        let newState = JSON.parse(JSON.stringify(controlState));
        newState.onInit = !state;
        setControlState(newState);
    }

    const steps = [
        {
            label: AttributesLocalCBC.title,
            description: (
                <TutorLocalCBC
                    ref={tutorRef}
                    state={controlState}
                    updateRef={updateTutorRef}
                    updateInitState={updateInitState}
                />
            )
        },
        {
            label: AttributesMaxCapacitance.title,
            description: (
                <TutorMaxCapacitance
                    ref={tutorRef}
                    state={controlState}
                    updateRef={updateTutorRef}
                    updateInitState={updateInitState}
                />
            )
        }
    ];

    useEffect(() => {
        const index = steps
            .map((object) => object.label)
            .indexOf(AttributesMaxCapacitance.title);
        console.log("INDEX:", index);
    }, []);

    function showStepTitle(step, index) {
        const btnParam = {
            width: "100%"
        };

        const textParam = {
            fontSize: 16,
            color: "colors.grey"
        };

        const param = {
            bgcolor: "primary.main",
            width: STEP_LENGTH,
            height: STEP_LENGTH,
            borderRadius: "50%"
        };

        if (index === controlState.step) {
            param.bgcolor = "primary.main";
            textParam.color = "primary.main";
        } else {
            param.bgcolor = "colors.grey";
            textParam.color = "colors.grey";
        }

        return (
            <Button
                onClick={() => {
                    ////setActiveStep(index);
                }}
                variant="text"
                style={{ justifyContent: "flex-start" }}
                sx={btnParam}
                startIcon={
                    <Stack justifyContent="center" alignItems="center" sx={param}>
                        <Typography
                            align="center"
                            sx={{
                                fontSize: 1,
                                color: "white"
                            }}
                        >
                            {index}
                        </Typography>
                    </Stack>
                }
            >
                <Typography variant="caption" sx={textParam}>
                    {step.label}
                </Typography>
            </Button>
        );
    }

    const myPromise = async (): Promise<string> => {
        console.log("myPromise start");
        try {
            await tutorRef.current.start();
            return Promise.resolve(JSON.stringify("test"));
        }
        catch (e) {
            alert(e);
            return Promise.reject("connect failed.");
        }
    };

    function onAction(action: string) {
        let newState = JSON.parse(JSON.stringify(DEFAULT_CONTROL_STATE));
        newState.step = controlState.step;
        console.log(action);
        switch (action) {
            case "progress":
                if (controlState.step === 0) {
                    newState.progress = 0;
                    newState.apply = 1;
                    newState.cancel = 1;
                    newState.start = 0;
                } else if (controlState.step === 1) {
                    newState.start = 0;
                    newState.apply = 1;
                    newState.cancel = 1;
                }
                break;
            case "back":
                newState.step = controlState.step - 1;
                break;
            case "next":
                newState.step = controlState.step + 1;
                break;
            case "clear":
                newState = JSON.parse(JSON.stringify(controlState));
                tutorRef.current.clear();
                break;
            case "accept":
                newState.progress = 0;
                newState.apply = 1;
                newState.cancel = 1;
                newState.start = 0;
                tutorRef.current.accept();
                break;
            case "start":
                if (controlState.step === 0) {
                    newState.start = 0;
                    newState.cancel = 1;
                    newState.progress = 1;
                } else if (controlState.step === 1) {
                    newState.start = 0;
                    newState.progress = 1;
                    newState.clear = 1;
                    newState.accept = 1;
                }
                actionQueueRef.current.push("start");
                break;
            case "done":
                newState = JSON.parse(JSON.stringify(DEFAULT_CONTROL_STATE));
                break;
            case "apply":
                tutorRef.current.apply();
                if (controlState.step !== STEP_COUNT_MAX) {
                    newState.step = controlState.step + 1;
                } else {
                    newState.start = 0;
                    newState.done = 1;
                }
                ///////////////////qqqqqqqqq
                break;
            case "terminate":
                actionQueueRef.current.push("terminate");
                break;
            case "cancel":
                break;
        }

        if (newState.step === 0) {
            newState.back = 0;
        } else {
            newState.back = 1;
        }
        if (newState.step === STEP_COUNT_MAX) {
            newState.next = 0;
        } else {
            newState.next = 1;
        }

        console.log(newState);
        setControlState(newState);
    }

    useEffect(() => {
        if (actionQueueRef.current[actionQueueRef.current.length - 1] === "start") {
            actionQueueRef.current.pop();
            //fixme need to handle cancel action properly
            myPromise().then(() => {
                if (actionQueueRef.current[actionQueueRef.current.length - 1] === "terminate") {
                    actionQueueRef.current.pop();
                } else {
                    tutorRef.current.update();
                    onAction("progress");
                }
            });
        }
        controlStatePrevRef.current = controlState;
    }, [controlState]);

    function showStep() {
        return (
            <Stack>
                {steps.map((step, index) => (
                    <Stack
                        direction="column"
                        justifyContent="center"
                        alignItems="flex-start"
                        key={step.label}
                        sx={{ mb: 2, width: TEXT_WIDTH_CONNECT }}
                    >
                        {showStepTitle(step, index)}
                    </Stack>
                ))}
            </Stack>
        );
    }

    function showFeedback() {
        return (
            <Box sx={{ position: "relative", display: "inline-flex", mr: 1 }}>
                <Paper
                    elevation={0}
                    sx={{
                        width: Attributes.ui.interactiveContentWidth,
                        minHeight: Attributes.ui.stepContentHeight
                    }}
                >
                    <Stack>
                        <Typography>{steps[controlState.step].description}</Typography>
                    </Stack>
                    {!initState && (
                        <Box
                            sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: "absolute",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    )}
                </Paper>
            </Box>
        );
    }

    return (
        <Stack direction="column">
            <Stack
                justifyContent="flex-start"
                alignItems="stretch"
                direction="row"
                sx={{ m: 1 }}
            >
                {showStep()}
                {showFeedback()}
            </Stack>
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    height: 16,
                    bgcolor: "palette.background.default"
                }}
            >
                {false && controlState.progress === 1 && (
                    <Box sx={{ width: "100%" }}>
                        <LinearProgress />
                    </Box>
                )}
            </Paper>
            <WidgetControl state={controlState} onAction={onAction} />
        </Stack>
    );
};
