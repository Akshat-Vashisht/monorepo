import { JsonForms } from '@jsonforms/react';
import React, { useMemo, useState } from 'react';
import SchemaFetcher from '../../reviewSchemas/SchemaFetcher';
import {
    materialCells,
    materialRenderers,
} from '@jsonforms/material-renderers';

import NumberRatingControl from '../NumberRating/NumberRatingControl';

import NumberRatingControlTester from '../NumberRating/NumberRatingControlTester';
import YesNoControlTester from '../JsonSchema/YesNoControlTester';
import YesNoControl from '../JsonSchema/YesNoControl';
import { groupTester, MaterializedGroupLayoutRenderer } from '../JsonSchema/GroupLayout';
import GoalsDropdownTester from '../JsonSchema/GoalsDropdown/GoalsDropdownTester';
import GoalsDropdownControl from '../JsonSchema/GoalsDropdown/GoalsDropdownControl';
import SliderTester from '../JsonSchema/Slider/SliderTester';
import SliderControl from '../JsonSchema/Slider/SliderControl';

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  readonly?: boolean;
  reviewSchemaId?: string;
  addRandomCultureQuestions?: boolean;
}
export default function ReviewForm(props: Props) {
  const {
    data,
    onUpdate,
    readonly,
    reviewSchemaId,
    addRandomCultureQuestions,
  } = props;

  const renderers = [
    ...materialRenderers,
    //register custom renderers
    { tester: NumberRatingControlTester, renderer: NumberRatingControl },
    { tester: YesNoControlTester, renderer: YesNoControl },
    { tester: groupTester, renderer: MaterializedGroupLayoutRenderer},
    { tester: GoalsDropdownTester, renderer: GoalsDropdownControl},
    { tester: SliderTester, renderer: SliderControl}
  ];

  const getFieldNameFromElement = (element: any) => {
    if (element.scope) {
      const parts = element.scope.split("/");
      return parts[parts.length - 1];
    }
    return undefined;
  }

  const schema = SchemaFetcher.getJsonSchema();
  const uischema = SchemaFetcher.getUiSchemaWithId(reviewSchemaId || '1');
  const cultureUiSchema = SchemaFetcher.getUiSchemaWithId('culture');
  const cultureFieldNamesMap: {[key: string]: any} = useMemo(
    () => cultureUiSchema.elements.reduce((mp: {[key:string]: any}, element:any) => {
      const fieldName = getFieldNameFromElement(element)
      if (fieldName) {
        mp[fieldName] = element;
      }
      return mp
    }, {}), [cultureUiSchema.elements]);

  const [didAddRandomCultureQuestions, setDidAddRandomCultureQuestions ] = useState(false);
  const [addedCultureQuestions, setAddedCultureQuestions] = useState<Set<string>>(new Set());

  const getRandomInt = (max: number) => {
    return Math.floor(Math.random() * max);
  };

  const getUiSchemaWithCultureQuestions = () => {
    const s = {...uischema, elements: [...uischema.elements]};

    if (addRandomCultureQuestions && !didAddRandomCultureQuestions) {
      const idx1 = getRandomInt(cultureUiSchema.elements.length);
      const idx2 = getRandomInt(cultureUiSchema.elements.length);
      const e1 = cultureUiSchema.elements[idx1];
      const e2 = cultureUiSchema.elements[idx2];
      // const group = {
      //   "type": "Group",
      //   "label": "Culture questions",
      //   "elements": [e1, e2],
      // }

      s.elements.push(e1);
      s.elements.push(e2);
      if (getFieldNameFromElement(e1)) {
        addedCultureQuestions.add(getFieldNameFromElement(e1));
      }

      // s.elements.push(cultureUiSchema.elements[idx2]);
      if (getFieldNameFromElement(e2)) {
        addedCultureQuestions.add(getFieldNameFromElement(e2));
      }

      setAddedCultureQuestions(new Set(addedCultureQuestions));
      setDidAddRandomCultureQuestions(true);
    }

    // Mainly for when coming to view a completed review. We do not want to add
    // random culture questions we want to add the ones they answered.
    const cultureFieldNames = Object.keys(cultureFieldNamesMap);
    Object.keys(data).forEach((field) => {
      if (cultureFieldNames.indexOf(field) >= 0 && !addedCultureQuestions.has(field)) {
        s.elements.push(cultureFieldNamesMap[field]);
        addedCultureQuestions.add('field');
        setAddedCultureQuestions(new Set(addedCultureQuestions));
      }
    });
    return s;
  }

  const uiSchemaWithCultureQuestions = useMemo(() => getUiSchemaWithCultureQuestions(), []);

  return (
    <div>
      <JsonForms
        schema={schema}
        uischema={uiSchemaWithCultureQuestions}
        data={data}
        renderers={renderers}
        cells={materialCells}
        onChange={({ errors, data }) => onUpdate(data)}
        readonly={readonly}
      />
    </div>
  )
}