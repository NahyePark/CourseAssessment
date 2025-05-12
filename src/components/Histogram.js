import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

function Histogram({ data, className, value }) {

    const chartData = [
        { name: "Exemplary", [value]: parseFloat(data.Exemplary.replace('%', '')) },
        { name: "Satisfactory", [value]: parseFloat(data.Satisfactory.replace('%', '')) },
        { name: "Developing", [value]: parseFloat(data.Developing.replace('%', '')) },
        { name: "Unsatisfactory", [value]: parseFloat(data.Unsatisfactory.replace('%', '')) },
    ];

    return (
        <ResponsiveContainer className={className} width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <Tooltip />
                <Legend />
                <Bar dataKey={value} fill="#8884d8" barSize={50} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export default Histogram;