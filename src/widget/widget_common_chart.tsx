import React from "react";

import { Typography, Stack, Box, Paper, Divider, Tooltip } from "@mui/material";

interface IProps {
    preParams: any;
    postParams: any;
    cumulativeMax?: number;
    currentMax?: number;
    last?: boolean;
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 300;
const CHART_PRETUNING_OFFSET = 70;
const CHART_POSTTUNING_OFFSET = 190;
export const CommonChart = (props: IProps) => {
    function drawChart() {
        const CHART_FONT_SIZE = 12;
        const CHART_TUNING_HEIGHT = 4;

        let preMax = props.preParams[1];
        let preMin = props.preParams[0];

        let postMax = props.postParams[1];
        let postMin = props.postParams[0];

        let baseLineMax = 0;
        if (preMax > baseLineMax) baseLineMax = preMax;
        if (postMax > baseLineMax) baseLineMax = postMax;

        //let maxRange = preMax - preMin;
        //if (postMax - postMin > maxRange) maxRange = postMax - postMin;

        baseLineMax = baseLineMax * 2;

        let postMean = (postMax + postMin) / 2;

        let perStep = 0;
        if (baseLineMax - postMean !== 0)
            perStep = CHART_HEIGHT / ((baseLineMax - postMean) * 2);
        let postHeight = (postMax - postMin) * perStep;
        let preHeight = (preMax - preMin) * perStep;
        let postTop = (baseLineMax - postMax) * perStep;
        let preTop = (baseLineMax - preMax) * perStep;
        if (postHeight < 2) postHeight = 0;
        if (preHeight < 2) preHeight = 0;

        let adcChartMax = 800;
        let adbCumulativeMax = 0;
        if (props.cumulativeMax)
            adbCumulativeMax = props.cumulativeMax;
        let adcCurrentMax = 0;
        if (props.currentMax)
            adcCurrentMax = props.currentMax;

        if (adbCumulativeMax > adcChartMax / 2) {
            adcChartMax = adbCumulativeMax * 2;
        }
        let sinalMax = adcChartMax * 1.3;
        let peakResponse = (adbCumulativeMax * 100) / sinalMax;
        let target = 50;

        let targetAbs = (target * CHART_HEIGHT) / 100;
        let peakAbs = (peakResponse * CHART_HEIGHT) / 100 + targetAbs;
        let total = peakAbs - targetAbs;
        let signalHeight = 0;
        if (adbCumulativeMax !== 0) {
            signalHeight = (adcCurrentMax * total) / adbCumulativeMax;
        }

        return (
            <Stack
                direction="column"
                alignItems="center"
                justifyContent="center"
                sx={{ width: "100%", height: "100%" }}
            >
                <Stack direction="column" alignItems="Left" justifyContent="center">
                    <Typography sx={{ fontSize: CHART_FONT_SIZE }}> ADC</Typography>
                    <Box
                        sx={{
                            borderLeft: 1,
                            borderBottom: 1,
                            width: CHART_WIDTH,
                            height: CHART_HEIGHT,
                            position: "relative",
                            display: "inline-flex",
                            ml: 1.5
                        }}
                    >
                        <Box
                            sx={{
                                left: -40,
                                bottom: peakAbs,
                                right: 0,
                                position: "absolute",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "left",
                                height: 0
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: 12,
                                    ml: 1
                                }}
                                style={{ transform: "scale(0.8)" }}
                            >
                                {props.cumulativeMax}
                            </Typography>
                        </Box>
                        {props.cumulativeMax && (
                            <>
                                <Box
                                    sx={{
                                        left: 0,
                                        bottom: peakAbs,
                                        right: 0,
                                        position: "absolute",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "left",
                                        height: 0
                                    }}
                                >
                                    <Divider
                                        textAlign="right"
                                        sx={{
                                            height: 2,
                                            width: CHART_WIDTH
                                        }}
                                    ></Divider>
                                </Box>
                                <Box
                                    sx={{
                                        bottom: peakAbs + 6,
                                        right: 0,
                                        position: "absolute",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "left",
                                        height: 0
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: 12,
                                            ml: 1
                                        }}
                                        style={{ transform: "scale(0.8)" }}
                                    >
                                        Peak Response
                  </Typography>
                                </Box>
                            </>
                        )}
                        <Box
                            sx={{
                                left: 0,
                                bottom: targetAbs,
                                right: 0,
                                position: "absolute",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "left",
                                height: 0
                            }}
                        >
                            <Divider
                                sx={{
                                    height: 2,
                                    width: CHART_WIDTH
                                }}
                            ></Divider>
                        </Box>
                        <Box
                            sx={{
                                bottom: targetAbs + 6,
                                right: 0,
                                position: "absolute",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "left",
                                height: 0
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: 12,
                                    ml: 1
                                }}
                                style={{ transform: "scale(0.8)" }}
                            >
                                Target
              </Typography>
                        </Box>
                        <Box
                            sx={{
                                top: preTop,
                                left: CHART_PRETUNING_OFFSET,
                                right: 0,
                                position: "absolute",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "left"
                            }}
                        >
                            <Tooltip
                                title={
                                    <div>
                                        Max: {preMax.toString()} <br />
                    Min : {preMin.toString()}
                                    </div>
                                }
                                placement="bottom"
                            >
                                <Paper
                                    id="pre-range"
                                    sx={{
                                        width: 30,
                                        height: preHeight,
                                        backgroundColor: "#ff6000",
                                        borderRadius: 1.5
                                    }}
                                ></Paper>
                            </Tooltip>
                        </Box>
                        {props.last === false && (
                            <Box
                                sx={{
                                    left: CHART_POSTTUNING_OFFSET + 5,
                                    bottom: targetAbs + signalHeight,
                                    right: 0,
                                    position: "absolute",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "left"
                                }}
                            >
                                <Typography
                                    sx={{
                                        width: 20,
                                        fontSize: 12,
                                        textAlign: "center"
                                    }}
                                    style={{ transform: "scale(0.8)" }}
                                >
                                    {props.currentMax}
                                </Typography>
                            </Box>
                        )}
                        <Box
                            sx={{
                                left: CHART_POSTTUNING_OFFSET + 5,
                                bottom: targetAbs,
                                right: 0,
                                position: "absolute",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "left"
                            }}
                        >
                            <Stack direction="column" alignItems="center">
                                <Box
                                    sx={{
                                        width: 20,
                                        height: CHART_TUNING_HEIGHT,
                                        backgroundColor: "#007fc9",
                                        borderRadius: 4
                                    }}
                                ></Box>
                                <Box
                                    sx={{
                                        width: 4,
                                        height: signalHeight - CHART_TUNING_HEIGHT,
                                        backgroundColor: "#007fc9"
                                    }}
                                ></Box>
                            </Stack>
                        </Box>

                        <Box
                            sx={{
                                top: postTop,
                                left: CHART_POSTTUNING_OFFSET,
                                right: 0,
                                position: "absolute",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "left"
                            }}
                        >
                            <Tooltip
                                title={
                                    <div>
                                        Max: {postMax.toString()} <br /> Min : {postMin.toString()}
                                    </div>
                                }
                                placement="bottom"
                            >
                                <Paper
                                    id="post-range"
                                    sx={{
                                        width: 30,
                                        height: postHeight,
                                        backgroundColor: "#ff6000",
                                        borderRadius: 1.5
                                    }}
                                ></Paper>
                            </Tooltip>
                        </Box>
                    </Box>
                    <Stack
                        spacing={0}
                        direction="row"
                        justifyContent="space-evenly"
                        alignItems="center"
                        sx={{ ml: 1, mt: 1 }}
                    >
                        <Typography
                            sx={{
                                fontSize: 12
                            }}
                        >
                            Pre Tuning
            </Typography>
                        <Typography
                            sx={{
                                fontSize: 12
                            }}
                        >
                            Post Tuning
            </Typography>
                    </Stack>
                </Stack>
            </Stack>
        );
    }

    return <>{drawChart()}</>;
};
