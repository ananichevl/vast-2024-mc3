import {RevenueFilterGraph} from "./SliderRange";
import {Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, TextField} from "@mui/material";
import {useState} from "react";
import {CountryTreeMap} from "./CountryTreeMap";

export const FilterRow = ({countries, data, setSelectedRevenueRange, selectedRevenueRange, searchTerm, setSearchTerm, selectedTypes, setSelectedTypes}) => {
    const [isOpen, setIsOpen] = useState(false);
    return (<>
        <div style={{display: 'flex', height: '160px;'}}>
            {data && <RevenueFilterGraph nodes={data.nodes} selectedRevenueRange={selectedRevenueRange}
                                         setSelectedRevenueRange={setSelectedRevenueRange}/>}
            <div style={{display: 'flex', flexDirection: 'column'}}>
                <TextField
                    label="Search Node ID"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ marginBottom: '1rem', width: '250px' }}
                />
                <Button variant="contained" onClick={() => setIsOpen(true)}>
                    Select Country Types
                </Button>
                {selectedTypes && <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
                    {Array.from(selectedTypes).map(type => (
                        <Chip
                            key={type}
                            label={type}
                            /*onDelete={() => handleToggle(type)}*/
                            color="primary"
                        />
                    ))}
                </Box>}

                <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Select Country Types</DialogTitle>
                    <DialogContent>
                        {countries && <CountryTreeMap data={countries} selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes}/>}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </div>
            {/*<div>
                <SearchInput/>
                <FishCompaniesCheckbox/>
            </div>
            <div>
                <SliderRange/>
            </div>
            <div>
                <PeriodSelection/>
            </div>*/}
        </div>
    </>);
}
