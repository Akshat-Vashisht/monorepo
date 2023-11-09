import schema from './schema.json';
import uischema_midproj from './uischema_midproj.json';
import uischema_endproj from './uischema_endproj.json';
import uischema_endproj_manager from './uischema_endproj_manager.json';
import uischema_culture from './uischema_culture.json';
import uischema_midproj_manager from './uischema_midproj_manager.json';
import uischema_ongoing from './uischema_ongoing.json';
import uischema_ongoing_manager from './uischema_ongoing_manager.json';
class SchemaFetcher {
    _UI_SCHEMA_MAP: {[key:string]:any} = {
        'midproj': uischema_midproj,
        '1': uischema_midproj,
        'endproj': uischema_endproj,
        '2': uischema_endproj,
        'endproj_manager': uischema_endproj_manager,
        '3': uischema_endproj_manager,
        'culture': uischema_culture,
        'midproj_manager': uischema_midproj_manager,
        'ongoing': uischema_ongoing,
        'ongoing_manager': uischema_ongoing_manager,
    };

    getJsonSchema() {
        return schema;
    }

    getUiSchemaWithId(id: string): any {
        if (Object.keys(this._UI_SCHEMA_MAP).includes(id)) {
            return this._UI_SCHEMA_MAP[id];
        }
        throw Error(`No schema with id: ${id}`);
    }
}

export default new SchemaFetcher();
