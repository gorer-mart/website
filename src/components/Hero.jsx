import React from 'react';
import image1 from '../assets/hero_tshirt_1.png';

const Hero = () => {
    return (
        <section className="relative w-full h-screen overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black/60 opacity-95" />

            <div className="container-max relative z-10 h-full mx-auto flex items-center px-6">
                <div className="max-w-2xl">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">Get ready for endless <span className="text-yellow-300 italic font-normal">“Eta Kotha Theke Kinechish?”</span> replies</h1>
                    <p className="mt-6 text-lg text-white/80">The coolest drips of Kolkata wrapped with nostalgia and aesthetics. Buy, wear and flex.</p>

                    <div className="mt-8 flex gap-4">
                        <a href="/shop" className="px-6 py-3 rounded-md bg-yellow-300 text-black font-semibold shadow hover:opacity-95">Shop T-Shirts</a>
                        <a href="#about" className="px-6 py-3 rounded-md border border-white/10 text-white/90">Learn More</a>
                    </div>
                </div>

                <div className="ml-auto hidden lg:block w-96 h-96 relative">
                    <img src={image1} alt="tshirt" className="w-full h-full object-cover rounded-2xl shadow-2xl transform hover:scale-105 transition" />
                </div>
            </div>
        </section>
    );
};

export default Hero;
