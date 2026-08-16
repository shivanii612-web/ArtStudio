import { createSlice } from "@reduxjs/toolkit";
const storedCart = localStorage.getItem("cart");
const initialState = {
  items: storedCart ? JSON.parse(storedCart) : [],
};
const saveCartToLocalStorage = (items) => {
  localStorage.setItem("cart", JSON.stringify(items));
};

const cartslice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        //Add to cart
        addtoCart(state, action) {
            const product = action.payload;

            const existingItem = state.items.find(item => item._id === product.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                state.items.push({
                    ...product,
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
        }


    }
})
export const { 
 addtoCart, 
 removeItem, 
 increaseQuantity, 
 decreaseQuantity,
 clearItem,
 clearCart
} = cartslice.actions;
export default cartslice.reducer;