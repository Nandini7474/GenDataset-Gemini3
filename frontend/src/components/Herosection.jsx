import React from "react";

const HeroSection = () => {
  return (
    <section className="relative text-center pt-24 pb-32 px-6 bg-gradient-to-b from-purple-50 via-purple-50 to-transparent overflow-hidden">

      
      {/* 🔮 Soft glow blobs */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-3xl -z-10" />
      <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-pink-300/20 rounded-full blur-3xl -z-10" />

      <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
        Generate synthetic data{" "}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
          in seconds.
        </span>
      </h1>

      <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto">
        Create realistic datasets for testing, ML training, and demos without
        compromising privacy.
      </p>

      {/* Body text */}
      <p className="mt-8 text-sm md:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
        Choose a dataset domain, describe your use case, and define the schema.
        <br className="hidden md:block" />
        NSDataLab instantly generates high-quality synthetic data tailored to
        your requirements — perfect for prototyping, analytics, and AI workflows.
      </p>

    </section>
  );
};

export default HeroSection;
