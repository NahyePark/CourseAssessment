import React from "react";
import "./Button.css";

function Button({ text, onClick }) {
    return (
        <button onClick={onClick} className="custom-button">
            {text}
        </button>
    )
}

export default Button;