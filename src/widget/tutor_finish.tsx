import React, {
    forwardRef,
    useImperativeHandle,
    useEffect,
    useRef
} from "react";

import {
    Typography,
    Stack
} from "@mui/material";

import { SendWriteToFlash } from "./tutor_api";

export const AttributesFinish = {
    title: "Finish Tuning",
    description: []
};

interface IProps {
    state: any;
    updateRef: any;
    updateInitState: any;
    onAction: any;
}

export const TutorFinish = forwardRef((props: IProps, ref: any) => {

    const stateRef = useRef(props.state);

    useEffect(() => {
        stateRef.current = props.state;
    }, [props.state]);

   
    useImperativeHandle(ref, () => ({
        async action(action: any) {
            try {
                switch (action) {
                    case "toflash":
                        await SendWriteToFlash();
                        break;
                    default:
                        break;
                }
            }
            catch (e) {
                alert(e.toString());
            }
        }
    }));

    useEffect(() => {
        console.log("TUTOR FINISH INIT");
        props.updateRef(this);
        props.updateInitState(true);
    }, []);

    function showDescription() {
        return (
            <>
                <Typography variant="caption" display="block" sx={{ fontWeight: 'bold'}}>
                    Write To FLASH
                </Typography>
                <Typography
                    variant="caption"
                    display="block"
                    gutterBottom
                    sx={{ pl: 2 }}
                >
                    All changes will be permanent and will be used even after the sensor
                    firmware restart.
                </Typography>
                <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                    Cancel
                </Typography>
                <Typography
                    variant="caption"
                    display="block"
                    gutterBottom
                    sx={{ pl: 2 }}
                >
                    All changes will be applied to the RAM and will be reset to default
                    after the sensor firmware restart
                </Typography>
            </>
        );
    }

    return (
        <Stack spacing={2}>
            <Stack direction="row" alignItems="flex-start" spacing={3} sx={{ m: 1 }}>
                <Stack direction="column" sx={{mt: 5, ml: 1}}>
                    {showDescription()}
                </Stack>
            </Stack>
        </Stack>
    );
});
