import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');
import NexoVersion from './NexoVersion';

async function getNexoSdk(version: string) {
    console.log("ToolNexoSDK", version);

    let nexoVersion = new NexoVersion(version);

    if(!nexoVersion.isExists()){
        await nexoVersion.downloadAndPrepare();
    } else {
        nexoVersion.useTool();
    }
}

async function run() {
    try {
        let nexoSdkVersion = tl.getInput('versionSpec', true);

        await getNexoSdk(nexoSdkVersion as string);

        console.log('End');
    }
    catch (err: any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();