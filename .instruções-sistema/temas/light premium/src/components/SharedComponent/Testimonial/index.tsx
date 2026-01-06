import React from 'react'
import Image from 'next/image'

const Testimonial = () => {
    return (
        <section className="scroll-mt-24 bg-section dark:bg-darklight py-24" id='testimonials'>
            <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md">
                <div>
                    <Image
                        src="/images/testimonial/vector-smart.png"
                        alt="logo"
                        width={150}
                        height={0}
                        quality={100}
                        className="w_f !w-94 !h-52 m-auto"
                    />
                    <div className='pt-16 pb-28'>
                        <p className="font-medium md:text-21 text-lg text-SlateBlueText dark:text-white text-center max-w-3xl mx-auto">
                            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
                            nisi ut aliquip exea commodo consequat.
                        </p>
                    </div>
                    <div className="text-center">
                        <strong className='text-lg font-bold text-SlateBlueText dark:text-primary'>Jonathan Diesel</strong>
                        <p className='text-base text-gray dark:text-white dark:text-opacity-50 '>Happy Customer, Apple inc</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Testimonial