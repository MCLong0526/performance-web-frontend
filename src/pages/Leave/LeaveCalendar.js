// src/pages/Leave/LeaveCalendar.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import bootstrapPlugin from "@fullcalendar/bootstrap";
import FeatherIcon from "feather-icons-react";
import * as Yup from "yup";
import { useFormik } from "formik";

import {
    Container,
    Row,
    Col,
    Modal,
    ModalHeader,
    ModalBody,
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    Card,
    CardBody,
} from "reactstrap";

import UpcommingLeaveList from "./UpcommingLeaveList";
import { getLeaveRequests, createLeaveRequest, updateLeaveRequest, deleteLeaveRequest } from "../../services/LeaveService";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Flatpickr from "react-flatpickr";
import { ToastContainer, toast } from "react-toastify";
// 🛑 FIX THIS LINE:
import "react-toastify/dist/ReactToastify.css"; // Ensure capitalization is correct (ReactToastify)

/* =======================
   Toast Configuration / Helpers
======================= */
const toastConfig = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    closeButton: false,
};

const showSuccessToast = (msg) =>
    toast.success(msg, {
        ...toastConfig,
        className: "bg-success text-white",
        icon: <i className="ri-check-double-line me-2"></i>,
    });

const showErrorToast = (msg) =>
    toast.error(msg, {
        ...toastConfig,
        className: "bg-danger text-white",
        icon: <i className="ri-error-warning-line me-2"></i>,
    });

const calculateDuration = (startStr, endStr) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.round((end - start) / (1000 * 3600 * 24)) + 1;
};

const formatLeaveDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

// =========================================================================
// 🛑 Component 1: Leave Request Form (For new requests) - UPDATED
// =========================================================================

const LeaveRequestForm = ({ onSave, onClose }) => {
    const [formData, setFormData] = useState({
        dateRange: "",
        reason: "",
        type: "ANNUAL",
    });
    const [loading, setLoading] = useState(false);

    const toLocalDate = (dateStr) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
        ).padStart(2, "0")}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const [startStr, endStr] = formData.dateRange.split(" to ");
        if (!startStr || !endStr) {
            showErrorToast("Please select a valid date range.");
            setLoading(false);
            return;
        }

        const startDate = toLocalDate(startStr);
        const endDate = toLocalDate(endStr);

        try {
            await createLeaveRequest({
                type: formData.type,
                reason: formData.reason,
                startDate,
                endDate,
                duration: calculateDuration(startDate, endDate),
            });

            showSuccessToast("Leave request submitted successfully.");

            // 🛑 FIX/IMPROVEMENT: Reset form data on success
            setFormData({
                dateRange: "",
                reason: "",
                type: "ANNUAL",
            });

            onSave();
        } catch (err) {
            showErrorToast(err.message);
        } finally {
            setLoading(false);
            // onClose is intentionally removed to keep the form open on submission failure
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            <FormGroup>
                <Label>Date Range</Label>
                <Flatpickr
                    className="form-control"
                    options={{
                        mode: "range",
                        dateFormat: "d M, Y",
                        // Key prop to ensure Flatpickr resets when formData.dateRange is cleared
                        defaultDate: formData.dateRange
                    }}
                    onChange={(d, s) => setFormData({ ...formData, dateRange: s })}
                />
            </FormGroup>

            <FormGroup>
                <Label>Leave Type</Label>
                <Input
                    type="select"
                    value={formData.type}
                    onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                    }
                >
                    <option value="ANNUAL">Annual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="UNPAID">Unpaid Leave</option>
                </Input>
            </FormGroup>

            <FormGroup>
                <Label>Reason</Label>
                <Input
                    type="textarea"
                    rows="3"
                    value={formData.reason}
                    onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                    }
                    required
                />
            </FormGroup>

            <div className="hstack gap-2 justify-content-end">
                <Button color="light" onClick={onClose} disabled={loading}>
                    Close
                </Button>
                <Button color="success" type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Submit"}
                </Button>
            </div>
        </Form>
    );
};

// =========================================================================
// 🛑 Component 2: Event Details / Edit Form (For existing events)
// =========================================================================

