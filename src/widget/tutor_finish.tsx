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
} from "@mui/material";


export const AttributesFinish = {
    title: "Finish Tuning",
    description: [
        `Write To Flash -> All changes will be permanent and will be used even after the sensor firmware restart.`,
        `Cancel         -> All changes will be applied to the RAM and will be reset to default after the sensor firmware restart`
    ]
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
            switch (action) {
                case "toflash":
                    break;
                default:
                    break;
            }
        }
    }));

    useEffect(() => {
        console.log("TUTOR FINISH INIT");
        props.updateRef(this);
        props.updateInitState(true);
    }, []);

    function TutorContent(): JSX.Element {
        return (
            <Stack direction="column" spacing={3}>
                {props.state.apply === 0 && (
                    <Paper elevation={0}>
                        <Stack direction="column" spacing={2}>
                        </Stack>
                    </Paper>
                )}
            </Stack>
        );
    }

    function showDescription() {
        let description = AttributesFinish.description;
        return (
            <>
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
            </>
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
