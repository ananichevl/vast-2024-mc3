import './App.css';
import {CheckDataComponent} from "./component/CheckDataComponent";
import React, {useEffect, useState} from "react";
import {AllNodesList} from "./component/AllNodesList";
import {Dashboard} from "./component/Dashboard";

export const App = () => {
    const [jsonData, setJsonData] = useState(null);
    const [subgraphs, setSubgraphs] = useState(null);

    useEffect(() => {
        fetch('/mc3.json')
            .then(response => response.text())
            .then((response) => {
                const clean = response.replace(/\bNaN\b/g, 'null');
                return JSON.parse(clean);
            })
            .then((data) => {
                setJsonData(data);
            })
            .catch((error) => {
                console.error('Error loading JSON:', error);
            });
    }, []);

    useEffect(() => {
        fetch('/subgraphs.json')
            .then(response => response.text())
            .then((response) => {
                return JSON.parse(response);
            })
            .then((data) => {
                setSubgraphs(data);
            })
            .catch((error) => {
                console.error('Error loading JSON:', error);
            });
    }, []);

    const countries = new Map();
    if (jsonData && jsonData.nodes) {
        for (const node of jsonData.nodes) {
            const value = node.country || "Unknown";
            countries.set(value, (countries.get(value) || 0) + 1);
        }
    }

    return (
        <>
            <div className="App">
                <Dashboard graph={jsonData} subgraphs={subgraphs} countries={countries}/>
            </div>
            <div id="tooltip" style={{
                position: "absolute",
                background: "white",
                border: "1px solid #ccc",
                padding: "8px",
                fontSize: "12px",
                pointerEvents: "none",
                display: "none",
                zIndex: 1000
            }}></div>
        </>
    );
}

export default App;
