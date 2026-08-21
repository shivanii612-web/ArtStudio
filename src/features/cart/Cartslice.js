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

const getInitialCart = () => {
  const userId = getUserId();
  if (userId) {
    const storedCart = localStorage.getItem(`cart_${userId}`);
    return storedCart ? JSON.parse(storedCart) : [];
  }
  return [];
};

const initialState = {
  items: getInitialCart(),
};

const saveCartToLocalStorage = (items) => {
  const userId = getUserId();
  if (userId) {
    localStorage.setItem(`cart_${userId}`, JSON.stringify(items));
  }
};

const cartslice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        //Add to cart
        addtoCart(state, action) {
            const product = action.payload;
            const productId = product._id || product.id;

            const existingItem = state.items.find(item => item._id === productId);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                state.items.push({
                    ...product,
                    _id: productId,
                    quantity: 1
                });
            }
            saveCartToLocalStorage(state.items);
        },
        //Remove from cart
        removeItem(state, action) {
            state.items = state.items.filter(item => item._id !== action.payload);

            saveCartToLocalStorage(state.items);

        },
        //increase quantity
        increaseQuantity(state, action) {
            const item = state.items.find(item => item._id === action.payload);
            if (item) {
                item.quantity++;

            }
            saveCartToLocalStorage(state.items);
        },
        //decrease quantity
        decreaseQuantity(state, action) {
            const item = state.items.find(item => item._id === action.payload);
            if (item) {
                item.quantity--;

                if (item.quantity === 0) {
                    state.items = state.items.filter(item => item._id !== action.payload);
                }
            }
            saveCartToLocalStorage(state.items);

        },
        clearItem: (state, action) => {
            state.items = state.items.filter((item) => item._id !== action.payload);
            saveCartToLocalStorage(state.items);
        },
        clearCart: (state) => {
         state.items = [];
         saveCartToLocalStorage(state.items);
        },
        setUserCart(state, action) {
            const userId = action.payload;
            if (userId) {
                const storedCart = localStorage.getItem(`cart_${userId}`);
                state.items = storedCart ? JSON.parse(storedCart) : [];
            } else {
                state.items = [];
            }
        },
        logoutCart(state) {
            state.items = [];
        }
    }
})
export const { 
  addtoCart, 
  removeItem, 
  increaseQuantity, 
  decreaseQuantity,
  clearItem,
  clearCart,
  setUserCart,
  logoutCart
} = cartslice.actions;
export default cartslice.reducer;