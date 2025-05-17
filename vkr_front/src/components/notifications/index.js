import React from 'react';
import styles from './styles.css';

const Notification = ({ id, message, type, onClose }) => {
    return (
        <div className={"notification " + type}>
            <div className="message">{message}</div>
            <button
                className="closeButton"
                onClick={() => onClose(id)}
                aria-label="Закрыть уведомление"
            >
                &times;
            </button>
        </div>
    );
};

export default Notification;
