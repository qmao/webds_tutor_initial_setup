import React, { useEffect } from "react";

import { Typography, Stack, Button } from "@mui/material";

import { SendWriteToFlash, SendUpdateStaticConfig } from "./tutor_api";

export const AttributesFinish = {
    title: "Apply Changes"
};

interface IProps {
    updateInitState: any;
    onContentUpdate: any;
    config: any;
    onDone: any;
    onMessage: any;
}

export const TutorFinish = (props: IProps) => {
    const [dataReady, setDataReady] = React.useState(
        Object.keys(props.config).length !== 0
    );

    async function action(action: any) {
        let data: any;
        let message: any = "success";
        setDataReady(false);
        try {
            switch (action) {
                case "toFlash":
                    data = await SendWriteToFlash();
                    console.log(data);
                    props.onDone({});
                    setDataReady(true);
                    break;
                case "toRAM":
                    data = await SendUpdateStaticConfig(props.config);
                    console.log(data);
                    setDataReady(true);
                    break;
                default:
                    break;
            }
            props.onMessage({
                state: true,
                severity: "success",
                message: message
            });
        } catch (e) {
            props.onMessage({
                state: true,
                severity: "error",
                message: e.toString()
            });
        }
    }

    useEffect(() => {
        console.log("TUTOR FINISH INIT", this);
        //updateContent(<></>);
    }, []);

    function showDescription() {
        return (
            <>
                <Typography
                    variant="caption"
                    display="block"
                    gutterBottom
                    sx={{
                        display: "inline-block",
                        whiteSpace: "pre-line",
                        fontSize: 12
                    }}
                >
                    Review all changes in the validation panel on the right. When you are
                    happy with the changes. write them to RAM for temporary usage or Flash
                    for permanent usage.
        </Typography>
            </>
        );
    }

    return (
        <Stack spacing={2} direction="column">
            <Stack direction="row" alignItems="flex-start" spacing={3} sx={{ m: 1 }}>
                <Stack direction="column">{showDescription()}</Stack>
            </Stack>
            <Stack
                direction="row"
                spacing={4}
                alignItems="center"
                justifyContent="space-evenly"
                sx={{ m: 2 }}
            >
                <Button
                    disabled={dataReady === false}
                    sx={{
                        width: 125,
                        borderRadius: 2
                    }}
                    onClick={() => {
                        action("toRAM");
                    }}
                >
                    Write to RAM
        </Button>
                <Button
                    disabled={dataReady === false}
                    sx={{
                        width: 125,
                        borderRadius: 2
                    }}
                    onClick={() => {
                        action("toFlash");
                    }}
                >
                    Write to Flash
        </Button>
            </Stack>
        </Stack>
    );
};
