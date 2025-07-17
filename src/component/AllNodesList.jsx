import React, {useState} from 'react';
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow} from '@mui/material';

export const AllNodesList = ({
                                 dataMap, selectedRowIndex,
                                 setSelectedRowIndex,
                             }) => {
    const rows = Array.from(dataMap.entries()).map(([index, stats]) => ({
        index,
        ...stats,
    }));

    const [page, setPage] = useState(0);
    const rowsPerPage = 10;

    const handleChangePage = (_, newPage) => setPage(newPage);

    return (
        <Paper sx={{width: '100%', overflow: 'hidden'}}>
            <TableContainer>
                <Table stickyHeader size="small" aria-label="compact table">
                    <TableHead>
                        <TableRow sx={{'& th': {fontSize: '0.75rem', padding: '4px 8px'}}}>
                            <TableCell>Subgraph Index</TableCell>
                            <TableCell>Node Count</TableCell>
                            <TableCell>All Time Link Count</TableCell>
                            <TableCell>Total Revenue</TableCell>
                            <TableCell>Average Revenue</TableCell>
                            <TableCell>Biggest Revenue Company</TableCell>
                            <TableCell>Biggest Link Company</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row) => (
                                <TableRow
                                    key={row.index}
                                    onClick={() => setSelectedRowIndex(row.index)}
                                    selected={selectedRowIndex === row.index}
                                    hover
                                    sx={{
                                        '& td': {fontSize: '0.75rem', padding: '4px 8px'},
                                        cursor: 'pointer',
                                    }}
                                >
                                    <TableCell>{row.index}</TableCell>
                                    <TableCell>{row.countNodes}</TableCell>
                                    <TableCell>{row.countLinks}</TableCell>
                                    <TableCell>{row.totalRevenue.toFixed(2)}</TableCell>
                                    <TableCell>{row.averageRevenue.toFixed(2)}</TableCell>
                                    <TableCell>{row.biggestCompanyName}</TableCell>
                                    <TableCell>{row.biggestLinkCompany}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[10]}
                component="div"
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                sx={{'.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {fontSize: '0.75rem'}}}
            />
        </Paper>
    );
}
