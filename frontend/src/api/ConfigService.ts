import { $Service } from './Service';


export default class ConfigService extends $Service {
    public get(subdomain: string) {
        return this.client.get(`/config/${subdomain}`);
    }
}


