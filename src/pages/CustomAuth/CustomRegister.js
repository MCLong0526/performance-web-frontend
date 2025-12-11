import React, { useState } from "react";
import { Row, Col, CardBody, Card, Alert, Container, Input, Label, Form, FormFeedback, Button } from "reactstrap";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";

// Toast Notifications
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Template Components
import ParticlesAuth from "../AuthenticationInner/ParticlesAuth"; 
import logoLight from "../../assets/images/logo-light.png"; 

// --- Configuration ---
const API_REGISTER_URL = "http://localhost:8080/api/users";

const toastConfig = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    closeButton: false,
    progress: undefined,
};

const showSuccessToast = (msg) =>
    toast.success(msg, {
        ...toastConfig,
        className: 'bg-success text-white',
        icon: <i className="ri-check-double-line align-middle me-2"></i>
    });

const showErrorToast = (msg) =>
    toast.error(msg, {
        ...toastConfig,
        className: 'bg-danger text-white',
        icon: <i className="ri-error-warning-line align-middle me-2"></i>
    });


const CustomRegister = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [registrationError, setRegistrationError] = useState(null);
    const [passwordShow, setPasswordShow] = useState(false);


    const validation = useFormik({
        initialValues: {
            email: '',
            name: '', // Changed from first_name to match backend 'name' field
            password: '',
            confirm_password: '', // For frontend validation only
            phoneNumber: '',
        },
        validationSchema: Yup.object({
            email: Yup.string().required("Please Enter Your Email").email("Invalid email format"),
            name: Yup.string().required("Please Enter Your Name"),
            password: Yup.string()
                .min(6, "Password must be at least 6 characters")
                .required("Please enter your password"),
            confirm_password: Yup.string()
                .oneOf([Yup.ref("password")], "Passwords do not match")
                .required("Please confirm your password"),
            phoneNumber: Yup.string().matches(/^[0-9]+$/, "Phone number must be digits only").optional(),
        }),
        onSubmit: async (values) => {
            setLoading(true);
            setRegistrationError(null);
            
            try {
                // Prepare data for the backend (excluding confirm_password)
                const payload = {
                    name: values.name,
                    email: values.email,
                    password: values.password, // This will be encrypted by the backend service
                    phoneNumber: values.phoneNumber,
                    
                    // Backend defaults that are required:
                    role: "PROGRAMMER", 
                    status: "ACTIVE",
                    createdBy: "SELF_REGISTER",
                };

                const response = await axios.post(API_REGISTER_URL, payload);
                
                // --- SUCCESSFUL REGISTRATION ---
                showSuccessToast(response.data.msg || "Registration successful!");

                // Redirect to login page after a short delay
                setTimeout(() => {
                    navigate("/login"); 
                }, 2000);

            } catch (error) {
                console.error("Registration Error:", error);
                let errorMessage = "Registration failed. Please check your inputs.";
                
                if (error.response && error.response.data) {
                    // Specific validation errors (from Spring's IllegalArgumentException)
                    if (error.response.data.error) {
                        errorMessage = error.response.data.error; 
                    } 
                    // General error message (e.g., Email already exists)
                    else if (error.response.data.msg) {
                        errorMessage = error.response.data.msg;
                    }
                }
                
                setRegistrationError(errorMessage);
                showErrorToast(errorMessage);
                setLoading(false);
            }
        }
    });

    document.title = "Sign Up | Performance Web App";

    return (
        <React.Fragment>
            <ParticlesAuth>
                <div className="auth-page-content">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center mt-sm-5 mb-4 text-white-50">
                                    <div>
                                        <Link to="/" className="d-inline-block auth-logo">
                                            <img src={logoLight} alt="" height="20" />
                                        </Link>
                                    </div>
                                    <p className="mt-3 fs-15 fw-medium">Performance Management Application</p>
                                </div>
                            </Col>
                        </Row>

                        <Row className="justify-content-center">
                            <Col md={8} lg={6} xl={5}>
                                <Card className="mt-4">

                                    <CardBody className="p-4">
                                        <div className="text-center mt-2">
                                            <h5 className="text-primary">Create New Account</h5>
                                            <p className="text-muted">Get your free account now</p>
                                        </div>
                                        <div className="p-2 mt-4">
                                            <Form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    validation.handleSubmit();
                                                }}
                                                className="needs-validation">

                                                {registrationError && (
                                                    <Alert color="danger" className="mt-3">{registrationError}</Alert>
                                                )}

                                                <div className="mb-3">
                                                    <Label htmlFor="useremail" className="form-label">Email <span className="text-danger">*</span></Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        className="form-control"
                                                        placeholder="Enter email address"
                                                        type="email"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.email}
                                                        invalid={validation.touched.email && validation.errors.email}
                                                    />
                                                    {validation.touched.email && validation.errors.email ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.email}</div></FormFeedback>
                                                    ) : null}

                                                </div>
                                                <div className="mb-3">
                                                    <Label htmlFor="username" className="form-label">Name <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="name" // Mapped to backend 'name'
                                                        type="text"
                                                        placeholder="Enter your name"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.name}
                                                        invalid={validation.touched.name && validation.errors.name}
                                                    />
                                                    {validation.touched.name && validation.errors.name ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.name}</div></FormFeedback>
                                                    ) : null}

                                                </div>

                                                <div className="mb-3">
                                                    <Label htmlFor="userpassword" className="form-label">Password <span className="text-danger">*</span></Label>
                                                    <div className="position-relative auth-pass-inputgroup">
                                                        <Input
                                                            name="password"
                                                            type={passwordShow ? "text" : "password"}
                                                            placeholder="Enter Password"
                                                            onChange={validation.handleChange}
                                                            onBlur={validation.handleBlur}
                                                            value={validation.values.password}
                                                            invalid={validation.touched.password && validation.errors.password}
                                                        />
                                                        {validation.touched.password && validation.errors.password ? (
                                                            <FormFeedback type="invalid"><div>{validation.errors.password}</div></FormFeedback>
                                                        ) : null}
                                                        <button 
                                                            className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted" 
                                                            type="button" 
                                                            onClick={() => setPasswordShow(!passwordShow)} 
                                                            id="password-addon">
                                                            <i className="ri-eye-fill align-middle"></i>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mb-2">
                                                    <Label htmlFor="confirmPassword" className="form-label">Confirm Password <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="confirm_password"
                                                        type="password"
                                                        placeholder="Confirm Password"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.confirm_password}
                                                        invalid={validation.touched.confirm_password && validation.errors.confirm_password}
                                                    />
                                                    {validation.touched.confirm_password && validation.errors.confirm_password ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.confirm_password}</div></FormFeedback>
                                                    ) : null}
                                                </div>
                                                
                                                <div className="mb-3">
                                                    <Label htmlFor="phoneNumber" className="form-label">Phone Number (Optional)</Label>
                                                    <Input
                                                        name="phoneNumber"
                                                        type="tel"
                                                        placeholder="Enter phone number"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.phoneNumber}
                                                        invalid={validation.touched.phoneNumber && validation.errors.phoneNumber}
                                                    />
                                                    {validation.touched.phoneNumber && validation.errors.phoneNumber ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.phoneNumber}</div></FormFeedback>
                                                    ) : null}
                                                </div>


                                                <div className="mb-4">
                                                    <p className="mb-0 fs-12 text-muted fst-italic">By registering you agree to the Performance App
                                                        <Link to="#" className="text-primary text-decoration-underline fst-normal fw-medium">Terms of Use</Link></p>
                                                </div>

                                                <div className="mt-4">
                                                    <Button 
                                                        color="success" 
                                                        className="w-100" 
                                                        type="submit"
                                                        disabled={loading}
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                Signing Up...
                                                            </>
                                                        ) : (
                                                            "Sign Up"
                                                        )}
                                                    </Button>
                                                </div>
                                                
                                                {/* Social Media buttons removed for simplicity */}

                                            </Form>
                                        </div>
                                    </CardBody>
                                </Card>
                                <div className="mt-4 text-center">
                                    <p className="mb-0">Already have an account ? <Link to="/login" className="fw-semibold text-primary text-decoration-underline"> Signin </Link> </p>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </ParticlesAuth>
            <ToastContainer />
        </React.Fragment>
    );
};

export default CustomRegister;