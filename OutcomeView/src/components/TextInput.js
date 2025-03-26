import React from 'react';

function TextInput({ label, value, onChange, placeholder, className }) {
    
    return (
        <div>
            {label && <label>{label}</label>}
            <textarea
                value={value || ""}
                onChange={onChange}
                placeholder={placeholder || ""}
                className={className}
            />
        </div>
    );
}

export default TextInput;