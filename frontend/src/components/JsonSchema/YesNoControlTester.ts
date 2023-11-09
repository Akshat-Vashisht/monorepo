import { rankWith, schemaTypeIs } from '@jsonforms/core';

export default rankWith(
  3, //increase rank as needed
  schemaTypeIs('boolean')
);