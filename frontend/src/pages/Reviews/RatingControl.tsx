import { OwnPropsOfControl } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Rating } from './Rating';

interface RatingControlProps {
  data: any;
  handleChange(path: string, value: any): void;
  path: string;
}

const RatingControl = (props: OwnPropsOfControl & RatingControlProps) => {
  const { data, handleChange, path } = props;
  return(<Rating
    value={data}
    updateValue={(newValue: number) => handleChange(path, newValue)}
    maxVal={props.schema?.maximum}
  />);
};

export default withJsonFormsControlProps(RatingControl);