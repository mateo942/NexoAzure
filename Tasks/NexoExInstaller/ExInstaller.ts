import tl = require('azure-pipelines-task-lib/task');
import * as path from "path";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as fs from "fs";
import tr = require('azure-pipelines-task-lib/toolrunner');


export const NEXO_EX_NAME: string = 'NexoExInstaller';
export const NEXO_EX_NAME_FILE : string = NEXO_EX_NAME + '.exe';

export default class NexoExInstaller {

    private version : string;

    constructor(version: string)
    {
        this.version = version;
    }

    public getTool(): string {
        let toolPath = toolLib.findLocalTool(NEXO_EX_NAME, this.version);
        return toolPath;
    }

    public isExists(): boolean{
        return this.getTool() !== undefined;
    }

    private getDownloadUrl(versionName: string) : string {
        
        const downloadUrl = `https://github.com/mateo942/NexoInstaller/releases/download/${versionName}/Nexo.Installer.exe`;
        return downloadUrl;
    }

    public async downloadEx() : Promise<string> {
        console.log("Download tool");
        const downloadUrl = this.getDownloadUrl(this.version);
        try {
            var downloadPath = await toolLib.downloadTool(downloadUrl, NEXO_EX_NAME_FILE);
            return downloadPath;
        }
        catch (ex) {
            throw tl.loc("CouldNotDownload", downloadUrl, ex);
        }
    }

    public async copyTool(nexoEx: string): Promise<void> {
        console.log("Copy tool");

        let tmpPath = path.dirname(nexoEx);
        let dirPath = path.join(tmpPath, NEXO_EX_NAME);
        let newExPath =  path.join(dirPath, NEXO_EX_NAME_FILE);

        fs.mkdirSync(dirPath);
        fs.copyFileSync(nexoEx, newExPath);
        fs.unlinkSync(nexoEx);

        await toolLib.cacheDir(dirPath, NEXO_EX_NAME, this.version);

        fs.unlinkSync(newExPath);
        fs.rmdirSync(dirPath);
    }

    public async useTool(): Promise<string> {
        console.log("Use tool");

        let toolPath = toolLib.findLocalTool(NEXO_EX_NAME, this.version);
        tl.prependPath(toolPath);
        return toolPath;
    }

    public async downloadAndPrepare() : Promise<string>{
        tl.setProgress(5, 'Download Ex');
        let downloadPath = await this.downloadEx();

        tl.setProgress(80, 'Copy Ex');
        await this.copyTool(downloadPath);

        tl.setProgress(99, 'Check SDK');
        let toolPath = await this.useTool();

        tl.setProgress(100, 'Finish');
        return toolPath;
    }
}