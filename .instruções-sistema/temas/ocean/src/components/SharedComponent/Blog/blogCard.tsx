import React, { FC } from "react";
import Image from "next/image";
import { Blog } from "@/types/blog";
import { format } from "date-fns";
import Link from "next/link";

const BlogCard = ({ blog }: { blog: Blog }) => {
    const { title, coverImage, excerpt, date, slug } = blog;
    return (
        <>
            <div className="group relative">
                <div className="mb-8 overflow-hidden rounded">
                    <Link href={`/blog/${slug}`} aria-label="blog cover" className="block">
                        <Image
                            src={coverImage!}
                            alt="image"
                            className="w-full transition group-hover:scale-125"
                            width={408}
                            height={272}
                            style={{ width: '100%', height: 'auto' }}
                            quality={100}
                        />
                    </Link>
                </div>
                <div className="absolute top-0 bg-primary py-2 ml-4 mt-4 px-5 rounded">
                    <span className="text-white font-medium text-sm">
                        Pricing
                    </span>
                </div>
                <div>
                    <h3>
                        <Link
                            href={`/blog/${slug}`}
                            className="mb-4 inline-block font-semibold text-dark text-black hover:text-primary dark:text-white dark:hover:text-primary text-[22px] leading-[2rem]"
                        >
                            {title}
                        </Link>
                    </h3>
                    <span className="text-sm font-semibold leading-loose text-SereneGray">
                        {format(new Date(date), "dd MMM yyyy")}
                    </span>
                </div>
            </div>
        </>
    );
};

export default BlogCard;