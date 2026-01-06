import React from "react";
import Link from "next/link";
import Image from "next/image";

const EventTicket = () => {
    return (
        <>
            <section className="dark:bg-darkmode pt-0">
                <div className="container">
                    <div className="text-center md:pb-20 pb-8">
                        <h2 className="pb-8" data-aos="fade-up" data-aos-delay="200" data-aos-duration="1000">The Biggest Digital Event in 2024</h2>
                        <p data-aos="fade-up" data-aos-delay="300" data-aos-duration="1000" className="text-SlateBlueText dark:text-opacity-80 text-lg font-normal max-w-920 m-auto">
                            Sometimes by accident, sometimes chunks as necessary making this
                            the first true generator on the Internet. recently with desktop
                            publishing software like Aldus PageMaker including versions of
                            Lorem Ipsum was popularised in the 1960s with the release of
                            Letraset sheets containing Lorem Ipsum passages.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-stretch" data-aos="fade-up" data-aos-delay="400" data-aos-duration="1000">
                        <div className="bg-primary flex items-center justify-center lg:px-16 px-8 lg:py-0 py-8 lg:rounded-l-22 rounded-t-22 md:rounded-tr-none md:rounded-bl-22 rounded-bl-none md:w-2/4 w-full">
                            <Image
                                src="/images/event-ticket/ticket.png"
                                alt="ticket"
                                width={0}
                                height={0}
                                quality={100}
                                layout="responsive"
                                sizes="100vh"
                            />
                        </div>
                        <div className="bg-ElectricAqua lg:py-14 py-6 lg:px-16 px-8 lg:rounded-r-22 rounded-b-22 md:rounded-bl-none md:rounded-tr-22 rounded-tr-none md:md:w-2/4 w-full">
                            <div className="bg-white dark:bg-darklight rounded-22 lg:px-11 px-4 pt-8 pb-10">
                                <h6 className="text-[26px] leading-[2.1rem] font-bold text-secondary dark:text-white pb-5">
                                    Ticket Prices
                                </h6>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center md:gap-30 gap-2">
                                        <span className="text-[22px] leading-[2rem] font-bold text-secondary dark:text-white">
                                            $100
                                        </span>
                                        <p className="text-xl font-normal text-secondary dark:text-darktext">
                                            Early birds
                                        </p>
                                        <p className="text-sm font-normal text-SlateBlueText">
                                            Until May 20, 2022
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center md:gap-30 gap-2">
                                        <span className="text-[22px] leading-[2rem] font-bold text-secondary dark:text-white">
                                            $150
                                        </span>
                                        <p className="text-xl font-normal text-secondary dark:text-darktext">
                                            Late birds
                                        </p>
                                        <p className="text-sm font-normal text-SlateBlueText">
                                            After May 20, 2022
                                        </p>
                                    </div>
                                    <Link
                                        href="/"
                                        className="btn btn-1 hover-filled-slide-down w-full text-center rounded-lg overflow-hidden"
                                    >
                                        <span>Book ticket</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default EventTicket;
