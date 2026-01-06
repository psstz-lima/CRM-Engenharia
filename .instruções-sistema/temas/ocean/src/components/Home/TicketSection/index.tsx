import React from "react";
import Link from "next/link";
import Image from "next/image";

const TicketSection = () => {
    return (
        <>
            <section className="dark:bg-darkmode pt-0">
                <div className="container">
                    <div className="bg-primary relative md:mx-auto mx-0 overflow-hidden py-0 rounded-22 lg:-mb-48 dark:lg:-mb-48 md:mt-20 mt-10">
                        <div className="flex flex-wrap items-center justify-between md:p-20 p-5">
                            <div className="md:w-2/2 w-full absolute top-0 -left-1 md:block hidden">
                                <Image
                                    src="/images/ticket-section/ticket.png"
                                    alt="hero"
                                    width={0}
                                    height={0}
                                    quality={100}
                                    layout="responsive"
                                    sizes="100vh"
                                    className="object-cover"
                                />
                            </div>
                            <div className="md:w-2/5 w-full ml-auto lg:text-start text-center">
                                <p className="sm:text-4xl text-[28px] leading-[2.25rem] font-bold text-white lg:max-w-364 max-w-full pb-9">
                                    Become a Part of the Digital Evolution!
                                </p>
                                <Link
                                    href="/"
                                    className="btn btn-1 hover-filled-slide-down rounded-lg overflow-hidden before:bg-ElectricAqua"
                                >
                                    <span className="sm:!px-20 px-10 !border-ElectricAqua !text-white">
                                        Book ticket
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default TicketSection;
