import React from "react";

const Footer = () => {
  return (
    <footer className="bg-stone-800 text-white py-6">
      <div className="flex flex-col items-center gap-2">

        <h2 className="text-2xl font-bold text-orange-400">
          ArtStudio
        </h2>

        <p className="text-sm">
          Sketch Your Dreams, Paint Your World.
        </p>

        <p className="text-xs text-gray-300">
          © 2026 ArtStudio. All Rights Reserved.
        </p>

      </div>
    </footer>
  );
};

export default Footer;