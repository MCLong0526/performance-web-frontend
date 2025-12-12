// src/pages/Leave/UpcommingLeaveList.jsx

import React, { useEffect, useState } from "react";
import UpcommingLeave from "./UpcommingLeave";
import { getUpcomingLeave } from "../../services/LeaveService";
import { Card, CardBody, Spinner, Alert } from "reactstrap";
import PropTypes from "prop-types";

function UpcommingLeaveList({ refreshTrigger }) {
    const [upcomingLeaves, setUpcomingLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUpcomingLeaves = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getUpcomingLeave();
            setUpcomingLeaves(data);
        } catch (e) {
            setError(e.message || "Failed to fetch upcoming leaves.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data on component mount and whenever refreshTrigger changes
    useEffect(() => {
        fetchUpcomingLeaves();
    }, [refreshTrigger]);

    if (loading) {
        return (
            <Card className="text-center">
                <CardBody>
                    <Spinner color="primary" size="sm" className="me-2" /> Loading upcoming leaves...
                </CardBody>
            </Card>
        );
    }

    if (error) {
        return <Alert color="danger">{error}</Alert>;
    }

    if (upcomingLeaves.length === 0) {
        return <Alert color="info" className="text-center mb-0">No upcoming leave requests found.</Alert>;
    }

    return (
        <div className="upcomming-leave-list">
            {upcomingLeaves.map((leave) => {
                if (!leave || !leave.id) return null;

                return (
                    <UpcommingLeave
                        key={leave.id}
                        leave={leave}
                    />
                );
            })}
        </div>
    );
}

UpcommingLeaveList.propTypes = {
    refreshTrigger: PropTypes.number,
};

export default UpcommingLeaveList;