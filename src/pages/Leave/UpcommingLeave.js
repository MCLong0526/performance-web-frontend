import React from "react";
import { Card, CardBody } from "reactstrap";
import PropTypes from "prop-types";

function UpcommingLeave({ leave }) {

    const formatDate = (dateString) => {
        if (!dateString) return null;
        try {
            const d = new Date(dateString);
            return d.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch {
            return dateString;
        }
    };

    const st_date = leave.start ? formatDate(leave.start) : null;
    const ed_date = leave.end ? formatDate(leave.end) : null;

    let dateDisplay = st_date;
    if (st_date && ed_date && st_date !== ed_date) {
        dateDisplay = `${st_date} to ${ed_date}`;
    }

    // leave.className contains "bg-*-subtle text-*", so we just apply it
    // We might need to split it if we want icon color separate, but usually
    // the service returns "bg-success-subtle text-success".
    // For the icon, we can extract the text color part or just map it.
    // Actually, let's use the text color from the class string for the icon.

    // Simple parsing since we know the format "bg-X-subtle text-X"
    const textColorClass = leave.className ? leave.className.split(' ')[1] : 'text-primary';

    return (
        <Card className="mb-3">
            <CardBody>
                <div className="d-flex mb-3">
                    <div className="flex-grow-1">
                        <i className={`mdi mdi-checkbox-blank-circle me-2 ${textColorClass}`} />
                        <span className="fw-medium">{dateDisplay}</span>
                    </div>
                </div>

                <h6 className="card-title fs-16">
                    {leave.reason || "Leave"}
                </h6>

                <p className="text-muted mb-1">
                    Duration: <strong>{leave.duration} days</strong>
                </p>

                <p className="text-muted mb-0">
                    {(() => {
                        switch (leave.status) {
                            case "APPROVED":
                                return <><i className="mdi mdi-check-circle-outline text-success me-1"></i> Approved</>;
                            case "REJECTED":
                                return <><i className="mdi mdi-close-circle-outline text-danger me-1"></i> Rejected</>;
                            case "PENDING":
                            default:
                                return <><i className="mdi mdi-clock-outline text-warning me-1"></i> Pending</>;
                        }
                    })()}
                </p>
            </CardBody>
        </Card>
    );
}

UpcommingLeave.propTypes = {
    leave: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        reason: PropTypes.string,
        start: PropTypes.string,
        end: PropTypes.string,
        duration: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        status: PropTypes.string,
        type: PropTypes.string,
    }).isRequired,
};

export default UpcommingLeave;
