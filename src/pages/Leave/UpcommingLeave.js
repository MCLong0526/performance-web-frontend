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

    // Color by leave TYPE
    const getClassByType = (type) => {
        switch (type) {
            case "SICK":
                return "danger";   // red
            case "UNPAID":
                return "warning";  // orange
            case "ANNUAL":
            default:
                return "primary";  // blue
        }
    };

    const st_date = leave.start ? formatDate(leave.start) : null;
    const ed_date = leave.end ? formatDate(leave.end) : null;

    let dateDisplay = st_date;
    if (st_date && ed_date && st_date !== ed_date) {
        dateDisplay = `${st_date} to ${ed_date}`;
    }

    const typeColor = getClassByType(leave.type);

    return (
        <Card className="mb-3">
            <CardBody>
                <div className="d-flex mb-3">
                    <div className="flex-grow-1">
                        <i className={`mdi mdi-checkbox-blank-circle me-2 text-${typeColor}`} />
                        <span className="fw-medium">{dateDisplay}</span>
                    </div>
                </div>

                <h6 className="card-title fs-16">
                    {leave.reason || "Leave"}
                </h6>

                <p className="text-muted mb-0">
                    Duration: <strong>{leave.duration} days</strong>
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
