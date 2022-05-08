import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');
import * as path from "path";
import ExInstaller, { NEXO_EX_NAME_FILE} from './ExInstaller';

const EX_VERSION : string = '1.0.0'

async function getTool() : Promise<string> {
    let downloader = new ExInstaller(EX_VERSION);
    let toolPath = '';
    if(!downloader.isExists()){
        toolPath = await downloader.downloadAndPrepare();
    } else {
        toolPath = await downloader.useTool();
    }

    return path.join(toolPath, NEXO_EX_NAME_FILE);
}

async function runTool(command : string, args: { [key: string]: string }) : Promise<void> {
    let tool = await getTool();

    let e = tl.tool(tool);
    e.arg(command);
    for(let item in args){
        e.arg('-' + item).arg(args[item]);
    }

    let options = <tr.IExecOptions>{
        silent: true
    };

    e.on('stdout', (buffer: Buffer) => {
        process.stdout.write(buffer);
    });
    e.on('stderr', (buffer: Buffer) => {
        process.stderr.write(buffer);
    });

    let exitCode: number = await e.exec(options);
    if (exitCode !== 0) {
        tl.setResult(tl.TaskResult.Failed, tl.loc('JS_ExitCode', exitCode));
    }
}

async function pack() :Promise<void> {
    console.log("Pack");
    let sourceDirectory = tl.getInput('SourceDirectory', true) as string;
    let version = tl.getInput('Version', true) as string;
    let name = tl.getInput('Name', true) as string;
    let excludedPatterns = tl.getInput('ExcludedPatterns', false) as string;

    await runTool('pack', { s: sourceDirectory, v: version, n: name, e: excludedPatterns });
}

async function install() :Promise<void> {
    console.log("Install");
    
    let source = tl.getInput('Source', true) as string;
    let connection = tl.getInput('ConnectionString', true) as string;
    let replaceOld = tl.getBoolInput('ReplaceOld', false) as boolean;

    await runTool('install', { s: source, c: connection, r: String(replaceOld) });
}

async function upload() :Promise<void> {
    console.log("Upload");

    let source = tl.getInput('Source', true) as string;
    let connection = tl.getInput('ConnectionString', true) as string;

    await runTool('upload', { s: source, c: connection });
}

async function cleanup() :Promise<void> {
    console.log("Cleanup");

    let connection = tl.getInput('ConnectionString', true) as string;
    let name = tl.getInput('ExName', true) as string;

    await runTool('cleanup', { c: connection, n: name });
}

async function run() {
    try {
        let command = tl.getInput('command', true);

        switch(command){
            case 'pack':
                pack();
            break;

            case 'install':
                install();
            break;

            case 'upload':
                upload();
            break;

            case 'cleanup':
                cleanup();
            break;
        }

        console.log('End');
    }
    catch (err: any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();