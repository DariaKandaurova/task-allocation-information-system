import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import moment from "moment-timezone";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import "react-datepicker/dist/react-datepicker.css";
import "./styles.css";
import {FaRegUser} from "react-icons/fa";

function StatsPage() {
    const navigate = useNavigate();

    // Данные текущего пользователя и его роль
    const [currentUser, setCurrentUser] = useState(null);
    const [role, setRole] = useState("");

    // Даты
    const defaultStartDate = moment().subtract(1, "month").toDate();
    const defaultEndDate = moment().toDate();
    const [selectedPeriodStart, setSelectedPeriodStart] = useState(defaultStartDate);
    const [selectedPeriodEnd, setSelectedPeriodEnd] = useState(defaultEndDate);

    // Общие данные для селекторов
    const [projects, setProjects] = useState([]);
    const [subTeamLeaders, setSubTeamLeaders] = useState([]); // для руководителя проектов
    const [teamMembers, setTeamMembers] = useState([]); // для тимлида

    // Статистика
    const [employeeStats, setEmployeeStats] = useState(null);
    const [teamStats, setTeamStats] = useState(null);
    const [projectStats, setProjectStats] = useState(null);
    const [selectedEmployeeStats, setSelectedEmployeeStats] = useState(null); // для выбранного сотрудника (вкладка "Статистика сотрудника")

    // Для вкладки "Статистика сотрудника" у руководителя проектов
    const [selectedTeamLeadForEmployee, setSelectedTeamLeadForEmployee] = useState(null);
    const [teamMembersForEmployee, setTeamMembersForEmployee] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Для вкладки "Статистика команды" у руководителя проектов
    const [selectedTeamLeadForTeam, setSelectedTeamLeadForTeam] = useState(null);
    const [teamStatsForTeamLead, setTeamStatsForTeamLead] = useState(null);

    // Выбранный проект для вкладки "Статистика проекта"
    const [selectedProject, setSelectedProject] = useState(null);

    // Для графиков
    const [selectedGraph, setSelectedGraph] = useState("");
    const [chartData, setChartData] = useState(null);

    // Текущая активная вкладка (для тимлида и руководителя проектов)
    const [activeTab, setActiveTab] = useState("");

    const graph_names = {
        "average_status_durations": "Среднее время в статусах",
        "status_transitions": "Количество задач в статусах",
        "average_completion_time_by_difficulty": "Среднее время выполнения по сложности"
    };

    useEffect(() => {
        const activeUserId = localStorage.getItem("activeUser");
        if (activeUserId) {
            fetchCurrentUser(activeUserId);
        }
        getProjects();
    }, []);

    useEffect(() => {
        if (role === "Тимлид") {
            setActiveTab("myStats");
        } else if (role === "Руководитель проектов") {
            setActiveTab("projectStats");
            fetchSubTeamLeaders();
        }
    }, [role]);

    useEffect(() => {
        setSelectedGraph("");
        setChartData(null);
    }, [activeTab]);

    useEffect(() => {
        if (role === "Сотрудник" && currentUser) {
            fetchEmployeeStats(currentUser.id);
        } else if (role === "Тимлид" && currentUser) {
            if (activeTab === "myStats") {
                fetchEmployeeStats(currentUser.id);
            }
            if (activeTab === "teamStats") {
                fetchTeamStats(currentUser.id);
            }
        } else if (role === "Руководитель проектов") {
            if (activeTab === "projectStats" && selectedProject) {
                fetchProjectStats(selectedProject.value);
            }
            if (activeTab === "teamStats" && selectedTeamLeadForTeam) {
                fetchTeamStats(selectedTeamLeadForTeam.value, true);
            }
            if (activeTab === "employeeStats" && selectedEmployee) {
                fetchEmployeeStatsForUser(selectedEmployee.value);
            }
        }
    }, [
        selectedPeriodStart,
        selectedPeriodEnd,
        activeTab,
        currentUser,
        selectedProject,
        selectedTeamLeadForTeam,
        selectedEmployee,
        role,
    ]);

    const fetchCurrentUser = async (userId) => {
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/users?user_id=${userId}&type=user`
            );
            const data = await response.json();
            if (data && data.length > 0) {
                setCurrentUser(data[0]);
                setRole(data[0].role);
            }
        } catch (error) {
            console.error("Ошибка получения данных текущего пользователя:", error);
        }
    };

    const getProjects = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/projects");
            const data = await response.json();
            setProjects(data);
        } catch (error) {
            console.error("Ошибка получения проектов:", error);
        }
    };

    const getDateRangeQuery = () => {
        const startDate = moment(selectedPeriodStart).tz("Europe/Moscow").format();
        const endDate = moment(selectedPeriodEnd).tz("Europe/Moscow").format();
        return `start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
    };

    const fetchEmployeeStats = async (userId) => {
        const dateQuery = getDateRangeQuery();
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/stats/employee?user_id=${userId}&${dateQuery}`
            );
            const data = await response.json();
            if (userId === currentUser?.id) {
                setEmployeeStats(data);
            } else {
                setSelectedEmployeeStats(data);
            }
        } catch (error) {
            console.error("Ошибка получения статистики сотрудника:", error);
        }
    };

    const fetchTeamStats = async (bossId, isProjectManager = false) => {
        const dateQuery = getDateRangeQuery();
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/stats/team?boss_id=${bossId}&${dateQuery}`
            );
            const data = await response.json();
            if (isProjectManager) {
                setTeamStatsForTeamLead(data);
            } else {
                setTeamStats(data);
            }
        } catch (error) {
            console.error("Ошибка получения статистики команды:", error);
        }
    };

    const fetchProjectStats = async (projectId) => {
        const dateQuery = getDateRangeQuery();
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/stats/project?project_id=${projectId}&${dateQuery}`
            );
            const data = await response.json();
            setProjectStats(data);
        } catch (error) {
            console.error("Ошибка получения статистики по проекту:", error);
        }
    };

    const fetchEmployeeStatsForUser = async (userId) => {
        await fetchEmployeeStats(userId);
    };

    const fetchTeamMembers = async (bossId, forEmployeeTab = false) => {
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/users?user_id=${bossId}&mybabies=true`
            );
            const data = await response.json();
            if (forEmployeeTab) {
                setTeamMembersForEmployee(data.all_users);
            } else {
                setTeamMembers(data.all_users);
            }
        } catch (error) {
            console.error("Ошибка получения списка сотрудников:", error);
        }
    };

    const fetchSubTeamLeaders = async () => {
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/users?user_id=${currentUser.id}&mybabies=true`
            );
            const data = await response.json();
            setSubTeamLeaders(data.all_users);
        } catch (error) {
            console.error("Ошибка получения списка тимлидов:", error);
        }
    };

    const handleGraphClick = (graphType, statsData) => {
        setSelectedGraph(graphType);
        if (!statsData) return;
        if (graphType === "average_status_durations") {
            let data = Object.entries(statsData.average_status_durations || {}).map(
                ([status, duration]) => ({ status, duration })
            );
            data = data.map((item) => ({ ...item, duration: Number((item.duration / 3600)?.toFixed(2)) }));
            setChartData(data);
        } else if (graphType === "status_transitions") {
            const data = Object.entries(statsData.status_transitions || {}).map(
                ([status, count]) => ({ status, count })
            );
            setChartData(data);
        } else if (graphType === "average_completion_time_by_difficulty") {
            let data = Object.entries(
                statsData.average_completion_time_by_difficulty || {}
            ).map(([difficulty, time]) => ({ difficulty, time }));
            data = data.map((item) => ({ ...item, time: Number((item.time / 3600)?.toFixed(2)) }));
            setChartData(data);
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

    // Функция отрисовки статистики сотрудника (для текущего пользователя или выбранного сотрудника)
    const renderEmployeeView = (stats = employeeStats) => (
        <div>
            {stats && (
                <>
                    <div className="stats-summary">
                        <p>Среднее время выполнения задач: {Number((Number(stats.average_completion_time) / 3600)?.toFixed(2))} ч</p>
                        <p>Процент задач, выполненных вовремя: {stats.percentage_completed_on_time?.toFixed(2)}%</p>
                        <p>Количество активных задач: {stats.active_tasks_count}</p>
                    </div>
                    <div className="graph-buttons">
                        <button className="create-button" onClick={() => handleGraphClick("average_status_durations", stats)}>
                            Среднее время в статусах
                        </button>
                        <button className="create-button" onClick={() => handleGraphClick("status_transitions", stats)}>
                            Количество задач в статусах
                        </button>
                        <button className="create-button"
                                onClick={() =>
                                    handleGraphClick("average_completion_time_by_difficulty", stats)
                                }
                        >
                            Среднее время выполнения задач по сложности
                        </button>
                    </div>
                </>
            )}
            {selectedGraph && chartData && (
                <div className="stat-chart-container">
                    <h3>{graph_names[selectedGraph]}</h3>
                    <ResponsiveContainer className="stat-chart-container">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey={
                                    selectedGraph === "status_transitions" ||
                                    selectedGraph === "average_status_durations"
                                        ? "status"
                                        : "difficulty"
                                }
                                label={{
                                    value:
                                        selectedGraph === "status_transitions" ||
                                        selectedGraph === "average_status_durations"
                                            ? "Статус"
                                            : "Сложность",
                                    position: "insideBottom",
                                    offset: -5,
                                }}
                            />
                            <YAxis type="number" allowDecimals={false} domain={[0, (dataMax) => Math.ceil(dataMax * 1.1)]} />
                            <Tooltip />
                            <Bar
                                dataKey={
                                    selectedGraph === "status_transitions"
                                        ? "count"
                                        : selectedGraph === "average_status_durations"
                                            ? "duration"
                                            : "time"
                                }
                                fill="#f6ce45"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );

    // Отрисовка вкладок для тимлида
    const renderTeamLeadTabs = () => (
        <div>
            <div className="stat-tabs">
                <div
                    className={`stat-tab ${activeTab === "myStats" ? "stat-tab-active" : ""}`}
                    onClick={() => setActiveTab("myStats")}
                >
                    Моя статистика
                </div>
                <div
                    className={`stat-tab ${activeTab === "teamStats" ? "stat-tab-active" : ""}`}
                    onClick={() => setActiveTab("teamStats")}
                >
                    Статистика по команде
                </div>
                <div
                    className={`stat-tab ${activeTab === "employeeStats" ? "stat-tab-active" : ""}`}
                    onClick={() => setActiveTab("employeeStats")}
                >
                    Статистика сотрудника
                </div>
            </div>
            {activeTab === "myStats" && renderEmployeeView()}
            {activeTab === "teamStats" && (
                <div>
                    <h2>Статистика по команде</h2>
                    {teamStats && (
                        <>
                            <div className="stats-summary">
                                <p>Среднее время выполнения задач: {(Number(teamStats.average_completion_time) / 3600)?.toFixed(2)} ч</p>
                                <p>Процент задач, выполненных вовремя: {teamStats.percentage_completed_on_time?.toFixed(2)}%</p>
                                <p>Количество активных задач: {teamStats.active_tasks_count}</p>
                            </div>
                            <div className="graph-buttons">
                                <button className="create-button" onClick={() => handleGraphClick("average_status_durations", teamStats)}>
                                    Среднее время в статусах
                                </button>
                                <button className="create-button" onClick={() => handleGraphClick("status_transitions", teamStats)}>
                                    Количество задач в статусах
                                </button>
                                <button className="create-button"
                                        onClick={() =>
                                            handleGraphClick("average_completion_time_by_difficulty", teamStats)
                                        }
                                >
                                    Среднее время выполнения задач по сложности
                                </button>
                                <button className="excel">
                                    <a href={`http://127.0.0.1:8000/stats/report?user_id=${localStorage.getItem('activeUser')}&${getDateRangeQuery()}`}>Выгрузить Excel отчет</a>
                                </button>
                            </div>
                        </>
                    )}
                    {selectedGraph && chartData && (
                        <div className="stat-chart-container">
                            <h3>{graph_names[selectedGraph]}</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey={
                                            selectedGraph === "status_transitions" ||
                                            selectedGraph === "average_status_durations"
                                                ? "status"
                                                : "difficulty"
                                        }
                                        label={{
                                            value:
                                                selectedGraph === "status_transitions" ||
                                                selectedGraph === "average_status_durations"
                                                    ? "Статус"
                                                    : "Сложность",
                                            position: "insideBottom",
                                            offset: -5,
                                        }}
                                    />
                                    <YAxis type="number" allowDecimals={false} domain={[0, (dataMax) => Math.ceil(dataMax * 1.1)]} />
                                    <Tooltip />
                                    <Bar
                                        dataKey={
                                            selectedGraph === "status_transitions"
                                                ? "count"
                                                : selectedGraph === "average_status_durations"
                                                    ? "duration"
                                                    : "time"
                                        }
                                        fill="#f6ce45"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}
            {activeTab === "employeeStats" && (
                <div>
                    <h2>Статистика сотрудника</h2>
                    <div className="project-selection">
                        <label>Сотрудник:</label>
                        <Select
                            options={teamMembers.map((member) => ({
                                label: member.name,
                                value: member.id,
                            }))}
                            value={selectedEmployee}
                            onChange={(selected) => {
                                setSelectedEmployee(selected);
                                if (selected) {
                                    fetchEmployeeStats(selected.value);
                                }
                            }}
                            placeholder="Выберите сотрудника"
                            styles={selectStyles}
                            onMenuOpen={() => fetchTeamMembers(currentUser.id, false)}
                        />
                    </div>
                        {selectedEmployee && selectedEmployeeStats && renderEmployeeView(selectedEmployeeStats)}
                </div>
            )}
        </div>
    );

    // Отрисовка вкладок для руководителя проектов
    const renderProjectManagerTabs = () => (
        <div>
            <div className="stat-tabs">
                <div
                    className={`stat-tab ${activeTab === "projectStats" ? "stat-tab-active" : ""}`}
                    onClick={() => setActiveTab("projectStats")}
                >
                    Статистика проекта
                </div>
                <div
                    className={`stat-tab ${activeTab === "teamStats" ? "stat-tab-active" : ""}`}
                    onClick={() => setActiveTab("teamStats")}
                >
                    Статистика команды
                </div>
                <div
                    className={`stat-tab ${activeTab === "employeeStats" ? "stat-tab-active" : ""}`}
                    onClick={() => setActiveTab("employeeStats")}
                >
                    Статистика сотрудника
                </div>
            </div>
            {activeTab === "projectStats" && (
                <div>
                    <h2>Статистика проекта</h2>
                    <div className="project-selection">
                        <label>Проект:</label>
                        <Select
                            options={projects.map((project) => ({
                                label: project.name,
                                value: project.id,
                            }))}
                            value={selectedProject}
                            onChange={(selected) => {
                                setSelectedProject(selected);
                                if (selected) {
                                    fetchProjectStats(selected.value);
                                }
                            }}
                            placeholder="Выберите проект"
                            styles={selectStyles}
                        />
                    </div>
                    {projectStats && (
                        <>
                            <div className="stats-summary">
                                <p>Среднее время выполнения задач: {(Number(projectStats.average_completion_time) / 3600)?.toFixed(2)} ч</p>
                                <p>Процент задач, выполненных вовремя: {projectStats.percentage_completed_on_time?.toFixed(2)}%</p>
                                <p>Количество активных задач: {projectStats.active_tasks_count}</p>
                            </div>
                            <div className="graph-buttons">
                                <button className="create-button" onClick={() => handleGraphClick("average_status_durations", projectStats)}>
                                    Среднее время в статусах
                                </button>
                                <button className="create-button" onClick={() => handleGraphClick("status_transitions", projectStats)}>
                                    Количество задач в статусах
                                </button>
                                <button className="create-button"
                                        onClick={() =>
                                            handleGraphClick("average_completion_time_by_difficulty", projectStats)
                                        }
                                >
                                    Среднее время выполнения задач по сложности
                                </button>
                                <button className="excel">
                                <a href={`http://127.0.0.1:8000/stats/report?user_id=${localStorage.getItem('activeUser')}&${getDateRangeQuery()}&project_id=${selectedProject.value}`}>Выгрузить Excel отчет</a>
                                </button>
                            </div>
                        </>
                    )}
                    {selectedGraph && chartData && (
                        <div className="stat-chart-container">
                            <h3>{graph_names[selectedGraph]}</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey={
                                            selectedGraph === "status_transitions" ||
                                            selectedGraph === "average_status_durations"
                                                ? "status"
                                                : "difficulty"
                                        }
                                        label={{
                                            value:
                                                selectedGraph === "status_transitions" ||
                                                selectedGraph === "average_status_durations"
                                                    ? "Статус"
                                                    : "Сложность",
                                            position: "insideBottom",
                                            offset: -5,
                                        }}
                                    />
                                    <YAxis type="number" allowDecimals={false} domain={[0, (dataMax) => Math.ceil(dataMax * 1.1)]} />
                                    <Tooltip />
                                    <Bar
                                        dataKey={
                                            selectedGraph === "status_transitions"
                                                ? "count"
                                                : selectedGraph === "average_status_durations"
                                                    ? "duration"
                                                    : "time"
                                        }
                                        fill="#f6ce45"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}
            {activeTab === "teamStats" && (
                <div>
                    <h2>Статистика по команде</h2>
                    <div className="project-selection">
                        <label>Тимлид команды:</label>
                        <Select
                            options={subTeamLeaders.map((leader) => ({
                                label: leader.name,
                                value: leader.id,
                            }))}
                            value={selectedTeamLeadForTeam}
                            onChange={(selected) => {
                                setSelectedTeamLeadForTeam(selected);
                                if (selected) {
                                    fetchTeamStats(selected.value, true);
                                }
                            }}
                            placeholder="Выберите тимлида"
                            styles={selectStyles}
                        />
                    </div>
                    {selectedTeamLeadForTeam && teamStatsForTeamLead && (
                        <>
                            <div className="stats-summary">
                                <p>Среднее время выполнения задач: {(Number(teamStatsForTeamLead.average_completion_time) / 3600)?.toFixed(2)} ч</p>
                                <p>Процент задач, выполненных вовремя: {teamStatsForTeamLead.percentage_completed_on_time?.toFixed(2)}%</p>
                                <p>Количество активных задач: {teamStatsForTeamLead.active_tasks_count}</p>
                            </div>
                            <div className="graph-buttons">
                                <button className="create-button" onClick={() => handleGraphClick("average_status_durations", teamStatsForTeamLead)}>
                                    Среднее время в статусах
                                </button>
                                <button className="create-button" onClick={() => handleGraphClick("status_transitions", teamStatsForTeamLead)}>
                                    Количество задач в статусах
                                </button>
                                <button className="create-button"
                                        onClick={() =>
                                            handleGraphClick("average_completion_time_by_difficulty", teamStatsForTeamLead)
                                        }
                                >
                                    Среднее время выполнения задач по сложности
                                </button>
                            </div>
                        </>
                    )}
                    {selectedGraph && chartData && (
                        <div className="stat-chart-container">
                            <h3>{graph_names[selectedGraph]}</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey={
                                            selectedGraph === "status_transitions" ||
                                            selectedGraph === "average_status_durations"
                                                ? "status"
                                                : "difficulty"
                                        }
                                        label={{
                                            value:
                                                selectedGraph === "status_transitions" ||
                                                selectedGraph === "average_status_durations"
                                                    ? "Статус"
                                                    : "Сложность",
                                            position: "insideBottom",
                                            offset: -5,
                                        }}
                                    />
                                    <YAxis type="number" allowDecimals={false} domain={[0, (dataMax) => Math.ceil(dataMax * 1.1)]} />
                                    <Tooltip />
                                    <Bar
                                        dataKey={
                                            selectedGraph === "status_transitions"
                                                ? "count"
                                                : selectedGraph === "average_status_durations"
                                                    ? "duration"
                                                    : "time"
                                        }
                                        fill="#f6ce45"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}
            {activeTab === "employeeStats" && (
                <div>
                    <h2>Статистика сотрудника</h2>
                    <div className="project-selection">
                        <label>Тимлид команды:</label>
                        <Select
                            options={subTeamLeaders.map((leader) => ({
                                label: leader.name,
                                value: leader.id,
                            }))}
                            value={selectedTeamLeadForEmployee}
                            onChange={(selected) => {
                                setSelectedTeamLeadForEmployee(selected);
                                if (selected) {
                                    fetchTeamMembers(selected.value, true);
                                    setSelectedEmployee(null);
                                    setSelectedEmployeeStats(null);
                                }
                            }}
                            placeholder="Выберите тимлида"
                            styles={selectStyles}
                        />
                    </div>
                    {selectedTeamLeadForEmployee && (
                        <div className="project-selection">
                            <label>Сотрудник:</label>
                           <Select
                               options={[
                                       {
                                       label: selectedTeamLeadForEmployee.label,
                                       value: selectedTeamLeadForEmployee.value,
                                   },
                                   ...teamMembersForEmployee.map((emp) => ({
                                       label: emp.name,
                                       value: emp.id,
                                   })),
                               ]}
                            value={selectedEmployee}
                            onChange={(selected) => {
                            setSelectedEmployee(selected);
                            if (selected) {
                                fetchEmployeeStatsForUser(selected.value);
                            }
                        }}
                            placeholder="Выберите сотрудника"
                            styles={selectStyles}
                            />
                        </div>
                    )}
                    {selectedEmployee && selectedEmployeeStats && renderEmployeeView(selectedEmployeeStats)}
                </div>
            )}
        </div>
    );

    return (
        <>
            <header className="stat-app-header-stats">
                <label onClick={() => navigate("/main")} className="stat-header-label-stats">
                    На главную
                </label>
                <button className="account-button" onClick={() => navigate("/account")}>
                    <FaRegUser />
                </button>
            </header>
            <div className="stat-stats-page">
                <div className="stat-date-filters">
                    <div className="stat-date-filter">
                        <label>Начало периода:</label>
                        <DatePicker
                            selected={selectedPeriodStart}
                            onChange={setSelectedPeriodStart}
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div className="stat-date-filter">
                        <label>Конец периода:</label>
                        <DatePicker
                            selected={selectedPeriodEnd}
                            onChange={setSelectedPeriodEnd}
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                </div>
                {role === "Сотрудник" && renderEmployeeView()}
                {role === "Тимлид" && renderTeamLeadTabs()}
                {role === "Руководитель проектов" && renderProjectManagerTabs()}
            </div>
        </>
    );
}

export default StatsPage;
