import tl = require('azure-pipelines-task-lib/task');
import * as path from "path";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as fs from "fs";
import tr = require('azure-pipelines-task-lib/toolrunner');

export const NEXO_DLL_PATH: string = 'NexoDllPath';

export default class NexoVersion
{
    private toolName: string = "NexoSDK";
    private tempPath: string;
    private version: string;

    constructor(version: string)
    {
        this.version = version;
        this.tempPath = tl.getVariable('Agent.TempDirectory') as string;;
    }

    private getVersionUrlPath(): string {
        const searchExp = '.';
        const replaceWith = "_";

        return this.version
            .replace(searchExp, replaceWith)
            .replace(searchExp, replaceWith)
            .replace(searchExp, replaceWith);
    }

    public getTool(): string {
        let toolPath = toolLib.findLocalTool(this.toolName, this.version);
        return toolPath;
    }

    public isExists(): boolean{
        return this.getTool() !== undefined;
    }

    private getDownloadUrl(versionName: string) : string {
        
        const downloadUrl = `http://ftp.insert.pl/pub/aktualizacje/InsERT_nexo/${versionName}`;
        return downloadUrl;
    }

    public async downloadSdk() : Promise<string> {
        console.log("Download tool");
        const versionName = `nexoSDK_${this.getVersionUrlPath()}.exe`;
        const downloadUrl = this.getDownloadUrl(versionName);
        try {
            var downloadPath = await toolLib.downloadTool(downloadUrl, versionName);
            return downloadPath;
        }
        catch (ex) {
            throw tl.loc("CouldNotDownload", downloadUrl, ex);
        }
    }

    public async extractTool(nexoSdk : string) : Promise<void> {
        console.log("Extract tool");
        try {
            let powershell = tl.tool(nexoSdk)
                    .arg(`-o${this.tempPath}`)
                    .arg('-y');

            let options = <tr.IExecOptions>{
                silent: true
            };
            powershell.on('stdout', (buffer: Buffer) => {
                process.stdout.write(buffer);
            });
            powershell.on('stderr', (buffer: Buffer) => {
                process.stderr.write(buffer);
            });
    
            let exitCode: number = await powershell.exec(options);
            if (exitCode !== 0) {
                tl.setResult(tl.TaskResult.Failed, tl.loc('JS_ExitCode', exitCode));
            }
        }
        catch (ex) {
            throw tl.loc("FailedWhileExtractingPacakge", ex);
        }
    }

    public findExtractedPath() : string {
        let extPath:string | undefined = undefined;

        fs.readdirSync(this.tempPath).forEach(file => {
            if(file.includes(`nexoSDK_${this.version}`)) {
                extPath = file;
            }
        });

        if(!extPath)
            throw tl.loc("FailedFindSdk");

        return extPath;
    }

    public async copyTool(nexoSdk: string): Promise<void> {
        console.log("Copy tool");

        await toolLib.cacheDir(path.join(this.tempPath, nexoSdk), "nexoSdk", this.version);
    }

    public async useTool(): Promise<string> {
        console.log("Use tool");

        let toolPath = toolLib.findLocalTool("NexoSDK", this.version);
        tl.setVariable(NEXO_DLL_PATH, path.join(toolPath, 'Bin'));
        return toolPath;
    }

    public async downloadAndPrepare() : Promise<string>{
        tl.setProgress(5, 'Download SDK');
        let downloadPath = await this.downloadSdk();
        tl.setProgress(40, 'Extract SDK');
        await this.extractTool(downloadPath);

        tl.setProgress(70, 'Find SDK');
        let sdkDir = this.findExtractedPath();

        tl.setProgress(80, 'Copy SDK');
        await this.copyTool(sdkDir);

        tl.setProgress(99, 'Check SDK');
        let toolPath = await this.useTool();

        tl.setProgress(100, 'Finish');
        return toolPath;
    }
}