import { AxiosRequestConfig } from "axios";
import { PresignedUrl } from "../apiTypes";
import { $Service } from "./Service";


export default class CompensationService extends $Service {

    getUploadUrl() {
        const config = {}
        return this.client.get("/compensation/uploadUrl", config);
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

    getCompData() {
        return this.client.get("/compensation", {});
    }

    getBudgetData() {
        return this.client.get("/budget", {});
    }
}

