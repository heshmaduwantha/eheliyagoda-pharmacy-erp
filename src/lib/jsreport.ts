import jsreportCore from "jsreport-core";
import jsreportHandlebars from "@jsreport/jsreport-handlebars";
import { serverOnly } from "./server-only";

serverOnly();

let jsreportInstance: ReturnType<typeof jsreportCore> | null = null;
let isInitializing = false;
let initPromise: Promise<ReturnType<typeof jsreportCore>> | null = null;

export async function getJsReport() {
  if (jsreportInstance) return jsreportInstance;
  
  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    const instance = jsreportCore({
      // Keep it completely in-memory to avoid filesystem writes on serverless/dev
      store: { provider: "memory" },
      blobStorage: { provider: "memory" },
      logger: { silent: true },
      allowLocalFilesAccess: false,
    });
    
    instance.use(jsreportHandlebars());
    
    await instance.init();
    jsreportInstance = instance;
    isInitializing = false;
    return instance;
  })();

  return initPromise;
}
