import React, { useEffect } from "react";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";

import { Stack, Button, Zoom } from "@mui/material";

const HEIGHT_CONTROLS = 100;
const WIDGET_WIDTH = 1000;

interface IProps {
    onAction(action: string): any;
    state: any;
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
                    <Zoom in={show}>
                        <Button
                            sx={{ width: 150 }}
                            onClick={() => props.onAction(action)}
                            disabled={props.state.onInit === 1}
                        >
                            {name}
                        </Button>
                    </Zoom>
                )}
            </>
        );
    }

    return (
        <Stack
            justifyContent="center"
            alignItems="center"
            sx={{
                width: WIDGET_WIDTH + "px",
                minHeight: HEIGHT_CONTROLS + "px",
                bgcolor: "section.main"
            }}
        >
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="stretch"
                spacing={2}
                sx={{ width: WIDGET_WIDTH }}
            >
                <Button
                    size="small"
                    disabled={
                        props.state.back === 0 ||
                        props.state.progress === 1 ||
                        props.state.onInit === 1
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
                    {addActionButtion(props.state.apply, "apply", "Write To RAM")}
                    {addActionButtion(props.state.clear, "clear", "Clear")}
                    {addActionButtion(props.state.accept, "accept", "Accept")}
                    {addActionButtion(props.state.toflash, "toflash", "Write To FLASH")}
                </Stack>
                <Button
                    size="small"
                    disabled={
                        props.state.next === 0 ||
                        props.state.progress === 1 ||
                        props.state.onInit === 1
                    }
                    onClick={handleNext}
                    variant="text"
                >
                    Next
          <KeyboardArrowRight />
                </Button>
            </Stack>
        </Stack>
    );
}
