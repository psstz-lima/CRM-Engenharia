import React from "react";
import Link from "next/link";

const ContactInfo = () => {
    return (
        <>
            <section className="dark:bg-darkmode lg:pt-20 pt-16 lg:pb-24 pb-10">
                <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md">
                    <div className="flex md:flex-row flex-col lg:items-center items-start justify-center md:gap-28 gap-8">
                        <div className="flex sm:flex-row flex-col items-start sm:gap-8 gap-4">
                            <div className="bg-primary/20 w-14 h-14 flex items-center justify-center rounded-full">
                                <i className="bg-[url('/images/contact-page/email.svg')] bg-no-repeat bg-contain w-9 h-9 inline-block"></i>
                            </div>
                            <div className="flex md:flex-col sm:flex-row flex-col md:items-start sm:items-center items-start h-full justify-between">
                                <div>
                                    <span className="text-secondary dark:text-white text-xl font-bold">
                                        Email US
                                    </span>
                                    <p className="text-SlateBlueText font-normal text-xl max-w-80 pt-3 pb-7 dark:text-opacity-80">
                                        Please feel free to drop us a line. We will respond as soon as
                                        possible.
                                    </p>
                                </div>
                                <div>
                                    <Link href="#" className="text-primary text-lg font-medium flex items-center gap-3 group hover:text-secondary dark:hover:text-white">
                                        Leave a message
                                        <svg
                                            width="23"
                                            height="17"
                                            viewBox="0 0 23 17"
                                            fill="#2F73F2"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="group-hover:fill-secondary group-hover:dark:fill-white"
                                        >
                                            <path
                                                d="M22.653 7.76352L15.3613 0.471852C15.1648 0.282104 14.9017 0.177109 14.6286 0.179483C14.3555 0.181856 14.0942 0.291407 13.9011 0.484541C13.7079 0.677674 13.5984 0.938937 13.596 1.21206C13.5936 1.48518 13.6986 1.74831 13.8884 1.94477L19.4019 7.45831H1.08317C0.806904 7.45831 0.541951 7.56806 0.346601 7.76341C0.151251 7.95876 0.0415039 8.22371 0.0415039 8.49998C0.0415039 8.77625 0.151251 9.0412 0.346601 9.23655C0.541951 9.4319 0.806904 9.54165 1.08317 9.54165H19.4019L13.8884 15.0552C13.7889 15.1513 13.7095 15.2662 13.6549 15.3933C13.6003 15.5204 13.5716 15.6571 13.5704 15.7954C13.5692 15.9337 13.5956 16.0709 13.6479 16.1989C13.7003 16.3269 13.7777 16.4432 13.8755 16.541C13.9733 16.6388 14.0896 16.7162 14.2176 16.7685C14.3456 16.8209 14.4828 16.8473 14.6211 16.8461C14.7594 16.8449 14.8961 16.8161 15.0232 16.7615C15.1503 16.707 15.2652 16.6276 15.3613 16.5281L22.653 9.23644C22.8482 9.0411 22.958 8.77619 22.958 8.49998C22.958 8.22377 22.8482 7.95886 22.653 7.76352Z"
                                            />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="flex sm:flex-row flex-col items-start sm:gap-8 gap-4">
                            <div className="bg-primary/20 w-14 h-14 flex items-center justify-center rounded-full">
                                <i className="bg-[url('/images/contact-page/Career.svg')] bg-no-repeat bg-contain w-9 h-9 inline-block"></i>
                            </div>
                            <div className="flex md:flex-col sm:flex-row flex-col md:items-start sm:items-center items-start h-full justify-between">
                                <div>
                                    <span className="text-secondary dark:text-white text-xl font-bold">
                                        Careers
                                    </span>
                                    <p className="text-SlateBlueText font-normal text-xl max-w-80 pt-3 pb-7 dark:text-opacity-80">
                                        Sit ac ipsum leo lorem magna nunc mattis maecenas non
                                        vestibulum
                                    </p>
                                </div>
                                <div>
                                    <Link href="#" className="text-primary text-lg font-medium flex items-center gap-3 group hover:text-secondary dark:hover:text-white">
                                        Send an application
                                        <svg
                                            width="23"
                                            height="17"
                                            viewBox="0 0 23 17"
                                            fill="#2F73F2"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="group-hover:fill-secondary group-hover:dark:fill-white"
                                        >
                                            <path
                                                d="M22.653 7.76352L15.3613 0.471852C15.1648 0.282104 14.9017 0.177109 14.6286 0.179483C14.3555 0.181856 14.0942 0.291407 13.9011 0.484541C13.7079 0.677674 13.5984 0.938937 13.596 1.21206C13.5936 1.48518 13.6986 1.74831 13.8884 1.94477L19.4019 7.45831H1.08317C0.806904 7.45831 0.541951 7.56806 0.346601 7.76341C0.151251 7.95876 0.0415039 8.22371 0.0415039 8.49998C0.0415039 8.77625 0.151251 9.0412 0.346601 9.23655C0.541951 9.4319 0.806904 9.54165 1.08317 9.54165H19.4019L13.8884 15.0552C13.7889 15.1513 13.7095 15.2662 13.6549 15.3933C13.6003 15.5204 13.5716 15.6571 13.5704 15.7954C13.5692 15.9337 13.5956 16.0709 13.6479 16.1989C13.7003 16.3269 13.7777 16.4432 13.8755 16.541C13.9733 16.6388 14.0896 16.7162 14.2176 16.7685C14.3456 16.8209 14.4828 16.8473 14.6211 16.8461C14.7594 16.8449 14.8961 16.8161 15.0232 16.7615C15.1503 16.707 15.2652 16.6276 15.3613 16.5281L22.653 9.23644C22.8482 9.0411 22.958 8.77619 22.958 8.49998C22.958 8.22377 22.8482 7.95886 22.653 7.76352Z"
                                            />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="md:pt-28 pt-11 md:pb-28 pb-16">
                        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d938779.7831767448!2d71.05098621661072!3d23.20271516446136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e82dd003ff749%3A0x359e803f537cea25!2sGANESH%20GLORY%2C%20Gota%2C%20Ahmedabad%2C%20Gujarat%20382481!5e0!3m2!1sen!2sin!4v1715676641521!5m2!1sen!2sin" width="1114" height="477" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="rounded-lg w-full"></iframe>
                    </div>
                </div>
                <div className="border-b border-solid  dark:border-dark_border"></div>
            </section>
        </>
    );
};

export default ContactInfo;
