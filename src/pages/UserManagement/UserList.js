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
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import axios from "axios";

const API_URL = "http://localhost:8080/api/users";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
  });

  // Alert state for rounded-label alert
  const [alert, setAlert] = useState({
    visible: false,
    type: "success", // "success" | "danger"
    message: "",
  });

  const showSuccessAlert = (msg) =>
    setAlert({ visible: true, type: "success", message: msg });

  const showErrorAlert = (msg) =>
    setAlert({ visible: true, type: "danger", message: msg });

  // ---------------- LOAD USERS ----------------
  const loadUsers = async () => {
    try {
      const res = await axios.get(API_URL);
      console.log("Loaded users:", res.data);
      setUsers(res.data);
    } catch (err) {
      console.error("API error:", err);
      showErrorAlert("Unable to fetch users from backend.");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ---------------- ADD USER ----------------
  const openAdd = () => {
    setSelectedUser(null);
    setForm({ name: "", email: "", role: "" });
    setModalOpen(true);
  };

  // ---------------- EDIT USER ----------------
  const openEdit = (u) => {
    setSelectedUser(u);
    setForm({
      name: u.name ?? "",
      email: u.email ?? "",
      role: u.role ?? "",
    });
    setModalOpen(true);
  };

  // ---------------- SAVE USER ----------------
  const saveUser = async () => {
    try {
      let message = "";
      if (selectedUser) {
        await axios.put(`${API_URL}/${selectedUser.id}`, form);
        message = "User updated successfully!";
      } else {
        await axios.post(API_URL, form);
        message = "New user added successfully!";
      }

      setModalOpen(false);
      showSuccessAlert(message);
      loadUsers();
    } catch (e) {
      console.error("Save error:", e);
      showErrorAlert("Failed to save user.");
    }
  };

  // ---------------- DELETE USER ----------------
  const confirmDelete = (u) => {
    setSelectedUser(u);
    setDeleteModal(true);
  };

  const deleteUser = async () => {
    try {
      await axios.delete(`${API_URL}/${selectedUser.id}`);
      setDeleteModal(false);
      showSuccessAlert(`User '${selectedUser?.name}' deleted successfully!`);
      loadUsers();
    } catch (e) {
      console.error("Delete error:", e);
      showErrorAlert("Failed to delete user.");
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="User Management" pageTitle="Users" />

        {/* Rounded label alert (your template style) */}
        {alert.visible && (
          <div
            className={`alert alert-${alert.type} alert-dismissible alert-label-icon rounded-label fade show`}
            role="alert"
          >
            <i
                className={`${
                    alert.type === "success"
                    ? "ri-check-double-line"
                    : "ri-error-warning-line"
                } label-icon`}
            ></i>
            <strong>
              {alert.type === "success" ? "Success" : "Error"}
            </strong>{" "}
            - {alert.message}
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setAlert({ ...alert, visible: false })}
            ></button>
          </div>
        )}

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
                        <td>{u.role}</td>
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
                      <td colSpan="5" className="text-center text-muted">
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
            <label>Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <label className="mt-3">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <label className="mt-3">Role</label>
            <Input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </ModalBody>

          <ModalFooter>
            <Button color="light" onClick={() => setModalOpen(false)}>
              Close
            </Button>
            <Button color="success" onClick={saveUser}>
              Save
            </Button>
          </ModalFooter>
        </Modal>

        {/* ---------------- DELETE MODAL ---------------- */}
        <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)}>
          <ModalHeader>Are you sure?</ModalHeader>
          <ModalBody>
            Delete user <b>{selectedUser?.name}</b> ?
          </ModalBody>
          <ModalFooter>
            <Button color="light" onClick={() => setDeleteModal(false)}>
              Cancel
            </Button>
            <Button color="danger" onClick={deleteUser}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>
      </Container>
    </div>
  );
};

export default UserList;
