import { AxiosRequestConfig } from "axios";
import { InviteUserRequest, PresignedUrl, UpdateUserRequest } from "../apiTypes";
import { User } from "../types";
import { $Service } from "./Service";


export default class UserService extends $Service {

    getUsers() {
        return this.client.get("/users", {});
    }

    inviteUser(request: InviteUserRequest) {
        return this.client.post("/users", request);
    }

    updateUser(request: UpdateUserRequest) {
        return this.client.post(`/users/${request.id}`, request);
    }

    getUploadUrl() {
        const config = {}
        return this.client.get("/tenants/upload_url", config);
    }

    uploadToS3(file: File, presignedUrl: string) {

        const data = file;
        
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            baseURL: presignedUrl
        }

        return this.client.put('', data, config);
    }

    getDirectReports(sub?: string) {
        let path = "/users/direct_reports";
        if (sub !== undefined) {
            path += `?sub=${sub}`
        }
        return this.client.get(path, {})
    }

    getDirectReportsPerformance() {
        let path = "/scoring/summary/reports";
        return this.client.get(path);
    }

    getDirectReportsCompensationData(users: User[]) {
        let path = "/users/direct_reports/compensation";
        return this.client.post(path, users, {});
    }

    masqueradeAsUser(user_id: string) {
        let path = `/users/${user_id}/masquerade`;
        return this.client.post(path, {}, {});
    }
}

