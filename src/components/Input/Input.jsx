import React from "react";

export const Input = ({
  onChange,
  name,
  label,
  placeholder,
  type,
  labelClass,
  inputClass,
  divClass,
  max,
  min,
  value
}) => {
  return (
    <div className={divClass}>
      <label className={labelClass} htmlFor="grid-first-name">
        {label}
      </label>
      <input
        className={inputClass}
        id="grid-first-name"
        type={type}
        max={type === "number" ? max : ""}
        min={type === "number" ? min : ""}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
      />
    </div>
  );
};
