import { $Service } from './Service';


export default class ScoresService extends $Service{

    getEmployeeScore() {
        return this.client.get('/scoring/employee');
    }

    getSummary() {
        return this.client.get('/scoring/summary');
    }
}


