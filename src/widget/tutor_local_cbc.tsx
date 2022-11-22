import React, { useEffect, useState, useRef } from "react";

import {
    Stack,
    Box,
    Button,
    Paper,
    Typography
} from "@mui/material";

import {
    SendGetImage,
    SendRun,
    GetStaticConfig,
    SendUpdateStaticConfig,
    SendTutorAction
} from "./tutor_api";

import { CommonChart } from "./widget_common_chart";

export const AttributesLocalCBC = {
    title: "Calculate Local CBC",
    description: [
        `Do not touch the sensor, and press "Start CBC calculation" button. WebDS will suggest new setting after calculation.`
    ],
    descriptionApply: [
        `Compare baseline images. Press "Cancel" button to recalculate local CBC, or press "Apply" button to apply tuning result.`
    ]
};

interface IProps {
    updateInitState: any;
    onDone: any;
    onContentUpdate: any;
    updateTuningResult: any;
    onBusy: any;
}

interface IRange {
    name: any;
    value: any;
}
//const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const BUTTON_RADIUS = 2;
const BUTTON_WIDTH = 100;
const BUTTON_HEIGHT = 36;
const rpi4 = true;

export const TutorLocalCBC = (props: IProps) => {
    const [cbcCurrent, setCbcCurrent] = useState<number[]>([]);
    const [cbcPrev, setCbcPrev] = useState<number[]>([]);
    const [progress, setProgress] = useState(0);
    const [frameCount, setFrameCount] = useState(10);
    const [state, setState] = useState("idle");

    const cbcRange = useRef<IRange[]>([]);

    const [imageProcessing, setImageProcessing] = useState(false);
    const imageA = useRef([]);
    const imageB = useRef([]);

    const preRange = useRef([0, 0]);
    const postRange = useRef([0, 0]);

    const eventSource = useRef<undefined | EventSource>(undefined);
    const eventError = useRef(false);
    const dataReady = useRef(false);
    const sseTimer = useRef(0);

    function convertCbcToString(cbc: any) {
        let strValue = cbc.map((v: any, i: any) => {
            if (v === 32) {
                return "0";
            } else if (v < 32) {
                return (v / 2).toString();
            } else {
                return "-" + ((v - 32) / 2).toString();
            }
        });
        return strValue;
    }

    function convertStringToCbc(cbc: any) {
        let value = cbc.map((v: any, i: any) => {
            if (v === 0) {
                return 32;
            } else if (v > 0) {
                return v * 2;
            } else {
                return 0 - v * 2 + 32;
            }
        });
        return value;
    }

    async function GetLocalCBC(): Promise<number[]> {
        try {
            let config: any = await GetStaticConfig();
            let cbc: any = config["imageCBCs"];
            return convertCbcToString(cbc);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    function getPostImage() {
        SendGetImage("baseline")
            .then((ret) => {
                imageB.current = ret;
                dataReady.current = true;
                setImageProcessing(false);
                setState("done");

                updateContent(drawChart());
                props.updateTuningResult({
                    preParams: preRange.current,
                    postParams: postRange.current
                });
            })
            .catch((err) => {
                dataReady.current = true;
                setImageProcessing(false);
                alert("eventHandler error");
                alert(err);
                setState("start");
            });
    }

    const eventType = "LocalCBC";
    const eventRoute = "/webds/tutor/event";

    const eventHandler = (event: any) => {
        const data = JSON.parse(event.data);

        if (data.state === "run") {
            setProgress(data.progress);
        } else if (data.state === "stop") {
            setCbcCurrent(convertCbcToString(data.data));
            getPostImage();
            props.onBusy(false);
        }
    };

    function getImageRange(image: any) {
        var maxRow = image.map(function (row: any) {
            return Math.max.apply(Math, row);
        });
        var max = Math.max.apply(null, maxRow);

        var minRow = image.map(function (row: any) {
            return Math.min.apply(Math, row);
        });
        var min = Math.min.apply(null, minRow);
        console.log(min, max);
        return [min, max];
    }

    function drawChart() {
        preRange.current = getImageRange(imageA.current);
        postRange.current = getImageRange(imageB.current);
        return (
            <CommonChart
                preParams={preRange.current}
                postParams={postRange.current}
            />
        );
    }

    function updateContent(content: any) {
        props.onContentUpdate(content);
    }

    async function testSSE() {
        let counter = 0;

        sseTimer.current = setInterval(() => {
            counter = counter + 1;
            setProgress(counter);
            if (counter === 100) {
                clearInterval(sseTimer.current);

                getPostImage();
            }
        }, 5);
    }

    const removeEvent = () => {
        const SSE_CLOSED = 2;
        if (eventSource.current && eventSource.current!.readyState !== SSE_CLOSED) {
            eventSource.current!.removeEventListener(eventType, eventHandler, false);
            eventSource.current!.close();
            eventSource.current = undefined;
        }
    };

    const errorHandler = (error: any) => {
        eventError.current = true;
        removeEvent();
        console.error(`Error on GET ${eventRoute}\n${error}`);
    };

    const addEvent = () => {
        setProgress(0);
        if (eventSource.current) {
            return;
        }
        eventError.current = false;
        eventSource.current = new window.EventSource(eventRoute);
        eventSource.current!.addEventListener(eventType, eventHandler, false);
        eventSource.current!.addEventListener("error", errorHandler, false);
    };

    useEffect(() => {
        console.log("TUTOR LOCAL CBC INIT");
        setFrameCount(10); //fixme
        updateContent(<></>);
        props.updateInitState(false);

        GetLocalCBC().then((cbc) => {
            props.updateInitState(true);
            setCbcPrev(cbc);
            setCbcCurrent(cbc);
        });

        cbcRange.current = [...Array(63)].map((v, i) => {
            let value = 15.5 - i * 0.5;
            let ret = { value: value.toString(), name: "" };
            if (value > 0) {
                ret.name = "+" + value.toString();
            } else {
                ret.name = value.toString();
            }
            return ret;
        });
    }, []);

    async function SendCollectCBC() {
        SendRun("LocalCBC", { frameCount: frameCount })
            .then((ret) => {
                console.log(ret);
            })
            .catch((err) => {
                alert(err);
            });
    }

    async function onAction(action: any) {
        let data;
        console.log("ON ACTION:", action);
        switch (action) {
            case "start":
                props.onBusy(true);
                setState("process");
                setProgress(0);
                setImageProcessing(true);
                dataReady.current = false;

                let image = await SendGetImage("baseline");
                imageA.current = image;
                try {
                    if (rpi4) {
                        addEvent();

                        await SendCollectCBC();
                    } else {
                        //await SendCollectCBC();
                        testSSE();
                    }
                } catch (err) {
                    alert(err);
                }
                break;
            case "terminate":
                if (rpi4) {
                    removeEvent();
                    try {
                        await SendTutorAction("LocalCBC", "terminate", {});
                    } catch (e) {
                        alert(e.toString());
                    }
                } else {
                    clearInterval(sseTimer.current);
                }
                setState("idle");
                props.onBusy(false);
                dataReady.current = true;
                break;
            case "cancel":
                data = await SendUpdateStaticConfig({
                    imageCBCs: convertStringToCbc(cbcPrev)
                });
                console.log(data);
                setState("start");
                break;
            case "apply":
                data = cbcCurrent.map((value) => {
                    let num = Number(value);
                    if (num === 0) {
                        return 0;
                    }
                    if (num > 0) {
                        return num * 2;
                    } else {
                        num = Math.abs(num) * 2 + 32;
                        return num;
                    }
                });
                await SendUpdateStaticConfig({ imageCBCs: data });
                setState("start");
                break;
        }
        //props.onAction(action);
        console.log("ON ACTION END");
    }

    function showProgress() {
        return (
            <Stack direction="row" justifyContent="center" alignItems="center">
                <Box
                    sx={{
                        width: BUTTON_WIDTH,
                        height: "98%",
                        position: "relative",
                        display: "inline-flex",
                        borderRadius: BUTTON_RADIUS,
                        overflow: "hidden"
                    }}
                >
                    <Box
                        sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: "absolute",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "left"
                        }}
                    >
                        <Paper
                            sx={{
                                bgcolor: "#ecebe5",
                                borderRadius: BUTTON_RADIUS
                            }}
                        />
                    </Box>
                    <Box
                        sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: "absolute",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "left"
                        }}
                    >
                        <Paper
                            sx={{
                                bgcolor: "#ffa777",
                                width: progress < 2 ? 0 : (progress * BUTTON_WIDTH) / 100,
                                height: "98%",
                                borderRadius: BUTTON_RADIUS
                            }}
                        />
                    </Box>
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
                        <Typography variant="overline" display="block">
                            Cancel
            </Typography>
                    </Box>
                    <Button
                        onClick={() => {
                            onAction("terminate");
                        }}
                        variant="outlined"
                        sx={{
                            width: BUTTON_WIDTH,
                            height: BUTTON_HEIGHT,
                            borderRadius: BUTTON_RADIUS,
                            border: 1
                        }}
                    />
                </Box>
            </Stack>
        );
    }

    function onDone() {
        let data = cbcCurrent.map((value) => {
            let num = Number(value);
            if (num === 0) {
                return 0;
            }
            if (num > 0) {
                return num * 2;
            } else {
                num = Math.abs(num) * 2 + 32;
                return num;
            }
        });
        props.onDone({ imageCBCs: data });
    }

    return (
        <Stack direction="column" spacing={3}>
            <Typography
                sx={{
                    display: "inline-block",
                    whiteSpace: "pre-line",
                    fontSize: 12
                }}
            >
                Remove all conductive objects from the sensor. Do not touch the sensor.
                Press start to begin coarse baseline adjustment. When complete the
                baseline distribution should appear smaller and closer to center than
                before tuning.
      </Typography>
            <Stack alignItems="center" sx={{ m: 2 }}>
                {state === "idle" && (
                    <Button
                        sx={{ width: BUTTON_WIDTH, borderRadius: BUTTON_RADIUS }}
                        onClick={() => {
                            onAction("start");
                        }}
                    >
                        Start
                    </Button>
                )}
                {state === "process" && showProgress()}
                {state === "done" && (
                    <Button
                        disabled={imageProcessing}
                        sx={{
                            width: BUTTON_WIDTH,
                            borderRadius: BUTTON_RADIUS,
                            backgroundColor: "text.disabled"
                        }}
                        onClick={() => {
                            onDone();
                        }}
                    >
                        Done
                    </Button>
                )}
            </Stack>
        </Stack>
    );
};
