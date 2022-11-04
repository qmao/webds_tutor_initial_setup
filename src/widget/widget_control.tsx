import React, { useEffect } from "react";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";

import { Stack, Button } from "@mui/material";
import { WidgetAttributes } from "./widget_constant";
import { Controls } from "./mui_extensions/Controls";

interface IProps {
    onAction(action: string): any;
    state: any;
    isInitProcess: any;
}

export default function WidgetControl(props: IProps): JSX.Element {
    useEffect(() => {
        console.log("useEffect", props.state);
    }, [props.state]);

    const handleNext = () => {
        props.onAction("next");
    };

    const handleBack = () => {
        props.onAction("back");
    };

    function addActionButtion(show: any, action: any, name: any) {
        return (
            <>
                {show === 1 && (
                    <Button
                        sx={{ width: 150 }}
                        onClick={() => props.onAction(action)}
                        disabled={props.isInitProcess === true}
                    >
                        {name}
                    </Button>
                )}
            </>
        );
    }

    return (
            <Controls
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                }}
        >
            <Stack direction="row" sx={{
                alignItems: "stretch",
                justifyContent: "space-between",
                width: WidgetAttributes.rootWidgetWidth
            }}>
                <Button
                    size="small"
                    disabled={
                        props.state.back === 0 ||
                        props.state.progress === 1 ||
                        props.isInitProcess === true
                    }
                    onClick={handleBack}
                    variant="text"
                >
                    <KeyboardArrowLeft />
          Back
        </Button>
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={3}
                    sx={{ width: 400 }}
                >
                    {addActionButtion(props.state.start, "start", "Start")}
                    {props.state.progress === 0 &&
                        addActionButtion(props.state.cancel, "cancel", "Cancel")}
                    {props.state.progress === 1 &&
                        addActionButtion(props.state.cancel, "terminate", "Cancel")}
                    {addActionButtion(props.state.apply, "apply", "Apply")}
                    {addActionButtion(props.state.clear, "clear", "Clear")}
                    {addActionButtion(props.state.accept, "accept", "Accept")}
                    {addActionButtion(props.state.toflash, "cancel", "Skip")}
                    {addActionButtion(props.state.toflash, "toflash", "Write To Flash")}
                </Stack>
                <Button
                    size="small"
                    disabled={
                        props.state.next === 0 ||
                        props.state.progress === 1 ||
                        props.isInitProcess === true
                    }
                    onClick={handleNext}
                    variant="text"
                >
                    Next
          <KeyboardArrowRight />
                </Button>
                </Stack>
            </Controls>
    );
}
