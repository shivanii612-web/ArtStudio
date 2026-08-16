import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminNavbar from "./AdminNavbar";

const AdminProducts = () => {

  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");

  const [editProduct, setEditProduct] = useState(null);


  // Add Product States

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [image, setImage] = useState("");



  const fetchProducts = async () => {

    try {

      const res = await axios.get(
        "http://localhost:3000/AllProducts"
      );

      setProducts(res.data.data || []);

    } catch(error) {

      console.log(error);
      alert("Failed to fetch products");

    }

  };



  useEffect(() => {

    fetchProducts();

  }, []);





  const clearAddForm = () => {

    setTitle("");
    setDescription("");
    setPrice("");
    setQuantity("");
    setImage("");

  };





  // ADD PRODUCT

  const handleAdd = async(e)=>{

    e.preventDefault();


    try{


      await axios.post(
        "http://localhost:3000/create",
        {
          title,
          description,
          price:Number(price),
          quantity:Number(quantity),
          image
        }
      );


      alert("Product Added Successfully");


      clearAddForm();

      fetchProducts();


    }
    catch(error){

      console.log(error);

      alert("Add Failed");

    }

  };





  // OPEN UPDATE BOX

  const handleEdit = (product)=>{

    setEditProduct(product);

    window.scrollTo({
      top:0,
      behavior:"smooth"
    });

  };






  // UPDATE PRODUCT

  const handleUpdate = async(e)=>{

    e.preventDefault();


    try{


      await axios.put(

        `http://localhost:3000/updateproduct/${editProduct._id}`,

        {
          title:editProduct.title,
          description:editProduct.description,
          price:Number(editProduct.price),
          quantity:Number(editProduct.quantity),
          image:editProduct.image
        }

      );



      alert("Product Updated Successfully");


      setEditProduct(null);


      fetchProducts();



    }
    catch(error){

      console.log(error);

      alert("Update Failed");

    }

  };





  // DELETE PRODUCT

  const handleDelete = async(id)=>{


    const confirmDelete = window.confirm(
      "Are you sure want to delete?"
    );


    if(!confirmDelete)
      return;



    try{


      await axios.delete(

        `http://localhost:3000/delete/${id}`

      );


      alert("Product Deleted Successfully");


      fetchProducts();



    }
    catch(error){


      console.log(error);

      alert("Delete Failed");


    }


  };






  const filteredProducts = products.filter((product)=>

    product.title
    .toLowerCase()
    .includes(search.toLowerCase())

  );

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#1F2937]">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-[2px] bg-[#F97316]"></span>
            <span className="text-xs font-bold tracking-[0.25em] uppercase text-[#F97316]">ArtStudio</span>
            <span className="w-8 h-[2px] bg-[#F97316]"></span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#1F2937]">
            Admin Product Management
          </h1>
        </div>

        {/* ADD PRODUCT BOX */}
        <form
          onSubmit={handleAdd}
          className="bg-white border border-[#E7E0D8] shadow-[0_4px_20px_rgba(231,224,216,0.5)] rounded-2xl p-8 mb-10 border-l-4 border-l-[#F97316]"
        >
          <h2 className="text-2xl font-bold mb-6 text-[#1F2937]">
            Add Product
          </h2>

          <div className="grid grid-cols-2 gap-5">
            <input
              type="text"
              placeholder="Product Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border border-[#E7E0D8] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all bg-[#F8F5F0]/20"
              required
            />

            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border border-[#E7E0D8] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all bg-[#F8F5F0]/20"
              required
            />

            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="border border-[#E7E0D8] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all bg-[#F8F5F0]/20"
              required
            />

            <input
              type="text"
              placeholder="Image URL"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="border border-[#E7E0D8] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all bg-[#F8F5F0]/20"
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-[#E7E0D8] p-3 rounded-xl col-span-2 focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all bg-[#F8F5F0]/20"
              rows="4"
              required
            />
          </div>

          <button
            className="mt-6 bg-[#F97316] text-white px-8 py-3.5 rounded-xl font-semibold shadow-md hover:bg-orange-600 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            Add Product
          </button>
        </form>

        {/* UPDATE PRODUCT BOX */}
        {editProduct && (
          <form
            onSubmit={handleUpdate}
            className="bg-white border border-[#E7E0D8] shadow-[0_4px_20px_rgba(231,224,216,0.5)] rounded-2xl p-8 mb-10 border-l-4 border-l-[#F97316]"
          >
            <h2 className="text-2xl font-bold mb-6 text-[#1F2937]">
              Update Product
            </h2>

            <div className="grid grid-cols-2 gap-5 mb-5">
              <input
                value={editProduct.title}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    title: e.target.value
                  })
                }
                placeholder="Product Title"
                className="border border-[#E7E0D8] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all bg-[#F8F5F0]/20"
              />

              <input
                value={editProduct.price}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    price: e.target.value
                  })
                }
                placeholder="Price (₹)"
                className="border border-[#E7E0D8] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all bg-[#F8F5F0]/20"
              />

              <input
                value={editProduct.quantity}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    quantity: e.target.value
                  })
                }
                placeholder="Quantity"
                className="border border-[#E7E0D8] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all bg-[#F8F5F0]/20"
              />

              <input
                value={editProduct.image}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    image: e.target.value
                  })
                }
                placeholder="Image URL"
                className="border border-[#E7E0D8] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all bg-[#F8F5F0]/20"
              />

              <textarea
                value={editProduct.description}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    description: e.target.value
                  })
                }
                placeholder="Description"
                className="border border-[#E7E0D8] p-3 rounded-xl w-full col-span-2 focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all bg-[#F8F5F0]/20"
                rows="4"
              />
            </div>

            <div className="flex gap-4">
              <button
                className="bg-[#16A34A] text-white px-8 py-3.5 rounded-xl font-semibold shadow-md hover:bg-green-700 hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                Update
              </button>

              <button
                type="button"
                onClick={() => setEditProduct(null)}
                className="bg-[#64748B] text-white px-8 py-3.5 rounded-xl font-semibold shadow-md hover:bg-slate-600 hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Header section with search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#F97316] rounded-full"></span>
            <h2 className="text-2xl font-bold text-[#1F2937]">
              All Products ({filteredProducts.length})
            </h2>
          </div>

          <input
            type="text"
            placeholder="Search Product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-[#E7E0D8] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all w-full sm:w-64 bg-white"
          />
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-2xl border border-[#E7E0D8] shadow-[0_4px_15px_rgba(231,224,216,0.3)] p-4 flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(231,224,216,0.5)] transition-all duration-300 relative group"
            >
              <div>
                {/* Image container with subtle cream background */}
                <div className="w-full h-52 bg-[#FFF1E6]/30 rounded-xl p-3 flex items-center justify-center overflow-hidden border border-[#E7E0D8]/40">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <h3 className="font-bold text-lg text-[#1F2937] mt-4 line-clamp-1">
                  {product.title}
                </h3>

                <p className="text-[#64748B] text-sm mt-1 line-clamp-2 min-h-[40px]">
                  {product.description}
                </p>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center text-sm border-t border-[#E7E0D8]/50 pt-3">
                  <span className="text-[#F97316] text-lg font-bold">
                    ₹{product.price}
                  </span>
                  <span className="text-[#64748B]">
                    Stock: <strong className="text-[#1F2937] font-semibold">{product.quantity}</strong>
                  </span>
                </div>

                <div className="flex gap-2.5 mt-4">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 bg-[#F59E0B] hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-xl transition duration-200 shadow-sm hover:shadow text-center text-sm cursor-pointer"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(product._id)}
                    className="flex-1 bg-[#DC2626] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl transition duration-200 shadow-sm hover:shadow text-center text-sm cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );


};


export default AdminProducts;