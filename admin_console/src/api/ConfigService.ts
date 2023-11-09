import { $Service } from './Service';


export default class ConfigService extends $Service {
    public get() {
        return this.client.get("/config/testing");
    }
}


