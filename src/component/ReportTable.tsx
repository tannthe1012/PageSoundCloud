import * as React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { visuallyHidden } from '@mui/utils';
import TidalAPI from '../service/KKBoxAPI';
import { IconButton, Tooltip } from '@mui/material';
import { SaveAlt } from '@mui/icons-material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Data {
    client_id: number;
    name: string;
    thread_size: number;
    success: number;
    failed: number;
    sph: number;
    last_update: string;
}

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

function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key,
): (
        a: { [key in Key]: number | string },
        b: { [key in Key]: number | string },
    ) => number {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

// This method is created for cross-browser compatibility, if you don't
// need to support IE11, you can use Array.prototype.sort() directly
function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) {
            return order;
        }
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

interface HeadCell {
    id: keyof Data;
    label: string;
    numeric: boolean;
    align: 'inherit' | 'left' | 'center' | 'right' | 'justify';
}

const headCells: readonly HeadCell[] = [
    {
        id: 'client_id',
        numeric: true,
        label: 'Client ID',
        align: 'left'
    },
    {
        id: 'name',
        numeric: true,
        label: 'Name',
        align: 'left'
    },
    {
        id: 'thread_size',
        numeric: true,
        label: 'Thread Size',
        align: 'left'
    },
    {
        id: 'success',
        numeric: true,
        label: 'Success',
        align: 'left'
    },
    {
        id: 'failed',
        numeric: true,
        label: 'Failed',
        align: 'left'
    },
    {
        id: 'sph',
        numeric: true,
        label: 'SPH',
        align: 'left'
    },
    {
        id: 'last_update',
        numeric: true,
        label: 'Last Update',
        align: 'right'
    }
];

interface EnhancedTableProps {
    onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void;
    order: Order;
    orderBy: string;
    rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
    const { order, orderBy, rowCount, onRequestSort } =
        props;
    const createSortHandler =
        (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
            onRequestSort(event, property);
        };

    return (
        <TableHead>
            <TableRow>
                <TableCell align='left'>
                    STT
                </TableCell>
                {headCells.map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.align}
                        sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id)}
                        >
                            {headCell.label}
                            {orderBy === headCell.id ? (
                                <Box component="span" sx={visuallyHidden}>
                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                </Box>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}

const API = TidalAPI.Instance;

export default function ReportTable() {
    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<keyof Data>('client_id');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(50);
    const [rows, setRows] = React.useState<Data[]>([]);

    function loadData() {
        if (!API.isAuth) {
            return;
        }

        API.report.clients().then((data) => {
            setRows(() => {
                return data.map((d) => {
                    return {
                        client_id: d.ClientID,
                        name: d.Name,
                        thread_size: d.ThreadSize,
                        success: d.Success,
                        failed: d.Failed,
                        sph: d.SPH,
                        last_update: d.LastUpdate
                    }
                });
            });
        });
    }

    React.useEffect(() => {
        loadData();
    }, [])

    const handleRequestSort = (
        event: React.MouseEvent<unknown>,
        property: keyof Data,
    ) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

    return (
        <Box sx={{ width: '100%' }}>
            <Paper
                sx={{
                    width: '100%', mb: 2
                }}
                elevation={4}>
                <Toolbar
                    sx={{
                        pl: { sm: 2 },
                        pr: { xs: 1, sm: 1 }
                    }}
                >
                    <Typography
                        sx={{ flex: '1 1 100%' }}
                        variant="h6"
                        id="tableTitle"
                        component="div"
                    >
                        Report Table
                    </Typography>
                    <Tooltip title="Refresh">
                        <IconButton onClick={loadData}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Export">
                        <IconButton>
                            <SaveAlt />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table
                        sx={{ minWidth: 750 }}
                        aria-labelledby="tableTitle"
                        size="small"
                        stickyHeader
                    >
                        <EnhancedTableHead
                            order={order}
                            orderBy={orderBy}
                            onRequestSort={handleRequestSort}
                            rowCount={rows.length}
                        />
                        <TableBody>
                            {/* if you don't need to support IE11, you can replace the `stableSort` call with: rows.slice().sort(getComparator(order, orderBy)) */}

                            {stableSort(rows, getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => {
                                    const labelId = `enhanced-table-checkbox-${index}`;
                                    var last_update = "";
                                    try {
                                        const time = new Date(row.last_update).getTime();
                                        const diff = (Date.now() - time) / 60000;
                                        last_update = Math.round(diff).toString();
                                    }
                                    catch { }

                                    return (
                                        <TableRow
                                            hover
                                            tabIndex={-1}
                                            key={row.client_id}
                                        >
                                            <TableCell align="left">{(page * rowsPerPage) + index + 1}</TableCell>
                                            <TableCell align="left">{row.client_id}</TableCell>
                                            <TableCell align="left">{row.name}</TableCell>
                                            <TableCell align="left">{row.thread_size}</TableCell>
                                            <TableCell align="left">{row.success}</TableCell>
                                            <TableCell align="left">{row.failed}</TableCell>
                                            <TableCell align="left">{row.sph}</TableCell>
                                            <TableCell align="right">{last_update} m</TableCell>
                                        </TableRow>
                                    );
                                })}
                            {emptyRows > 0 && (
                                <TableRow
                                    style={{
                                        height: 33 * emptyRows,
                                    }}
                                >
                                    <TableCell colSpan={6} />
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[50, 100, 200]}
                    component="div"
                    count={rows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>
        </Box>
    );
}