"use client";
import React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";

const Highlight = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (e: { preventDefault: () => void }) => {
        e.preventDefault();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    var settings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        arrows: false,
        slidesToScroll: 1,
        // centerMode: true,
        responsive: [
            {
                breakpoint: 768, // Tablet
                settings: {
                    slidesToShow: 1,
                    centerMode: false, // Disable centerMode on smaller screens
                },
            },
            {
                breakpoint: 480, // Mobile
                settings: {
                    slidesToShow: 1,
                    centerMode: false,
                },
            },
        ],
    };
    return (
        <>
            <section className="bg-IcyBreeze dark:bg-darklight">
                <div className="container">
                    <div className="grid md:grid-cols-12 grid-cols-1 items-center max-w-[125rem] mx-auto">
                        <div
                            className="col-span-5 py-0 px-7"
                            data-aos="fade-right"
                            data-aos-delay="200"
                            data-aos-duration="1000"
                        >
                            <h2>Previous Year Highlights</h2>
                            <p className="text-lg font-normal text-SlateBlueText dark:text-opacity-80 max-w-404 pt-7 pb-11">
                                Many variations of passages of Lorem Ipsum available but the
                                majority have suffered alteration in some form injected humour,
                                or randomised words
                            </p>
                            <div className="flex items-center flex-wrap gap-30">
                                <div className="text-start sm:pb-0 pb-5">
                                    <h2 className="text-primary">10k+</h2>
                                    <p className="text-lg font-medium text-secondary dark:text-darktext">
                                        Ticket confirmed
                                    </p>
                                </div>
                                <div className="text-start sm:pb-0 pb-5">
                                    <h2 className="text-primary">16</h2>
                                    <p className="text-lg font-medium text-secondary dark:text-darktext">
                                        Partners
                                    </p>
                                </div>
                                <div className="text-start sm:pb-0 pb-5">
                                    <h2 className="text-primary">150k+</h2>
                                    <p className="text-lg font-medium text-secondary dark:text-darktext">
                                        Participants
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div
                            className="col-span-7 year_slider px-7"
                            data-aos="fade-left"
                            data-aos-delay="200"
                            data-aos-duration="1000"
                        >
                            <Slider {...settings}>
                                <div className="mt-14 relative">
                                    <Image
                                        src="/images/highlight/slide-1.png"
                                        alt="Product"
                                        width={0}
                                        height={0}
                                        layout="responsive"
                                        quality={100}
                                        sizes="100vh"
                                        className="rounded-22"
                                    ></Image>
                                    <Link
                                        href="/"
                                        className="bg-white group sm:w-12 w-10 sm:h-12 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2/4 rounded-full shadow-[0_0px_30px_rgba(24,23,23,0.1)] flex items-center justify-center dark:text-black"
                                        onClick={openModal}
                                    >
                                        <svg
                                            fill="currentcolor"
                                            version="1.1"
                                            id="Capa_1"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlnsXlink="http://www.w3.org/1999/xlink"
                                            width="800px"
                                            height="800px"
                                            viewBox="0 0 163.861 163.861"
                                            xmlSpace="preserve"
                                            className="bg-no-repeat w-4 h-4 inline-block bg-cover group-hover:text-primary"
                                        >
                                            <g>
                                                <path d="M34.857,3.613C20.084-4.861,8.107,2.081,8.107,19.106v125.637c0,17.042,11.977,23.975,26.75,15.509L144.67,97.275 c14.778-8.477,14.778-22.211,0-30.686L34.857,3.613z" />
                                            </g>
                                        </svg>
                                    </Link>
                                </div>
                                <div className="mt-14 relative">
                                    <Image
                                        src="/images/highlight/slide-1.png"
                                        alt="Product"
                                        width={0}
                                        height={0}
                                        layout="responsive"
                                        quality={100}
                                        sizes="100vh"
                                        className="rounded-22"
                                    ></Image>
                                    <Link
                                        href="/"
                                        className="bg-white group sm:w-12 w-10 sm:h-12 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2/4 rounded-full shadow-[0_0px_30px_rgba(24,23,23,0.1)] flex items-center justify-center dark:text-black"
                                        onClick={openModal}
                                    >
                                        <svg
                                            fill="currentcolor"
                                            version="1.1"
                                            id="Capa_1"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlnsXlink="http://www.w3.org/1999/xlink"
                                            width="800px"
                                            height="800px"
                                            viewBox="0 0 163.861 163.861"
                                            xmlSpace="preserve"
                                            className="bg-no-repeat w-4 h-4 inline-block bg-cover group-hover:text-primary"
                                        >
                                            <g>
                                                <path d="M34.857,3.613C20.084-4.861,8.107,2.081,8.107,19.106v125.637c0,17.042,11.977,23.975,26.75,15.509L144.67,97.275 c14.778-8.477,14.778-22.211,0-30.686L34.857,3.613z" />
                                            </g>
                                        </svg>
                                    </Link>
                                </div>
                                <div className="mt-14 relative">
                                    <Image
                                        src="/images/highlight/slide-1.png"
                                        alt="Product"
                                        width={0}
                                        height={0}
                                        layout="responsive"
                                        quality={100}
                                        sizes="100vh"
                                        className="rounded-22"
                                    ></Image>
                                    <Link
                                        href="/"
                                        className="bg-white group sm:w-12 w-10 sm:h-12 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2/4 rounded-full shadow-[0_0px_30px_rgba(24,23,23,0.1)] flex items-center justify-center dark:text-black"
                                        onClick={openModal}
                                    >
                                        <svg
                                            fill="currentcolor"
                                            version="1.1"
                                            id="Capa_1"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlnsXlink="http://www.w3.org/1999/xlink"
                                            width="800px"
                                            height="800px"
                                            viewBox="0 0 163.861 163.861"
                                            xmlSpace="preserve"
                                            className="bg-no-repeat w-4 h-4 inline-block bg-cover group-hover:text-primary"
                                        >
                                            <g>
                                                <path d="M34.857,3.613C20.084-4.861,8.107,2.081,8.107,19.106v125.637c0,17.042,11.977,23.975,26.75,15.509L144.67,97.275 c14.778-8.477,14.778-22.211,0-30.686L34.857,3.613z" />
                                            </g>
                                        </svg>
                                    </Link>
                                </div>
                            </Slider>
                        </div>
                    </div>
                </div>
                {isModalOpen && (
                    // Render your YouTube popup modal here
                    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-darkmode rounded-lg sm:m-0 m-4">
                            <div className="overlay flex items-center justify-between border-b border-solid border-border dark:border-dark_border p-5 z-50 dark:border-darkborder">
                                <h3 className="text-secondary dark:text-white">Video</h3>
                                <button
                                    onClick={closeModal}
                                    className="bg-[url('/images/highlight/closed.svg')] bg-no-repeat bg-contain w-5 h-5 inline-block dark:invert"
                                ></button>
                            </div>
                            <iframe
                                height="400"
                                className="p-4 md:w-[50rem] w-full"
                                src="https://www.youtube.com/embed/zzBxZeOTuDw?si=y_4N9SeeNXiSofCG"
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                )}
            </section>
        </>
    );
};

export default Highlight;
