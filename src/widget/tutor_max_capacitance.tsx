import React, {
    forwardRef,
    useImperativeHandle,
    useEffect,
    useRef
} from "react";

import {
    Typography,
    Stack,
    Divider,
    Paper,
    TextField,
    InputAdornment,
    CircularProgress
} from "@mui/material";

import { SendGetImage, SendUpdateStaticConfig } from "./tutor_api";
import { Heatmap } from "./widget_heatmap";
import { Attributes } from "./constant";

export const AttributesMaxCapacitance = {
    title: "Max Capacitance",
    description: [
        `Place a conductive object that is at least three pixels in diameter on the sensor.`,
        `
    Make sure the object is well grounded (connected by a metal wire to a ground pin on the board or to the grounded metal sheath of an exposed USB cable connected to the system).`,
        `
    When ready, click "Collect Signal" button.`,
        `Move the object slowly to capture the maximum pixel value.`,
        `To accept the result, click the "Accept" button.`
    ]
};

interface IProps {
    state: any;
    updateRef: any;
    updateInitState: any;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const TutorMaxCapacitance = forwardRef((props: IProps, ref: any) => {
    const [signalMax, setSignalMax] = React.useState("");
    const [signalCumulativeMax, setSignalCumulativeMax] = React.useState("");

    const [imageProcessing, setImageProcessing] = React.useState(false);
    const [imageA, setImageA] = React.useState([]);
    const [imageB, setImageB] = React.useState([]);

    const stateRef = useRef(props.state);
    const exitRef = useRef(false);

    useEffect(() => {
        console.log("TUTOR MAX CAPACITANCE INIT");

        props.updateRef(this);
        exitRef.current = false;
        return () => {
            exitRef.current = true;
        };
    }, []);

    useEffect(() => {
        stateRef.current = props.state;
    }, [props.state]);

    const updateSignal = (max: number, cumulativeMax: number) => {
        setSignalMax(max.toString());
        setSignalCumulativeMax(cumulativeMax.toString());
    };

    async function SendCollect() {
        while (stateRef.current.progress === 1 && exitRef.current === false) {
            updateSignal(
                Math.floor(Math.random() * 100),
                Math.floor(Math.random() * 100)
            );
            await delay(150);
        }
    }

    async function setupImage() {
        setImageProcessing(true);
        try {
            let ret = await SendGetImage("delta");
            setImageB(ret);
        } catch (e) {
            console.error(e);
        }
        setImageProcessing(false);
    }

    useImperativeHandle(ref, () => ({
        async start() {
            setImageProcessing(true);
            console.log("child function start called");
            let image = await SendGetImage("delta");
            setImageA(image);

            await SendCollect();
            await setupImage();

            console.log("child function start done");
            console.log("setImageProcessing true");
        },
        async update() {
            console.log("child function update called");
            //setCbcCurrent(Array(RxCount).fill(2.5));
            console.log("child function update done");
        },
        async apply() {
            console.log("child function apply called");
            let data = await SendUpdateStaticConfig({ imageCBCs: [] });
            console.log("child function apply done", data);
        }
    }));

    function showTextField(
        title: string,
        value: string,
        helper?: string,
        unit?: string
    ) {
        return (
            <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="center"
            >
                <Typography
                    variant="caption"
                    display="block"
                    gutterBottom
                    sx={{ width: 140 }}
                    textAlign="right"
                >
                    {title}
                </Typography>
                <TextField
                    hiddenLabel
                    variant="outlined"
                    size="small"
                    helperText={helper}
                    value={value}
                    sx={{ width: 140 }}
                    InputProps={{
                        readOnly: true,
                        endAdornment: (
                            <InputAdornment position="end">
                                <Typography sx={{ fontSize: 10 }}>{unit}</Typography>
                            </InputAdornment>
                        )
                    }}
                />
            </Stack>
        );
    }

    function showImage(image: any, title: any) {
        return (
            <Stack alignItems="center" justifyContent="center">
                <Typography sx={{}}>{title}</Typography>
                <Heatmap
                    image={image}
                    width={700}
                    height={Attributes.ui.interactiveImageHeight}
                />
            </Stack>
        );
    }

    function showImages() {
        if (!imageProcessing) {
            return (
                <Stack spacing={2}>
                    {showImage(imageA, "Delta Image Untuned")}
                    {showImage(imageB, "Delta Image Tuned")}
                </Stack>
            );
        } else {
            return (
                <Stack
                    justifyContent="center"
                    alignItems="center"
                    sx={{ minHeight: 300 }}
                >
                    <CircularProgress />
                </Stack>
            );
        }
    }

    function TutorContentApply(): JSX.Element {
        return <>{showImages()}</>;
    }

    function TutorContent(): JSX.Element {
        return (
            <Stack direction="column" spacing={3}>
                <Paper elevation={0}>
                    <Stack direction="column" spacing={2}>
                        {showTextField("Max Signal", signalMax)}
                        {showTextField("Cumulative Max Signal", signalCumulativeMax)}
                        {showTextField("Saturation Level", "85", "Was: 85", "2D ADC")}
                    </Stack>
                </Paper>
                {props.state.apply === 1 && (
                    <Stack sx={{ px: 2 }}>{TutorContentApply()}</Stack>
                )}
            </Stack>
        );
    }

    return (
        <Stack spacing={2}>
            <Stack direction="row" alignItems="flex-start" spacing={3} sx={{ m: 1 }}>
                <Stack direction="column">
                    {AttributesMaxCapacitance.description.map((value) => {
                        return (
                            <Typography
                                variant="subtitle2"
                                gutterBottom
                                key={`Typography-MaxCapacitance-des-${value}`}
                                sx={{ fontSize: 12 }}
                            >
                                {value}
                            </Typography>
                        );
                    })}
                </Stack>
            </Stack>
            <Divider />
            <Stack sx={{ px: 2 }}>{TutorContent()}</Stack>
        </Stack>
    );
});
