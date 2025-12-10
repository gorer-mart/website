import React from 'react'

const Footer = () => {
    return (
        <footer className="mt-20 border-t border-white/6 pt-10 pb-12">
            <div className="container-max px-6 mx-auto flex flex-col md:flex-row justify-between gap-8">
                <div className="max-w-sm">
                    <h3 className="text-2xl font-semibold">Gorer Mart</h3>
                    <p className="mt-3 text-sm text-white/70">Small brand, big vibes — Kolkata inspired tees with nostalgia and attitude.</p>
                    <p className="mt-4 text-xs text-white/60">© {new Date().getFullYear()} Gorer Mart. All rights reserved.</p>
                </div>

                <div className="flex gap-12">
                    <div>
                        <h4 className="font-medium">Shop</h4>
                        <ul className="mt-3 text-sm text-white/70">
                            <li className="mt-2">T-Shirts</li>
                            <li className="mt-2">Collections</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-medium">Connect</h4>
                        <ul className="mt-3 text-sm text-white/70">
                            <li className="mt-2">hello@gorermart.com</li>
                            <li className="mt-2">Instagram</li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-xs">
                    <h4 className="font-medium">Join the drop</h4>
                    <p className="text-sm text-white/70 mt-2">Get occasional updates and restock alerts.</p>
                    <div className="mt-4 flex gap-2">
                        <input placeholder="Email" className="flex-1 bg-white/5 px-3 py-2 rounded-md text-white placeholder-white/60 focus:outline-none" />
                        <button className="px-4 py-2 rounded-md bg-yellow-300 text-black font-semibold">Join</button>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer