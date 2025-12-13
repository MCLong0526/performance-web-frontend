// src/pages/Leave/LeaveCalendar.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import bootstrapPlugin from "@fullcalendar/bootstrap";
import FeatherIcon from "feather-icons-react";
import * as Yup from "yup";
import { useFormik } from "formik";
import Select from "react-select";

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

const leaveTypeOptions = [
    { label: "Annual Leave", value: "ANNUAL" },
    { label: "Sick Leave", value: "SICK" },
    { label: "Unpaid Leave", value: "UNPAID" },
];

// =========================================================================
// 🛑 Component 1: Leave Request Form (For new requests) - UPDATED
// =========================================================================

const LeaveRequestForm = ({ onSave, onClose, initialValues }) => {
    const [formData, setFormData] = useState({
        dateRange: initialValues?.dateRange || "",
        reason: "",
        type: initialValues?.type || "ANNUAL",
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
                <Select
                    value={leaveTypeOptions.find((opt) => opt.value === formData.type)}
                    onChange={(opt) =>
                        setFormData({ ...formData, type: opt.value })
                    }
                    options={leaveTypeOptions}
                />
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
                <Select
                    name="type"
                    value={leaveTypeOptions.find((opt) => opt.value === validation.values.type)}
                    onChange={(opt) => validation.setFieldValue("type", opt.value)}
                    options={leaveTypeOptions}
                />
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
    const [initialFormValues, setInitialFormValues] = useState(null);

    useEffect(() => {
        const draggableEl = document.getElementById("external-events");
        if (draggableEl) {
            new Draggable(draggableEl, {
                itemSelector: ".external-event",
                eventData: function (eventEl) {
                    return {
                        title: eventEl.innerText,
                        start: new Date(),
                        className: eventEl.getAttribute("data-class"),
                    };
                },
            });
        }
    }, []);

    // Standardized Modal Toggles
    const openCreateModal = () => {
        setInitialFormValues(null); // Reset values for manual open
        setCreateModal(true);
    };
    const closeCreateModal = () => setCreateModal(false);

    const openDetailsModal = () => setDetailsModal(true);
    const closeDetailsModal = () => setDetailsModal(false);

    const fetchLeaves = useCallback(async () => {
        try {
            const data = await getLeaveRequests();
            // FullCalendar end date is exclusive, so we need to add +1 day to the end date
            // so that the calendar renders the event up to the end of the intended day.
            const eventsWithInclusiveEndDate = data.map((evt) => {
                if (!evt.end) return evt;
                const d = new Date(evt.end);
                d.setDate(d.getDate() + 1);
                // Ensure YYYY-MM-DD format
                const newEnd = d.toISOString().split("T")[0];
                return { ...evt, end: newEnd };
            });
            setEvents(eventsWithInclusiveEndDate);
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

    const handleEventDrop = async (info) => {
        const { event, revert } = info;

        try {
            const start = event.start;
            // FullCalendar end is exclusive, usually need to subtract 1 day for inclusive backend
            let end = event.end;
            if (!end) {
                end = start; // If no end (single day), end is same as start
            } else {
                // Determine if we need to subtract based on FullCalendar behavior
                // Usually if it's an all-day event spanning multiple days, 'end' is 00:00 of next day.
                // We want inclusive end date.
                const d = new Date(end);
                d.setDate(d.getDate() - 1);
                end = d;
            }

            const toLocalDate = (d) => {
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            };

            const startDate = toLocalDate(start);
            const endDate = toLocalDate(end);
            const duration = calculateDuration(startDate, endDate);

            const payload = {
                id: event.id, // Assuming ID is directly on event or need to get from extendedProps
                type: event.extendedProps.type,
                reason: event.extendedProps.reason,
                status: event.extendedProps.status,
                startDate,
                endDate,
                duration,
            };

            // ID might be string or number, ensure we have it
            if (!event.id) throw new Error("Event ID missing");

            await updateLeaveRequest(event.id, payload);
            showSuccessToast("Leave request rescheduled successfully.");
            setRefreshTrigger((v) => v + 1); // Refresh lists
        } catch (err) {
            showErrorToast("Failed to reschedule: " + err.message);
            revert();
        }
    };

    const onDrop = (info) => {
        const { date, draggedEl } = info;
        const type = draggedEl.getAttribute("data-type");

        // Format date as "d M, Y" for Flatpickr compatibility (e.g., "14 Dec, 2025 to 14 Dec, 2025")
        // Flatpickr range mode expects "start to end" string
        const d = new Date(date);
        const formattedDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const dateRange = `${formattedDate} to ${formattedDate}`;

        setInitialFormValues({
            dateRange: dateRange,
            type: type || "ANNUAL"
        });
        setCreateModal(true);
    };

    const renderEventContent = (eventInfo) => {
        const { status } = eventInfo.event.extendedProps;
        let iconClass = "mdi-clock-outline"; // Default Pending

        if (status === "APPROVED") {
            iconClass = "mdi-check-circle-outline";
        } else if (status === "REJECTED") {
            iconClass = "mdi-close-circle-outline";
        }

        return (
            <div className="d-flex align-items-center overflow-hidden text-truncate">
                <i className={`mdi ${iconClass} me-1`}></i>
                <div className="fc-event-title text-truncate">
                    {eventInfo.event.title}
                </div>
            </div>
        );
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
            editable: true,
            selectable: true,
            droppable: true,
            events: events,
            eventClick: handleEventClick,
            eventDrop: handleEventDrop,
            drop: onDrop,
            eventContent: renderEventContent, // Custom renderer
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
                            <Card className="card-h-100">
                                <CardBody>
                                    <Button
                                        color="primary"
                                        className="w-100 mb-4"
                                        onClick={openCreateModal}
                                    >
                                        <i className="mdi mdi-plus me-1"></i> New Leave Request
                                    </Button>

                                    <div id="external-events">
                                        <p className="text-muted">Drag and drop to create leave</p>
                                        <div
                                            className="bg-success-subtle external-event fc-event text-success p-2 mb-2 cursor-pointer"
                                            data-class="bg-success-subtle text-success"
                                            data-type="ANNUAL"
                                        >
                                            <i className="mdi mdi-checkbox-blank-circle font-size-11 me-2" />
                                            Annual Leave
                                        </div>
                                        <div
                                            className="bg-danger-subtle external-event fc-event text-danger p-2 mb-2 cursor-pointer"
                                            data-class="bg-danger-subtle text-danger"
                                            data-type="SICK"
                                        >
                                            <i className="mdi mdi-checkbox-blank-circle font-size-11 me-2" />
                                            Sick Leave
                                        </div>
                                        <div
                                            className="bg-warning-subtle external-event fc-event text-warning p-2 mb-2 cursor-pointer"
                                            data-class="bg-warning-subtle text-warning"
                                            data-type="UNPAID"
                                        >
                                            <i className="mdi mdi-checkbox-blank-circle font-size-11 me-2" />
                                            Unpaid Leave
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

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
                        initialValues={initialFormValues}
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