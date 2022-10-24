import { requestAPI } from "../handler";

export async function SendUpdateStaticConfig(dataToSend): Promise<string> {
    try {
        const reply = await requestAPI<any>(`config/static`, {
            body: JSON.stringify(dataToSend),
            method: "POST"
        });
        return Promise.resolve(reply);
    } catch (error) {
        console.log(error);
        return Promise.reject(`run failed: ${error.toString()}`);
    }
}

export async function SendWriteToFlash(): Promise<string | undefined> {
    try {
        var dataToSend = {
            command: "commitConfig"
        };
        const reply = await requestAPI<any>("command", {
            body: JSON.stringify(dataToSend),
            method: "POST"
        });

        return Promise.resolve(JSON.stringify(reply));
    } catch (e) {
        console.error(`Error on POST ${dataToSend}.\n${e}`);
        return Promise.reject((e as Error).message);
    }
};

export async function SendTutorAction(module: any, action: any, settings: any): Promise<string> {
    const dataToSend = {
        task: action,
        settings
    };

    try {
        const reply = await requestAPI<any>(`tutor/${module}`, {
            body: JSON.stringify(dataToSend),
            method: "POST"
        });
        return Promise.resolve(reply);
    } catch (error) {
        console.log(error);
        return Promise.reject(`run failed: ${error.toString()}`);
    }
}

export async function SendRun(module: any, settings: any): Promise<string> {
    const dataToSend = {
        task: "run",
        settings
    };

    try {
        const reply = await requestAPI<any>(`tutor/${module}`, {
            body: JSON.stringify(dataToSend),
            method: "POST"
        });
        return Promise.resolve(reply);
    } catch (error) {
        console.log(error);
        return Promise.reject(`run failed: ${error.toString()}`);
    }
}

/*
const Identify = async (): Promise<string> => {
    let partNumber: string = "none";
    let fw_mode: string = "none";

    try {
        const reply = await requestAPI<any>("command?query=identify", {
            method: "GET"
        });

        fw_mode = reply["mode"];
        if (fw_mode === "application") {
            console.log("appliction mode");
            partNumber = reply["partNumber"];
            return Promise.resolve(partNumber);
        } else {
            return Promise.reject(`invalid fw mode: ${fw_mode}`);
        }
    } catch (error) {
        console.log(error);
        return Promise.reject(`identify failed: ${error.toString()}`);
    }
};
*/

export async function GetStaticConfig(): Promise<string> {
    try {
        let data = await requestAPI<any>(`config/static`, {
            method: "GET"
        });

        return Promise.resolve(data);
    } catch (error) {
        console.error("Error - GET /webds/report");
        return Promise.reject("Failed to get static config");
    }
}

export async function SendGetImageTest() {
    let image = [];

    const c = 40;
    const r = 50;
    Array.from(Array(r).keys()).forEach((item, index) => {
        let row = Array.from(Array(c).keys());
        row = row.map((e) => {
            return e + index;
        });
        image.push(row);
    });
    return image;
}

const getReport = async (rtype: string): Promise<void> => {
    try {
        let data = await requestAPI<any>(`report/${rtype}`, {
            method: "GET"
        });

        let image = data.report;
        if (!image) {
            return Promise.reject("Failed to get report");
        }
        return Promise.resolve(image);
    } catch (error) {
        console.error("Error - GET /webds/report");
        return Promise.reject("Failed to get report");
    }
};

export async function SendGetImage(rtype: string): Promise<any> {
    //return SendGetImageTest();
    let image = await getReport(rtype);
    return image;
}
