import { CreateGoalRequest } from "../apiTypes";
import { Goal } from "../types";
import { $Service } from "./Service";


export default class GoalsService extends $Service {
    get() {
        const config = {}
        return this.client.get("/goals", config);
    }

    create(goal: CreateGoalRequest) {
        return this.client.post('/goals', goal);
    }
}

