import * as fs from 'fs';
import {HardwareInfo} from './HardwareInfo';
import path from 'path';
import {LoggerService} from '../services/LoggerService';

export class Cello {
  public static basePath = '';

  public description: string;
  public ip: string;
  public mac: string;
  public port = 3178;
  public filePath: string;
  public hardwareInfo?: HardwareInfo;

  constructor(description: string, ip: string, mac: string) {
    this.description = description;
    this.ip = ip;
    this.mac = mac;
    this.filePath = Cello.GetFilePath(this.mac);
  }

  public static CreateCelloAndSafeOnFileSystem(description: string, ip: string, mac: string): Cello {
    let cello = Cello.GetCelloFromFile(this.GetFilePath(mac));

    if(cello !== undefined) {
      cello.ip = ip;
      cello.description = description;
    } else {
      cello = new Cello(description, ip, mac);
    }

    cello.SaveToFile();
    return cello;
  }

  public static GetFilePath(mac: string): string {
    return this.basePath + mac + '.json';
  }

  public static GetCelloFromFile(filePath: string): Cello | undefined {
    if(!fs.existsSync(filePath)) {
      return undefined;
    }

    const fileContent = fs.readFileSync(filePath);
    const jsonObject = JSON.parse(fileContent.toString());

    const cello = new Cello(jsonObject.description, jsonObject.ip, jsonObject.mac);
    cello.port = jsonObject.port;

    if(jsonObject.hardwareInfo !== undefined) {
      cello.hardwareInfo = new HardwareInfo(jsonObject.hardwareInfo.R, jsonObject.hardwareInfo.S, jsonObject.hardwareInfo.H);
    }

    return cello;
  }

  public static GetAllCellosFromFiles(loggerService: LoggerService): Cello[] {
    loggerService.logDebug('GetAllCellosFromFiles');

    const cellos: Cello[] = [];
    if(!fs.existsSync(this.basePath)) {
      loggerService.logDebug('GetAllCellosFromFiles: basePath does not exist');
      return cellos;
    }

    const files = fs.readdirSync(this.basePath);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');

    loggerService.logDebug(`Total files: ${files.length}`);

    for(const jsonFile of jsonFiles) {
      loggerService.logDebug(`GetAllCellosFromFiles: ${jsonFile}`);
      const cello = Cello.GetCelloFromFile(path.join(this.basePath, jsonFile));
      if(cello === undefined) {
        continue;
      }

      cellos.push(cello);
    }

    return cellos;
  }

  public SaveToFile(): void {
    if(!fs.existsSync(Cello.basePath)) {
      return;
    }

    if(fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }

    fs.writeFileSync(this.filePath, JSON.stringify(this));
  }
}