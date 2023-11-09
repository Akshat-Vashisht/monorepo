import React from 'react';
import { Card, CardContent, CardHeader, Hidden } from '@mui/material';
import {
  GroupLayout,
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
  withIncreasedRank,
} from '@jsonforms/core';
// import {
//   MaterialLabelableLayoutRendererProps,
//   MaterialLayoutRenderer,
// } from ;
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { MaterialLabelableLayoutRendererProps, MaterialLayoutRenderer,  } from '@jsonforms/material-renderers';

export const groupTester: RankedTester = rankWith(1000, uiTypeIs('Group'));
const style: { [x: string]: any } = { marginBottom: '10px' };

const GroupComponent = React.memo(({ visible, enabled, uischema, label, ...props }: MaterialLabelableLayoutRendererProps) => {
  const groupLayout = uischema as GroupLayout;
  return (
    <Hidden xsUp={!visible}>
    {label && (
        <h3>{label}</h3>
    )}
        <MaterialLayoutRenderer {...props} visible={visible} enabled={enabled} elements={groupLayout.elements} />
    </Hidden>
  );
});

export const MaterializedGroupLayoutRenderer = ({ uischema, schema, path, visible, enabled, renderers, cells, direction, label }: LayoutProps) => {
  const groupLayout = uischema as GroupLayout;

  return (
    <GroupComponent
      elements={groupLayout.elements}
      schema={schema}
      path={path}
      direction={direction}
      visible={visible}
      enabled={enabled}
      uischema={uischema}
      renderers={renderers}
      cells={cells}
      label={label}
    />
  );
};

export default withJsonFormsLayoutProps(MaterializedGroupLayoutRenderer);

export const materialGroupTester: RankedTester = withIncreasedRank(
  1,
  groupTester
);
