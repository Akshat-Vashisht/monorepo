import axios, { AxiosRequestConfig } from 'axios';

export class RequestHandler {
    private baseUrl: string;
    private defaultRequestConfig: AxiosRequestConfig;

    constructor(baseUrl: string, config: AxiosRequestConfig) {
        this.baseUrl = baseUrl;
        this.defaultRequestConfig = config;
    }

    async get (path: string, config: AxiosRequestConfig = {}) {
        const _config = {
            ...this.defaultRequestConfig,
            ...config,
        };

        try {
            const resp = await axios.get(path, _config);
            return resp.data;
        } catch(e) {
            console.log(e);
            throw e
        }
    }

    async post(path: string, data: any = {}, config: AxiosRequestConfig = {}) {
        const _config = {
            ...this.defaultRequestConfig,
            ...config,
        }
        try {
            const resp = await axios.post(path, data, _config);
            return resp.data;
        } catch(e) {
            console.log(e);
            throw e
        }
    }

    async put(path: string, data: any = {}, config: AxiosRequestConfig = {}) {
        const _config = {
            ...this.defaultRequestConfig,
            ...config,
        }
        try {
            const resp = await axios.put(path, data, _config);
            return resp.data;
        } catch(e) {
            console.log(e);
            throw e
        }
    }
}
