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
    InputAdornment
} from "@mui/material";

import { SendGetImage, SendUpdateStaticConfig, SendRun, SendTutorAction, GetStaticConfig } from "./tutor_api";
import { Heatmap } from "./widget_heatmap";

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
    const [signalCumulativeRam, setSignalCumulativeRam] = React.useState(0);

    const [imageProcessing, setImageProcessing] = React.useState(false);
    const [imageA, setImageA] = React.useState([]);
    const [imageB, setImageB] = React.useState([]);

    const stateRef = useRef(props.state);

    const eventSource = useRef(undefined);
    const eventError = useRef(false);
    const dataReady = useRef(false);

    useEffect(() => {
        stateRef.current = props.state;
    }, [props.state]);

    const updateSignal = (max: number, cumulativeMax: number) => {
        setSignalMax(max.toString());
        setSignalCumulativeMax(cumulativeMax.toString());
    };

    const eventType = "MaxCapacitance";
    const eventRoute = "/webds/tutor/event";

    const eventHandler = (event: any) => {
        console.log(event);
        const data = JSON.parse(event.data);

        if (data.state === "run") {
            updateSignal(
                data.value.max,
                data.value.cum_max
            );
        }
    };

    const removeEvent = () => {
        const SSE_CLOSED = 2;
        if (eventSource.current && eventSource.current.readyState !== SSE_CLOSED) {
            eventSource.current.removeEventListener(eventType, eventHandler, false);
            eventSource.current.close();
            eventSource.current = undefined;
        }
    };

    const errorHandler = (error: any) => {
        eventError.current = true;
        removeEvent();
        console.error(`Error on GET ${eventRoute}\n${error}`);
    };

    const addEvent = () => {
        if (eventSource.current) {
            return;
        }
        eventError.current = false;
        eventSource.current = new window.EventSource(eventRoute);
        eventSource.current.addEventListener(eventType, eventHandler, false);
        eventSource.current.addEventListener("error", errorHandler, false);
    };

    async function SendClearMaxCap() {
        SendTutorAction("MaxCapacitance", "reset", {})
            .then((ret) => {
                console.log(ret);
            })
            .catch((err) => {
                alert(err);
            });
    }

    async function SendTerminateMaxCap() {
        SendTutorAction("MaxCapacitance", "terminate", {})
            .then((ret) => {
                console.log(ret);
            })
            .catch((err) => {
                alert(err);
            });
    }

    async function SendCollectMaxCap() {
        SendRun("MaxCapacitance", { })
            .then((ret) => {
                console.log(ret);
            })
            .catch((err) => {
                alert(err);
            });
    }

    async function waitForTaskDone() {
        while (dataReady.current === false) {
            await delay(100);
        }
    }

    useImperativeHandle(ref, () => ({
        async start() {
            setImageProcessing(true);
            console.log("child function start called");
            let image = await SendGetImage("delta");
            setImageA(image);

            addEvent();
            await SendCollectMaxCap();
            await waitForTaskDone();

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
            let data = await SendUpdateStaticConfig({ saturationLevel: signalCumulativeMax});
            console.log("child function apply done", data);
        },
        async clear() {
            console.log("child function clear called");
            let data = await SendClearMaxCap();
            console.log("child function clear done", data);
        },
        async cancel() {
            console.log("child function cancel called");
            let data = await SendUpdateStaticConfig({ saturationLevel: signalCumulativeRam });
            console.log("child function cancel done", data);
        },
        async accept() {
            console.log("child function accept called");
            await SendTerminateMaxCap();
            SendGetImage("delta")
                .then((ret) => {
                    setImageB(ret);
                    dataReady.current = true;
                    setImageProcessing(false);
                })
                .catch((err) => {
                    dataReady.current = true;
                    setImageProcessing(false);
                });
            console.log("child function accept called");
        }
    }));

    async function GetMaxCapFromStaticConfig(): Promise<number> {
        try {
            let config = await GetStaticConfig();
            let data = config["saturationLevel"];
            return data;
        } catch (err) {
            return Promise.reject(err);
        }
    }

    useEffect(() => {
        console.log("TUTOR MAX CAP INIT");
        props.updateRef(this);
        props.updateInitState(false);

        GetMaxCapFromStaticConfig().then((data) => {
            props.updateInitState(true);
            setSignalCumulativeRam(data);
        });
    }, []);

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
                <Heatmap image={image} width={300} />
            </Stack>
        );
    }

    function showImages() {
        if (!imageProcessing) {
            return (
                <Stack
                    spacing={5}
                    direction="row"
                    sx={{ width: "100%" }}
                    alignItems="center"
                    justifyContent="center"
                >
                    {showImage(imageA, "Delta Image Untuned")}
                    {showImage(imageB, "Delta Image Tuned")}
                </Stack>
            );
        } else {
            return <></>;
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
                        {showTextField("Saturation Level", signalCumulativeRam.toString(), "", "2D ADC")}
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
