import { AxiosRequestConfig } from "axios";
import { InviteUserRequest, PresignedUrl, UpdateUserRequest } from "../apiTypes";
import { $Service } from "./Service";


export default class UserService extends $Service {

    getUsers() {
        return this.client.get("/users", {});
    }

    getUsersForTenant(tenantId: string) {
        return this.client.get(`/users/${tenantId}`)
    }

    inviteUser(request: InviteUserRequest) {
        return this.client.post("/users", request);
    }

    updateUser(request: UpdateUserRequest) {
        return this.client.post(`/users/${request.userName}`, request);
    }

    getUploadUrl() {
        const config = {}
        return this.client.get("/organization/uploadUrl", config);
    }

    uploadToS3(file: File, presignedUrl: PresignedUrl) {

        const data = {
            ...presignedUrl.fields,
            file,
        }
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            baseURL: presignedUrl.url
        }

        return this.client.post('', data, config);
    }


}

