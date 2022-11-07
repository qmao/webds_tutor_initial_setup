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
    SendUpdateStaticConfig,
    SendTutorAction
} from "./tutor_api";

import SettingsIcon from "@mui/icons-material/Settings";
import { Heatmap } from "./widget_heatmap";
import { WidgetAttributes } from "./widget_constant";

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
    updateInitState: any;
    onAction: any;
}

interface IRange {
    name: any;
    value: any;
}
//const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PROGRESS_WIDTH = 250;
const PROGRESS_HEIGHT = 30;

export const TutorLocalCBC = forwardRef((props: IProps, ref: any) => {
    const [cbcCurrent, setCbcCurrent] = useState<number[]>([]);
    const [cbcPrev, setCbcPrev] = useState<number[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [progress, setProgress] = useState(0);
    const [frameCount, setFrameCount] = useState(10);

    const cbcRange = useRef<IRange[]>([]);

    const [imageProcessing, setImageProcessing] = useState(false);
    const [imageA, setImageA] = useState([]);
    const [imageB, setImageB] = useState([]);

    const eventSource = useRef<undefined | EventSource>(undefined);
    const eventError = useRef(false);
    const dataReady = useRef(false);

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
            }
            else if (v > 0) {
                return v * 2;
            }
            else {
                return 0 - (v * 2) + 32;
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
        const data = JSON.parse(event.data);

        if (data.state === "run") {
            setProgress(data.progress);
        }
        else if (data.state === "stop") {
            setCbcCurrent(convertCbcToString(data.data));
            SendGetImage("baseline")
                .then((ret) => {
                    setImageB(ret);
                    dataReady.current = true;
                    setImageProcessing(false);
                    props.onAction("progress");
                })
                .catch((err) => {
                    dataReady.current = true;
                    setImageProcessing(false);
                    props.onAction("done");
                });
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
        setProgress(0);
        if (eventSource.current) {
            return;
        }
        eventError.current = false;
        eventSource.current = new window.EventSource(eventRoute);
        eventSource.current!.addEventListener(eventType, eventHandler, false);
        eventSource.current!.addEventListener("error", errorHandler, false);
    };

    const handleSelectChange = (value: any, index: number) => {
        let newCbc: any = [...cbcCurrent];
        newCbc[index] = value;
        setCbcCurrent(newCbc);
    };

    useEffect(() => {
        console.log("TUTOR LOCAL CBC INIT");

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

    useImperativeHandle(ref, () => ({
        async action(action: any) {
            let data;
            switch (action) {
                case "start":
                    setProgress(0);
                    setImageProcessing(true);
                    dataReady.current = false;
                    try {
                        let image = await SendGetImage("baseline");
                        setImageA(image);
                        addEvent();
                        await SendCollectCBC();
                    } catch (err) {
                        alert(err);
                    }
                    break;
                case "terminate":
                    removeEvent();
                    try {
                        await SendTutorAction("LocalCBC", "terminate", {});
                    }
                    catch (e) {
                        alert(e.toString());
                    }
                    dataReady.current = true;
                    break;
                case "cancel":
                    data = await SendUpdateStaticConfig({ imageCBCs: convertStringToCbc(cbcPrev) });
                    console.log(data);
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
                    break;
            }
        }
    }));

    function showImage(image: any, title: any) {
        return (
            <Stack alignItems="center" justifyContent="center">
                <Typography>{title}</Typography>
                <Heatmap image={image} width={300} />
            </Stack>
        );
    }

    function showImages() {
        if (!imageProcessing) {
            console.log("A", imageA);
            console.log("B", imageB);
            return (
                <Stack
                    spacing={5}
                    direction="row"
                    sx={{ width: "100%", pt: 3 }}
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

    function TutorContent(): JSX.Element {
        return (
            <Stack direction="column" spacing={3}>
                {props.state.apply === 0 && (
                <Stack alignItems="flex-start" direction="row" spacing={1}>
                    <Stack alignItems="flex-end" direction="column">
                        <Box
                            alignItems="flex-end"
                            sx={{
                                border: 0,
                                //borderColor: "section.main",
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
                            <Box
                                sx={{
                                    border: 1,
                                    borderColor: "colors.grey",
                                    //bgcolor: "section.main",
                                    width: 120
                                }}
                            >
                                <Typography sx={{ textAlign: "center", fontSize: 10 }}>
                                    Was (pF)
                </Typography>
                            </Box>
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
                                        {cbcRange.current.map((element: any) => {
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
                                                //bgcolor: "section.main"
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
                )}
                {props.state.apply === 1 && (
                    <Stack sx={{ px: 2 }}>
                        {showImages()}
                    </Stack>
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
                            style={{ whiteSpace: 'normal' }}
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
                    {props.state.apply === 0 &&
                        <IconButton onClick={() => setOpenDialog(true)}>
                            <Avatar sx={{ bgcolor: "primary.main" }}>
                                <SettingsIcon />
                            </Avatar>
                        </IconButton>
                    }
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
                sx={{ minHeight: WidgetAttributes.HeatmapImageHeight }}
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
                                borderRadius: 1,
                                borser: 1,
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
                    <Paper
                        elevation={2}
                        id="outlined-size-small"
                        sx={{
                            width: PROGRESS_WIDTH,
                            height: PROGRESS_HEIGHT,
                            borderRadius: 1,
                            border: 1
                        }}
                    />
                </Box>
            </Stack>
        );
    }
    return <>{props.state.progress === 0 ? showTutor() : showProgress()}</>;
});
