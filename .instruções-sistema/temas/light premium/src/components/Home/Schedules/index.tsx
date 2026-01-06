import React from "react";
import Image from "next/image";
import Link from "next/link";
import { conferences, intermissions } from "../../../app/api/data";

const Schedules = () => {
  return (
    <>
      <div className="flex items-center flex-wrap  w-full border border-solid border-border dark:border-dark_border md:px-14 px-6 md:mt-14 mt-6 rounded-22">
        {conferences.map((conference, index) => (
          <React.Fragment key={index}  >
            <div data-aos="fade-up" data-aos-delay={`${index*200}`} data-aos-duration="1000"  className="flex items-center flex-wrap gap-6 justify-between w-full md:py-12 py-5 border-b border-solid border-border dark:border-dark_border last:border-b-0">
              <div className="lg:min-w-96 min-w-max" >
                <h6 className="text-[26px] leading-[2.1rem] font-bold text-secondary dark:text-white max-w-286">
                  {conference.title}
                </h6>
              </div>
              <div className="flex items-center flex-wrap gap-30 lg:min-w-96 min-w-max">
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
              <div className="lg:min-w-40 min-w-max" >
                <Link
                  href={conference.buttonLink}
                  className="btn_outline btn-2 btn_outline hover-outline-slide-down"
                >
                  <span>{conference.buttonText}</span>
                </Link>
              </div>
            </div>

            {/* Insert intermissions at appropriate places */}
            {index === 1 && (
              <div data-aos="fade-up" data-aos-delay={`${index*200}`} data-aos-duration="1000" className="flex items-center flex-wrap justify-between w-full md:py-12 py-5 border-b border-solid border-border dark:border-dark_border">
                <div className="lg:min-w-96 min-w-max">
                  <h6 className="text-[26px] leading-[2.1rem] font-bold text-secondary dark:text-white max-w-286">
                    {intermissions[0].title}
                  </h6>
                </div>
                <div className="flex items-center flex-wrap gap-30 lg:min-w-96 min-w-max">
                  <div className="flex items-center">
                    <Image
                      src={intermissions[0].image}
                      alt="coffee break"
                      width={0}
                      height={0}
                      quality={100}
                      layout="responsive"
                      sizes="100vh"
                      className="!w-10 !h-10 rounded-full"
                    />
                  </div>
                  <div>                    
                    <p className="text-lg font-normal text-SlateBlueText dark:text-opacity-80">
                      {intermissions[0].time}
                    </p>
                  </div>
                </div>
                <div className="lg:min-w-40 min-w-max"></div> {/* No button for intermission row */}
              </div>
            )}

            {index === 3 && (
              <div data-aos="fade-up" data-aos-delay={`${index*200}`} data-aos-duration="1000" className="flex items-center flex-wrap justify-between w-full md:py-12 py-5 border-b border-solid border-border dark:border-dark_border">
                <div className="lg:min-w-96 min-w-max">
                  <h6 className="text-[26px] leading-[2.1rem] font-bold text-secondary dark:text-white max-w-286">
                    {intermissions[1].title}
                  </h6>
                </div>
                <div className="flex items-center flex-wrap gap-30 lg:min-w-96 min-w-max">
                  <div className="flex items-center">
                    <Image
                      src={intermissions[1].image}
                      alt="lunch break"
                      width={0}
                      height={0}
                      quality={100}
                      layout="responsive"
                      sizes="100vh"
                      className="!w-10 !h-10 rounded-full"
                    />
                  </div>
                  <div>                    
                    <p className="text-lg font-normal text-SlateBlueText dark:text-opacity-80">
                      {intermissions[1].time}
                    </p>
                  </div>
                </div>
                <div className="lg:min-w-40 min-w-max" ></div> {/* No button for intermission row */}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export default Schedules;
