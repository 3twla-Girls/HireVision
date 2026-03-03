import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../../assets/assests'

const RightSidebar = () => (
    <aside className="flex flex-col gap-5 h-fit">
        {/* Interviews */}
        <div className="rounded-2xl bg-white px-6 py-14 flex flex-col items-center text-center">
            <img src={assets.interviewIcon} alt="Interviews" className="w-16 h-16 object-contain mb-4" />
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
                className="text-sm text-dark-gray3 mt-3 hover:text-orange transition-colors"
            >
                Go check your interviews →
            </Link>
        </div>

        {/* Applications */}
        <div className="rounded-2xl bg-white px-6 py-14 flex flex-col items-center text-center">
            <img src={assets.applicationPedingIcon} alt="Applications" className="w-16 h-16 object-contain mb-4" />
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
                className="text-sm text-dark-gray3 mt-3 hover:text-orange transition-colors"
            >
                Go check your Applications →
            </Link>
        </div>
    </aside>
)

export default RightSidebar
