import React from 'react'
import Hero from '../components/Hero.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO'
import { Link } from 'react-router-dom'
import { products } from '../data/products'
import ProductCard from '../components/ProductCard'

const Home = () => {
    return (
        <main>
            <SEO
                title=""
                description="Kolkata-inspired t-shirts with nostalgia and aesthetics. Shop modern streetwear designs online."
                url="/"
                keywords="t-shirt, kolkata, tees, streetwear, fashion"
            />
            <Hero />

            {/* Featured Products */}
            <section className="container-max mx-auto px-6 py-20">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-semibold">Featured Collection</h2>
                    <p className="text-white/70 mt-3">Handpicked designs from our latest drop</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.slice(0, 4).map(p => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
                <div className="text-center mt-12">
                    <Link to="/shop" className="inline-block px-8 py-3 border border-white/20 text-white rounded-md hover:bg-white/5 transition">
                        View All
                    </Link>
                </div>
            </section>

            {/* Why Gorer Mart */}
            <section className="bg-gradient-to-r from-white/5 to-transparent py-20 border-y border-white/10">
                <div className="container-max mx-auto px-6">
                    <h2 className="text-3xl font-semibold text-center mb-12">Why Choose Gorer Mart?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="glass p-6 rounded-lg">
                            <div className="text-4xl mb-4">🎨</div>
                            <h3 className="text-xl font-semibold">Unique Designs</h3>
                            <p className="text-white/70 mt-3">Kolkata-inspired, nostalgic artwork you won't find anywhere else.</p>
                        </div>
                        <div className="glass p-6 rounded-lg">
                            <div className="text-4xl mb-4">✨</div>
                            <h3 className="text-xl font-semibold">Premium Quality</h3>
                            <p className="text-white/70 mt-3">Soft cotton blend, local printing, built to last.</p>
                        </div>
                        <div className="glass p-6 rounded-lg">
                            <div className="text-4xl mb-4">🚀</div>
                            <h3 className="text-xl font-semibold">Small Drops</h3>
                            <p className="text-white/70 mt-3">Limited quantity releases. Exclusive and collectible.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="container-max mx-auto px-6 py-20">
                <h2 className="text-3xl font-semibold text-center mb-12">What Our Customers Say</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { name: 'Arjun K.', text: 'Love the vibe! Exactly what Kolkata needed.' },
                        { name: 'Priya S.', text: 'Quality is amazing. Wearing it everywhere!' },
                        { name: 'Rohan M.', text: 'Best streetwear brand in Bengal right now.' },
                    ].map((testimonial, i) => (
                        <div key={i} className="glass p-6 rounded-lg">
                            <p className="text-white/80 italic">"{testimonial.text}"</p>
                            <p className="text-yellow-300 font-semibold mt-4">— {testimonial.name}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="bg-gradient-to-r from-yellow-300/10 via-transparent to-blue-500/10 py-20 border-y border-white/10">
                <div className="container-max mx-auto px-6 text-center">
                    <h2 className="text-3xl font-semibold mb-6">Ready to Flex?</h2>
                    <p className="text-white/70 mb-8">Get your Gorer Mart tee today and join the movement.</p>
                    <Link to="/shop" className="inline-block px-8 py-3 bg-yellow-300 text-black font-semibold rounded-md hover:bg-yellow-400 transition">
                        Shop Now
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    )
}

export default Home