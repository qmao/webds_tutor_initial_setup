import React, { useEffect, useRef, useState } from "react";

import { Stack, Typography, Box } from "@mui/material";
import { ColorTable } from "./widget_constant";

interface IProps {
    image: any;
    width?: any;
    height?: any;
    max?: any;
    min?: any;
    range?: any;
}

const SHOW_INDEX = false;

/*
const theme = (mode: string) => ({
    MuiPaper: {
        styleOverrides: {
            root: {
                "::-webkit-scrollbar": {
                    width: "12px",
                    height: "12px",
                    marginRight: "5px"
                },
                "::-webkit-scrollbar-track": {
                    background: "#E4E7EB",
                    borderRadius: "100px"
                },
                "::-webkit-scrollbar-thumb": {
                    background: "#9e9e9e",
                    borderRadius: "100px"
                },
                "::-webkit-scrollbar-corner": {
                    background: "transparent"
                }
            }
        }
    }
});
*/

export const Heatmap = (props: IProps): JSX.Element => {
    function getMax(data: any): number {
        if (props.max) {
            return props.max;
        }
        var maxRow = data.map(function (row) {
            return Math.max.apply(Math, row);
        });
        var max = Math.max.apply(null, maxRow);
        return max;
    }

    function getMin(data: any): number {
        if (props.min) {
            return props.min;
        }
        var minRow = data.map(function (row) {
            return Math.min.apply(Math, row);
        });
        var min = Math.min.apply(null, minRow);
        return min;
    }

    const PeakMax = useRef(getMax(props.image));
    const PeakMin = useRef(getMin(props.image));
    const imageRow = useRef(-1);
    const imageColumn = useRef(-1);
    const [pixelWidth, setPixelWidth] = useState(-1);
    const [pixelHeight, setPixelHeight] = useState(-1);
    const [pixelRangeHeight, setPixelRangeHeight] = useState(-1);
    const [pixelInfo, setPixelInfo] = useState([-1, -1, -1]);
    const pixelLocation = useRef([0, 0]);
    const [paperWidth, setPaperWidth] = useState(-1);
    const [paperHeight, setPaperHeight] = useState(-1);

    function getIndex(value: number): number {
        value = (value - PeakMin.current) / (PeakMax.current - PeakMin.current);
        //value = value / PeakMax.current;
        if (value > 1) value = 1;
        else if (value < 0) value = 0;
        return Math.round(value * (ColorTable.length - 1));
    }

    function red(value: number): number {
        return ColorTable[value][0];
    }

    function green(value: number): number {
        return ColorTable[value][1];
    }

    function blue(value: number): number {
        return ColorTable[value][2];
    }

    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    const getColorFromMap = (value) => {
        let r = Math.floor(red(value) * 255);
        let g = Math.floor(green(value) * 255);
        let b = Math.floor(blue(value) * 255);
        return [r, g, b];
    };

    useEffect(() => {
        let row = props.image.length;
        let column = props.image[0].length;

        imageRow.current = row;
        imageColumn.current = column;

        let w, h;
        if (props.width && props.height) {
            w = props.width;
            h = props.height;
            setPaperWidth(w);
            setPaperHeight(h);
            setPixelWidth(w / column);
            setPixelHeight(h / row);
        } else if (props.width) {
            w = props.width;
            let l = w / column;
            h = l * row;
            setPixelWidth(l);
            setPixelHeight(l);
            setPaperWidth(w);
            setPaperHeight(h);
        } else if (props.height) {
            h = props.height;
            let l = props.height / row;
            w = l * column;
            setPixelWidth(l);
            setPixelHeight(l);
            setPaperWidth(w);
            setPaperHeight(h);
        }
        setPixelRangeHeight((h - 2) / row);
    }, []);

    function showPixel(row: any, column: any, title: any) {
        return (
            <Typography
                key={`heatmap-text-${row}-${column}`}
                variant="overline"
                style={{
                    backgroundColor: "transparent"
                }}
                sx={{
                    borderRadius: 0,
                    border: 1,
                    borderColor: "pink",
                    width: pixelWidth,
                    height: pixelHeight,
                    fontSize: 12,
                    textAlign: "center"
                }}
            >
                {title}
            </Typography>
        );
    }

    function hover(
        e: any,
        y: number | undefined,
        x: number | undefined,
        value: number | undefined,
        state: boolean
    ) {
        if (state) {
            pixelLocation.current = [x * pixelWidth - 10, y * pixelHeight + 10];
            setPixelInfo([x, y, value]);
        } else {
            setPixelInfo([-1, -1, -1]);
        }
    }

    function showPixelContent(element: any, row: any, column: any) {
        let index = getIndex(element);
        let color = getColorFromMap(index);
        let bgColor = rgbToHex(color[0], color[1], color[2]);

        return (
            <Stack
                key={`heatmap-text-${row}-${column}`}
                sx={{
                    borderRadius: 0,
                    /*borderColor: "pink", */
                    width: pixelWidth,
                    height: pixelHeight,
                    backgroundColor: bgColor,
                    "&:hover": {
                        borderColor: "pink",
                        border: 1,
                        width: pixelWidth - 2,
                        height: pixelHeight - 2
                    }
                }}
                onMouseEnter={(e) => hover(e, row, column, element, true)}
                onMouseLeave={(e) => hover(e, row, column, element, false)}
            ></Stack>
        );
    }

    function showRange() {
        //PeakMax PeakMin
        let step = (PeakMax.current - PeakMin.current) / imageRow.current;
        let range = Array.from(Array(imageRow.current).keys()).map((v) => {
            let element = PeakMax.current - step * v;
            let index = getIndex(element);
            let color = getColorFromMap(index);
            let bgColor = rgbToHex(color[0], color[1], color[2]);
            return bgColor;
        });

        return (
            <Box sx={{ position: "relative", display: "inline-flex" }}>
                <Stack
                    sx={{
                        width: 30,
                        height: paperHeight - 2,
                        border: 1,
                        borderColor: "black"
                    }}
                >
                    {range.map((v) => (
                        <Stack
                            key={`range-color-${v}`}
                            sx={{ backgroundColor: v, height: pixelRangeHeight }}
                        ></Stack>
                    ))}
                </Stack>
                <Stack
                    position="absolute"
                    top="0px"
                    left="0px"
                    right="0px"
                    justifyContent="center"
                    alignItems="center"
                    style={{ transform: "scale(0.7)" }}
                >
                    <Typography sx={{ fontSize: 12, color: "black" }}>{PeakMax.current}</Typography>
                </Stack>
                <Stack
                    position="absolute"
                    bottom="0px"
                    left="0px"
                    right="0px"
                    justifyContent="center"
                    alignItems="center"
                    style={{ transform: "scale(0.7)" }}
                >
                    <Typography sx={{ color: "#F9F9F9", fontSize: 12 }}>
                        {PeakMin.current}
                    </Typography>
                </Stack>
            </Box>
        );
    }

    return (
        <>
            {paperWidth === -1 ? (
                <Stack sx={{ width: props.width }}></Stack>
            ) : (
                    <Stack direction="row" spacing={1}>
                        {showRange()}
                        <Box sx={{ position: "relative", display: "inline-flex" }}>
                            <Stack
                                sx={{
                                    overflow: "auto",
                                    width: paperWidth,
                                    height: paperHeight,
                                    "::-webkit-scrollbar": {
                                        width: "12px",
                                        height: "12px",
                                        marginRight: "5px"
                                    },
                                    "::-webkit-scrollbar-track": {
                                        background: "#E4E7EB",
                                        borderRadius: "100px"
                                    },
                                    "::-webkit-scrollbar-thumb": {
                                        background: "#9e9e9e",
                                        borderRadius: "100px"
                                    },
                                    "::-webkit-scrollbar-corner": {
                                        background: "transparent"
                                    }
                                }}
                            >
                                <Stack justifyContent="flex-start" alignItems="flex-start">
                                    {SHOW_INDEX && (
                                        <Stack direction="row">
                                            {showPixel(1, 1, "C/R")}
                                            {props.image[0].map((value, index) => (
                                                <> {showPixel(1, 1, `${index}`)}</>
                                            ))}
                                        </Stack>
                                    )}
                                    {props.image.map((value, row) => (
                                        <Stack direction="row" key={`heatmap-stack-top-${row}`}>
                                            <Stack
                                                direction="column"
                                                spacing={0}
                                                key={`heatmap-stack-root-${row}`}
                                            >
                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    key={`heatmap-stack-sub-${row}`}
                                                >
                                                    {value.map((element, column) =>
                                                        showPixelContent(element, row, column)
                                                    )}
                                                </Stack>
                                            </Stack>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Stack>
                            {pixelInfo[0] !== -1 && (
                                <Stack
                                    position="absolute"
                                    top={pixelLocation.current[1]}
                                    left={pixelLocation.current[0]}
                                    style={{
                                        pointerEvents: "none",
                                        transform: "scale(0.8)"
                                    }}
                                    sx={{
                                        borderRadius: 1,
                                        border: 1,
                                        backgroundColor: "white",
                                        borderColor: "black",
                                        p: 0.5
                                    }}
                                >
                                    <Typography sx={{ color: "black", fontSize: 12 }}>X={pixelInfo[0]}</Typography>
                                    <Typography sx={{ color: "black", fontSize: 12 }}>Y={pixelInfo[1]}</Typography>
                                    <Typography sx={{ color: "black", fontSize: 12 }}>V={pixelInfo[2]}</Typography>
                                </Stack>
                            )}
                        </Box>
                    </Stack>
                )}
        </>
    );
};
