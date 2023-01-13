export class Device {
  public id: string;
  public mac: string;
  public name: string;

  constructor(id: string, mac: string, name: string) {
    this.id = id;
    this.name = name;
    this.mac = mac;
  }
}