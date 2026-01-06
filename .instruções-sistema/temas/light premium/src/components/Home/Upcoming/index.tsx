import React from "react";
import BoxSlider from "../../SharedComponent/BoxSlider";
import Image from "next/image";
import Link from "next/link";
import { conferences } from "../../../app/api/data";

const Upcoming = () => {
  return (
    <>
      <section className="upcoming dark:bg-darkmode">
        <div className="max-w-1068 m-auto">
          <div className="container">
            <h2 data-aos="fade-up" data-aos-delay="200" data-aos-duration="1000" className="text-center pb-10">Upcoming Conference</h2>
            <div>
              <div data-aos="fade-up" data-aos-delay="300" data-aos-duration="1000">
                <BoxSlider />
              </div>
              <div>
                <div className="flex items-center flex-wrap w-full border border-solid  dark:border-dark_border md:px-14 px-6 md:mt-14 mt-6 rounded-22">
                  {conferences.slice(0, 2).map((conference, index) => (
                    <div
                      key={index}
                      data-aos="fade-up" data-aos-delay={`${index*300}`} data-aos-duration="1000"
                      className="flex items-center lg:gap-0 gap-4 flex-wrap justify-between w-full md:py-12 py-5 border-b border-solid  dark:border-dark_border last:border-b-0"
                    >
                      <div>
                        <h6 className="text-[26px] leading-[2.1rem] font-bold text-secondary dark:text-white max-w-286">
                          {conference.title}
                        </h6>
                      </div>
                      <div className="flex items-center flex-wrap gap-30">
                        <div className="flex items-center">
                          {conference.profiles.map((profile, profileIndex) => (
                            <Image
                              key={profileIndex}
                              src={profile}
                              alt="profile"
                              width={0}
                              height={0}
                              quality={100}
                              layout="responsive"
                              sizes="100vh"
                              className={`!w-16 !h-16 rounded-full ${
                                profileIndex !== conference.profiles.length - 1
                                  ? "-mr-3"
                                  : ""
                              }`}
                            />
                          ))}
                        </div>
                        <div>
                          <p className="text-lg font-normal text-SlateBlueText dark:text-opacity-80">
                            Speech by
                          </p>
                          <p className="text-lg font-medium text-secondary dark:text-white">
                            {conference.speakers}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Link
                          href={conference.buttonLink}
                          className="btn_outline btn-2 btn_outline hover-outline-slide-down"
                        >
                          <span>{conference.buttonText}</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Upcoming;
