import React from 'react'
import { Metadata } from "next";
import Hero from '@/components/Home/Hero';
import ThumbnailCarousel from '@/components/Home/Conferences';
import WorkSpeakers from '@/components/Home/WorkSpeakers';
import EventTicket from '@/components/Home/EventTicket';
import Highlight from '@/components/Home/YearHighlight/page';
import Upcoming from '@/components/Home/Upcoming';
import Testimonials from '@/components/Home/Testimonials';
import TicketSection from '@/components/Home/TicketSection';
export const metadata: Metadata = {
  title: "Symposium",
};

export default function Home() {
  return (
    <main>
      <Hero />
      <ThumbnailCarousel/>
      <WorkSpeakers/>
      <EventTicket/>
      <Highlight/>
      <Upcoming/>
      <Testimonials/>
      <TicketSection/>
    </main>
  )
}
