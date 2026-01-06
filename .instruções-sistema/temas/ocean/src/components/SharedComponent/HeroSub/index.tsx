import React, { FC } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import {BreadcrumbLink} from "@/types/breadcrumb"

interface HeroSubProps {
    title: string;
    description: string;
    breadcrumbLinks: BreadcrumbLink[];
}

const HeroSub: FC<HeroSubProps> = ({ title, description, breadcrumbLinks }) => {

    return (
        <>
            <section className="text-start pt-32 dark:bg-darkmode pb-0">
                <div className="container">
                    <div className="flex flex-wrap items-center justify-between">
                        <div data-aos="fade-right" data-aos-delay="200" data-aos-duration="1000">
                            <h2 className="dark:text-white md:text-[40px] leading-[3.4rem] text-4xl font-bold text-secondary">{title}</h2>
                            <p className="text-lg text-SlateBlueText dark:text-opacity-80 font-normal max-w-506 w-full mt-3 px-0">
                                {description}
                            </p>
                        </div>
                        <div data-aos="fade-left" data-aos-delay="200" data-aos-duration="1000">
                        <Breadcrumb links={breadcrumbLinks} />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default HeroSub;