const EventDetailsForm = ({ event, onSave, onDelete, onCancel }) => {
    const [isEdit, setIsEdit] = useState(false);
    const [loading, setLoading] = useState(false);

    const toLocalDate = (dateStr) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const initialDateRange = event.start && event.end
        ? `${formatLeaveDate(event.start)} to ${formatLeaveDate(event.end)}`
        : formatLeaveDate(event.start) || '';

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            reason: event.reason || '',
            type: event.type || 'ANNUAL',
            dateRange: initialDateRange,
            startDate: event.start || '',
            endDate: event.end || '',
        },
        validationSchema: Yup.object({
            reason: Yup.string().required("Please enter a reason."),
            type: Yup.string().required("Please select a leave type."),
            dateRange: Yup.string(),
        }),
        onSubmit: async (values) => {
            setLoading(true);
            const [startStr, endStr] = values.dateRange.split(" to ");

            if (!startStr || !endStr) {
                showErrorToast("Invalid date range.");
                setLoading(false);
                return;
            }

            const startDate = toLocalDate(startStr);
            const endDate = toLocalDate(endStr);
            const duration = calculateDuration(startDate, endDate);

            const payload = {
                type: values.type,
                reason: values.reason,
                startDate,
                endDate,
                duration,
                status: event.status,
            };

            try {
                await updateLeaveRequest(event.id, payload);
                showSuccessToast("Leave request updated successfully.");
                onSave();
            } catch (err) {
                showErrorToast(err.message);
            } finally {
                setLoading(false);
                setIsEdit(false);
            }
        }
    });

    const handleDateChange = (selectedDates, dateStr) => {
        validation.setFieldValue('dateRange', dateStr);
        if (selectedDates.length === 2) {
            validation.setFieldValue('startDate', toLocalDate(selectedDates[0]));
            validation.setFieldValue('endDate', toLocalDate(selectedDates[1]));
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this leave request?")) return;
        setLoading(true);
        try {
            await deleteLeaveRequest(event.id);
            showSuccessToast("Leave request deleted successfully.");
            onDelete();
        } catch (err) {
            showErrorToast(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'APPROVED': 'success',
            'REJECTED': 'danger',
            'PENDING': 'info',
            'CANCELED': 'secondary'
        };
        const badgeClass = statusMap[status] || 'secondary';
        return <span className={`badge bg-${badgeClass}-subtle text-${badgeClass}`}>{status}</span>;
    };


    if (!isEdit) {
        // VIEW MODE (Template style)
        return (
            <div className="p-2 pt-0">
                <div className="text-end">
                    <Button
                        size="sm"
                        color="soft-primary"
                        onClick={() => setIsEdit(true)}
                    >
                        Edit
                    </Button>
                </div>
                <div className="event-details">
                    <div className="d-flex mb-2">
                        <div className="flex-grow-1 d-flex align-items-center">
                            <div className="flex-shrink-0 me-3">
                                <i className="ri-calendar-event-line text-muted fs-16"></i>
                            </div>
                            <div className="flex-grow-1">
                                <h6 className="d-block fw-semibold mb-0">
                                    {formatLeaveDate(event.start)} to {formatLeaveDate(event.end)}
                                </h6>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex align-items-center mb-2">
                        <div className="flex-shrink-0 me-3">
                            <i className="ri-list-check-2 text-muted fs-16"></i>
                        </div>
                        <div className="flex-grow-1">
                            <h6 className="d-block fw-semibold mb-0 text-uppercase">
                                {event.type} Leave {getStatusBadge(event.status)}
                            </h6>
                        </div>
                    </div>

                    <div className="d-flex mb-3">
                        <div className="flex-shrink-0 me-3">
                            <i className="ri-discuss-line text-muted fs-16"></i>
                        </div>
                        <div className="flex-grow-1">
                            <p className="d-block text-muted mb-0">
                                {event.reason || "No reason provided."}
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-top">
                        <p className="mb-0 text-muted"><small>Duration: {event.duration} days</small></p>
                    </div>
                </div>
                <div className="hstack gap-2 justify-content-end mt-4">
                    <Button color="light" onClick={onCancel}>Close</Button>
                    <Button color="soft-danger" onClick={handleDelete} disabled={loading}>
                        <i className="ri-close-line align-bottom"></i> Delete
                    </Button>
                </div>
            </div>
        );
    }

    // EDIT MODE
    return (
        <Form onSubmit={validation.handleSubmit}>
            <FormGroup>
                <Label>Date Range</Label>
                <Flatpickr
                    className="form-control"
                    name="dateRange"
                    options={{
                        mode: "range",
                        dateFormat: "d M, Y",
                        defaultDate: initialDateRange
                    }}
                    onChange={handleDateChange}
                    value={validation.values.dateRange}
                />
            </FormGroup>

            <FormGroup>
                <Label>Leave Type</Label>
                <Input
                    type="select"
                    name="type"
                    value={validation.values.type}
                    onChange={validation.handleChange}
                >
                    <option value="ANNUAL">Annual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="UNPAID">Unpaid Leave</option>
                </Input>
            </FormGroup>

            <FormGroup>
                <Label>Reason</Label>
                <Input
                    type="textarea"
                    rows="3"
                    name="reason"
                    value={validation.values.reason}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={validation.touched.reason && validation.errors.reason}
                />
            </FormGroup>

            <div className="hstack gap-2 justify-content-end mt-4">
                <Button color="light" onClick={() => setIsEdit(false)} disabled={loading}>Cancel Edit</Button>
                <Button color="success" type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Save Changes"}
                </Button>
            </div>
        </Form>
    );
};

function LeaveCalendar() {
    const [events, setEvents] = useState([]);
    const [createModal, setCreateModal] = useState(false);
    const [detailsModal, setDetailsModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Standardized Modal Toggles
    const openCreateModal = () => setCreateModal(true);
    const closeCreateModal = () => setCreateModal(false);

    const openDetailsModal = () => setDetailsModal(true);
    const closeDetailsModal = () => setDetailsModal(false);

    const fetchLeaves = useCallback(async () => {
        try {
            const data = await getLeaveRequests();
            setEvents(data);
        } catch (e) {
            showErrorToast(e.message);
            setEvents([]);
        }
    }, []);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const handleEventClick = (clickInfo) => {
        const event = clickInfo.event;
        // ... (event data mapping logic) ...
        let actualEndDate = event.endStr;
        if (actualEndDate) {
            const d = new Date(actualEndDate);
            d.setDate(d.getDate() - 1);
            actualEndDate = d.toISOString().split('T')[0];
        } else {
            actualEndDate = event.startStr;
        }

        const eventData = {
            id: event.id,
            title: event.title,
            start: event.startStr,
            end: actualEndDate,
            reason: event.extendedProps.reason,
            type: event.extendedProps.type,
            status: event.extendedProps.status,
            duration: event.extendedProps.duration,
        };
        setSelectedEvent(eventData);
        openDetailsModal(); // Use the open function
    };

    const handleUpdate = () => {
        closeCreateModal(); // Close create modal if open
        closeDetailsModal(); // Close details modal if open
        fetchLeaves();
        setRefreshTrigger((v) => v + 1);
    };

    const calendarOptions = useMemo(
        () => ({
            plugins: [
                bootstrapPlugin,
                dayGridPlugin,
                interactionPlugin,
                listPlugin,
            ],
            themeSystem: "bootstrap",
            headerToolbar: {
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek,dayGridDay,listWeek",
            },
            initialView: "dayGridMonth", // 🔥 REQUIRED
            editable: false,
            selectable: true,
            droppable: false,
            events: events,
            eventClick: handleEventClick,
            eventClassNames: ({ event }) => [
                "bg-subtle",
                event.extendedProps.className,
            ],
        }),
        [events]
    );


    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Annual Leave Calendar"
                        pageTitle="Leave Management"
                    />

                    <Row>
                        <Col xl={3}>
                            <Button
                                color="primary"
                                className="w-100 mb-4"
                                onClick={openCreateModal}
                            >
                                <i className="mdi mdi-plus me-1"></i> New Leave Request
                            </Button>

                            <h5 className="mb-1">Upcoming Leave</h5>
                            <UpcommingLeaveList refreshTrigger={refreshTrigger} />
                        </Col>

                        <Col xl={9}>
                            <Card className="card-h-100">
                                <CardBody>
                                    <FullCalendar {...calendarOptions} />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Modal for Creating New Request (FIXED) */}
            <Modal isOpen={createModal} toggle={closeCreateModal} centered>
                <ModalHeader
                    // 🛑 FIX: Pass the close function to the ModalHeader's toggle prop
                    toggle={closeCreateModal}
                    tag="h5"
                    className="p-3 bg-primary-subtle modal-title"
                >
                    Submit New Leave Request
                </ModalHeader>

                <ModalBody>
                    <LeaveRequestForm
                        onSave={handleUpdate}
                        onClose={closeCreateModal}
                    />
                </ModalBody>
            </Modal>


            {/* Modal for Viewing/Editing Details (FIXED) */}
            {selectedEvent && (
                <Modal isOpen={detailsModal} toggle={closeDetailsModal} centered>
                    <ModalHeader
                        // 🛑 FIX: Pass the close function to the ModalHeader's toggle prop
                        toggle={closeDetailsModal}
                        tag="h5"
                        className="p-3 bg-info-subtle modal-title"
                    >
                        Leave Request Details
                    </ModalHeader>

                    <ModalBody>
                        <EventDetailsForm
                            event={selectedEvent}
                            onSave={handleUpdate}
                            onDelete={handleUpdate}
                            onCancel={closeDetailsModal}
                        />
                    </ModalBody>
                </Modal>
            )}

            <ToastContainer />
        </React.Fragment>
    );
}

export default LeaveCalendar;