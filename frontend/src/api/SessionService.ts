import { AxiosRequestConfig } from "axios";
import { getCognitoCodeExchange } from "../utils";
import { $Service } from "./Service";


export default class SessionService extends $Service {

    exchangeCodeForTokens(clientId: string, code: string, redirectUri: string) {
        const data = {
            grant_type: "authorization_code",
            client_id: clientId,
            code: code,
            redirect_uri: redirectUri,
        };
        const params = new URLSearchParams();
        params.append("code", code);
        params.append("grant_type", "authorization_code");
        params.append("client_id", clientId);
        const p = params.toString() + `&redirect_uri=${redirectUri}`
        
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            baseURL: getCognitoCodeExchange(window.location.href),
        }
        return this.client.post('?' + p, {}, config);
    }
}

