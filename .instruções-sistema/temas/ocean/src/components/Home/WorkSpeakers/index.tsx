"use client";
import React from "react";
import Image from "next/image";
import { speakers } from "@/app/api/data";
import { usePathname } from "next/navigation";
import Link from "next/link";

const WorkSpeakers = ({ showTitle = true }) => {
  const pathname = usePathname();
  return (
    <>
      <section className={` dark:bg-darkmode ${pathname === "/" ? "" : ""}`}>
        {showTitle && (
          <h2 className="text-center pb-12">World Class Speakers</h2>
        )}
        <div className="grid lg:grid-cols-5 sm:grid-cols-2 grid-cols-1 items-stretch gap-8 mx-7">
          {speakers.map((speaker, index) => (
            <div
              key={speaker.id}
              data-aos="fade-up"
              data-aos-delay={`${index * 300}`}
              data-aos-duration="1000"
              className={`col-span-1 group overflow-hidden ${
                index % 2 === 1 ? "lg:mt-28 mt-0" : ""
              }`}
            >
              <div className="overflow-hidden rounded-lg">
                <Image
                  src={speaker.src}
                  alt={speaker.alt}
                  width={0}
                  height={0}
                  quality={100}
                  layout="responsive"
                  sizes="100vh"
                  className=" object-cover w-full h-full transition-all duration-0.4s group-hover:scale-110"
                />
              </div>
              <div className="pt-6">
                <h6 className="text-[28px] leading-[2.25rem] font-bold text-secondary dark:text-white">
                  {speaker.name}
                </h6>
                <span className="text-lg font-normal text-SlateBlueText dark:text-opacity-80">
                  {speaker.designation}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default WorkSpeakers;
