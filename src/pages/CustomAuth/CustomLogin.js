import React, { useState } from 'react';
import { Card, CardBody, Col, Container, Input, Label, Row, Button, Form, FormFeedback, Alert } from 'reactstrap';
import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { useFormik } from "formik";
import axios from 'axios';
import { toast } from 'react-toastify';

import logoLight from "../../assets/images/logo-light.png";

const API_LOGIN_URL = "http://localhost:8080/api/auth/login";

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

const showErrorToast = (msg) =>
  toast.error(msg, {
    ...toastConfig,
    className: 'bg-danger text-white',
    icon: <i className="ri-error-warning-line align-middle me-2"></i>
  });

const showSuccessToast = (msg) =>
    toast.success(msg, {
    ...toastConfig,
    className: 'bg-success text-white',
    icon: <i className="ri-checkbox-circle-line align-middle me-2"></i>
    });
  

const Login = () => {
  const navigate = useNavigate();
  const [passwordShow, setPasswordShow] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [loading, setLoading] = useState(false);

  const validation = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Please Enter Your Email").email("Invalid email format"),
      password: Yup.string().required("Please Enter Your Password"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setLoginError(null);

      try {
        const response = await axios.post(API_LOGIN_URL, values);

        const userData = response.data?.data || response.data;

        sessionStorage.removeItem("authUser");

        localStorage.setItem("user", JSON.stringify(userData));

        // Clear any existing toasts before showing a new one
        toast.dismiss();

        showSuccessToast("Login successful! Welcome back 👋");
        navigate("/users");


      } catch (error) {
        console.error("Login Error:", error);

        let errorMessage = "Invalid Credential. Please try again.";

        if (error.response) {
          console.log("Error response data:", error.response.data);
          errorMessage = error.response.data.msg || errorMessage;
        } else if (error.request) {
          console.error("No response received:", error.request);
          errorMessage = "No response from server. Please try again later.";
        } else {
          console.error("Error:", error.message);
          errorMessage = error.message || errorMessage;
        }

        showErrorToast(errorMessage);
        setLoginError(errorMessage);
        setLoading(false);
      }
    }
  });

  document.title = "Login | Performance Web App";

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
                      <h5 className="text-primary">Welcome Back!</h5>
                      <p className="text-muted">Sign in to continue to Performance App.</p>
                    </div>
                    {loginError && (<Alert color="danger" className="mt-3">{loginError}</Alert>)}
                    <div className="p-2 mt-4">
                      <Form onSubmit={validation.handleSubmit}>
                        {/* Form fields */}
                        <div className="mb-3">
                          <Label htmlFor="email" className="form-label">Email</Label>
                          <Input
                            name="email"
                            className="form-control"
                            placeholder="Enter email"
                            type="email"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.email}
                            invalid={validation.touched.email && validation.errors.email}
                          />
                          {validation.touched.email && validation.errors.email ? (
                            <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                          ) : null}
                        </div>
                        <div className="mb-3">
                          <div className="float-end">
                            <Link to="/forgot-password" className="text-muted">Forgot password?</Link>
                          </div>
                          <Label className="form-label" htmlFor="password-input">Password</Label>
                          <div className="position-relative auth-pass-inputgroup mb-3">
                            <Input
                              name="password"
                              value={validation.values.password}
                              type={passwordShow ? "text" : "password"}
                              className="form-control pe-5"
                              placeholder="Enter Password"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              invalid={validation.touched.password && validation.errors.password}
                            />
                            {validation.touched.password && validation.errors.password ? (
                              <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                            ) : null}
                            <button
                              className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                              type="button"
                              onClick={() => setPasswordShow(!passwordShow)}
                              id="password-addon"
                            >
                              <i className="ri-eye-fill align-middle"></i>
                            </button>
                          </div>
                        </div>
                        <div className="form-check">
                          <Input className="form-check-input" type="checkbox" value="" id="auth-remember-check" />
                          <Label className="form-check-label" htmlFor="auth-remember-check">Remember me</Label>
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
                                Loading...
                              </>
                            ) : (
                              "Sign In"
                            )}
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </CardBody>
                </Card>
                <div className="mt-4 text-center">
                  <p className="mb-0">Don't have an account? <Link to="/register" className="fw-semibold text-primary text-decoration-underline">Signup</Link></p>
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </ParticlesAuth>
    </React.Fragment>
  );
};

export default Login;
