import React from 'react'
import Footer from '../components/Footer'

const About = () => {
    return (
        <main className="min-h-screen container-max mx-auto px-6 py-12">
            <h1 className="text-3xl font-semibold">About Gorer Mart</h1>
            <p className="mt-4 text-white/70">We make tees inspired by Kolkata — its phrases, its memories, and its style. Small batch drops, local printing, and designs with a wink.</p>

            <section className="mt-8">
                <h2 className="font-medium">Our Story</h2>
                <p className="mt-2 text-white/70">Started as a passion project to put Kolkata on a tee, Gorer Mart blends nostalgia and modern streetwear aesthetics.</p>
            </section>

            <Footer />
        </main>
    )
}

export default About