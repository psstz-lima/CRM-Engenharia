"use client"
import React from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";

const BoxSlider = () => {
  var settings = {
    dots: false,
    arrows: true,
    infinite: true,
    speed: 500,
    slidesToShow: 7,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024, // screen width <= 1024px
        settings: {
          slidesToShow: 5,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768, // screen width <= 768px
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,          
        },
      },
      {
        breakpoint: 480, // screen width <= 480px
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };
  return (
    <>
      <Slider {...settings} className="text-center">
        <div className="bg-IcyBreeze dark:bg-darklight pt-5 pb-7 rounded-lg text-center group hover:bg-primary">
          <h5 className="text-gray-400 text-[34px] leading-[2.76rem] font-normal group-hover:text-white">16</h5>
          <p className="text-xs font-medium text-gray-400 group-hover:text-white">JUN 2024</p>
        </div>
        <div className="bg-IcyBreeze dark:bg-darklight pt-5 pb-7 rounded-lg text-center group hover:bg-primary">
          <h5 className="text-gray-400 text-[34px] leading-[2.76rem] font-normal group-hover:text-white">17</h5>
          <p className="text-xs font-medium text-gray-400 group-hover:text-white">JAN 2024</p>
        </div>
        <div className="bg-IcyBreeze dark:bg-darklight pt-5 pb-7 rounded-lg text-center group hover:bg-primary">
          <h5 className="text-gray-400 text-[34px] leading-[2.76rem] font-normal group-hover:text-white">18</h5>
          <p className="text-xs font-medium text-gray-400 group-hover:text-white">FEB 2024</p>
        </div>
        <div className="bg-IcyBreeze dark:bg-darklight pt-5 pb-7 rounded-lg text-center group hover:bg-primary">
          <h5 className="text-gray-400 text-[34px] leading-[2.76rem] font-normal group-hover:text-white">19</h5>
          <p className="text-xs font-medium text-gray-400 group-hover:text-white">APR 2024</p>
        </div>
        <div className="bg-IcyBreeze dark:bg-darklight pt-5 pb-7 rounded-lg text-center group hover:bg-primary">
          <h5 className="text-gray-400 text-[34px] leading-[2.76rem] font-normal group-hover:text-white">20</h5>
          <p className="text-xs font-medium text-gray-400 group-hover:text-white">MAY 2024</p>
        </div>
        <div className="bg-IcyBreeze dark:bg-darklight pt-5 pb-7 rounded-lg text-center group hover:bg-primary">
          <h5 className="text-gray-400 text-[34px] leading-[2.76rem] font-normal group-hover:text-white">21</h5>
          <p className="text-xs font-medium text-gray-400 group-hover:text-white">AUG 2024</p>
        </div>
        <div className="bg-IcyBreeze dark:bg-darklight pt-5 pb-7 rounded-lg text-center group hover:bg-primary">
          <h5 className="text-gray-400 text-[34px] leading-[2.76rem] font-normal group-hover:text-white">22</h5>
          <p className="text-xs font-medium text-gray-400 group-hover:text-white">SEP 2024</p>
        </div>
        <div className="bg-IcyBreeze dark:bg-darklight pt-5 pb-7 rounded-lg text-center group hover:bg-primary">
          <h5 className="text-gray-400 text-[34px] leading-[2.76rem] font-normal group-hover:text-white">23</h5>
          <p className="text-xs font-medium text-gray-400 group-hover:text-white">NOV 2024</p>
        </div>
        <div className="bg-IcyBreeze dark:bg-darklight pt-5 pb-7 rounded-lg text-center group hover:bg-primary">
          <h5 className="text-gray-400 text-[34px] leading-[2.76rem] font-normal group-hover:text-white">24</h5>
          <p className="text-xs font-medium text-gray-400 group-hover:text-white">DEC 2024</p>
        </div>
      </Slider>
    </>
  );
};

export default BoxSlider;
