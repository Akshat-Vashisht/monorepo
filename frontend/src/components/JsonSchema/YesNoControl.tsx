import { OwnPropsOfControl } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { YesNo } from './YesNo';

interface YesNoProps {
  data: any;
  handleChange(path: string, value: any): void;
  path: string;
}

const RatingControl = (props: OwnPropsOfControl & YesNoProps & {readOnly?: boolean}) => {
  const { data, handleChange, path, enabled } = props;

  return(
    <YesNo
        value={data}
        updateValue={(newValue: boolean) => handleChange(path, newValue)}
        title={props.uischema?.label === undefined ? props.schema?.title : `${props.uischema.label}`}
        enabled={enabled}
    />
  );
};

export default withJsonFormsControlProps(RatingControl);