import React, { createContext, useState, useContext } from "react";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const initialData = {
    semester: "F25",
    selectedCourse: "", // page 1
    SLO: "", // page 2
    level: "", 
    description: "", // page 2
    courseActivities: [],
    piTable: [], // page 3
    rubricTable: [], // page 4 and 5
    cumulativeTable: [], // page 5
    dataAnalysis: "", // page 5
    pdfUrl: null,
    prevRubric: [], 

    csvData: [],
    formulaByPI: {},
    thresholdByPI: {},
    piDescriptions: [],
    activityVars: {},
    activityDescs: {},
    flowSource: "", // In summary page(page5), flag for previous page(PI or PICSV)
  }
  
  const [data, setData] = useState(initialData); 

  const updateData = (nameOrObject, newData) => {
    if (typeof nameOrObject === "object") {
      setData(prevData => ({
        ...prevData,
        ...nameOrObject,
      }));
    } else {
      setData(prevData => ({
        ...prevData,
        [nameOrObject]: newData,
      }));
    }
  };

  const resetData = () => {
    updateData(initialData);
  };

  return (
    <DataContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);