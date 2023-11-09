import { OwnPropsOfControl } from "@jsonforms/core";
import { withJsonFormsControlProps } from "@jsonforms/react";
import { JsonFormSlider } from './JsonFormSlider';

interface SliderProps {
    data: any;
    handleChange(path: string, value: any): void;
    path: string;
}

const RatingControl = (props: OwnPropsOfControl & SliderProps & {readOnly?: boolean}) => {
    const { data, handleChange, path, enabled } = props;

    return (
        <JsonFormSlider 
            value={data}
            updateValue={(newValue: number) => handleChange(path, newValue)}
            title={props.uischema?.label === undefined ? props.schema?.title : `${props.uischema.label}`}
            enabled={enabled}
        />
    );
};

export default withJsonFormsControlProps(RatingControl);