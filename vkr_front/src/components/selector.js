import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { components } from "react-select";

const UserOption = (props) => {
    const { data } = props;
    const [hovered, setHovered] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const optionRef = useRef(null);

    const handleMouseEnter = () => {
        setHovered(true);
        if (optionRef.current) {
            const rect = optionRef.current.getBoundingClientRect();
            setTooltipPosition({
                top: rect.top - 150,
                left: rect.left + 400,
            });
        }
    };

    const handleMouseLeave = () => {
        setHovered(false);
    };

    return (
        <div
            ref={optionRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ position: "relative" }}
        >
            <components.Option {...props} />
            {hovered &&
                createPortal(
                    <div
                        className="user-tooltip"
                        style={{
                            position: "absolute",
                            marginRight: "50px",
                            top: tooltipPosition.top,
                            left: tooltipPosition.left,
                            zIndex: 9999,
                            backgroundColor: "#f5f5f5",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            padding: "8px",
                            boxShadow: "0 0 6px rgba(0, 0, 0, 0.2)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        <h3>
                            <strong>{data.name}</strong>
                        </h3>
                        <p>
                            <strong>Должность:</strong> {data.position || "N/A"}
                        </p>
                        <p>
                            <strong>Отдел:</strong> {data.department || "N/A"}
                        </p>
                        <p>
                            <strong>Почта:</strong> {data.email || "N/A"}
                        </p>
                        <p>
                            <strong>Телефон:</strong> {data.phone || "N/A"}
                        </p>
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default UserOption;

