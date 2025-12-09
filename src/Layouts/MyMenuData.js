const MyMenuData = () => {
    return {
      props: {
        children: [
          {
            label: "Main Menu",
            isHeader: true,
          },
          {
            id: "users",
            label: "Users",
            icon: "ri-user-line",
            link: "/users"
          }
        ]
      }
    };
  };
  
  export default MyMenuData;
  