import React from "react";

function Table({ className, columns, data, onDataChange, tableWidth = "80%", inputWidth = "95%", inputHeight = "150px", inputFontSize = "16px" }) {

    const handleInputChange = (rowIndex, columnName, value) => {
        const updatedData = [...data];
        updatedData[rowIndex][columnName] = value;
        onDataChange(updatedData);
    };

    const firstColumnName = columns.length > 0 ? columns[0].name : null;

    const getRowSpan = (rowIndex, columnName) => {
        if (rowIndex > 0 && data[rowIndex - 1][columnName] === data[rowIndex][columnName]) {
            return 0; 
        }

        let span = 1;
        for (let i = rowIndex + 1; i < data.length; i++) {
            if (data[i][columnName] === data[rowIndex][columnName]) {
                span++;
            } else {
                break;
            }
        }
        return span;
    };

    return (
        <table
          style={{
            width: tableWidth,
            borderCollapse: "collapse",
            margin: "20px auto",
            tableLayout: "fixed" // Force column widths to be respected
          }}
          className={className}
          border="1"
          cellPadding="5"
        >
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index} 
                    style={{ 
                      fontSize: "18px", 
                      padding: "10px",
                      width: col.name === firstColumnName ? "100px" : "auto", // Adjust PI column width
                      minWidth: col.name === firstColumnName ? "80px" : "auto",
                    }}
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) => {
                  const value = row[col.name];

                  if (col.name === firstColumnName) {
                    const rowSpan = getRowSpan(rowIndex, col.name);
                    if (rowSpan === 0) return null; 
                    return (
                      <td 
                        key={colIndex} 
                        rowSpan={rowSpan} 
                        style={{ 
                          padding: "10px", 
                          textAlign: "center",
                          width: "100px", 
                          minWidth: "80px", 
                        }}
                      >
                        {value}
                      </td>
                    );
                  }

                  return (
                    <td key={colIndex} style={{ 
                        padding: "10px", 
                        textAlign: "center",
                        width: col.type === "number" ? "50px" : "auto", 
                      }}>
                      {col.type === "textOrNumber" ? (
                        row.isNumberRow? (
                            <input
                                type={"number"}
                                value={value || ""}
                                onChange={(e) => handleInputChange(rowIndex, col.name, e.target.value)}
                                style={{
                                    flex: "flex-start",
                                    flexDirection: "column",
                                    width: "95%", 
                                    height: "40px", 
                                    fontSize: inputFontSize,
                                    padding: "5px",
                                }}
                        />
                        ) : (
                            <textarea
                                type={"text"}
                                value={value || ""}
                                onChange={(e) => handleInputChange(rowIndex, col.name, e.target.value)}
                                style={{
                                    flex: "flex-start",
                                    flexDirection: "column",
                                    width: "95%", 
                                    height: inputHeight, 
                                    fontSize: inputFontSize,
                                    padding: "5px",
                                }}
                        />
                        )
                        
                      ) : (
                        <span style={{ 
                            fontSize: inputFontSize,
                            }}>
                            {value}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
    );
}

export default Table;