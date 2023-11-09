import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel } from '@mui/material';
import { CompPlanningData } from '../../types';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  
    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  });

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}
type Order = 'asc' | 'desc';

function getComparator<Key extends keyof CompPlanningData>(
    order: Order,
    orderBy: Key,
): (
    a: CompPlanningData,
    b: CompPlanningData,
) => number {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

interface HeaderCell {
    id: keyof CompPlanningData;
    key: string;
    label: string;
    numeric?: boolean;
    disablePadding?: boolean;
}

const defaultHeaderCells: readonly HeaderCell[] = [
    {
        id: 'firstName',
        key: 'firstNameHeader',
        label: 'First Name',
    }, 
    {
        id: 'lastName',
        key: 'lastNameHeader',
        label: 'Last Name',
    },
    {
        id: 'managerName',
        key: 'managerNameHeader',
        label: 'Manager'
    },
    {
        id: 'score',
        key: 'scoreHeader',
        label: 'Score',
        numeric: true,
    },
    {
        id: 'replaceabilityScore',
        key: 'replaceabilityScoreHeader',
        label: 'Replaceability Score',
        numeric: true,
    },
    {
        id: 'basePay',
        key: 'basePayHeader',
        label: 'Base Pay',
        numeric: true,
    },
    {
        id: 'variablePay',
        key: 'variablePayHeader',
        label: 'Variable Pay',
        numeric: true,
    },

];

interface CompPlanningTableHeadProps {
    includeMarketAdjustmentColumns: boolean,
    includeMeritAdjustmentColumns: boolean,
    onRequestSort: (event: React.MouseEvent<unknown>, property: keyof CompPlanningData) => void;
    order: Order;
    orderBy: keyof CompPlanningData;

};

function CompPlanningTableHead(props: CompPlanningTableHeadProps) {
    // const { headers } = props;
    const { 
        includeMarketAdjustmentColumns,
        includeMeritAdjustmentColumns,
        onRequestSort, 
        order,
        orderBy,
    } = props;
    const headerCells = [...defaultHeaderCells];

    const createSortHandler =
    (property: keyof CompPlanningData) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

    if (includeMarketAdjustmentColumns) {
        headerCells.push({
            id: `marketIncreasePercent`,
            key: 'marketIncreasePercentHeader',
            label: 'Market Increase (%)',
            numeric: true,
        });
        headerCells.push({
            id: 'marketIncreaseDollar',
            key: 'marketIncreaseDollarHeader',
            label: 'Market Increase ($)',
            numeric: true,
        });
    }

    if (includeMeritAdjustmentColumns) {
        headerCells.push({
            id: `meritIncreasePercent`,
            key: 'meritIncreasePercentHeader',
            label: 'Merit Increase (%)',
            numeric: true,
        });
        headerCells.push({
            id: 'meritIncreaseDollar',
            key: 'meritIncreaseDollarHeader',
            label: 'Merit Increase ($)',
            numeric: true,
        });
    }

    
    headerCells.push({
        id: 'newSalary',
        key: 'newSalaryHeader',
        label: 'New Salary',
        numeric: true,
    });
    

    return(
        <TableHead>
            <TableRow>
                {headerCells.map(headerCell => (
                    <TableCell
                        id={headerCell.id}
                        // align={headerCell.numeric ? 'right': 'left'}
                        padding={headerCell.disablePadding ? 'none': 'normal'}
                        key={headerCell.key}
                    >
                        <TableSortLabel
                            active={orderBy === headerCell.id}
                            direction={orderBy === headerCell.id ? order : 'asc'}
                            onClick={createSortHandler(headerCell.id)}
                        >
                            {headerCell.label}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
};

interface CompPlanningTableProps {
    data: CompPlanningData[];
}


export default function CompPlanningTable(props: CompPlanningTableProps) {
    const { 
        data,
    } = props; 
    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<keyof CompPlanningData>('lastName');  
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [pageNum, setPageNum] = useState(0);


    const handleRequestSort = (
        event: React.MouseEvent<unknown>,
        property: keyof CompPlanningData,
    ) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };


    const handleChangePage = (event: unknown, newPage: number) => {
        setPageNum(newPage);
    };
    
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPageNum(0);
    };
    
    return(
        <>
        <TableContainer>
            <Table size={'medium'}>
                <CompPlanningTableHead
                    includeMarketAdjustmentColumns={data.length > 0 && data[0].marketIncreaseDollar !== undefined}
                    includeMeritAdjustmentColumns={data.length > 0 && data[0].meritIncreaseDollar !== undefined} 
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={handleRequestSort}
                />
                <TableBody>
                    {data.slice(pageNum * rowsPerPage, pageNum * rowsPerPage + rowsPerPage)
                        .sort(getComparator(order, orderBy)).map(bd => {
                        return (
                            <TableRow
                                key={bd.email}
                            >
                                <TableCell>{bd.firstName}</TableCell>
                                <TableCell>{bd.lastName}</TableCell>
                                <TableCell>{bd.managerName}</TableCell>
                                <TableCell>{bd.score}</TableCell>
                                <TableCell>{bd.replaceabilityScore}</TableCell>
                                <TableCell>{formatter.format(bd.basePay || 0)}</TableCell>
                                <TableCell>{formatter.format(bd.variablePay || 0)}</TableCell>
                                {bd.marketIncreaseDollar !== undefined &&
                                    <>
                                    <TableCell>{bd.marketIncreasePercent || 0}%</TableCell>
                                    <TableCell>{formatter.format(bd.marketIncreaseDollar || 0)}</TableCell>
                                    </>
                                }
                                {bd.meritIncreaseDollar !== undefined &&
                                    <>
                                    <TableCell>{bd.meritIncreasePercent || 0}%</TableCell>
                                    <TableCell>{formatter.format(bd.meritIncreaseDollar || 0)}</TableCell>
                                    </>
                                }
                                
                                <TableCell>{formatter.format((bd.newSalary || bd.basePay || 0) + (bd.variablePay || 0))}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={pageNum}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        </>
    );
}