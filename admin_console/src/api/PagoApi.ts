import { AxiosRequestConfig } from "axios";
import ConfigService from "./ConfigService";
import { RequestHandler } from "./RequestHandler";
import SessionService from "./SessionService";
import TenantService from "./TenantService";
import UserService from "./UserService";
import CompensationService from "./CompensationService";

export class PagoApi {
    configService: ConfigService;
    sessionService: SessionService;
    userService: UserService;
    tenantService: TenantService;
    compensationService: CompensationService;

    // Can't use RootState type due to circular reference.
    constructor(state: any, baseURL: string) {
        const defaultConfig: AxiosRequestConfig = {
            headers: {
                Authorization: `Bearer ${state.sessionState.user?.idToken}`,
                'Content-Type': 'application/json',
            },
            baseURL,
        }

        const requestHandler = new RequestHandler(baseURL, defaultConfig);
        this.configService = new ConfigService(requestHandler);
        this.sessionService = new SessionService(requestHandler);
        this.userService = new UserService(requestHandler);
        this.tenantService = new TenantService(requestHandler);
        this.compensationService = new CompensationService(requestHandler);
    }
}

