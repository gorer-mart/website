import React from 'react'
import Hero from '../components/Hero.jsx'
import Footer from '../components/Footer.jsx'

const Home = () => {
    return (
        <main>
            <Hero />
            <section className="container-max mx-auto px-6 mt-16">
                <h2 className="text-2xl font-semibold">Featured Tees</h2>
                <p className="text-sm text-white/70 mt-2">A quick look at some favorites — click through to shop.</p>
            </section>
            <Footer />
        </main>
    )
}

export default Home