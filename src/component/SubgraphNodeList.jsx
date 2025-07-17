import React, { useMemo, useState } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead, TablePagination,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';

export const SubgraphNodeList = ({ subgraph,
                                     selectedNodeId,
                                     onSelectNode, }) => {
    const [filter, setFilter] = useState("all");
    const [orderBy, setOrderBy] = useState("linkCount");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const useNodesWithLinkCount = (subgraph) => {
        return useMemo(() => {
            if (!subgraph) return [];

            const { nodes, links } = subgraph;

            const linkMap = {};

            links.forEach(({ source, target }) => {
                linkMap[source] = (linkMap[source] || 0) + 1;
                linkMap[target] = (linkMap[target] || 0) + 1;
            });

            return nodes.map((node) => ({
                ...node,
                linkCount: linkMap[node.id] || 0,
            }));
        }, [subgraph]);
    }

    const nodesWithLinkCount = useNodesWithLinkCount(subgraph);

    const filteredNodes = useMemo(() => {
        if (!nodesWithLinkCount) return [];

        let filtered = nodesWithLinkCount;

        switch (filter) {
            case "persons":
                filtered = filtered.filter((n) => n.type.startsWith("Entity.Person"));
                break;
            case "companies":
                filtered = filtered.filter((n) =>
                    n.type.startsWith("Entity.Organization")
                );
                break;
            default:
                break;
        }
        return filtered;
    }, [nodesWithLinkCount, filter]);

    const sortedNodes = useMemo(() => {
        const sorted = [...filteredNodes];
        sorted.sort((a, b) => {
            let aVal, bVal;

            if (orderBy === "id") {
                aVal = a.id.toLowerCase();
                bVal = b.id.toLowerCase();
            } else if (orderBy === "linkCount") {
                aVal = a.linkCount;
                bVal = b.linkCount;
            } else {
                aVal = a.id.toLowerCase();
                bVal = b.id.toLowerCase();
            }

            if (aVal < bVal) return order === "asc" ? -1 : 1;
            if (aVal > bVal) return order === "asc" ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredNodes, orderBy, order]);

    const paginatedNodes = useMemo(() => {
        const start = page * rowsPerPage;
        return sortedNodes.slice(start, start + rowsPerPage);
    }, [sortedNodes, page, rowsPerPage]);

    const handleFilterChange = (_, newFilter) => {
        if (newFilter !== null) setFilter(newFilter);
        setPage(0);
    };

    const handleSortChange = (field) => {
        if (orderBy === field) {
            setOrder(order === "asc" ? "desc" : "asc");
        } else {
            setOrderBy(field);
            setOrder("asc");
        }
    };

    const handlePageChange = (_, newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleRowClick = (nodeId) => {
        if (onSelectNode) {
            onSelectNode(nodeId);
        }
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Nodes in Selected Subgraph
            </Typography>

            <ToggleButtonGroup
                value={filter}
                exclusive
                onChange={handleFilterChange}
                size="small"
                sx={{ mb: 2 }}
            >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="persons">Persons</ToggleButton>
                <ToggleButton value="companies">Companies</ToggleButton>
            </ToggleButtonGroup>

            <TableContainer>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow
                            sx={{ "& th": { fontSize: "0.75rem", padding: "4px 8px", cursor: "pointer" } }}
                        >
                            <TableCell onClick={() => handleSortChange("id")}>
                                id {orderBy === "id" ? (order === "asc" ? "▲" : "▼") : ""}
                            </TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell onClick={() => handleSortChange("linkCount")}>
                                Link Count {orderBy === "linkCount" ? (order === "asc" ? "▲" : "▼") : ""}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedNodes.map((node) => (
                            <TableRow
                                key={node.id}
                                onClick={() => handleRowClick(node.id)}
                                selected={selectedNodeId === node.id}
                                hover
                                sx={{
                                    cursor: "pointer",
                                    "& td": { fontSize: "0.75rem", padding: "4px 8px" },
                                }}
                            >
                                <TableCell>{node.id}</TableCell>
                                <TableCell>{node.type.replace("Entity.", "")}</TableCell>
                                <TableCell>{node.linkCount}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={sortedNodes.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                labelRowsPerPage="Rows per page"
            />
        </Paper>
    );
}
