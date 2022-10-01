import CheapWatch from "cheap-watch";
import { config } from "./config";
import { EventType } from "./eventTypes";
import { resolve } from "path";
import type { Signal } from 'signal-js';
import type { File } from './interfaces';

function fileFilter(file: File) {
    if (config.get("allowedFiletypes").some(extension => file.path.endsWith(extension)))
        return true;
    if (file.stats.isDirectory())
        return true;
    return false;
}

export async function setupWatch(signaller: Signal) {
    const watch = new CheapWatch({
        dir: config.get("scriptsFolder"),
        filter: fileFilter,
        watch: !config.get("dry")
    });

    if (!config.get("quiet")) console.log("Watching folder", resolve(config.get("scriptsFolder")))

    watch.on('+', fileEvent => { if (fileEvent.stats.isFile()) signaller.emit(EventType.FileChanged, fileEvent) });
    watch.on('-', fileEvent => { if (fileEvent.stats.isFile()) signaller.emit(EventType.FileDeleted, fileEvent) });

    // Wait 'till filewatcher is ready to go
    await watch.init();

    if (config.get("dry")) {
        console.log("Watch would've synchronised:\n", watch.paths)
        process.exit();
    }

    return watch;
}