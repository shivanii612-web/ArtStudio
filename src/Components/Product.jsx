import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import heroImg from "../assets/hero.png";

const Product = ({ addToCart, cart }) => {
  const products = [
    {
      id: 1,
      name: "Graphite Pencil Set",
      price: "₹299",
      image: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQZoruVk5efsg1sMxSYuyoTW-J4PNDC_NYu_rJuJxmOplL2BBJQl3YNWnltTYVJbXeLLqpbem-l9JOaEsPb-_D7MMcb82UZG63Jl1ILdhby",
    },
    {
      id: 2,
      name: "Sketch Book",
      price: "₹399",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYYDQ3gt-llw4n447j725ipztwBRecfDEtBBWfW_n1CA&s=10",
    },
    {
      id: 3,
      name: "Canvas Board",
      price: "₹599",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSp4AhVZr2h9PW6lARV0uVN8LOomnXjmu8FoK6uBVfHyw&s",
    },
    {
      id: 4,
      name: "Acrylic Paint Set",
      price: "₹699",
      image: "https://m.media-amazon.com/images/I/81dvedSDVaL._AC_SL1500_.jpg",
    },
    {
      id: 5,
      name: "Watercolor Set",
      price: "₹549",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKc41Re_IYCZNzwI6Hj4WDxFVuViEEHy728hSEcZP3Ag&s=10",
    },
    {
      id: 6,
      name: "Professional Brush Set",
      price: "₹349",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTy5POuozXOeB8NMu_XS6GJMlP7Pw1V8RUmfyeylNSsog&s=10",
    },
    {
      id: 7,
      name: "Color Pencil Set",
      price: "₹499",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWjuvexZf-E4Bq97J4tL-2UnTtDU9cSc1skoh7TRiGjg&s=10",
    },
    {
      id: 8,
      name: "Charcoal Pencil Set",
      price: "₹279",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRj_l-ruIUbeNImAuVUtkSuTSzMIwDg5A4WIZcNOtfxuA&s=10",
    },
    {
      id: 9,
      name: "Blending Stumps",
      price: "₹149",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREwLjY5UWtmFEJnSVSCMDHYmY7r8Qve_T9RaUI0xZ2nQ&s=10",
    },
    {
      id: 10,
      name: "Kneaded Eraser",
      price: "₹99",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKzCIwx1Q8bWO12RKW0k3YexPN5h8gCPu-PZnDc5vr3w&s=10",
    },
    {
      id: 11,
      name: "Mechanical Pencil",
      price: "₹249",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0K_KcPjTdx_4PQiHt1K6Mmf2YjZAL-wXJXUS4UE3uVQ&s=10",
    },
    {
      id: 12,
      name: "Palette Knife Set",
      price: "₹399",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcxCTsXCC3i1_lAnskjCCb6kEnFtdnSlYWRGCpjBI7cw&s=10",
    },
    {
      id: 13,
      name: "Wooden Easel Stand",
      price: "₹1299",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYON4BSU81w9SW9HBiWIQI2xJxjpZSsQPT-EUuOFhXAw&s=10",
    },
    {
      id: 14,
      name: "Artist Palette",
      price: "₹199",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAzE5q0WHsmg1RXDYZZeUaq2bnUGiL6RcVcMU4RC-Rcg&s=10",
    },
    {
      id: 15,
      name: "Fixative Spray",
      price: "₹449",
      image: "https://m.media-amazon.com/images/I/71NU7lA4TnL.jpg",
    },
  ];

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div>
      <Navbar cartCount={cartCount} />
      <div className="relative">
        <img
          src={heroImg}
          alt="Hero Banner"
          className="w-full h-[500px] object-cover object-center"
        />
        <div className="absolute top-1/2 left-16 -translate-y-1/2 text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
          <h1 className="text-5xl font-bold">
            Unleash Your Creativity
          </h1>
          <p className="mt-4 text-xl font-semibold">
            Premium Art Supplies for Every Artist
          </p>
          <button className="mt-6 bg-orange-500 px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-all duration-300">
            Shop Now
          </button>
        </div>
      </div>


      <section className="bg-gray-100 px-3 py-5">
        <h1 className="text-xl font-semibold text-center mb-4">
          Our Art Materials
        </h1>

        <div className="grid grid-cols-5 gap-4">
          {products.map((prod) => {
            return (
              <div
                key={prod.id}
                className="bg-white p-2 rounded-lg shadow-md flex flex-col items-center gap-3 cursor-pointer hover:scale-105 transition duration-300"
              >
                <img src={prod.image} alt={prod.name} className="h-[230px]" />

                <div className="flex flex-col items-center gap-2">
                  <h2>{prod.name}</h2>
                  <p>{prod.price}</p>
                </div>

                <button
                  onClick={() => addToCart(prod)}
                  className="bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-amber-300 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Product;