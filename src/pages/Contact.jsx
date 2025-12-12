import React from 'react'
import Footer from '../components/Footer'
import SEO from '../components/SEO'

const Contact = () => {
    return (
        <main className="min-h-screen container-max mx-auto px-6 py-12">
            <SEO
                title="Contact"
                description="Get in touch with Gorer Mart. We'd love to hear from you!"
                url="/contact"
                keywords="contact, support, inquiries"
            />
            <h1 className="text-3xl font-semibold">Get in Touch</h1>
            <p className="mt-3 text-white/70">Have a question, collaboration offer, or wholesale inquiry? Send us a message.</p>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
                <form className="space-y-4">
                    <input className="w-full bg-white/5 px-4 py-3 rounded-md text-white placeholder:text-white/60" placeholder="Your name" />
                    <input className="w-full bg-white/5 px-4 py-3 rounded-md text-white placeholder:text-white/60" placeholder="Email" />
                    <input className="w-full bg-white/5 px-4 py-3 rounded-md text-white placeholder:text-white/60" placeholder="Subject" />
                    <textarea className="w-full bg-white/5 px-4 py-3 rounded-md text-white placeholder:text-white/60" rows="5" placeholder="Message"></textarea>
                    <button className="px-5 py-3 bg-yellow-300 text-black rounded-md font-semibold hover:bg-yellow-400 transition">Send Message</button>
                </form>

                <div>
                    <h3 className="text-xl font-semibold mb-6">Contact Info</h3>
                    <div className="space-y-6">
                        <div>
                            <p className="text-white/70 text-sm">Email</p>
                            <p className="text-lg font-semibold">hello@gorermart.com</p>
                        </div>
                        <div>
                            <p className="text-white/70 text-sm">Instagram</p>
                            <p className="text-lg font-semibold">@gorermart</p>
                        </div>
                        <div className="glass p-6 rounded-lg mt-8">
                            <p className="text-white/70">We typically respond within 24 hours. For wholesale inquiries, please mention it in your subject line.</p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}

export default Contact