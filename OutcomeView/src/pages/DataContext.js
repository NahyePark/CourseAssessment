import React, { createContext, useState, useContext } from "react";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
        selectedCouse: "", // page 1
        SLO: "", // page 2
        description: "", // page 2
        courseActivities: [],
        piTable: [], // page 3
        rubricTable: [], // page 4 and 5
        cumulativeTable: [], // page 5
        dataAnalysis: "", // page 5
        pdfUrl: null,
  }); 

  const updateData = (name, newData) => {
    setData(prevData => ({
        ...prevData,
        [name]: newData,
    }));
};

  return (
    <DataContext.Provider value={{ data, updateData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);