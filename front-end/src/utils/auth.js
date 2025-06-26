export const isLoggedIn = () => {
  return !!localStorage.getItem("accessToken");
};
