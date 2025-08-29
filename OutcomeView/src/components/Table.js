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
            tableLayout: "fixed" 
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
                  {col.header ?? col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) => {
                  const value = row[col.name];
                  const colType = typeof col.type === "function" ? col.type(row, rowIndex) : col.type;
                  // 'number' | 'text' | undefined
                  const cellKindRaw = typeof col.cellKind === "function" ? col.cellKind(row, rowIndex, col.name): col.cellKind; 
                  const isNumberCell = colType === "number" || (colType === "textOrNumber" &&
                                                    (cellKindRaw
                                                      ? cellKindRaw === "number"
                                                      : !!row.isNumberRow)); 
                  const readOnly = typeof col.readOnly === "function" ? !!col.readOnly(row, rowIndex, col.name): !!col.readOnly;
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

                  const tdWidth = isNumberCell || colType === "number" ? "50px" : "auto";
                  return (
                    <td key={colIndex} style={{ 
                        padding: "10px", 
                        textAlign: "center",
                        width: tdWidth, 
                      }}>
                      {colType === "textOrNumber" ? (
                        isNumberCell ? (
                          readOnly ? (
                            <span
                              style={{ fontSize: inputFontSize, opacity: 0.7 }}
                            >
                              {value ?? ""}
                            </span>
                          ) : (
                            <input
                              type="number"
                              value={value ?? ""}
                              onChange={(e) =>
                                handleInputChange(
                                  rowIndex,
                                  col.name,
                                  e.target.value
                                )
                              }
                              style={{
                                width: "95%",
                                height: "40px",
                                fontSize: inputFontSize,
                                padding: "5px",
                              }}
                            />
                          )
                        ) : readOnly ? (
                          <span style={{ fontSize: inputFontSize, opacity: 0.7 }}>
                            {value ?? ""}
                          </span>
                        ) : (
                          <textarea
                            value={value ?? ""}
                            onChange={(e) =>
                              handleInputChange(rowIndex, col.name, e.target.value)
                            }
                            style={{
                              width: "95%",
                              height: inputHeight,
                              fontSize: inputFontSize,
                              padding: "5px",
                            }}
                          />
                        )
                      ) : colType === "checkbox" ? (
                        <input
                          type="checkbox"
                          checked={!!value}
                          onChange={() =>
                            handleInputChange(rowIndex, col.name, !value)
                          }
                        />
                      ) : (
                        <span style={{ fontSize: inputFontSize }}>{value}</span>
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