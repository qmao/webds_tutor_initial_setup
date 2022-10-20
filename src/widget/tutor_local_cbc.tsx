import React, {
    forwardRef,
    useEffect,
    useState,
    useRef,
    useImperativeHandle
} from "react";

import {
    Stack,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    IconButton,
    Avatar,
    Divider,
    Box,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    Button,
    TextField,
    Paper,
    Typography
} from "@mui/material";

import {
    SendGetImage,
    SendRun,
    GetStaticConfig,
    SendUpdateStaticConfig
} from "./tutor_api";

import SettingsIcon from "@mui/icons-material/Settings";
import { Heatmap } from "./widget_heatmap";

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
    state: any;
    updateRef: any;
    updateInitState: any;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PROGRESS_WIDTH = 250;
const PROGRESS_HEIGHT = 30;

export const TutorLocalCBC = forwardRef((props: IProps, ref: any) => {
    const [cbcCurrent, setCbcCurrent] = useState([]);
    const [cbcPrev, setCbcPrev] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [progress, setProgress] = useState(0);
    const [frameCount, setFrameCount] = useState(5);

    const cbcRange = useRef([]);

    const [imageProcessing, setImageProcessing] = useState(false);
    const [imageA, setImageA] = useState([]);
    const [imageB, setImageB] = useState([]);

    const eventSource = useRef(undefined);
    const eventError = useRef(false);
    const dataReady = useRef(false);

    function convertCbcToString(cbc: any) {
        let strValue = cbc.map((v, i) => {
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

    async function GetLocalCBC(): Promise<number[]> {
        try {
            let config = await GetStaticConfig();
            let cbc = config["imageCBCs"];
            return convertCbcToString(cbc);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    /*
    async function qmaoTestSSE() {
        const count = 10;
        setProgress(0);
        for (let i = 0; i < count + 1; i++) {
            await delay(100);
            setProgress((100 / count) * i);
        }

        GetLocalCBC()
            .then(() => {
                return SendGetImage("baseline");
            })
            .then((ret) => {
                return setImageB(ret);
            })
            .then(() => {
                dataReady.current = true;
                setImageProcessing(false);
            })
            .catch((err) => {
                dataReady.current = true;
                setImageProcessing(false);
                alert(err);
            });
    }
    */
 
    const eventType = "LocalCBC";
    const eventRoute = "/webds/tutor/event";

    const eventHandler = (event: any) => {
        console.log(event);
        const data = JSON.parse(event.data);
        console.log(data);
        if (data.state === "stop") {
            setImageProcessing(false);
            GetLocalCBC()
                .then(() => {
                    return SendGetImage("baseline");
                })
                .then((ret) => {
                    setImageB(ret);
                    dataReady.current = true;
                    setImageProcessing(false);
                })
                .catch((err) => {
                    dataReady.current = true;
                    setImageProcessing(false);
                });
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
        setProgress(0);
        if (eventSource.current) {
            return;
        }
        eventError.current = false;
        eventSource.current = new window.EventSource(eventRoute);
        eventSource.current.addEventListener(eventType, eventHandler, false);
        eventSource.current.addEventListener(eventType, errorHandler, false);
    };

    const handleSelectChange = (value: string | any[], index: number) => {
        let newCbc = [...cbcCurrent];
        newCbc[index] = value;
        setCbcCurrent(newCbc);
    };

    useEffect(() => {
        console.log("Progress:", progress);
    }, [progress]);

    useEffect(() => {
        console.log("TUTOR LOCAL CBC INIT");
        props.updateRef(this);

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

    async function waitForTaskDone() {
        while (dataReady.current === false) {
            await delay(100);
        }
    }

    useImperativeHandle(ref, () => ({
        async start() {
            setProgress(0);
            setImageProcessing(true);
            dataReady.current = false;
            try {
                console.log("child function start called");
                let image = await SendGetImage("baseline");
                setImageA(image);

                addEvent();
                await SendCollectCBC();
                ////// qmaoTestSSE();
                await waitForTaskDone();
            } catch (err) {
                alert(err);
            }
            console.log("child function start done");
        },

        async update() {
            console.log("child function update called");

            console.log("child function update done");
        },

        async apply() {
            console.log("child function apply called");
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
            await SendUpdateStaticConfig({ imageCBCs: data });
            console.log("child function apply done");
        }
    }));

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
                    {showImage(imageA, "Baseline Untuned")}
                    {showImage(imageB, "Baseline Tuned")}
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
                <Stack alignItems="flex-start" direction="row" spacing={1}>
                    <Stack alignItems="flex-end" direction="column">
                        <Box
                            alignItems="flex-end"
                            sx={{
                                border: 0,
                                borderColor: "section.main",
                                width: 120,
                                height: 38,
                                mt: 2
                            }}
                        >
                            <Typography
                                sx={{
                                    mt: 1,
                                    fontSize: 12,
                                    textAlign: "center"
                                }}
                            >
                                Image CBC (pF)
              </Typography>
                        </Box>
                        {props.state.apply === 0 && (
                            <Box
                                sx={{
                                    border: 1,
                                    borderColor: "colors.grey",
                                    bgcolor: "section.main",
                                    width: 120
                                }}
                            >
                                <Typography sx={{ textAlign: "center", fontSize: 10 }}>
                                    Was (pF)
                </Typography>
                            </Box>
                        )}
                    </Stack>
                    <Stack direction="row" style={{ overflow: "auto", width: 600 }}>
                        {cbcCurrent.map((value, index) => {
                            return (
                                <FormControl
                                    sx={{ my: 2, minWidth: 60 }}
                                    key={`FormControl-CBC-${value}-${index}`}
                                >
                                    <InputLabel
                                        key={`InputLabel-CBC-${value}-${index}`}
                                        id="demo-simple-select-helper-label"
                                        style={{
                                            fontSize: 16,
                                            display: "block"
                                        }}
                                    >
                                        R{index}
                                    </InputLabel>
                                    <Select
                                        key={`Select-CBC-${value}-${index}`}
                                        readOnly={props.state.apply === 1}
                                        labelId="demo-simple-select-helper-label"
                                        id="demo-simple-select-helper"
                                        defaultValue={value}
                                        value={value}
                                        label="Age"
                                        onChange={(e) => handleSelectChange(e.target.value, index)}
                                        style={{
                                            borderRadius: 0,
                                            fontSize: 10,
                                            fontFamily: "monospace",
                                            padding: "12px 1px 12px 1px",
                                            textAlign: "center"
                                        }}
                                        IconComponent={() => null}
                                        inputProps={{
                                            sx: { padding: "0 !important" }
                                        }}
                                    >
                                        {cbcRange.current.map((element) => {
                                            return (
                                                <MenuItem
                                                    key={`FormHelperText-CBC-${value}-${index}-${element.name}`}
                                                    value={element.value}
                                                >
                                                    {element.name}
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                    {props.state.apply === 0 && (
                                        <Box
                                            key={`FormHelperText-CBC-box-${value}-${index}`}
                                            sx={{
                                                border: 1,
                                                borderColor: "colors.grey",
                                                bgcolor: "section.main"
                                            }}
                                        >
                                            <Typography
                                                key={`FormHelperText-CBC-text-${value}-${index}`}
                                                sx={{
                                                    color: "colors.grey",
                                                    fontSize: 10,
                                                    fontFamily: "monospace",
                                                    textAlign: "center"
                                                }}
                                            >
                                                {cbcPrev[index]}
                                            </Typography>
                                        </Box>
                                    )}
                                </FormControl>
                            );
                        })}
                    </Stack>
                </Stack>
                {props.state.apply === 1 && (
                    <Stack sx={{ px: 2 }}>{TutorContentApply()}</Stack>
                )}
            </Stack>
        );
    }

    function showDescription() {
        let description;
        if (props.state.apply === 0) {
            description = AttributesLocalCBC.description;
        } else {
            description = AttributesLocalCBC.descriptionApply;
        }
        return (
            <>
                {description.map((value) => {
                    return (
                        <Typography
                            variant="subtitle2"
                            gutterBottom
                            key={`Typography-CBC-des-${value}`}
                            sx={{ fontSize: 12 }}
                        >
                            {value}
                        </Typography>
                    );
                })}
            </>
        );
    }

    const handleFrameCountChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        let value = parseInt(event.target.value, 10);
        if (!isNaN(value)) {
            setFrameCount(value);
        }
    };

    function showDialog() {
        return (
            <Dialog onClose={() => setOpenDialog(false)} open={openDialog}>
                <DialogTitle>Set Frame Count</DialogTitle>
                <DialogContent>
                    <TextField
                        required
                        id="outlined-required"
                        defaultValue={frameCount.toString()}
                        onChange={handleFrameCountChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} autoFocus>
                        Apply
          </Button>
                </DialogActions>
            </Dialog>
        );
    }

    function showTutor() {
        return (
            <Stack spacing={2}>
                <Stack
                    direction="row"
                    alignItems="flex-start"
                    spacing={3}
                    sx={{ mx: 2, my: 1 }}
                >
                    <Stack direction="column" sx={{ mt: 2 }}>
                        {showDescription()}
                    </Stack>
                    <IconButton onClick={() => setOpenDialog(true)}>
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                            <SettingsIcon />
                        </Avatar>
                    </IconButton>
                </Stack>
                <Divider />
                <Stack sx={{ px: 2 }}>{TutorContent()}</Stack>
                {showDialog()}
            </Stack>
        );
    }

    function showProgress() {
        return (
            <Stack
                direction="row"
                justifyContent="center"
                alignItems="center"
                sx={{ minHeight: 300 }}
                spacing={2}
            >
                <Box sx={{ position: "relative", display: "inline-flex", mr: 1 }}>
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
                                bgcolor: "#46a832",
                                width: (progress * PROGRESS_WIDTH) / 100,
                                height: PROGRESS_HEIGHT,
                                borderRadius: 5,
                                ml: "1px"
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
                            {progress.toFixed(1) + " %"}
                        </Typography>
                    </Box>
                    <Stack
                        id="outlined-size-small"
                        sx={{
                            width: PROGRESS_WIDTH,
                            height: PROGRESS_HEIGHT,
                            border: 1,
                            borderRadius: 4
                        }}
                    />
                </Box>
            </Stack>
        );
    }
    return <>{props.state.progress === 0 ? showTutor() : showProgress()}</>;
});
