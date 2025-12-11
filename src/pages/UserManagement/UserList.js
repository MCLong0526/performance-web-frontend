import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  CardBody,
  CardHeader,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Row,
  Col,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import axios from "axios";

// Import react-toastify components and CSS
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "http://localhost:8080/api/users";

// Configuration for success/error toasts
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

// --- HELPER FUNCTIONS FOR BADGE RENDERING ---
const getRoleBadge = (role) => {
  if (!role) return <span className="badge bg-secondary-subtle text-secondary">N/A</span>;
  const badgeMap = {
    'ADMIN': { bg: 'bg-danger-subtle', text: 'text-danger' },
    'BOSS': { bg: 'bg-primary-subtle', text: 'text-primary' },
    'LEADER': { bg: 'bg-info-subtle', text: 'text-info' },
    'PROGRAMMER': { bg: 'bg-success-subtle', text: 'text-success' },
    'DEFAULT': { bg: 'bg-secondary-subtle', text: 'text-secondary' }, 
  };
  const { bg, text } = badgeMap[role] || badgeMap['DEFAULT'];
  return (
    <span className={`badge ${bg} ${text} text-uppercase`}>
      {role.toLowerCase()}
    </span>
  );
};

const getStatusBadge = (status) => {
  if (!status) return <span className="badge rounded-pill border bg-secondary"><i className="mdi mdi-circle-medium"></i> N/A</span>;
  const badgeMap = {
    'ACTIVE': 'success',
    'DEACTIVATE': 'danger',
    'DEFAULT': 'secondary',
  };
  const bgClass = badgeMap[status] || badgeMap['DEFAULT'];
  return (
    <span className={`badge rounded-pill border border-${bgClass} text-${bgClass}`}>
     {status}
    </span>

  );
};


