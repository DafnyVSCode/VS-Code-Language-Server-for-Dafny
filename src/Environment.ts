import * as cp from "child_process";
import { Strings } from "./stringRessources";
import * as vscode from "vscode";
import * as os from "os";


export class Command {
    // tslint:disable-next-line:no-empty
    public constructor(public command: string = null, public args: string[]= null) {};
    public notFound: boolean = false;
}

export class Environment {

    private config: vscode.WorkspaceConfiguration;
    public usesMono: boolean;
    private dafnyServerPath: string;
    public hasCustomMonoPath: boolean;

    public constructor() {
        this.config = vscode.workspace.getConfiguration(Strings.Dafny);
        this.usesMono = this.config.get<boolean>("useMono") || os.platform() !== "win32"; // setting only relevant on windows
        this.dafnyServerPath = this.config.get<string>("dafnyServerPath");
        let monoPath: string = this.config.get<string>("monoPath");
        this.hasCustomMonoPath = monoPath !== "";

    }
    public TestCommand(path: string): boolean {
        const process: cp.ChildProcess = cp.exec(path);
        const commandSuccessful: boolean = process.pid !== 0;
        if (commandSuccessful) {
            process.kill();
        }
        return commandSuccessful;
    }

    public GetStartDafnyCommand(): Command {
        let command: string;
        let args: string[];
        let monoPath: string = this.config.get<string>("monoPath");
        if (!this.usesMono) {
            command = this.dafnyServerPath;
            args = [];
            return new Command(command, args);
        } else {
            const monoInSystemPath: boolean = this.TestCommand(Strings.Mono);
            const monoAtConfigPath: boolean = this.hasCustomMonoPath && this.TestCommand(monoPath);
            if (monoInSystemPath && !monoAtConfigPath) {
                if (this.hasCustomMonoPath) {
                    vscode.window.showWarningMessage(Strings.MonoPathWrong);
                }
                monoPath = Strings.Mono;
            } else if (!monoInSystemPath && !monoAtConfigPath) {
                vscode.window.showErrorMessage(Strings.NoMono);
                const command: Command = new Command();
                command.notFound = true;
                return command;
            }
            command = monoPath;
            args = [this.dafnyServerPath];
            return new Command(command, args);
        }
    }
}