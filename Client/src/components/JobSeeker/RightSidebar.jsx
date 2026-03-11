import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../../assets/assets'

const RightSidebar = () => (
    <aside className="flex flex-row md:flex-col gap-5 h-fit lg:sticky lg:top-28">
        {/* Interviews */}
        <div className="sidebar-card-hover group rounded-3xl bg-white px-6 py-6 md:py-14 flex-1 md:flex-none flex flex-col items-center text-center shadow-md">
            <img src={assets.interviewIcon} alt="Interviews"
                className="w-10 h-10 md:w-16 md:h-16 object-contain mb-4 group-hover:scale-110 transition-transform duration-300" />
            <p className="text-base text-dark-blue font-bold leading-relaxed">
                You have{' '}
                <span className="inline-flex items-center justify-center bg-dark-blue text-white text-xs w-5 h-5 rounded font-bold align-middle">
                    2
                </span>
                <br />
                upcoming Interviews
            </p>
            <Link
                to="/interviews"
                className="text-sm text-dark-gray3 mt-3 hover:text-orange hover:translate-x-1 transition-all duration-200 inline-block"
            >
                Go check your interviews →
            </Link>
        </div>

        {/* Applications */}
        <div className="sidebar-card-hover group rounded-3xl bg-white px-6 py-6 md:py-14 flex-1 md:flex-none flex flex-col items-center text-center shadow-md">
            <img src={assets.applicationPedingIcon} alt="Applications"
                className="w-10 h-10 md:w-16 md:h-16 object-contain mb-4 group-hover:scale-110 transition-transform duration-300" />
            <p className="text-base text-dark-gray4 font-bold leading-relaxed">
                You have{' '}
                <span className="inline-flex items-center justify-center bg-dark-blue text-white text-xs w-5 h-5 rounded font-bold align-middle">
                    3
                </span>
                <br />
                Applications pending
            </p>
            <Link
                to="/applications"
                className="text-sm text-dark-gray3 mt-3 hover:text-orange hover:translate-x-1 transition-all duration-200 inline-block"
            >
                Go check your Applications →
            </Link>
        </div>
    </aside>
)

export default RightSidebar
