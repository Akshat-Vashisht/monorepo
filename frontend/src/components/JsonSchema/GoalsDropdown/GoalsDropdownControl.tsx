import { OwnPropsOfControl } from "@jsonforms/core";
import { withJsonFormsControlProps } from "@jsonforms/react";
import { GoalsDropdown } from "./GoalsDropdown";

interface GoalsDropdownProps {
    data: any;
    handleChange(path: string, value: any): void;
    path: string;
}

const RatingControl = (props: OwnPropsOfControl & GoalsDropdownProps & {readOnly?: boolean}) => {
    const { data, handleChange, path, enabled } = props;

    return (
        <GoalsDropdown 
            value={data}
            updateValue={(newValue: string) => handleChange(path, newValue)}
            title={props.uischema?.label === undefined ? props.schema?.title : `${props.uischema.label}`}
            enabled={enabled}
        />
    );
};

export default withJsonFormsControlProps(RatingControl);