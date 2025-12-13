// src/services/LeaveService.js
import api from "./api";

const CURRENT_USER_ID = 1;
const BASE_PATH = `/api/leave`;

/* =====================
   Helpers
===================== */
const getCurrentUserId = () => {
    // 🛑 IMPLEMENTATION POINT: You MUST ensure your login process stores the user ID 
    // in localStorage under the key "currentUserId".
    const userId = localStorage.getItem("currentUserId");
    if (!userId) {
        // In a real application, you would log out or redirect here.
        throw new Error("User ID is unavailable. Please log in.");
    }
    return userId;
};

const getClassByType = (type) => {
    switch (type) {
        case "SICK":
            return "bg-danger-subtle text-danger";
        case "UNPAID":
            return "bg-warning-subtle text-warning";
        case "ANNUAL":
        default:
            return "bg-success-subtle text-success";
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
    const userId = getCurrentUserId();
    const res = await api.get(`${BASE_PATH}/user/${userId}`);
    return (res.data || []).map(mapToFrontend);
};

export const createLeaveRequest = async (payload) => {
    const userId = getCurrentUserId();
    const res = await api.post(`${BASE_PATH}/user/${userId}`, payload);
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
