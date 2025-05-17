import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./styles.css";
import formatDueDate from "../forms/DateFormat";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import moment from "moment-timezone";

function TaskPage() {
    const timezone = 'Europe/Moscow'
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tags, setTags] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsError, setCommentsError] = useState(null);
    const [newCommentText, setNewCommentText] = useState("");
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentText, setEditingCommentText] = useState("");

    const statuses = ["Новые", "Ожидающие", "В работе", "Выполнена"];

    const [showEditTaskModal, setShowEditTaskModal] = useState(false);
    const [editTaskTitle, setEditTaskTitle] = useState("");
    const [editTaskDescription, setEditTaskDescription] = useState("");
    const [editAttachments, setEditAttachments] = useState([]);
    const [editExistingAttachments, setEditExistingAttachments] = useState([]);
    const [editPriority, setEditPriority] = useState("");
    const [editDueDate, setEditDueDate] = useState("");
    const [editComplexity, setEditComplexity] = useState("1");
    const [editSelectedTags, setEditSelectedTags] = useState([]);
    const [editRelatedTask, setEditRelatedTask] = useState("");
    const [editSelectedExecutor, setEditSelectedExecutor] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [history, setHistory] = useState([]);

    const priorityOptions = [
        { value: "Высокий", label: "Высокий" },
        { value: "Средний", label: "Средний" },
        { value: "Низкий", label: "Низкий" },
    ];

    const complexityOptions = [
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
        { value: "5", label: "5" },
    ];
    const [babies, setBabies] = useState([]);
    const userOptions = babies.map((user) => ({
        value: user.id,
        label: user.name,
    }));

    const getUserRole = async () => {
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/users?user_id=${localStorage.getItem("activeUser")}`
            );
            const data = await response.json();
            setRole(data[0].role);
        } catch (error) {
            console.error(error);
        }
    };

    const selectStyles = {
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? "#f6ce45" : provided.backgroundColor,
            color: state.isSelected ? "black" : provided.color,
            "&:hover": {
                backgroundColor: "rgba(246,206,69,0.64)",
                color: "black",
            },
        }),
    };

    const removeAttachment = (attachmentId) => {
        setEditExistingAttachments(editExistingAttachments.filter(att => att.id !== attachmentId));
    };

    const removeNewAttachment = (indexToRemove) => {
        setEditAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const fetchTask = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/task?task_id=${id}`);
            const data = await response.json();
            setTask(data);
        } catch (err) {
            console.error(err);
            setError("Ошибка загрузки задачи");
        } finally {
            setLoading(false);
        }
    };

    const updateTaskStatus = async (newStatus) => {
        console.log(currentUser);
        try {
            const response = await fetch(`http://127.0.0.1:8000/task/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus, current_user: currentUser }),
            });
            const updatedTask = await response.json();
            setTask(updatedTask);
        } catch (err) {
            console.error(err);
            setError("Ошибка обновления задачи");
        }
    };

    const fetchComments = async () => {
        setCommentsLoading(true);
        try {
            const response = await fetch(`http://127.0.0.1:8000/comment/${id}`);
            const data = await response.json();
            setComments(data);
        } catch (err) {
            console.error(err);
            setCommentsError("Ошибка загрузки комментариев");
        } finally {
            setCommentsLoading(false);
        }
    };

    const fetchHitory = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/task/${id}/history`);
            const data = await response.json();
            setHistory(data);
        } catch (err) {
            console.error(err);
            setError("Ошибка загрузки истории");
        }
    }

    const addComment = async (e) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;
        const formData = new FormData();
        const payload = {
            task_id: parseInt(id),
            user_id: localStorage.getItem("activeUser"),
            text: newCommentText,
            current_user: currentUser
        };
        formData.append("comment", JSON.stringify(payload));
        if (attachments && attachments.length > 0) {
            for (let i = 0; i < attachments.length; i++) {
                formData.append('attachments', attachments[i]);
            }
        }
        try {
            const response = await fetch("http://127.0.0.1:8000/comment", {
                method: "POST",
                body: formData,
            });
            if (response.ok) {
                setNewCommentText("");
                setAttachments([]);
                fetchComments();
            } else {
                setCommentsError("Ошибка добавления комментария");
            }
        } catch (err) {
            console.error(err);
            setCommentsError("Ошибка добавления комментария");
        }
    };

    const updateComment = async (commentId) => {
        if (!editingCommentText.trim()) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/comment/${commentId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: editingCommentText }),
            });
            if (response.ok) {
                setEditingCommentId(null);
                setEditingCommentText("");
                fetchComments();
            } else {
                setCommentsError("Ошибка обновления комментария");
            }
        } catch (err) {
            console.error(err);
            setCommentsError("Ошибка обновления комментария");
        }
    };

    const deleteComment = async (commentId) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/comment/${commentId}`, {
                method: "DELETE",
            });
            if (response.ok) {
                fetchComments();
            } else {
                setCommentsError("Ошибка удаления комментария");
            }
        } catch (err) {
            console.error(err);
            setCommentsError("Ошибка удаления комментария");
        }
    };


    useEffect(() => {
        getUserRole();
    }, []);


    useEffect(() => {
        fetchTask();
    }, [id]);

    useEffect(() => {
        if (
            task &&
            task.status === "Новые" &&
            String(localStorage.getItem("activeUser")) === String(task.executor_id)
        ) {
            updateTaskStatus("Ожидающие");
        }
    }, [task]);

    useEffect(() => {
        if (id) {
            fetchComments();
            fetchHitory();
        }
    }, [id]);

    const fetchTags = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/tags");
            const data = await response.json();
            setTags(data);
        } catch (error) {
            console.error(error);
        }
    };

    const selectMyBabies = async () => {
        try {
            const response = await fetch(
                "http://127.0.0.1:8000/users?user_id=" +
                localStorage.getItem("activeUser") +
                "&mybabies=true&difficulty=" + editComplexity
            );
            const data = await response.json();
            setBabies(data.all_users);
            return data;
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        selectMyBabies();
    }, []);

    const deleteTask = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/task/${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                navigate("/main");
            } else {
                console.error("Ошибка удаления задачи");
            }
        } catch (error) {
            console.error("Ошибка удаления задачи:", error);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "Высокий":
                return "rgba(255,102,102,0.5)";
            case "Средний":
                return "rgba(255,242,102,0.5)";
            case "Низкий":
                return "rgba(163,255,102,0.5)";
            default:
                return "gray";
        }
    };

    const deleteAttachment = async (attachmentId) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/attachment/${attachmentId}`, {
                method: "DELETE",
            });
            if (response.ok) {
                fetchTask();
            } else {
                console.error("Ошибка удаления вложения");
            }
        } catch (error) {
            console.error("Ошибка удаления вложения:", error);
        }
    };

    const getLocalMin = () => {
        const now = new Date();
        const Y = now.getFullYear();
        const M = String(now.getMonth() + 1).padStart(2, "0");
        const D = String(now.getDate()).padStart(2, "0");
        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        return `${Y}-${M}-${D}T${h}:${m}`;
    };

    const openEditModal = async () => {
        console.log(editSelectedTags);
        setEditTaskTitle(task.title);
        setEditTaskDescription(task.description);
        setEditPriority(task.priority);
        setEditDueDate(task.due_date ? task.due_date.slice(0, 16) : "");
        setEditComplexity(task.difficulty ? String(task.difficulty) : "");
        setEditSelectedTags(
            task.tags ? task.tags.map((tag) => ({ value: tag.id, label: tag.name })) : []
        );
        setEditRelatedTask(task.epic_task_id ? task.epic_task_id : null);
        const person = babies.find((user) => user.name === task.executor_name);
        setEditSelectedExecutor(person ? { value: person.id, label: person.name } : null);
        setEditExistingAttachments(task.attachments || []);
        setEditAttachments([]);
        setShowEditTaskModal(true);
    };

    const updateTask = async () => {
        const errors = {};
        if (!editTaskTitle.trim()) {
            errors.taskTitle = "Поле обязательно для заполнения.";
        }
        if (!editTaskDescription.trim()) {
            errors.taskDescription = "Поле обязательно для заполнения.";
        }
        if (!editDueDate.trim()) {
            errors.dueDate = "Поле обязательно для заполнения.";
        }
        if (!editPriority.trim()) {
            errors.priority = "Поле обязательно для заполнения.";
        }
        if (!editSelectedExecutor) {
            errors.selectedExecutor = "Поле обязательно для заполнения.";
        }
        if (!editComplexity) {
            errors.selectedComplexity = "Поле обязательно для заполнения.";
        }
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        try {
            const updatedTaskData = {
                project_id: Number(localStorage.getItem("activeProject")),
                executor_id: editSelectedExecutor ? editSelectedExecutor.value : null,
                requestor_id: Number(localStorage.getItem("activeUser")),
                title: editTaskTitle,
                description: editTaskDescription,
                due_date: editDueDate ? moment.tz(editDueDate, timezone).format() : null,
                status: task.status,
                priority: editPriority,
                difficulty: Number(editComplexity),
                tag_ids:
                    editSelectedTags && editSelectedTags.length > 0
                        ? editSelectedTags
                            .filter((tag) => tag.label !== tag.value)
                            .map((tag) => tag.value)
                        : null,
                tag_names:
                    editSelectedTags && editSelectedTags.length > 0
                        ? editSelectedTags
                            .filter((tag) => tag.__isNew__)
                            .map((tag) => tag.value)
                        : null,
                epic_task_id: editRelatedTask ? editRelatedTask : null,
                existing_attachment_ids: editExistingAttachments.map((att) => att.id),
                current_user: currentUser
            };
            console.log(moment.tz(editDueDate, timezone).format());
            console.log(new Date(editDueDate));

            const formData = new FormData();
            formData.append("task", JSON.stringify(updatedTaskData));
            if (editAttachments && editAttachments.length > 0) {
                for (let i = 0; i < editAttachments.length; i++) {
                    formData.append("attachments", editAttachments[i]);
                }
            }
            const response = await fetch(`http://127.0.0.1:8000/task/${task.id}`, {
                method: "PUT",
                body: formData,
            });
            const data = await response.json();
            setTask(data);
            setShowEditTaskModal(false);
            setValidationErrors({});
        } catch (error) {
            console.error(error);
        }
    };

    const currentIndex = task ? statuses.indexOf(task.status) : -1;
    const handleNextStatus = () => {
        if (currentIndex < statuses.length - 1) {
            updateTaskStatus(statuses[currentIndex + 1]);
        }
        navigate(-1);
    };
    const handlePrevStatus = () => {
        if (currentIndex > 0) {
            updateTaskStatus(statuses[currentIndex - 1]);
        }
        navigate(-1);
    };

    const currentUser = localStorage.getItem("activeUserName");
    const canChangeStatus =
        task &&
        (String(task.requestor_name) === currentUser || String(task.executor_name) === currentUser);

    if (loading) {
        return <div className="task-page loading">Загрузка...</div>;
    }
    if (error) {
        return <div className="task-page error">{error}</div>;
    }
    if (!task) {
        return <div className="task-page not-found">Задача не найдена</div>;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content-task">
                <button className="back-button-task" onClick={() => navigate(-1)}>
                    Назад
                </button>

                <div className="task-id-box-modal">#{task.id}</div>
                <h1 className="task-title">{task.title}</h1>
                <p className="task-info">
                    <strong>Приоритет:</strong>{" "}
                    <div style={{ backgroundColor: getPriorityColor(task.priority) }} className="task-priority-box">
                        {task.priority}
                    </div>
                </p>
                <p className="task-info">
                    <strong>Срок:</strong> {formatDueDate(task.due_date)}
                </p>
                <p className="task-info">
                    <strong>Исполнитель:</strong> {task.executor_name}
                </p>
                <p className="task-info">
                    <strong>Автор:</strong> {task.requestor_name}
                </p>
                <p className="task-info">
                    <strong>Статус:</strong> {task.status}
                </p>
                <p className="task-info">
                    <strong>Сложность:</strong> {task.difficulty}
                </p>
                <p className="task-info">
                    <strong>Тэги:</strong>{" "}
                    {task.tags && task.tags.length > 0 && (
                        <div className="task-tags-container">
                            {task.tags.map((tag, index) => (
                                <span key={index} className="task-tag-box">
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    )}
                </p>
                {task.epic_task_id && (
                <p className="task-info">
                    <strong>Эпик задача: </strong>
                    <a href={`/task/${task.epic_task_id}`}>
                         #{task.epic_task_id}
                    </a>
                </p>)
                }
                {task.related_tasks && task.related_tasks.length > 0 && (
                    <div className="task-info">
                        <strong>Связанные задачи:</strong>
                        <ul>
                            {task.related_tasks.map((relatedTask) => (
                                <li key={relatedTask.id}>
                                    <a href={`/task/${relatedTask.id}`}>
                                        {relatedTask.title} (#{relatedTask.id})
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}


                {currentUser !== String(task.executor_name) && role !== "Заказчик" &&
                    <div className="edit-delete-container">
                        <button className="edit-task-button" onClick={openEditModal}>
                            Редактировать
                        </button>
                        <button className="delete-task-button" onClick={deleteTask}>
                            Удалить
                        </button>
                    </div>
                }

                <p className="task-description">{task.description}</p>
                {task.attachments && task.attachments.length > 0 && (
                    <div className="attachments-section">
                        <h3>Вложения</h3>
                        <ul>
                            {task.attachments.map((attachment) => (
                                <li key={attachment.id}>
                                    <a
                                        href={`http://127.0.0.1:8000/attachment/${attachment.id}`}
                                        download
                                    >
                                        {attachment.file_name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {canChangeStatus && (
                    <div className="button-container-task">
                        {currentIndex > 0 && (
                            <button className="previous-button" onClick={handlePrevStatus}>
                                Вернуть в статус: {statuses[currentIndex - 1]}
                            </button>
                        )}
                        {currentIndex < statuses.length - 1 && (
                            <button className="next-button" onClick={handleNextStatus}>
                                Перевести в статус: {statuses[currentIndex + 1]}
                            </button>
                        )}
                    </div>
                )}
                <div className="comments-section">
                    <h2>Комментарии</h2>
                    {commentsLoading ? (
                        <p>Загрузка комментариев...</p>
                    ) : commentsError ? (
                        <p className="error">{commentsError}</p>
                    ) : (
                        <div className="comments-list">
                            {comments.length === 0 ? (
                                <p>Комментариев пока нет.</p>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="comment-item">
                                        <p className="comment-author">
                                            <strong>{comment.user_name}</strong>{" "}
                                            <span className="comment-date">
          {new Date(comment.updated_at).toLocaleString()}
        </span>
                                        </p>

                                        {comment.attachments && comment.attachments.length > 0 && (
                                            <div className="attachments-section">
                                                <ul>
                                                    {comment.attachments.map((attachment) => (
                                                        <li key={attachment.id}>
                                                            <a
                                                                href={`http://127.0.0.1:8000/attachment/${attachment.id}`}
                                                                download
                                                            >
                                                                {attachment.file_name}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {editingCommentId === comment.id ? (
                                            <div className="comment-edit">
          <textarea
              value={editingCommentText}
              onChange={(e) => setEditingCommentText(e.target.value)}
          />
                                                <div className="comment-edit-buttons">
                                                    <button onClick={() => updateComment(comment.id)}>
                                                        Сохранить
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingCommentId(null);
                                                            setEditingCommentText("");
                                                        }}
                                                    >
                                                        Отмена
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="comment-text">{comment.text}</p>
                                                {currentUser === comment.user_name && (
                                                    <div className="comment-buttons">
                                                        <button
                                                            onClick={() => {
                                                                setEditingCommentId(comment.id);
                                                                setEditingCommentText(comment.text);
                                                            }}
                                                        >
                                                            Изменить
                                                        </button>
                                                        <button onClick={() => deleteComment(comment.id)}>
                                                            Удалить
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                    <form className="comment-form" onSubmit={addComment}>
    <textarea
        placeholder="Добавить комментарий..."
        value={newCommentText}
        onChange={(e) => setNewCommentText(e.target.value)}
    />
    <div className="attachment-section">
        <label>Вложение:  </label>
        <input
            type="file"
            onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                    setAttachments((prev) => [...prev, e.target.files[0]]);
                }
            }}
        />
        {attachments && attachments.length > 0 && (
            <div className="attached-files">
                <p>Прикрепленные файлы:</p>
                <ul>
                    {attachments
                        .filter(file => file)
                        .map((file, index) => (
                            <li key={index}>
                                {file?.name}{" "}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setAttachments(prev => prev.filter((_, i) => i !== index))
                                    }
                                >
                                    Удалить
                                </button>
                            </li>
                        ))}
                </ul>
            </div>
        )}
    </div>
                        <button type="submit" className="create-comment-button">
                            Отправить
                        </button>
                    </form>
                </div>
                {history && history.length > 0 && (
                    <div className="history-container">
                        <h2>История изменений</h2>
                        {history
                            .filter((item) => !item.data.endsWith("Изменения: "))
                            .map((item, index) => (
                                <div key={index}>
                                    <div className="comment-header-container">
                                    <h4>{item.user_name}</h4>
                                    <h4 className="datetime">  {formatDueDate(item.created_at)}</h4>
                                    </div>
                                    <ul>
                                        <li>
                                            <p>{item.data}</p>
                                        </li>
                                    </ul>
                                </div>
                            ))}
                    </div>

                )}
            </div>


            {showEditTaskModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowEditTaskModal(false)}
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Редактирование задачи</h2>
                        <label className="yellow-text">Проект</label>
                        <label className="grey-text">
                            {localStorage.getItem("activeProjectName")}
                        </label>
                        <label>Заголовок *</label>
                        <input
                            type="text"
                            value={editTaskTitle}
                            onChange={
                            (e) => {
                                setEditTaskTitle(e.target.value);
                                setValidationErrors(prev => ({...prev, taskTitle: ""}));
                            }
                        }
                        />
                        {validationErrors.taskTitle && (
                            <div className="error-message">{validationErrors.taskTitle}</div>
                        )}
                        <label>Описание *</label>
                        <textarea
                            rows="5"
                            value={editTaskDescription}
                            onChange={(e) => {
                                setEditTaskDescription(e.target.value);
                                setValidationErrors(prev => ({ ...prev, taskDescription: "" }));}
                        }
                        />
                        {validationErrors.taskDescription && (
                            <div className="error-message">{validationErrors.taskDescription}</div>
                        )}
                        <label>Вложение</label>
                        <input
                            type="file"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    setEditAttachments(prev => [...prev, e.target.files[0]]);
                                }
                            }}
                        />
                        {editAttachments && editAttachments.length > 0 && (
                            <div className="new-attachments">
                                <p>Новые вложения:</p>
                                <ul>
                                    {editAttachments.map((file, index) => (
                                        <li key={index}>
                                            {file?.name}{" "}
                                            <button
                                                type="button"
                                                onClick={() => removeNewAttachment(index)}
                                            >
                                                Удалить
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {editExistingAttachments && editExistingAttachments.length > 0 && (
                            <div className="existing-attachments">
                                <p>Текущие вложения:</p>
                                <ul>
                                    {editExistingAttachments.map((att) => (
                                        <li key={att.id}>
                                            <a
                                                href={`http://127.0.0.1:8000/attachment/${att.id}`}
                                                download
                                            >
                                                {att.file_name}
                                            </a>
                                            <button
                                                onClick={() => [removeAttachment(att.id), deleteAttachment(att.id)]}
                                                type="button"
                                            >
                                                Удалить
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <label>Приоритет *</label>
                        <Select
                            options={priorityOptions}
                            value={priorityOptions.find(
                                (option) => option.value === editPriority
                            )}
                            onChange={(option) => {
                                setEditPriority(option.value);
                                setValidationErrors(prev => ({ ...prev, priority: "" }));}
                        }
                            placeholder="Выберите приоритет..."
                            styles={selectStyles}
                        />
                        {validationErrors.priority && (
                            <div className="error-message">{validationErrors.priority}</div>
                        )}
                        <label>Сложность *</label>
                        <Select
                            options={complexityOptions}
                            value={complexityOptions.find(
                                (option) => option.value === editComplexity
                            )}
                            onChange={(option) => {
                                setEditComplexity(option.value);
                                setValidationErrors(prev => ({ ...prev, selectedComplexity: "" }));
                        }}
                            placeholder="Выберите сложность..."
                            styles={selectStyles}
                        />
                        {validationErrors.selectedComplexity && (
                            <div className="error-message">{validationErrors.selectedComplexity}</div>
                        )}
                        <label>Исполнитель *</label>
                        <Select
                            options={userOptions}
                            value={editSelectedExecutor}
                            onChange={(option) => {
                                setEditSelectedExecutor(option);
                                setValidationErrors(prev => ({ ...prev, selectedExecutor: "" }));
                            }}
                            isSearchable={true}
                            placeholder="Выберите исполнителя..."
                            styles={selectStyles}
                            onMenuOpen={selectMyBabies}
                        />
                        {validationErrors.selectedExecutor && (
                            <div className="error-message">{validationErrors.selectedExecutor}</div>
                        )}
                        <label>Дата выполнения *</label>
                        <input
                            type="datetime-local"
                            value={editDueDate}
                            min={getLocalMin()}
                            onChange={(e) => {
                                const val = e.target.value;
                                const sel = new Date(val);
                                const now = new Date();

                                if (sel < now) {
                                    setValidationErrors(prev => ({
                                        ...prev,
                                        dueDate: "Дата и время не могут быть раньше текущего"
                                    }));
                                    return;
                                }

                                setEditDueDate(val);
                                setValidationErrors(prev => ({ ...prev, dueDate: "" }));
                            }}
                        />
                        {validationErrors.dueDate && (
                            <div className="error-message">{validationErrors.dueDate}</div>
                        )}
                        <label>Тэги (необязательно)</label>
                        <CreatableSelect
                            options={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
                            value={editSelectedTags}
                            onChange={setEditSelectedTags}
                            isMulti
                            placeholder="Выберите тэги..."
                            styles={selectStyles}
                            isClearable
                            onMenuOpen={fetchTags}
                        />
                        <label>Связанная задача (необязательно)</label>
                        <input
                            type="text"
                            value={editRelatedTask}
                            onChange={(e) => setEditRelatedTask(e.target.value)}
                            placeholder="Введите ID связанной задачи..."
                        />
                        <div className="modal-buttons">
                            <button className="create-button" onClick={updateTask}>
                                Сохранить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TaskPage;
