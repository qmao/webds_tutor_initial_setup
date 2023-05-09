import React, { useEffect, useRef } from "react";

import { Typography, Stack, Button } from "@mui/material";

import { CommonChart } from "./widget_common_chart";

import {
    SendUpdateStaticConfig,
    SendRun,
    SendTutorAction,
    GetStaticConfig
} from "./tutor_api";

export const AttributesMaxCapacitance = {
    title: "Dynamic Range",
    description: [
        `Place a grounded conductive object on the sensor.`,
        `Be sure to cover at least 3 full pixels with the object.`,
        `Slowly move the object around the sensor trying to find the
    large response (shown on right).`,
        `Hit start to begin collection and done when complete`
    ]
};

interface IProps {
    updateInitState: any;
    onContentUpdate: any;
    onDone: any;
    tuningParams: any;
    onBusy: any;
}

export const TutorMaxCapacitance = (props: IProps) => {
    const [dataReady, setDataReady] = React.useState(false);
    const [state, setState] = React.useState("");

    const eventSource = useRef<undefined | EventSource>(undefined);
    const eventError = useRef(false);
    const sseTimer = useRef(0);

    const sMax = useRef(0);
    const cMax = useRef(0);
    const cDefaultMax = useRef(0);

    const eventType = "MaxCapacitance";
    const eventRoute = "/webds/tutor/event";

    function updateContent(content: any) {
        props.onContentUpdate(content);
    }

    const eventHandler = (event: any) => {
        const data = JSON.parse(event.data);

        if (data.state === "run") {
            cMax.current = data.value.cum_max;
            sMax.current = data.value.max;
        }
    };

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
        if (eventSource.current) {
            return;
        }
        eventError.current = false;
        eventSource.current = new window.EventSource(eventRoute);
        eventSource.current!.addEventListener(eventType, eventHandler, false);
        eventSource.current!.addEventListener("error", errorHandler, false);
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
            let ret = await SendTutorAction("MaxCapacitance", "terminate", {});
            console.log(ret);
        } catch (e) {
            alert(e);
        }
    }

    async function SendCollectMaxCap() {
        SendRun("MaxCapacitance", {})
            .then((ret) => {
                console.log(ret);
            })
            .catch((err) => {
                alert(err);
            });
    }

    function drawChart(last: any) {
        return (
            <CommonChart
                preParams={props.tuningParams[0]}
                postParams={props.tuningParams[1]}
                cumulativeMax={cMax.current}
                currentMax={sMax.current}
                last={last}
            />
        );
    }

    async function updateCapChart() {
        updateContent(drawChart(false));
        if (sseTimer.current === 0) return;
        requestAnimationFrame(updateCapChart);
    }

    async function action(action: any) {
        let data;
        setDataReady(false);
        setState(action);
        switch (action) {
            case "start":
                props.onBusy(true);

                addEvent();
                sseTimer.current = 1;
                updateCapChart();
                await SendCollectMaxCap();

                break;
            case "apply":
                data = await SendUpdateStaticConfig({
                    saturationLevel: cMax.current
                });
                console.log(data);
                break;
            case "clear":
                data = await SendClearMaxCap();
                console.log(data);
                break;
            case "cancel":
                cMax.current = 0;
                sMax.current = 0;
                data = await SendUpdateStaticConfig({
                    saturationLevel: cDefaultMax.current
                });
                console.log(data);
                break;
            case "accept":
                sseTimer.current = 0;
                removeEvent();
                await SendTerminateMaxCap();
                setDataReady(true);

                sMax.current = cMax.current;
                updateContent(drawChart(true));
                props.onBusy(false);
                break;
            default:
                break;
        }
    }

    async function GetMaxCapFromStaticConfig(): Promise<number> {
        try {
            let config: any = await GetStaticConfig();
            let data: any = config["saturationLevel"];
            return data;
        } catch (err) {
            return Promise.reject(err);
        }
    }

    useEffect(() => {
        console.log("TUTOR MAX CAP INIT");
        //updateContent(<></>);
        props.updateInitState(false);

        sMax.current = 0;
        cMax.current = 0;

        GetMaxCapFromStaticConfig().then((data) => {
            props.updateInitState(true);
            cDefaultMax.current = data;
        });

        return () => {
            removeEvent();
        };
    }, []);

    function showDescription() {
        let description = AttributesMaxCapacitance.description;
        return (
            <Stack sx={{ minHeight: 100 }}>
                {description.map((value) => {
                    return (
                        <Typography
                            variant="subtitle2"
                            gutterBottom
                            key={`Typography-max-cap-des-${value}`}
                            sx={{ fontSize: 12 }}
                            style={{ whiteSpace: "normal" }}
                        >
                            {value}
                        </Typography>
                    );
                })}
            </Stack>
        );
    }

    return (
        <Stack direction="column" spacing={2}>
            <Stack direction="row" alignItems="flex-start" spacing={3} sx={{ m: 1 }}>
                <Stack direction="column">{showDescription()}</Stack>
            </Stack>
            <Stack alignItems="center" sx={{ m: 2 }}>
                {state === "start" && (
                    <Button
                        variant="contained"
                        sx={{
                            width: 100,
                            borderRadius: 2
                        }}
                        onClick={() => {
                            action("accept");
                        }}
                    >
                        Accept
                    </Button>
                )}
                {state === "accept" && (
                    <Button
                        variant="contained"
                        disabled={dataReady === false}
                        sx={{
                            width: 100,
                            borderRadius: 2,
                            backgroundColor: "text.disabled"
                        }}
                        onClick={() => {
                            props.onDone({
                                saturationLevel: cMax.current
                            });
                        }}
                    >
                        Done
                    </Button>
                )}
                {state === "" && (
                    <Button
                        variant="contained"
                        sx={{
                            width: 100,
                            borderRadius: 2
                        }}
                        onClick={() => {
                            action("start");
                        }}
                    >
                        Start
                    </Button>
                )}
            </Stack>
        </Stack>
    );
};