const UserList = () => {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "PROGRAMMER", 
    status: "ACTIVE",  
    phoneNumber: "",
  });

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "N/A";
    const date = new Date(dateTime);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Toast functions
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

  // ---------------- LOAD USERS ----------------
  const loadUsers = async () => {
    try {
      const res = await axios.get(API_URL);
      // Safely access data, fallback to empty array if not present
      setUsers(res.data || []);
    } catch (err) {
      console.error("API error:", err);
      showErrorToast(`Load Error: ${err.message || "Unable to fetch users from backend."}`);
    }
  };
  

  useEffect(() => {
    loadUsers();
  }, []);

  // ---------------- ADD / EDIT USER ----------------
  const openAdd = () => {
    setSelectedUser(null);
    setForm({ 
        name: "", 
        email: "", 
        role: "PROGRAMMER", 
        status: "ACTIVE", 
        phoneNumber: "" 
    });
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setSelectedUser(u);
    setForm({
      name: u.name ?? "",
      email: u.email ?? "",
      role: u.role ?? "PROGRAMMER",
      status: u.status ?? "ACTIVE",
      phoneNumber: u.phoneNumber ?? "",
    });
    setModalOpen(true);
  };

  // ---------------- SAVE USER ----------------
  const saveUser = async () => {
    try {
      let res;
      if (selectedUser) {
        const updateData = {
            name: form.name,
            email: form.email,
            role: form.role,
            status: form.status,
            phoneNumber: form.phoneNumber,
        };
        res = await axios.put(`${API_URL}/${selectedUser.id}`, updateData);
      } else {
        res = await axios.post(API_URL, form);
      }
      
      setModalOpen(false);
      // Use the success message from the response body
      showSuccessToast(res.msg); 
      loadUsers();
    } catch (e) {
        console.error("Full Error Object:", e); 

        let errorMessage = "Failed to save user. Please check your inputs.";
        
        if (e.response && e.response.data) {
            // Priority 1: Specific validation error message (from @ExceptionHandler 400)
            if (e.response.data.error) {
                errorMessage = e.response.data.error; 
            } 
            // Priority 2: General message (from 404, etc., returned by controller helper)
            else if (e.response.data.msg) {
                errorMessage = e.response.data.msg;
            }
        }
        
        showErrorToast(errorMessage);
    }
  };

  // ---------------- DELETE USER ----------------
  const confirmDelete = (u) => {
    setSelectedUser(u);
    setDeleteModal(true);
  };

  const deleteUser = async () => {
    try {
      const res = await axios.delete(`${API_URL}/${selectedUser.id}`);
      setDeleteModal(false);
      // Use the success message from the response body
      showSuccessToast(res.msg); 
      loadUsers();
    } catch (e) {
      console.error("Delete error:", e);
      let errorMessage = "Failed to delete user.";
      
      if (e.response && e.response.data && e.response.data.msg) {
          // Use the message field (e.g., "User not found or already soft-deleted.")
          errorMessage = e.response.data.msg;
      }
      showErrorToast(errorMessage);
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="User Management" pageTitle="Users" />
        
        <Card>
          <CardHeader>
            <h4 className="card-title mb-0">Users</h4>
            <Button color="info" className="mt-3" onClick={openAdd}>
              + Add User
            </Button>
          </CardHeader>

          <CardBody>
            <div className="table-responsive">
              <table className="table table-nowrap align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th> 
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Created By / Time</th>
                    <th>Last Updated</th>
                    <th width="140px">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {users && users.length > 0 ? (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{getRoleBadge(u.role)}</td> 
                        <td>{u.phoneNumber || 'N/A'}</td>
                        <td>{getStatusBadge(u.status)}</td>
                        <td>
                            {u.createdBy || 'N/A'}
                            <br/><small className="text-muted">{formatDateTime(u.createTime)}</small>
                        </td>
                        <td>
                            {u.updatedBy || 'N/A'}
                            <br/><small className="text-muted">{formatDateTime(u.updateTime)}</small>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              color="info"
                              onClick={() => openEdit(u)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              onClick={() => confirmDelete(u)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center text-muted">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* ---------------- ADD / EDIT MODAL ---------------- */}
        <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
          <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
            {selectedUser ? "Edit User" : "Add User"}
          </ModalHeader>
          <ModalBody>
            <Row>
                <Col md={6}>
                    <label>Name</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                </Col>
                <Col md={6}>
                    <label>Email</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                </Col>
            </Row>

            <label className="mt-3">Phone Number</label>
            <Input
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            />

            <Row className="mt-3">
                <Col md={6}>
                    <label>Role</label>
                    <Input
                      type="select"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                        <option value="ADMIN">Admin</option>
                        <option value="BOSS">Boss</option>
                        <option value="LEADER">Leader</option>
                        <option value="PROGRAMMER">Programmer</option>
                    </Input>
                </Col>
                <Col md={6}>
                    <label>Status</label>
                    <Input
                      type="select"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                        <option value="ACTIVE">Active</option>
                        <option value="DEACTIVATE">Deactivate</option>
                    </Input>
                </Col>
            </Row>

            {selectedUser && (
                <div className="mt-3 border-top pt-3">
                    <p className="mb-1 text-muted"><small>Created By: <b>{selectedUser.createdBy}</b> on {formatDateTime(selectedUser.createTime)}</small></p>
                    {selectedUser.updatedBy && <p className="mb-0 text-muted"><small>Last Updated By: <b>{selectedUser.updatedBy}</b> on {formatDateTime(selectedUser.updateTime)}</small></p>}
                </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button color="light" onClick={() => setModalOpen(false)}>
              Close
            </Button>
            <Button color="success" onClick={saveUser}>
              {selectedUser ? "Update" : "Save"}
            </Button>
          </ModalFooter>
        </Modal>

        {/* ---------------- DELETE MODAL ---------------- */}
        <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)}>
          <ModalHeader>Confirm Soft Delete</ModalHeader>
          <ModalBody>
            Are you sure you want to **soft-delete** user <b>{selectedUser?.name}</b>? The user will be deactivated but remain in the database.
          </ModalBody>
          <ModalFooter>
            <Button color="light" onClick={() => setDeleteModal(false)}>
              Cancel
            </Button>
            <Button color="danger" onClick={deleteUser}>
              Confirm Soft Delete
            </Button>
          </ModalFooter>
        </Modal>
      </Container>
      
      <ToastContainer /> 
    </div>
  );
};

export default UserList;