import { createSlice } from "@reduxjs/toolkit";

const getUserId = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user._id || user.id || user.email;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};

const getInitialWishlist = () => {
  const userId = getUserId();
  if (userId) {
    const storedWishlist = localStorage.getItem(`wishlist_${userId}`);
    return storedWishlist ? JSON.parse(storedWishlist) : [];
  }
  return [];
};

const initialState = {
  items: getInitialWishlist(),
};

const saveWishlistToLocalStorage = (items) => {
  const userId = getUserId();
  if (userId) {
    localStorage.setItem(`wishlist_${userId}`, JSON.stringify(items));
  }
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
      const userId = getUserId();
      if (userId) {
        localStorage.removeItem(`wishlist_${userId}`);
      } else {
        localStorage.removeItem("wishlist");
      }
    },

    setUserWishlist(state, action) {
      const userId = action.payload;
      if (userId) {
        const storedWishlist = localStorage.getItem(`wishlist_${userId}`);
        state.items = storedWishlist ? JSON.parse(storedWishlist) : [];
      } else {
        state.items = [];
      }
    },

    logoutWishlist(state) {
      state.items = [];
    },
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  setUserWishlist,
  logoutWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;