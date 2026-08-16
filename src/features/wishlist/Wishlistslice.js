import { createSlice } from "@reduxjs/toolkit";

const storedWishlist = localStorage.getItem("wishlist");

const initialState = {
  items: storedWishlist ? JSON.parse(storedWishlist) : [],
};

const saveWishlistToLocalStorage = (items) => {
  localStorage.setItem("wishlist", JSON.stringify(items));
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,

  reducers: {
    addToWishlist(state, action) {
      const product = action.payload;

      const exists = state.items.find(
        (item) => item._id === product._id
      );

      if (!exists) {
        state.items.push(product);
      }

      saveWishlistToLocalStorage(state.items);
    },

    removeFromWishlist(state, action) {
      state.items = state.items.filter(
        (item) => item._id !== action.payload
      );

      saveWishlistToLocalStorage(state.items);
    },

    clearWishlist(state) {
      state.items = [];
      localStorage.removeItem("wishlist");
    },
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;