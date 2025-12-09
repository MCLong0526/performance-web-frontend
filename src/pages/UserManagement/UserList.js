import React from "react";
import { Container } from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";

const UserList = () => {
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="User Management" pageTitle="Users" />

          <h3>Hello, this is the User Page!</h3>
          <p>Later we will load data from your backend API.</p>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default UserList;
