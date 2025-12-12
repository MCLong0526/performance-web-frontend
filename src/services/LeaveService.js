// src/services/LeaveService.js
import api from "./api";

const CURRENT_USER_ID = 1;
const BASE_PATH = `/api/leave`;

/* =====================
   Helpers
===================== */
const getClassByType = (type) => {
    switch (type) {
        case "SICK":
            return "bg-danger";
        case "UNPAID":
            return "bg-warning";
        case "ANNUAL":
        default:
            return "bg-primary";
    }
};

const mapToFrontend = (leave) => ({
    id: leave.id,
    title: leave.reason || "Leave",
    start: leave.startDate,
    end: leave.endDate, // ✅ NO +1 (backend already inclusive)
    reason: leave.reason,
    type: leave.type,
    status: leave.status,
    duration: leave.duration,
    className: getClassByType(leave.type),
});

/* =====================
   APIs
===================== */
export const getLeaveRequests = async () => {
    const res = await api.get(`${BASE_PATH}/user/${CURRENT_USER_ID}`);
    return (res.data || []).map(mapToFrontend);
};

export const createLeaveRequest = async (payload) => {
    const res = await api.post(`${BASE_PATH}/user/${CURRENT_USER_ID}`, payload);
    return mapToFrontend(res.data);
};

export const updateLeaveRequest = async (id, payload) => {
    const res = await api.put(`${BASE_PATH}/${id}`, payload);
    return mapToFrontend(res.data);
};

export const deleteLeaveRequest = async (id) => {
    await api.delete(`${BASE_PATH}/${id}`);
};


// =====================
// Upcoming leave helper
// =====================
export const getUpcomingLeave = async () => {
    const allLeaves = await getLeaveRequests();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allLeaves
        .filter(leave => new Date(leave.start) >= today)
        .sort((a, b) => new Date(a.start) - new Date(b.start));
};
