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
import { WidgetAttributes } from "./widget_constant";

export const AttributesMaxCapacitance = {
    title: "Max Capacitance",
    description: [
        `Place a conductive object that is at least three pixels in diameter on the sensor.`,
        `Make sure the object is well grounded (connected by a metal wire to a ground pin on the board or to the grounded metal sheath of an exposed USB cable connected to the system).`,
        `When ready, click "Start" button.`
    ],
    descriptionProgress: [
        `Move the object slowly to capture the maximum pixel value.`,
        `Click the "Clear" button to re-collect data.`,
        `Click the "Accept" button to accept the result.`,
        ``
    ],
    descriptionApply: [
        `Compare delta images. Press "Cancel" button to recolloect nax capacitance, or press "Apply" button to apply tuning result.`
    ]
};

interface IProps {
    state: any;
    updateInitState: any;
    onAction: any;
}

export const TutorMaxCapacitance = forwardRef((props: IProps, ref: any) => {
    const [signalMax, setSignalMax] = React.useState("");
    const [signalCumulativeMax, setSignalCumulativeMax] = React.useState("");
    const [signalCumulativeRam, setSignalCumulativeRam] = React.useState(0);

    const [imageReady, setImageReady] = React.useState(false);
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
        try {
            let ret = await SendTutorAction("MaxCapacitance", "terminate", {})
            console.log(ret);
        }
        catch (e) {
            alert(e);
        }
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

    useImperativeHandle(ref, () => ({
        async action(action: any) {
            let data;
            switch (action) {
                case "start":
                    let image = await SendGetImage("delta");
                    setImageA(image);

                    addEvent();
                    await SendCollectMaxCap();
                    break;
                case "apply":
                    data = await SendUpdateStaticConfig({ saturationLevel: signalCumulativeMax });
                    console.log(data);
                    break;
                case "clear":
                    data = await SendClearMaxCap();
                    console.log(data);
                    break;
                case "cancel":
                    setSignalCumulativeMax("");
                    setSignalMax("");
                    data = await SendUpdateStaticConfig({ saturationLevel: signalCumulativeRam });
                    console.log(data);
                    break;
                case "accept":
                    removeEvent();
                    await SendTerminateMaxCap();
                    try {
                        let data = await SendGetImage("delta")
                        await setImageB(data);
                    }
                    catch (e) {
                        alert(e.toString());
                    }
                    finally {
                        dataReady.current = true;
                        setImageReady(true);
                    }
                    break;
                default:
                    break;
            }
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
        props.updateInitState(false);
        setImageReady(false);
        setSignalCumulativeMax("");
        setSignalMax("");

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
                <Heatmap image={image} width={WidgetAttributes.HeatmapImageHeight} />
            </Stack>
        );
    }

    function showImages() {
        if (imageReady) {
            return (
                <Stack
                    spacing={5}
                    direction="row"
                    sx={{ width: "100%", pt: 3}}
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

    function TutorContent(): JSX.Element {
        return (
            <Stack direction="column" spacing={3}>
                {props.state.apply === 0 && (
                    <Paper elevation={0}>
                        <Stack direction="column" spacing={2}>
                            {showTextField("Max Signal", signalMax)}
                            {showTextField("Cumulative Max Signal", signalCumulativeMax)}
                            {showTextField("Saturation Level", signalCumulativeRam.toString(), "", "2D ADC")}
                        </Stack>
                    </Paper>
                )}
                {props.state.apply === 1 && (
                    <Stack sx={{ px: 2 }}>{showImages()}</Stack>
                )}
            </Stack>
        );
    }

    function showDescription() {
        let description;
        if (props.state.progress === 1) {
            description = AttributesMaxCapacitance.descriptionProgress;
        }
        else if (props.state.apply === 0) {
            description = AttributesMaxCapacitance.description;
        } else {
            description = AttributesMaxCapacitance.descriptionApply;
        }
        return (
            <Stack sx={{minHeight: 100}}>
                {description.map((value) => {
                    return (
                        <Typography
                            variant="subtitle2"
                            gutterBottom
                            key={`Typography-max-cap-des-${value}`}
                            sx={{ fontSize: 12 }}
                            style={{ whiteSpace: 'normal' }}
                        >
                            {value}
                        </Typography>
                    );
                })}
            </Stack>
        );
    }

    return (
        <Stack spacing={2}>
            <Stack direction="row" alignItems="flex-start" spacing={3} sx={{ m: 1 }}>
                <Stack direction="column">
                    {showDescription()}
                </Stack>
            </Stack>
            <Divider />
            <Stack sx={{ px: 2 }}>{TutorContent()}</Stack>
        </Stack>
    );
});
