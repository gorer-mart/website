import React from 'react'
import Footer from '../components/Footer'
import SEO from '../components/SEO'

const About = () => {
    return (
        <main className="min-h-screen container-max mx-auto px-6 py-12">
            <SEO
                title="About"
                description="Learn about Gorer Mart, our mission, and passion for Kolkata-inspired streetwear."
                url="/about"
                keywords="about, kolkata, streetwear, brand story"
            />
            <h1 className="text-3xl font-semibold">About Gorer Mart</h1>
            <p className="mt-4 text-white/70 max-w-2xl">We make tees inspired by Kolkata — its phrases, its memories, and its style. Small batch drops, local printing, and designs with a wink.</p>

            <section className="mt-12">
                <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
                <p className="text-white/70 mb-4">Started as a passion project to put Kolkata on a tee, Gorer Mart blends nostalgia and modern streetwear aesthetics. We believe in celebrating the quirky, beautiful culture of Bengal through wearable art.</p>
                <p className="text-white/70">Every design tells a story. Every tee is a conversation starter. We're building a community of Kolkata lovers who wear their heritage with pride.</p>
            </section>

            <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3">Our Mission</h3>
                    <p className="text-white/70">To create authentic, high-quality streetwear that celebrates Kolkata's unique culture and aesthetic.</p>
                </div>
                <div className="glass p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3">Our Values</h3>
                    <p className="text-white/70">Quality, authenticity, and celebration of local culture. Every tee is printed locally with care.</p>
                </div>
            </section>

            <Footer />
        </main>
    )
}

export default About