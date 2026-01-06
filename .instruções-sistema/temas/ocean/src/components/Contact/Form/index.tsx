import React from "react";
import Link from "next/link";
import Image from "next/image";

const ContactForm = () => {

    return (
        <>
            <section className="dark:bg-darkmode lg:pb-24 pb-16 pt-0">
                <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md">
                    <div className="grid md:grid-cols-12 grid-cols-1 gap-8">
                        <div className="col-span-6">
                            <h2 className="max-w-72 text-[40px] leading-[3.4rem] font-bold mb-9 text-secondary">Get Online Consultation</h2>
                            <form className="flex flex-wrap w-full m-auto justify-between">
                                <div className="sm:flex gap-3 w-full">
                                    <div className="mx-0 my-2.5 flex-1">
                                        <label htmlFor="first-name" className="pb-3 inline-block text-base text-SlateBlueText">First Name*</label>
                                        <input
                                            id="first-name"
                                            className="w-full text-base px-4 rounded-lg py-2.5 border-border dark:border-dark_border border-solid dark:text-white  dark:bg-darkmode border transition-all duration-500 focus:border-primary dark:focus:border-primary focus:border-solid focus:outline-0"
                                            type="text"
                                        />
                                    </div>
                                    <div className="mx-0 my-2.5 flex-1">
                                        <label htmlFor="last-name" className="pb-3 inline-block text-base text-SlateBlueText">Last Name*</label>
                                        <input
                                            id="last-name"
                                            className="w-full text-base px-4 py-2.5 rounded-lg border-border dark:border-dark_border border-solid dark:text-white  dark:bg-darkmode border transition-all duration-500 focus:border-primary dark:focus:border-primary focus:border-solid focus:outline-0"
                                            type="text"
                                        />
                                    </div>
                                </div>
                                <div className="sm:flex gap-3 w-full">
                                    <div className="mx-0 my-2.5 flex-1">
                                        <label htmlFor="email" className="pb-3 inline-block text-base text-SlateBlueText">Email address*</label>
                                        <input
                                            id="email"
                                            type="email"
                                            className="w-full text-base px-4 py-2.5 rounded-lg border-border dark:border-dark_border border-solid dark:text-white  dark:bg-darkmode border transition-all duration-500 focus:border-primary dark:focus:border-primary focus:border-solid focus:outline-0"
                                        />
                                    </div>
                                    <div className="mx-0 my-2.5 flex-1">
                                        <label htmlFor="Specialist" className="pb-3 inline-block text-base text-SlateBlueText">Specialist*</label>
                                        <select id="Specialist" className="w-full text-base px-4 py-2.5 text-SlateBlueText rounded-lg border-border dark:text-white border-solid dark:bg-darkmode border transition-all duration-500 focus:border-primary dark:focus:border-primary dark:border-dark_border focus:border-solid focus:outline-0">
                                            <option value="">Choose a specialist</option>
                                            <option value="Baking &amp; Pastry">
                                                Choose a specialist
                                            </option>
                                            <option value="Exotic Cuisine">Exotic Cuisine</option>
                                            <option value="French Desserts">French Desserts</option>
                                            <option value="Seafood &amp; Wine">
                                                Choose a specialist
                                            </option>
                                        </select>
                                    </div>
                                </div>
                                <div className="sm:flex gap-3 w-full">
                                    <div className="mx-0 my-2.5 flex-1">
                                        <label htmlFor="date" className="pb-3 inline-block text-base text-SlateBlueText">Date*</label>
                                        <input
                                            id="date"
                                            className="w-full text-base text-SlateBlueText px-4 rounded-lg py-2.5 outline-none dark:text-white dark:bg-darkmode border-border border-solid border transition-all duration-500 focus:border-primary dark:focus:border-primary dark:border-dark_border focus:border-solid focus:outline-0"
                                            type="date"
                                        />
                                    </div>
                                    <div className="mx-0 my-2.5 flex-1">
                                        <label htmlFor="time" className="pb-3 inline-block text-base text-SlateBlueText">Time*</label>
                                        <input
                                            id="time"
                                            className="w-full text-base px-4 rounded-lg py-2.5 border-border outline-none dark:text-white dark:bg-darkmode border-solid border transition-all duration-500 focus:border-primary dark:focus:border-primary dark:border-dark_border focus:border-solid focus:outline-0"
                                            type="time"
                                        />
                                    </div>
                                </div>
                                <div className="mx-0 my-2.5 w-full">
                                    <Link href="#" className="mt-4 btn btn-1 hover-filled-slide-down overflow-hidden rounded-lg" type="submit">
                                        <span>Make an appointment</span>
                                    </Link>
                                </div>
                            </form>
                        </div>
                        <div className="col-span-6">
                            <Image
                                src="/images/contact-page/contact.jpg"
                                alt="Contact"
                                width={1300}
                                height={0}
                                quality={100}
                                style={{ width: '100%', height: 'auto' }}
                                className="bg-no-repeat bg-contain rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default ContactForm;
