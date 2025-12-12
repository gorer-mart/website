import React from 'react';
import { assets } from '../assets/assets.js';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faUser, faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

const NavItem = ({ to, children }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `flex flex-col items-center gap-1 px-2 py-1 text-sm ${isActive ? 'text-yellow-300' : 'text-white/90'}`}
    >
        <p className="tracking-widest">{children}</p>
        <hr className="w-full border-none h-[1.5px] bg-yellow-300 mt-1 opacity-0" />
    </NavLink>
)

const Navbar = () => {
    const { itemCount } = useContext(CartContext)

    return (
        <header className="w-full sticky top-0 z-50 glass">
            <div className="container-max px-6 py-4 flex items-center justify-between">
                <Link to="/">
                    <img src={assets.logo_white} alt="Logo" className="w-36 h-auto object-contain" />
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    <NavItem to="/">HOME</NavItem>
                    <NavItem to="/shop">SHOP</NavItem>
                    <NavItem to="/about">ABOUT</NavItem>
                    <NavItem to="/contact">CONTACT</NavItem>
                </nav>

                <div className="hidden sm:flex items-center gap-4">
                    <div className='flex items-center gap-3 bg-white/5 px-3 py-2 rounded-md'>
                        <input type="text" placeholder="Search" className='bg-transparent placeholder:muted text-sm text-white focus:outline-none' />
                        <FontAwesomeIcon icon={faMagnifyingGlass} className='text-white/80' />
                    </div>
                    <Link to="/login" className="text-white/90 hover:text-yellow-300 transition">
                        <FontAwesomeIcon icon={faUser} className='w-5' />
                    </Link>
                    <Link to="/cart" className="text-white/90 hover:text-yellow-300 transition relative">
                        <FontAwesomeIcon icon={faCartShopping} className='w-5' />
                        {itemCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-yellow-300 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                {itemCount}
                            </span>
                        )}
                    </Link>
                </div>

                <div className="md:hidden text-white/90">
                    <button aria-label="open menu" className="p-2">
                        <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="2" rx="1" fill="currentColor" /><rect y="6" width="20" height="2" rx="1" fill="currentColor" /><rect y="12" width="20" height="2" rx="1" fill="currentColor" /></svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
