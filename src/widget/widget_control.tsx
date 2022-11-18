import React from "react";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";

import { Stack, Button } from "@mui/material";
import { WidgetAttributes } from "./widget_constant";

interface IProps {
    step: number;
    count: number;
    busy: boolean;
    updateStep: any;
}

export default function WidgetControl(props: IProps): JSX.Element {
    const handleNext = () => {
        props.updateStep(props.step + 1);
    };

    const handleBack = () => {
        props.updateStep(props.step - 1);
    };

    return (
        <Stack
            direction="row"
            sx={{
                alignItems: "stretch",
                justifyContent: "space-between",
                width: WidgetAttributes.rootWidgetWidth
            }}
        >
            <Button
                size="small"
                disabled={props.busy === true || props.step === 0}
                onClick={handleBack}
                variant="text"
            >
                <KeyboardArrowLeft />
        Back
      </Button>

            <Button
                size="small"
                disabled={props.busy === true || props.step === props.count - 1}
                onClick={handleNext}
                variant="text"
            >
                Next
        <KeyboardArrowRight />
            </Button>
        </Stack>
    );
}
