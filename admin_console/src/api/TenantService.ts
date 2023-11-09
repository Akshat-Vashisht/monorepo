import { AxiosRequestConfig } from "axios";
import { CreateTenantRequest, InviteUserRequest, PresignedUrl, UpdateUserRequest } from "../apiTypes";
import { $Service } from "./Service";


export default class TenantService extends $Service {

    getTenants() {
        return this.client.get("/tenants", {});
    }

    registerTenant(request: CreateTenantRequest) {
        return this.client.post("/tenants", request);
    }
}

