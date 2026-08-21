import { createSlice } from "@reduxjs/toolkit";

const initialToken = localStorage.getItem("token");
const getInitialUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

const initialState = {
    user : getInitialUser(),
    token : initialToken || null,
    isAuthenticated : !!initialToken
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      // Save to localStorage
      localStorage.setItem(
        "user",
        JSON.stringify(action.payload.user)
      );
      localStorage.setItem(
        "token",
        action.payload.token
      );
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      // Remove from localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("cart");
      localStorage.removeItem("wishlist");
    },
  },
});

export const { loginSuccess, logout } = userSlice.actions;

export default userSlice.reducer;