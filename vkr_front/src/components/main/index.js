import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Column from "./Tasks";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import "./styles.css";
import { all } from "axios";
import moment from "moment-timezone";
import UserOption from "../selector";
import {FaFilter, FaRegUser} from "react-icons/fa";

const columns = [
    { title: "Новые", status: "Новые", color: "#ffe3e3" },
    { title: "Ожидающие", status: "Ожидающие", color: "#fdf6e0" },
    { title: "В процессе", status: "В работе", color: "#e6ffe6" },
    { title: "Завершенные", status: "Выполнена", color: "#e8e8e8" },
];

function Main() {
    const navigate = useNavigate();
    const timezone = 'Europe/Moscow';

    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [babies, setBabies] = useState([]);
    const [filteredBabies, setFilteredBabies] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [projectTitle, setProjectTitle] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [isRequestor, setIsRequestor] = useState(false);
    const [isChooseProject, setIsChooseProject] = useState(true);
    const [activeTaskCategory, setActiveTaskCategory] = useState("my");
    const [tags, setTags] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});


    const [activeProjectId, setActiveProjectId] = useState(
        localStorage.getItem("activeProject") ? localStorage.getItem("activeProject") : "1"
    );
    const [attachments, setAttachments] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [attachment, setAttachment] = useState("");
    const [priority, setPriority] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [selectedExecutor, setSelectedExecutor] = useState(null);
    const [requestorId, setRequestorId] = useState("");
    const [status, setStatus] = useState("Новые");
    const [role, setRole] = useState("");

    const [complexity, setComplexity] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [relatedTask, setRelatedTask] = useState("");

    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filterComplexity, setFilterComplexity] = useState("");
    const [filterPriority, setFilterPriority] = useState("");
    const [filterTags, setFilterTags] = useState([]);
    const [filterDueDate, setFilterDueDate] = useState("");

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

    const allUsers = [];
    if (filteredBabies && filteredBabies.length > 0) {
        allUsers.push(...filteredBabies);
    }
    allUsers.push(...babies);
    const userOptions = allUsers.map((user) => ({
        value: user.id,
        label: user.rating
            ? user.name + ", рейтинг: " + user.rating + ", tasks: " + user.tasks
            : user.name,
    }));

    console.log(userOptions);

    const selectStyles = {
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#f6ce45' : provided.backgroundColor,
            color: state.isSelected ? 'black' : provided.color,
            '&:hover': {
                backgroundColor: 'rgba(246,206,69,0.64)',
                color: 'black',
            },
        }),
    };

    const filterContainerRef = useRef(null);
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                filterContainerRef.current &&
                !filterContainerRef.current.contains(event.target)
            ) {
                setShowFilterPanel(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getTasks = async () => {
        try {
            const activeProject = localStorage.getItem("activeProject");
            if (!activeProject) {
                return;
            }
            let url = `http://127.0.0.1:8000/tasks?project_id=${activeProject}&is_requestor=${isRequestor}`;
            if (role === "Руководитель проектов") {
                url = `http://127.0.0.1:8000/tasks?project_id=${activeProject}`;
            } else {
                if (role !== "Заказчик") {
                    url += `&user_id=${localStorage.getItem("activeUser")}`;
                }
            }
            const response = await fetch(url);
            const data = await response.json();
            setTasks(data);
        } catch (error) {
            console.error(error);
        }
    };

    const getProjects = async () => {
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/projects?user_id=${localStorage.getItem("activeUser")}`
            );
            const data = await response.json();
            setProjects(data);
        } catch (error) {
            console.error(error);
        }
    };

    const setActiveProject = (id, name) => {
        localStorage.setItem("activeProject", id);
        localStorage.setItem("activeProjectName", name);
        setActiveProjectId(id);
        setIsChooseProject(true);
        getTasks();
    };

    useEffect(() => {
        getProjects();
        getUsers();
        getUserRole();
        getTasks();
    }, [isRequestor]);

    const getUserRole = async () => {
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/users?user_id=${localStorage.getItem("activeUser")}`
            );
            const data = await response.json();
            setRole(data[0].role);
            if (data[0].role === "Руководитель проектов") {
                setIsRequestor(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getUsers = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/users");
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
        }
    };

    const selectMyBabies = async () => {
        try {
            let url = `http://127.0.0.1:8000/users?user_id=${localStorage.getItem("activeUser")}&mybabies=true`;
            if (complexity) {
                url += `&difficulty=${complexity}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            setBabies(data.all_users);
            setFilteredBabies(data.filtered_users);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenModal = () => setShowModal(true);
    const handleCloseModal = () => {
        setShowModal(false);
        setValidationErrors({});
    };
    const handleOpenTaskModal = () => setShowTaskModal(true);
    const handleCloseTaskModal = () => {
        setShowTaskModal(false);
        setTaskTitle("");
        setTaskDescription("");
        setAttachment("");
        setAttachments([]);
        setPriority("");
        setDueDate("");
        setSelectedExecutor(null);
        setRequestorId("");
        setStatus("Новые");
        setComplexity("");
        setSelectedTags([]);
        setRelatedTask("");
        setValidationErrors({});
    };

    const fetchTags = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/tags");
            const data = await response.json();
            setTags(data);
        } catch (error) {
            console.error(error);
        }
    };

    const createProject = async () => {
        const errors = {};
        if (!projectTitle.trim()) {
            errors.projectTitle = "Поле обязательно для заполнения.";
        }
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        try {
            const response = await fetch("http://127.0.0.1:8000/project", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: localStorage.getItem("activeUser"),
                    name: projectTitle,
                    description: projectDescription,
                }),
            });
            const data = await response.json();
            getProjects();
        } catch (error) {
            console.error(error);
        }
        setProjectTitle("");
        setProjectDescription("");
        setShowModal(false);
    };

    const createTask = async () => {
        const errors = {};
        if (!taskTitle.trim()) {
            errors.taskTitle = "Поле обязательно для заполнения.";
        }
        if (!taskDescription.trim()) {
            errors.taskDescription = "Поле обязательно для заполнения.";
        }
        if (!dueDate.trim()) {
            errors.dueDate = "Поле обязательно для заполнения.";
        }
        if (!priority.trim()) {
            errors.priority = "Поле обязательно для заполнения.";
        }
        if (!selectedExecutor) {
            errors.selectedExecutor = "Поле обязательно для заполнения.";
        }
        if (!complexity.trim()) {
            errors.complexity = "Поле обязательно для заполнения.";
        }
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        try {
            const taskData = {
                project_id: Number(localStorage.getItem("activeProject")),
                executor_id: selectedExecutor ? selectedExecutor.value : null,
                requestor_id: Number(localStorage.getItem("activeUser")),
                title: taskTitle,
                description: taskDescription,
                due_date: dueDate ? moment.tz(dueDate, timezone).format() : null,
                status: "Новые",
                priority,
                difficulty: Number(complexity),
                tag_ids:
                    selectedTags && selectedTags.length > 0
                        ? selectedTags
                            .filter((tag) => tag.label !== tag.value)
                            .map((tag) => tag.value)
                        : null,
                tag_names:
                    selectedTags && selectedTags.length > 0
                        ? selectedTags.filter((tag) => tag.__isNew__).map((tag) => tag.value)
                        : null,
                epic_task_id: relatedTask ? relatedTask : null,
                current_user: localStorage.getItem("activeUserName"),
            };

            const formData = new FormData();
            formData.append("task", JSON.stringify(taskData));
            if (attachments && attachments.length > 0) {
                for (let i = 0; i < attachments.length; i++) {
                    formData.append("attachments", attachments[i]);
                }
            }
            const response = await fetch("http://127.0.0.1:8000/task", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            setTaskTitle("");
            setTaskDescription("");
            setAttachments([]);
            setPriority("");
            setDueDate("");
            setSelectedExecutor(null);
            setComplexity("");
            setSelectedTags([]);
            setRelatedTask("");
            setValidationErrors({});
            getTasks();
            setShowTaskModal(false);
        } catch (error) {
            console.error(error);
        }
    };

    const changeTeamLeadTasksTrue = () => {
        setIsRequestor(true);
        setActiveTaskCategory("team");
    };

    const changeTeamLeadTasksFalse = () => {
        setIsRequestor(false);
        setActiveTaskCategory("my");
    };

    const handleTaskClick = (task) => {
        navigate(`/task/${task.id}`);
    };

    const handleAccountClick = () => {
        navigate("/account");
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

    const handleLogout = async () => {
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/logout?user_id=${localStorage.getItem("activeUser")}`
            );
            localStorage.removeItem("activeUser");
            window.location.href = "/";
        } catch (e) {
            console.error(e);
        }
    };

    const handleStatsClick = () => {
        navigate("/stats");
    };

    const filteredTasks = tasks.filter((task) => {
        const matchesSearch =
            ((task.title || "").toLowerCase().includes(searchQuery.toLowerCase())) ||
            ((task.description || "").toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesComplexity = filterComplexity
            ? Number(task.difficulty) === Number(filterComplexity)
            : true;
        const matchesPriority = filterPriority ? task.priority === filterPriority : true;
        const matchesTags =
            filterTags.length > 0
                ? task.tags && filterTags.some((tag) => task.tags.map((n) => n.name).includes(tag.label))
                : true;
        const matchesDueDate = filterDueDate
            ? task.due_date &&
            new Date(task.due_date).toISOString().slice(0, 16) === filterDueDate
            : true;

        return matchesSearch && matchesComplexity && matchesPriority && matchesTags && matchesDueDate;
    });

    const formatUserOption = (user) => ({
        value: user.id,
        label: user.rating
            ? `${user.name}, Рейтинг: ${user.rating}, Активных задач: ${Math.abs(user.tasks)}`
            : user.name,
        rating: user.rating,
        tasks: Math.abs(user.tasks),
        phone: user.phone,
        email: user.email,
        position: user.position,
        department: user.department,
        name: user.name,
    });

    let selectOptions = [];
    if (!complexity) {
        selectOptions = [
            {
                label: "Чтобы увидеть предложения, выберите сложность",
                options: (babies || []).map(formatUserOption),
            },
        ];
    } else {
        selectOptions = [
            {
                label: "Предложенные варианты",
                options: (filteredBabies || []).map(formatUserOption),
            },
            {
                label: "Все сотрудники",
                options: (babies || []).map(formatUserOption),
            },
        ];
    }

    return (
        <>
            {/* Верхняя панель */}
            <header className="app-header">
                {role !== "Заказчик" ? (
                    <label className="header-label" onClick={handleStatsClick}>
                        Аналитика
                    </label>
                ) : ("")}
                {role === "Заказчик" ? (
                    <button className="account-button-exit" onClick={handleLogout}>
                        Выйти
                    </button>
                ) : (
                    <button className="account-button" onClick={handleAccountClick}>
                        <FaRegUser />
                    </button>
                )}
            </header>

            <div className="app-container">
                {/* Боковое меню */}
                <div className="sidebar">
                    <div className="sidebar-menu">
                        {projects.map((project) => (
                            <button
                                key={project.id || project.name}
                                onClick={() => setActiveProject(project.id, project.name)}
                                className={activeProjectId === project.id ? "active" : ""}
                            >
                                {project.name}
                            </button>
                        ))}
                    </div>
                    {role === "Руководитель проектов" && (
                        <button className="create-project-button" onClick={handleOpenModal}>
                            Создать проект
                        </button>
                    )}
                </div>

                {/* Основная часть */}
                <div className="main-content">
                    {role === "Тимлид" && (
                        <div>
                            <button
                                className={`teamlead-tasks ${activeTaskCategory === "my" ? "active" : ""}`}
                                onClick={changeTeamLeadTasksFalse}
                            >
                                Мои задачи
                            </button>
                            <button
                                className={`teamlead-tasks ${activeTaskCategory === "team" ? "active" : ""}`}
                                onClick={changeTeamLeadTasksTrue}
                            >
                                Задачи команды
                            </button>
                        </div>
                    )}
                    <div className="top-panel">
                        <div className="search-filter">
                            <input
                                type="text"
                                placeholder="Поиск"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {/* Оборачиваем кнопку и панель фильтров в контейнер с ref */}
                            <div className="filter-container" ref={filterContainerRef}>
                                <button
                                    className="filter-button"
                                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                                >
                                    <FaFilter />
                                </button>
                                {showFilterPanel && (
                                    <div className="filter-panel">
                                        <div className="filter-control">
                                            <label>Сложность</label>
                                            <Select
                                                options={complexityOptions}
                                                value={
                                                    filterComplexity
                                                        ? complexityOptions.find(
                                                            (option) => option.value === filterComplexity
                                                        )
                                                        : null
                                                }
                                                onChange={(option) =>
                                                    setFilterComplexity(option ? option.value : "")
                                                }
                                                placeholder="Выберите сложность..."
                                                styles={selectStyles}
                                                isClearable
                                            />
                                        </div>
                                        <div className="filter-control">
                                            <label>Приоритет</label>
                                            <Select
                                                options={priorityOptions}
                                                value={
                                                    filterPriority
                                                        ? priorityOptions.find(
                                                            (option) => option.value === filterPriority
                                                        )
                                                        : null
                                                }
                                                onChange={(option) =>
                                                    setFilterPriority(option ? option.value : "")
                                                }
                                                placeholder="Выберите приоритет..."
                                                styles={selectStyles}
                                                isClearable
                                            />
                                        </div>
                                        <div className="filter-control">
                                            <label>Тэги</label>
                                            <CreatableSelect
                                                options={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
                                                value={filterTags}
                                                onChange={setFilterTags}
                                                isMulti
                                                placeholder="Выберите тэги..."
                                                styles={selectStyles}
                                                onMenuOpen={fetchTags}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {role !== "Сотрудник" && role !== "Заказчик" && (
                            <button className="create-button" onClick={handleOpenTaskModal}>
                                Создать задачу
                            </button>
                        )}
                    </div>

                    <div className="columns">
                        {columns.map((column) => {
                            // Sort tasks by due date ascending (closest deadline first)
                            const tasksForColumn = filteredTasks
                                .filter((task) => task.status === column.status)
                                .sort((a, b) => {
                                    const timeA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
                                    const timeB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
                                    return timeA - timeB;
                                });

                            return (
                                <Column
                                    key={column.title}
                                    title={column.title}
                                    color={column.color}
                                    tasks={tasksForColumn}
                                    onTaskClick={handleTaskClick}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Модальное окно для создания проекта */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Создать проект</h2>
                        <label>Название</label>
                        <input
                            type="text"
                            value={projectTitle}
                            onChange={(e) => {
                                setProjectTitle(e.target.value);
                                setValidationErrors((prev) => ({ ...prev, projectTitle: "" }));
                            }}
                        />
                        {validationErrors.projectTitle && (
                            <div className="error-message">{validationErrors.projectTitle}</div>
                        )}
                        <div className="modal-buttons">
                            <button className="create-button" onClick={createProject}>
                                Создать
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно для создания задачи */}
            {showTaskModal && (
                <div className="modal-overlay" onClick={handleCloseTaskModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Создание задачи</h2>
                        <label className="yellow-text">Проект</label>
                        <label className="grey-text">{localStorage.getItem("activeProjectName")}</label>

                        <label>Заголовок *</label>
                        <input
                            type="text"
                            value={taskTitle}
                            onChange={(e) => {
                                setTaskTitle(e.target.value);
                                setValidationErrors((prev) => ({ ...prev, taskTitle: "" }));
                            }}
                        />
                        {validationErrors.taskTitle && (
                            <div className="error-message">{validationErrors.taskTitle}</div>
                        )}

                        <label>Описание *</label>
                        <textarea
                            rows="5"
                            value={taskDescription}
                            onChange={(e) => {
                                setTaskDescription(e.target.value);
                                setValidationErrors((prev) => ({ ...prev, taskDescription: "" }));
                            }}
                        />
                        {validationErrors.taskDescription && (
                            <div className="error-message">{validationErrors.taskDescription}</div>
                        )}

                        <label>Вложение</label>
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
                                        .filter((file) => file)
                                        .map((file, index) => (
                                            <li key={index}>
                                                {file?.name}{" "}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setAttachments((prev) =>
                                                            prev.filter((_, i) => i !== index)
                                                        )
                                                    }
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
                            value={priorityOptions.find((option) => option.value === priority)}
                            onChange={(option) => {
                                setPriority(option.value);
                                setValidationErrors((prev) => ({ ...prev, priority: "" }));
                            }}
                            placeholder="Выберите приоритет..."
                            styles={selectStyles}
                        />
                        {validationErrors.priority && (
                            <div className="error-message">{validationErrors.priority}</div>
                        )}

                        <label>Сложность *</label>
                        <Select
                            options={complexityOptions}
                            value={complexityOptions.find((option) => option.value === complexity)}
                            onChange={(option) => {
                                setComplexity(option.value);
                                setValidationErrors((prev) => ({ ...prev, complexity: "" }));
                            }}
                            placeholder="Выберите сложность..."
                            styles={selectStyles}
                        />
                        {validationErrors.complexity && (
                            <div className="error-message">{validationErrors.complexity}</div>
                        )}

                        <label>Исполнитель *</label>
                        <Select
                            options={selectOptions}
                            value={selectedExecutor}
                            onChange={(option) => {
                                setSelectedExecutor(option);
                                setValidationErrors((prev) => ({ ...prev, selectedExecutor: "" }));
                            }}
                            isSearchable={true}
                            placeholder="Выберите исполнителя..."
                            styles={selectStyles}
                            onMenuOpen={selectMyBabies}
                            components={{ Option: UserOption }}
                        />
                        {validationErrors.selectedExecutor && (
                            <div className="error-message">{validationErrors.selectedExecutor}</div>
                        )}

                        <label>Дата выполнения *</label>
                        <input
                            type="datetime-local"
                            value={dueDate}
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

                                setDueDate(val);
                                setValidationErrors(prev => ({ ...prev, dueDate: "" }));
                            }}
                        />

                        {validationErrors.dueDate && (
                            <div className="error-message">{validationErrors.dueDate}</div>
                        )}

                        <label>Тэги</label>
                        <CreatableSelect
                            options={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
                            value={selectedTags}
                            onChange={setSelectedTags}
                            isMulti
                            placeholder="Выберите тэги..."
                            styles={selectStyles}
                            isClearable
                            onMenuOpen={fetchTags}
                        />

                        <label>Связанная задача</label>
                        <input
                            type="text"
                            value={relatedTask}
                            onChange={(e) => setRelatedTask(e.target.value)}
                            placeholder="Введите ID связанной задачи..."
                        />

                        <div className="modal-buttons">
                            <button className="create-button" onClick={createTask}>
                                Создать
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Main;
