import { RequestHandler } from "./RequestHandler";

export class $Service {
    protected client;

    constructor(requestHandler: RequestHandler) {
        this.client = requestHandler;
    }
}