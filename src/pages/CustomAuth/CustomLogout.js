import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, Col, Container, Row } from 'reactstrap';
import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";
import { toast } from "react-toastify";

// Images
import logoLight from "../../assets/images/logo-light.png";

const CustomLogout = () => {

    useEffect(() => {
        // Show logout success toast
        toast.success("You have been logged out successfully. Goodbye!", {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            className: "bg-success text-white",
            icon: () => <i className="ri-checkbox-circle-line align-middle me-2"></i>
        });

        // Clear stored authentication data
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        sessionStorage.removeItem("authUser");
    }, []);

    document.title = "Logout | Performance Management System";

    return (
        <React.Fragment>
            <div className="auth-page-content">
                <div className="auth-page-wrapper">
                    <ParticlesAuth>
                        <div className="auth-page-content">
                            <Container>
                                <Row>
                                    <Col lg={12}>
                                        <div className="text-center mt-sm-5 mb-4 text-white-50">
                                            <div>
                                                <Link to="/" className="d-inline-block auth-logo">
                                                    <img src={logoLight} alt="logo" height="20" />
                                                </Link>
                                            </div>
                                            <p className="mt-3 fs-15 fw-medium">
                                                Performance Management Application
                                            </p>
                                        </div>
                                    </Col>
                                </Row>

                                <Row className="justify-content-center">
                                    <Col md={8} lg={6} xl={5}>
                                        <Card className="mt-4">
                                            <CardBody className="p-4 text-center">
                                                <lord-icon
                                                    src="https://cdn.lordicon.com/hzomhqxz.json"
                                                    trigger="loop"
                                                    colors="primary:#405189,secondary:#08a88a"
                                                    style={{ width: "180px", height: "180px" }}>
                                                </lord-icon>

                                                <div className="mt-4 pt-2">
                                                    <h4>You are Logged Out</h4>
                                                    <p className="text-muted">
                                                        Thank you for using the Performance Management System.
                                                    </p>

                                                    <div className="mt-4">
                                                        <Link to="/login" className="btn btn-success w-100">
                                                            Sign In Again
                                                        </Link>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>
                            </Container>
                        </div>
                    </ParticlesAuth>
                </div>
            </div>
        </React.Fragment>
    );
};

export default CustomLogout;
