import React from "react";
import "./styles.css";
import formatDueDate from "../forms/DateFormat";

function TaskCard({ task, color, onClick }) {
    const getPriorityColor = (priority) => {
        switch (priority) {
            case "Высокий":
                return "rgba(253,122,122,0.5)";
            case "Средний":
                return "rgba(255,242,102,0.5)";
            case "Низкий":
                return "rgba(163,255,102,0.5)";
            default:
                return "gray";
        }
    };

    return (
        <div className="task-card" style={{ backgroundColor: color }} onClick={onClick}>
            <div className="task-id-box">#{task.id}</div>
            <p className="task-title-main">{task.title}</p>
            <p className="task-info-main"><strong>Срок:</strong> {formatDueDate(task.due_date)}</p>
            <p className="task-info-main"><strong>Исполнитель:</strong> {task.executor_name}</p>
            {task.tags && task.tags.length > 0 && (
                <div className="task-tags-container">
                    {task.tags.map((tag, index) => (
                        <span key={index} className="task-tag-box">{tag.name}</span>
                    ))}
                </div>
            )}
            <div
                className="task-priority-box"
                style={{ backgroundColor: getPriorityColor(task.priority) }}
            >
                {task.priority}
            </div>
        </div>
    );
}

function Column({ title, color, tasks, onTaskClick }) {
    return (
        <div className="column-container">
            <h2 className="column-title">{title}</h2>
            <div className="column-content">
                {tasks && tasks.length > 0 ? (
                    tasks.map((task, index) => (
                        <TaskCard
                            key={task.id || index}
                            task={task}
                            color={color}
                            onClick={() => onTaskClick(task)}
                        />
                    ))
                ) : (
                    <p className="no-tasks">Нет задач</p>
                )}
            </div>
        </div>
    );
}

export default Column;
