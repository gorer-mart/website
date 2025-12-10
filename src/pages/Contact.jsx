import React from 'react'
import Footer from '../components/Footer'

const Contact = () => {
    return (
        <main className="min-h-screen container-max mx-auto px-6 py-12">
            <h1 className="text-3xl font-semibold">Get in touch</h1>
            <p className="mt-3 text-white/70">Have a question, collaboration or wholesale inquiry? Send us a message.</p>

            <form className="mt-6 max-w-lg">
                <input className="w-full bg-white/5 px-4 py-3 rounded-md mb-3" placeholder="Your name" />
                <input className="w-full bg-white/5 px-4 py-3 rounded-md mb-3" placeholder="Email" />
                <textarea className="w-full bg-white/5 px-4 py-3 rounded-md mb-3" rows="5" placeholder="Message"></textarea>
                <button className="px-5 py-3 bg-yellow-300 text-black rounded-md font-semibold">Send Message</button>
            </form>

            <Footer />
        </main>
    )
}

export default Contact